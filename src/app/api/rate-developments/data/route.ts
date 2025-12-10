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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient();

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

    return NextResponse.json({
      providerAlerts: providerAlerts || [],
      bills: billsData || [],
      statePlanAmendments: statePlanAmendments || [],
    });
  } catch (error) {
    console.error("Error in rate developments data API:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

