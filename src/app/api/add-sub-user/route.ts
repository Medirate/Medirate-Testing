import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import Stripe from "stripe";

// ✅ Initialize Supabase & Stripe
const supabase = createServiceClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  try {
    const { email, subUserEmail } = await req.json();

    if (!email || !subUserEmail) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Fetch subscription details
    const { data: subscription, error: subError } = await supabase
      .from("Subscription")
      .select("StartDate, EndDate, UserID, PlanID")
      .eq("UserID", email)
      .single();

    if (subError || !subscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // ✅ Calculate remaining days
    const endDate = new Date(subscription.EndDate);
    const currentDate = new Date();
    const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (remainingDays === 0) {
      return NextResponse.json({ error: "Subscription expired" }, { status: 400 });
    }

    // ✅ Calculate prorated cost
    const proratedCost = (remainingDays / 365) * 2000;

    // ✅ Check if max additional users (10) is reached
    const { data: subUsers, error: subUserError } = await supabase
      .from("Subscription")
      .select("UserID")
      .eq("PrimaryUserID", subscription.UserID);

    if (subUserError) {
      return NextResponse.json({ error: "Failed to fetch sub-users" }, { status: 500 });
    }

    if (subUsers.length >= 10) {
      return NextResponse.json({ error: "Max sub-users reached (10)" }, { status: 400 });
    }

    // ✅ Charge user via Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(proratedCost * 100), // Convert to cents
      currency: "usd",
      receipt_email: email,
      metadata: { primaryUser: email, subUserEmail: subUserEmail },
    });

    // ✅ Add the sub-user to the database
    const { error: insertError } = await supabase.from("Subscription").insert([
      {
        UserID: subUserEmail,
        PrimaryUserID: subscription.UserID,
        PlanID: subscription.PlanID,
        Status: "Active",
        CreatedAt: new Date().toISOString(),
        UpdatedAt: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: "Failed to add sub-user" }, { status: 500 });
    }

    return NextResponse.json({
      message: "Sub-user added successfully",
      chargeAmount: `$${proratedCost.toFixed(2)}`,
      stripePaymentIntent: paymentIntent.client_secret,
    });

  } catch (error) {
    console.error("🚨 Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
