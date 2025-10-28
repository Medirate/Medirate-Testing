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

    // Get the new price details to verify it's annual
    const newPrice = await stripe.prices.retrieve(newPriceId);
    if (newPrice.recurring?.interval !== 'year') {
      return NextResponse.json({ error: 'Only annual upgrades are allowed' }, { status: 400 });
    }

    // Check if user is already on annual plan
    if (currentItem.price.recurring?.interval === 'year') {
      return NextResponse.json({ error: 'You are already on the annual plan' }, { status: 400 });
    }

    // For scheduled upgrades, we need to use Subscription Schedules to properly schedule the change
    // This ensures the annual plan starts after the monthly period ends with no immediate charges
    
    try {
      // Create a subscription schedule to handle the scheduled upgrade
      const schedule = await stripe.subscriptionSchedules.create({
        from_subscription: subscription.id,
        phases: [
          {
            // Phase 1: Current monthly plan until period end
            items: [{
              price: currentItem.price.id,
              quantity: 1,
            }],
            end_date: subscription.current_period_end,
          },
          {
            // Phase 2: New annual plan starting after current period
            items: [{
              price: newPriceId,
              quantity: 1,
            }],
            // No end_date means it continues indefinitely
          }
        ],
      });

      console.log('📅 Created subscription schedule:', schedule.id);
      console.log('   Phase 1 (current):', subscription.current_period_end);
      console.log('   Phase 2 (annual):', 'indefinite');

      // If subscription is cancelled, reactivate it
      if (subscription.cancel_at_period_end) {
        await stripe.subscriptions.update(subscription.id, {
          cancel_at_period_end: false,
        });
        console.log('🔄 Reactivated cancelled subscription');
      }

      // Return the updated subscription info
      const updatedSubscription = await stripe.subscriptions.retrieve(subscription.id);

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
        schedule: {
          id: schedule.id,
          current_phase: schedule.current_phase,
          phases: schedule.phases.map(phase => ({
            start_date: phase.start_date,
            end_date: phase.end_date,
            items: phase.items.map(item => ({
              price_id: item.price,
              quantity: item.quantity,
            })),
          })),
        },
        reactivated: subscription.cancel_at_period_end && !updatedSubscription.cancel_at_period_end,
        scheduledUpgrade: true,
        upgradeEffectiveDate: new Date(subscription.current_period_end * 1000).toISOString(),
      });

    } catch (scheduleError) {
      console.error('❌ Error creating subscription schedule:', scheduleError);
      
      // Fallback: If subscription schedules fail, we'll need to handle this differently
      return NextResponse.json(
        { 
          error: 'Failed to schedule upgrade. Please contact support.', 
          details: 'Subscription schedule creation failed' 
        },
        { status: 500 }
      );
    }

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
