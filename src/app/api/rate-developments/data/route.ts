import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

/**
 * API endpoint to fetch rate developments data for authenticated users
 * Uses service role client to bypass RLS and ensure users always get data
 */
export async function GET() {
  try {
    // Check authentication
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      console.error("❌ Rate Dev Data API - Unauthorized: No user or email");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`✅ Rate Dev Data API - Authenticated user: ${user.email}`);

    // Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE) {
      console.error("❌ Rate Dev Data API - SUPABASE_SERVICE_ROLE not configured");
      return NextResponse.json(
        { error: "Server configuration error", details: "Service role key not available" },
        { status: 500 }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient();
    console.log("✅ Rate Dev Data API - Service client created, fetching data...");

    // Fetch Provider Alerts
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("*")
      .order("announcement_date", { ascending: false });

    if (providerError) {
      console.error("Error fetching provider alerts:", providerError);
      return NextResponse.json(
        { error: "Failed to fetch provider alerts", details: providerError.message },
        { status: 500 }
      );
    }

    // Fetch Legislative Updates (Bill Track 50)
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*");

    if (billsError) {
      console.error("Error fetching legislative updates:", billsError);
      return NextResponse.json(
        { error: "Failed to fetch legislative updates", details: billsError.message },
        { status: 500 }
      );
    }

    // Fetch State Plan Amendments
    const { data: statePlanAmendments, error: spaError } = await supabase
      .from("state_plan_amendments")
      .select("*");

    if (spaError) {
      console.error("Error fetching state plan amendments:", spaError);
      return NextResponse.json(
        { error: "Failed to fetch state plan amendments", details: spaError.message },
        { status: 500 }
      );
    }

    const response = {
      providerAlerts: providerAlerts || [],
      bills: billsData || [],
      statePlanAmendments: statePlanAmendments || [],
    };

    console.log(`✅ Rate Dev Data API - Successfully fetched data:`, {
      providerAlerts: response.providerAlerts.length,
      bills: response.bills.length,
      statePlanAmendments: response.statePlanAmendments.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in rate developments data API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

