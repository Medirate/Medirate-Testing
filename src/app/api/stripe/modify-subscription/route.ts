import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, newPriceId } = await request.json();

    if (!email || !newPriceId) {
      return NextResponse.json({ error: 'Email and new price ID are required' }, { status: 400 });
    }

    // Find the customer by email
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const customer = customers.data[0];

    // Get the customer's active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 404 });
    }

    const subscription = subscriptions.data[0];

    // Get the current subscription item
    const currentItem = subscription.items.data[0];
    if (!currentItem) {
      return NextResponse.json({ error: 'No subscription items found' }, { status: 400 });
    }

    // Get the actual amount that was charged (from the latest invoice)
    let actualChargedAmount = 0;
    try {
      const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      actualChargedAmount = latestInvoice.amount_paid || 0;
    } catch (error) {
      console.error('Could not get latest invoice:', error);
    }

    // Calculate refund amount based on actual charged amount
    const currentPeriodStart = subscription.current_period_start;
    const currentPeriodEnd = subscription.current_period_end;
    const now = Math.floor(Date.now() / 1000);
    
    // Calculate unused time in seconds
    const totalPeriodSeconds = currentPeriodEnd - currentPeriodStart;
    const unusedSeconds = currentPeriodEnd - now;
    
    // Calculate refund amount (unused portion of actual charged amount)
    const refundAmount = actualChargedAmount > 0 ? Math.floor((actualChargedAmount * unusedSeconds) / totalPeriodSeconds) : 0;
    
    // Process refund BEFORE updating subscription
    if (refundAmount > 0) {
      try {
        // Get all invoices for this subscription to find the original payment
        const invoices = await stripe.invoices.list({
          subscription: subscription.id,
          limit: 10,
        });
        
        // Find the most recent paid invoice (original subscription payment)
        const paidInvoice = invoices.data.find(inv => inv.status === 'paid' && inv.amount_paid > 0);
        
        if (paidInvoice && paidInvoice.payment_intent && typeof paidInvoice.payment_intent === 'string') {
          // Create refund for unused amount
          const refund = await stripe.refunds.create({
            payment_intent: paidInvoice.payment_intent,
            amount: refundAmount,
            reason: 'requested_by_customer',
            metadata: {
              reason: 'subscription_plan_change',
              old_plan: currentItem.price.id,
              new_plan: newPriceId,
              unused_days: Math.floor(unusedSeconds / (24 * 60 * 60)),
            },
          });
          
          console.log('Refund created:', refund.id, 'Amount:', refundAmount);
        }
      } catch (refundError) {
        console.error('Refund creation failed:', refundError);
        // Continue even if refund fails
      }
    }

    // Update the subscription with the new price (no proration)
    // If subscription is cancelled, reactivate it by setting cancel_at_period_end to false
    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'none' as Stripe.SubscriptionUpdateParams.ProrationBehavior,
    };

    // If subscription is cancelled, reactivate it
    if (subscription.cancel_at_period_end) {
      updateParams.cancel_at_period_end = false;
      console.log('🔄 Reactivating cancelled subscription');
    }

    const updatedSubscription = await stripe.subscriptions.update(subscription.id, updateParams);

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: updatedSubscription.current_period_end,
        current_period_start: updatedSubscription.current_period_start,
        cancel_at_period_end: updatedSubscription.cancel_at_period_end,
        items: updatedSubscription.items.data.map(item => ({
          id: item.id,
          price: {
            id: item.price.id,
            unit_amount: item.price.unit_amount,
            currency: item.price.currency,
            recurring: item.price.recurring,
          },
        })),
      },
      reactivated: subscription.cancel_at_period_end && !updatedSubscription.cancel_at_period_end,
    });

  } catch (error) {
    console.error('Error modifying subscription:', error);
    return NextResponse.json(
      { error: 'Failed to modify subscription' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch available prices/plans
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all active prices
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product'],
    });

    // Filter for recurring prices (subscriptions)
    const subscriptionPrices = prices.data.filter(price => 
      price.type === 'recurring' && 
      price.product && 
      typeof price.product === 'object' && 
      !price.product.deleted
    );

    // Format the response
    const availablePlans = subscriptionPrices.map(price => {
      const product = typeof price.product === 'object' ? price.product : null;
      return {
        id: price.id,
        amount: price.unit_amount,
        currency: price.currency,
        interval: price.recurring?.interval,
        intervalCount: price.recurring?.interval_count,
        product: {
          id: product ? product.id : (typeof price.product === 'string' ? price.product : 'unknown'),
          name: product && 'name' in product ? product.name : 'Unknown',
          description: product && 'description' in product ? product.description : null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      plans: availablePlans,
    });

  } catch (error) {
    console.error('Error fetching available plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch available plans' },
      { status: 500 }
    );
  }
}
