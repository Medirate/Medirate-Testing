import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// Initialize Supabase Client with service role for admin operations
const supabaseService = createServiceClient();

/**
 * Test endpoint to simulate what happens when a user visits the rate dev page
 * Usage: GET /api/test-user-access?email=csegner@blueprinthcre.com
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const testEmail = searchParams.get("email");

    if (!testEmail) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    const email = testEmail.toLowerCase();
    console.log("🔍 Testing user access flow for:", email);

    const results: any = {
      email,
      timestamp: new Date().toISOString(),
      accessChecks: {},
      dataAccess: {},
      finalAccessDecision: null,
      canSeeData: false,
    };

    // ============================================
    // STEP 1: Check if user is admin
    // ============================================
    console.log("🔍 Step 1: Checking admin status...");
    try {
      const { data: adminData, error: adminError } = await supabaseService
        .from("admin_users")
        .select("*")
        .eq("email", email)
        .eq("is_active", true)
        .single();

      const isAdmin = !adminError && adminData;
      results.accessChecks.isAdmin = {
        result: isAdmin,
        data: adminData,
        error: adminError?.message,
      };

      if (isAdmin) {
        console.log("✅ User is admin - would grant full access");
        results.finalAccessDecision = "ADMIN_ACCESS";
        results.canSeeData = true;
        // Admins bypass all checks, but let's still test data access
      }
    } catch (error) {
      results.accessChecks.isAdmin = {
        result: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // ============================================
    // STEP 2: Check Stripe subscription
    // ============================================
    console.log("🔍 Step 2: Checking Stripe subscription...");
    try {
      const customers = await stripe.customers.list({ email, limit: 1 });
      let hasStripeSubscription = false;
      let stripeStatus = "no_customer";

      if (customers.data.length > 0) {
        const customer = customers.data[0];
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
        });

        const validSubscriptions = subscriptions.data.filter((sub) => {
          if (sub.status === "canceled") {
            const now = Math.floor(Date.now() / 1000);
            return sub.current_period_end > now;
          }
          return ["active", "trialing", "past_due", "incomplete"].includes(sub.status);
        });

        hasStripeSubscription = validSubscriptions.length > 0;
        stripeStatus = hasStripeSubscription ? validSubscriptions[0].status : "no_active_subscription";
      }

      results.accessChecks.stripeSubscription = {
        result: hasStripeSubscription,
        status: stripeStatus,
        customerFound: customers.data.length > 0,
      };

      if (hasStripeSubscription && !results.finalAccessDecision) {
        console.log("✅ User has active Stripe subscription");
        results.finalAccessDecision = "STRIPE_SUBSCRIPTION";
      }
    } catch (error) {
      results.accessChecks.stripeSubscription = {
        result: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // ============================================
    // STEP 3: Check if user is a sub-user
    // ============================================
    console.log("🔍 Step 3: Checking sub-user status...");
    try {
      const { data: allRecords, error: searchError } = await supabaseService
        .from("subscription_users")
        .select("primary_user, sub_users");

      let isSubUser = false;
      let primaryUserEmail: string | null = null;

      if (allRecords) {
        for (const record of allRecords) {
          if (record.sub_users && Array.isArray(record.sub_users)) {
            const isSubUserMatch = record.sub_users.some(
              (sub) => typeof sub === "string" && sub.toLowerCase() === email
            );

            if (isSubUserMatch) {
              isSubUser = true;
              primaryUserEmail = record.primary_user;
              break;
            }
          }
        }
      }

      results.accessChecks.isSubUser = {
        result: isSubUser,
        primaryUserEmail,
        error: searchError?.message,
      };

      if (isSubUser && primaryUserEmail) {
        console.log(`✅ User is sub-user under: ${primaryUserEmail}`);
        // Check primary user's subscription
        try {
          const primaryCustomers = await stripe.customers.list({ email: primaryUserEmail, limit: 1 });
          let primaryHasSubscription = false;

          if (primaryCustomers.data.length > 0) {
            const primaryCustomer = primaryCustomers.data[0];
            const primarySubscriptions = await stripe.subscriptions.list({
              customer: primaryCustomer.id,
              status: "all",
            });

            const validPrimarySubscriptions = primarySubscriptions.data.filter((sub) => {
              if (sub.status === "canceled") {
                const now = Math.floor(Date.now() / 1000);
                return sub.current_period_end > now;
              }
              return ["active", "trialing", "past_due", "incomplete"].includes(sub.status);
            });

            primaryHasSubscription = validPrimarySubscriptions.length > 0;
          }

          // Also check wire transfer for primary user
          const { data: wireTransferData } = await supabaseService
            .from("wire_transfer_subscriptions")
            .select("*")
            .eq("user_email", primaryUserEmail)
            .eq("status", "active")
            .single();

          const primaryHasWireTransfer = !!wireTransferData;

          results.accessChecks.primaryUserSubscription = {
            hasStripe: primaryHasSubscription,
            hasWireTransfer: primaryHasWireTransfer,
            hasAccess: primaryHasSubscription || primaryHasWireTransfer,
          };

          if ((primaryHasSubscription || primaryHasWireTransfer) && !results.finalAccessDecision) {
            console.log("✅ Sub-user has access through primary user");
            results.finalAccessDecision = "SUB_USER_ACCESS";
          }
        } catch (error) {
          results.accessChecks.primaryUserSubscription = {
            error: error instanceof Error ? error.message : String(error),
          };
        }
      }
    } catch (error) {
      results.accessChecks.isSubUser = {
        result: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // ============================================
    // STEP 4: Check wire transfer subscription
    // ============================================
    console.log("🔍 Step 4: Checking wire transfer subscription...");
    try {
      const { data: wireTransferData, error: wireTransferError } = await supabaseService
        .from("wire_transfer_subscriptions")
        .select("*")
        .eq("user_email", email)
        .eq("status", "active")
        .single();

      const isWireTransferUser = !wireTransferError && !!wireTransferData;
      results.accessChecks.wireTransferSubscription = {
        result: isWireTransferUser,
        data: wireTransferData,
        error: wireTransferError?.message,
      };

      if (isWireTransferUser && !results.finalAccessDecision) {
        console.log("✅ User has wire transfer subscription");
        results.finalAccessDecision = "WIRE_TRANSFER_ACCESS";
      }
    } catch (error) {
      results.accessChecks.wireTransferSubscription = {
        result: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }

    // ============================================
    // STEP 5: Determine final access decision
    // ============================================
    const hasAccess =
      results.accessChecks.isAdmin?.result ||
      results.accessChecks.stripeSubscription?.result ||
      (results.accessChecks.isSubUser?.result && results.accessChecks.primaryUserSubscription?.hasAccess) ||
      results.accessChecks.wireTransferSubscription?.result;

    if (!results.finalAccessDecision) {
      results.finalAccessDecision = hasAccess ? "UNKNOWN_ACCESS" : "NO_ACCESS";
    }

    results.canSeeData = hasAccess;

    // ============================================
    // STEP 6: Test actual data access (RLS check)
    // This simulates what happens when fetchData() is called
    // ============================================
    console.log("🔍 Step 6: Testing actual data access (RLS check)...");
    
    // Note: This uses the anon client which respects RLS
    // In a real scenario, the user would be authenticated via Kinde
    // For testing, we'll try to query with the anon key
    // This will show if RLS policies would block the user
    
    try {
      // Test provider_alerts
      const { data: providerAlerts, error: providerError } = await supabase
        .from("provider_alerts")
        .select("*")
        .limit(5);

      results.dataAccess.providerAlerts = {
        canAccess: !providerError,
        error: providerError?.message,
        errorCode: providerError?.code,
        rowCount: providerAlerts?.length || 0,
        sampleData: providerAlerts?.slice(0, 2) || [],
      };

      // Test bill_track_50
      const { data: bills, error: billsError } = await supabase
        .from("bill_track_50")
        .select("*")
        .limit(5);

      results.dataAccess.billTrack50 = {
        canAccess: !billsError,
        error: billsError?.message,
        errorCode: billsError?.code,
        rowCount: bills?.length || 0,
        sampleData: bills?.slice(0, 2) || [],
      };

      // Test state_plan_amendments
      const { data: spa, error: spaError } = await supabase
        .from("state_plan_amendments")
        .select("*")
        .limit(5);

      results.dataAccess.statePlanAmendments = {
        canAccess: !spaError,
        error: spaError?.message,
        errorCode: spaError?.code,
        rowCount: spa?.length || 0,
        sampleData: spa?.slice(0, 2) || [],
      };

      // Determine if user can actually see data
      const canAccessData =
        results.dataAccess.providerAlerts.canAccess ||
        results.dataAccess.billTrack50.canAccess ||
        results.dataAccess.statePlanAmendments.canAccess;

      results.canSeeData = hasAccess && canAccessData;

      if (!canAccessData && hasAccess) {
        console.log("⚠️ User has access but RLS policies are blocking data");
        results.finalAccessDecision += " (RLS_BLOCKED)";
      }
    } catch (error) {
      results.dataAccess.error = error instanceof Error ? error.message : String(error);
    }

    // ============================================
    // SUMMARY
    // ============================================
    results.summary = {
      hasPageAccess: hasAccess,
      canSeeData: results.canSeeData,
      accessReason: results.finalAccessDecision,
      rlsBlocking: hasAccess && !results.canSeeData,
    };

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("❌ Error in test-user-access:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

