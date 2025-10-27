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

    // Update the subscription with the new price using Stripe's proration
    const updatedSubscription = await stripe.subscriptions.update(subscription.id, {
      items: [{
        id: currentItem.id,
        price: newPriceId,
      }],
      proration_behavior: 'create_prorations' as Stripe.SubscriptionUpdateParams.ProrationBehavior,
    });

    return NextResponse.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        current_period_end: updatedSubscription.current_period_end,
        current_period_start: updatedSubscription.current_period_start,
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
