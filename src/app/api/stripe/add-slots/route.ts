import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: Request) {
  try {
    const { email, remainingDays, totalDays } = await req.json();

    if (!email || !remainingDays || !totalDays) {
      return NextResponse.json({ error: "Missing required data" }, { status: 400 });
    }

    // Calculate prorated price
    const fullPrice = 2000; // Full price per year per user
    const proratedAmount = (remainingDays / totalDays) * fullPrice;

    // Call the checkout session creation API
    const checkoutResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/create-checkout-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, amount: proratedAmount }),
    });

    const checkoutData = await checkoutResponse.json();

    if (checkoutData.error) {
      throw new Error(checkoutData.error);
    }

    return NextResponse.json({ url: checkoutData.url });
  } catch (error) {
    console.error("❌ Error processing slot:", error);
    return NextResponse.json({ error: "Failed to create slot" }, { status: 500 });
  }
}
