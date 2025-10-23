import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

export async function GET() {
  try {
    console.log("🔍 Stripe Test: Starting Stripe configuration test");
    console.log("🔍 Stripe Test: Stripe secret key exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("🔍 Stripe Test: Stripe secret key starts with:", process.env.STRIPE_SECRET_KEY?.substring(0, 7));
    
    // Test basic connection
    const customers = await stripe.customers.list({ limit: 5 });
    console.log("🔍 Stripe Test: Found", customers.data.length, "customers");
    console.log("🔍 Stripe Test: Customer emails:", customers.data.map(c => c.email));
    
    // Test specific email search
    const specificCustomers = await stripe.customers.list({ email: "devreddy923@gmail.com" });
    console.log("🔍 Stripe Test: Found", specificCustomers.data.length, "customers for devreddy923@gmail.com");
    
    // Try to find the specific customer by ID
    try {
      const specificCustomer = await stripe.customers.retrieve("cus_THEBRqdqJDorFN");
      console.log("🔍 Stripe Test: Found customer by ID:", { 
        id: specificCustomer.id, 
        email: specificCustomer.email 
      });
    } catch (idError) {
      console.log("❌ Stripe Test: Could not find customer by ID:", idError);
    }
    
    return NextResponse.json({
      success: true,
      totalCustomers: customers.data.length,
      customerEmails: customers.data.map(c => c.email),
      specificEmailResults: specificCustomers.data.length,
      specificEmailCustomers: specificCustomers.data.map(c => ({ id: c.id, email: c.email }))
    });
    
  } catch (error) {
    console.error("❌ Stripe Test: Error:", error);
    return NextResponse.json({ 
      error: "Stripe test failed", 
      details: (error as Error).message 
    }, { status: 500 });
  }
}
