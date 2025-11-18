import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    const supabase = createServiceClient();
    
    // Fetch provider alerts
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("*")
      .order("announcement_date", { ascending: false });

    if (providerError) {
      console.error("Error fetching provider alerts:", providerError);
      return NextResponse.json({ error: "Failed to fetch provider alerts" }, { status: 500 });
    }

    // Fetch legislative updates
    const { data: billsData, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*");

    if (billsError) {
      console.error("Error fetching legislative updates:", billsError);
      return NextResponse.json({ error: "Failed to fetch legislative updates" }, { status: 500 });
    }

    // Fetch state plan amendments
    const { data: statePlanAmendments, error: spaError } = await supabase
      .from("state_plan_amendments")
      .select("*");

    if (spaError) {
      console.error("Error fetching state plan amendments:", spaError);
      return NextResponse.json({ error: "Failed to fetch state plan amendments" }, { status: 500 });
    }

    return NextResponse.json({
      providerAlerts: providerAlerts || [],
      bills: billsData || [],
      statePlanAmendments: statePlanAmendments || []
    });

  } catch (error) {
    console.error("Error in admin rate data API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
