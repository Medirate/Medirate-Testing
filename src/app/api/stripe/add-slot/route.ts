import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: Request) {
  try {
    const { email, remainingDays, totalDays } = await req.json();

    // Calculate the prorated amount (assuming $2,000 for a full year)
    const proratedAmount = (remainingDays / totalDays) * 2000;

    // Create a Stripe Checkout session for the additional slot
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Additional Slot",
              description: "Prorated charge for adding an additional user slot",
            },
            unit_amount: Math.round(proratedAmount * 100), // Convert dollars to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment", // For one-time payments
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success`, // Redirect to success page after payment
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cancel`, // Redirect to cancel page if payment fails
      customer_email: email, // This will be the user's email
    });

    // Respond with the session URL to redirect the user to the Stripe checkout page
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Something went wrong while creating the checkout session." },
      { status: 500 }
    );
  }
} 