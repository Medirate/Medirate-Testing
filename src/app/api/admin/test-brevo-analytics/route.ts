import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: "Brevo API key not configured" }, { status: 500 });
    }

    const results: any = {
      apiKey: {
        present: !!BREVO_API_KEY,
        length: BREVO_API_KEY?.length || 0
      },
      tests: {}
    };

    // Test 1: Account access
    try {
      const accountResponse = await fetch('https://api.brevo.com/v3/account', {
        headers: { 'Accept': 'application/json', 'api-key': BREVO_API_KEY }
      });
      
      results.tests.account = {
        status: accountResponse.status,
        ok: accountResponse.ok,
        data: accountResponse.ok ? await accountResponse.json() : await accountResponse.text()
      };
    } catch (error) {
      results.tests.account = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 2: Email logs endpoint
    try {
      const logsResponse = await fetch('https://api.brevo.com/v3/smtp/logs?limit=1', {
        headers: { 'Accept': 'application/json', 'api-key': BREVO_API_KEY }
      });
      
      results.tests.logs = {
        status: logsResponse.status,
        ok: logsResponse.ok,
        data: logsResponse.ok ? await logsResponse.json() : await logsResponse.text()
      };
    } catch (error) {
      results.tests.logs = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 3: Statistics events endpoint
    try {
      const eventsResponse = await fetch('https://api.brevo.com/v3/smtp/statistics/events?limit=1', {
        headers: { 'Accept': 'application/json', 'api-key': BREVO_API_KEY }
      });
      
      results.tests.events = {
        status: eventsResponse.status,
        ok: eventsResponse.ok,
        data: eventsResponse.ok ? await eventsResponse.json() : await eventsResponse.text()
      };
    } catch (error) {
      results.tests.events = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 4: Aggregated report endpoint
    try {
      const aggregatedResponse = await fetch('https://api.brevo.com/v3/smtp/statistics/aggregatedReport', {
        headers: { 'Accept': 'application/json', 'api-key': BREVO_API_KEY }
      });
      
      results.tests.aggregated = {
        status: aggregatedResponse.status,
        ok: aggregatedResponse.ok,
        data: aggregatedResponse.ok ? await aggregatedResponse.json() : await aggregatedResponse.text()
      };
    } catch (error) {
      results.tests.aggregated = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    // Test 5: Campaigns endpoint (alternative)
    try {
      const campaignsResponse = await fetch('https://api.brevo.com/v3/emailCampaigns?limit=1', {
        headers: { 'Accept': 'application/json', 'api-key': BREVO_API_KEY }
      });
      
      results.tests.campaigns = {
        status: campaignsResponse.status,
        ok: campaignsResponse.ok,
        data: campaignsResponse.ok ? await campaignsResponse.json() : await campaignsResponse.text()
      };
    } catch (error) {
      results.tests.campaigns = { error: error instanceof Error ? error.message : 'Unknown error' };
    }

    return NextResponse.json({
      success: true,
      message: "Brevo analytics endpoints test completed",
      results
    });

  } catch (error) {
    console.error("Error testing Brevo analytics:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      message: "Failed to test Brevo analytics endpoints"
    }, { status: 500 });
  }
}
