import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const stateName = searchParams.get('state');
    
    if (!stateName) {
      return NextResponse.json({ error: "State parameter is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // Count provider alerts with is_new = "yes" for the specified state
    const { data: providerAlerts, error: providerError } = await supabase
      .from("provider_alerts")
      .select("id")
      .eq("is_new", "yes")
      .ilike("state", `%${stateName}%`);

    if (providerError) {
      console.error("Error fetching provider alerts:", providerError);
      return NextResponse.json({ error: "Failed to fetch provider alerts" }, { status: 500 });
    }

    // Count legislative updates with is_new = "yes" for the specified state
    let billsData = [];
    let billsError = null;
    
    try {
      const { data: billsResult, error: billsResultError } = await supabase
        .from("bill_track_50")
        .select("url")
        .eq("is_new", "yes")
        .ilike("state", `%${stateName}%`);
      
      billsData = billsResult || [];
      billsError = billsResultError;
    } catch (error) {
      console.error("Error fetching legislative updates:", error);
      billsData = [];
    }

    if (billsError) {
      console.error("Error fetching legislative updates:", billsError);
      // Don't return error, just use empty array
      billsData = [];
    }

    const totalNewAlerts = (providerAlerts?.length || 0) + (billsData?.length || 0);

    return NextResponse.json({
      state: stateName,
      newProviderAlerts: providerAlerts?.length || 0,
      newLegislativeUpdates: billsData?.length || 0,
      totalNewAlerts: totalNewAlerts
    });

  } catch (error) {
    console.error("Error in state alerts API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
