import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createServiceClient();

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = user.email;
    console.log("🔍 Debug: Checking user status for:", userEmail);

    // Check all possible tables for this user
    const results: any = {
      userEmail,
      timestamp: new Date().toISOString(),
      checks: {}
    };

    // 1. Check Stripe subscription
    try {
      const stripeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stripe/subscription`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });
      const stripeData = await stripeResponse.json();
      results.checks.stripe = {
        hasActiveSubscription: stripeData.status === 'active',
        status: stripeData.status,
        data: stripeData
      };
    } catch (error) {
      results.checks.stripe = { error: error instanceof Error ? error.message : String(error) };
    }

    // 2. Check subscription_users table
    try {
      const { data: subUsersData, error: subUsersError } = await supabase
        .from("subscription_users")
        .select("*");

      let isSubUser = false;
      let primaryUserEmail = null;

      if (subUsersData) {
        for (const record of subUsersData) {
          if (record.sub_users && Array.isArray(record.sub_users) && record.sub_users.includes(userEmail)) {
            isSubUser = true;
            primaryUserEmail = record.primary_user;
            break;
          }
        }
      }

      results.checks.subscriptionUsers = {
        isSubUser,
        primaryUserEmail,
        allRecords: subUsersData,
        error: subUsersError
      };
    } catch (error) {
      results.checks.subscriptionUsers = { error: error instanceof Error ? error.message : String(error) };
    }

    // 3. Check transferred_subscriptions table
    try {
      const { data: transferredData, error: transferredError } = await supabase
        .from("transferred_subscriptions")
        .select("*")
        .eq("sub_user_email", userEmail);

      results.checks.transferredSubscriptions = {
        found: transferredData && transferredData.length > 0,
        data: transferredData,
        error: transferredError
      };
    } catch (error) {
      results.checks.transferredSubscriptions = { error: error instanceof Error ? error.message : String(error) };
    }

    // 4. Check registration form
    try {
      const formResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/registrationform?email=${encodeURIComponent(userEmail)}`);
      const formData = await formResponse.json();
      results.checks.registrationForm = {
        hasFormData: !!formData.data,
        data: formData.data,
        error: formData.error
      };
    } catch (error) {
      results.checks.registrationForm = { error: error instanceof Error ? error.message : String(error) };
    }

    return NextResponse.json(results);

  } catch (error) {
    console.error("❌ Debug error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
