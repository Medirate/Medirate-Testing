import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase";

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body
  },
};

// Initialize Stripe & Supabase
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});
const supabase = createServiceClient();

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.arrayBuffer();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      return NextResponse.json({ error: "No Stripe signature found" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        Buffer.from(rawBody),
        sig,
        endpointSecret
      );
    } catch (error) {
      return NextResponse.json({ error: `Webhook Error: ${(error as Error).message}` }, { status: 400 });
    }

    // Handle different Stripe events
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscription(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_succeeded":
        await handlePayment(event.data.object as Stripe.Invoice);
        break;

      case "customer.subscription.deleted":
        await handleCancellation(event.data.object as Stripe.Subscription);
        break;

      case "checkout.session.completed":
        await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`⚠️ Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("🚨 Webhook Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ✅ **Handle Subscription Sync (Insert or Update)**
async function handleSubscription(subscription: Stripe.Subscription) {
  const customerEmail = (await stripe.customers.retrieve(subscription.customer as string)) as Stripe.Customer;
  if (!customerEmail.email) return;

  console.log(`🆕 Syncing Subscription for: ${customerEmail.email}`);

  const { data: user, error } = await supabase
    .from("User")
    .select("UserID, FirstName, LastName")
    .eq("Email", customerEmail.email)
    .single();

  if (error) {
    console.error("❌ User not found in database:", error);
    return;
  }

  // Get plan ID from Stripe price
  const planID = subscription.items.data[0]?.price.id;
  if (!planID) {
    console.error("❌ Error fetching subscription or missing PlanID");
    return;
  }

  // Check if there's a stored role for this user (from subscription flow)
  let selectedRole = null;
  try {
    // Try to get role from subscription metadata first
    if (subscription.metadata && subscription.metadata.selectedRole) {
      selectedRole = subscription.metadata.selectedRole;
      console.log(`📋 Found role in subscription metadata: ${selectedRole}`);
    }
  } catch (error) {
    console.log("ℹ️ No role metadata found in subscription");
  }

  // Update the user's subscription status, plan, and role
  const updateData: any = {
    subscriptionStatus: subscription.status,
    planId: parseInt(planID), // Convert to integer if needed
    UpdatedAt: new Date().toISOString(),
  };

  // If we found a selected role, update it
  if (selectedRole && ['user', 'subscription_manager'].includes(selectedRole)) {
    updateData.Role = selectedRole;
    console.log(`🎭 Updating user role to: ${selectedRole}`);
  }

  const { error: updateError } = await supabase
    .from("User")
    .update(updateData)
    .eq("UserID", user.UserID);

  if (updateError) {
    console.error("❌ Error updating user subscription:", updateError);
  } else {
    console.log(`✅ User subscription updated: ${subscription.status}${selectedRole ? ` with role: ${selectedRole}` : ''}`);
    
    // Send welcome email for new active subscriptions
    if (subscription.status === 'active') {
      try {
        console.log(`📧 Sending welcome email for new subscription to: ${customerEmail.email}`);
        await sendWelcomeEmailForSubscription(customerEmail.email, user.FirstName, user.LastName);
      } catch (emailError) {
        console.error("❌ Error sending welcome email:", emailError);
        // Don't fail the webhook if email fails
      }
    }
  }
}

// ✅ **Handle Payment Sync**
async function handlePayment(invoice: Stripe.Invoice) {
  const customerEmail = (await stripe.customers.retrieve(invoice.customer as string)) as Stripe.Customer;
  if (!customerEmail.email) return;

  console.log(`💰 Syncing payment for: ${customerEmail.email}`);

  const { data: user, error } = await supabase
    .from("User")
    .select("UserID")
    .eq("Email", customerEmail.email)
    .single();

  if (error) {
    console.error("❌ User not found in database:", error);
    return;
  }

  // Get plan ID from the user's current subscription
  const { data: userData, error: userError } = await supabase
    .from("User")
    .select("planId")
    .eq("UserID", user.UserID)
    .single();

  if (userError || !userData?.planId) {
    console.error("❌ Error fetching user plan or missing PlanID:", userError);
    return;
  }

  console.log(`➕ Creating new Payment for User: ${user.UserID}`);

  const { error: insertError } = await supabase
    .from("Payment")
    .insert([
      {
        UserId: user.UserID,
        PlanId: userData.planId,
        // Store the complete webhook data for flexibility
        webhookData: invoice,
        // Keep essential fields for easy querying
        Amount: invoice.amount_paid / 100,
        PaymentStatus: invoice.status,
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      },
    ]);

  if (insertError) {
    console.error("❌ Error inserting payment:", insertError);
  } else {
    console.log("✅ Payment successfully synced.");
  }
}

// ✅ **Handle Subscription Cancellation**
async function handleCancellation(subscription: Stripe.Subscription) {
  console.log(`🚫 Cancelling Subscription: ${subscription.id}`);

  const { error: updateError } = await supabase
    .from("Subscription")
    .update({ Status: "canceled", UpdatedAt: new Date().toISOString() })
    .eq("SubscriptionID", subscription.id);

  if (updateError) {
    console.error("❌ Error updating cancellation:", updateError);
  } else {
    console.log("✅ Subscription successfully cancelled.");
  }
}

// ✅ **Handle Checkout Session Completion**
async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  console.log("⚡ Handling Checkout Session Completion...");
  if (!session.customer_email || !session.subscription) return;

  console.log(`✅ Checkout completed for: ${session.customer_email}`);
  await handleSubscription(
    (await stripe.subscriptions.retrieve(session.subscription as string)) as Stripe.Subscription
  );
}

// ✅ **Send Welcome Email for New Subscription**
async function sendWelcomeEmailForSubscription(userEmail: string, firstName?: string, lastName?: string) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/send-welcome-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        firstName,
        lastName,
        subscriptionType: 'Professional Plan',
        isFirstLogin: false
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Welcome email API error:', errorData);
      throw new Error(`Welcome email API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Welcome email sent successfully:', result.messageId);
    return result;

  } catch (error) {
    console.error('Error sending welcome email:', error);
    throw error;
  }
}
