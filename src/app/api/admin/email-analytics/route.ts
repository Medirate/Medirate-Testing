import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function POST(req: NextRequest) {
  try {
    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: "Brevo API key not configured" }, { status: 500 });
    }

    // Get parameters from request body
    const body = await req.json();
    const days = parseInt(body.days?.toString() || '30');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(`📅 Fetching analytics for date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Call Brevo's aggregated report endpoint for real analytics data
    const aggregatedUrl = new URL('https://api.brevo.com/v3/smtp/statistics/aggregatedReport');
    aggregatedUrl.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    aggregatedUrl.searchParams.set('endDate', endDate.toISOString().split('T')[0]);

    console.log('🔍 Fetching from Brevo aggregated report:', aggregatedUrl.toString());

    const aggregatedResponse = await fetch(aggregatedUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
      },
    });

    let aggregatedData = null;
    let aggregatedError = null;

    if (!aggregatedResponse.ok) {
      const errorText = await aggregatedResponse.text();
      console.error("❌ Brevo aggregated report API error:", aggregatedResponse.status, errorText);
      aggregatedError = `Brevo API error: ${aggregatedResponse.status} ${errorText}`;
    } else {
      aggregatedData = await aggregatedResponse.json();
      console.log(`✅ Retrieved aggregated data from Brevo:`, aggregatedData);
    }

    // Also get recent events for daily breakdown
    const eventsUrl = new URL('https://api.brevo.com/v3/smtp/statistics/events');
    eventsUrl.searchParams.set('limit', '1000'); // Increased limit to get more comprehensive data
    eventsUrl.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    eventsUrl.searchParams.set('endDate', endDate.toISOString().split('T')[0]);

    console.log('🔍 Fetching events from Brevo:', eventsUrl.toString());

    const eventsResponse = await fetch(eventsUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY,
      },
    });

    let eventsData = null;
    let eventsError = null;

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("❌ Brevo events API error:", eventsResponse.status, errorText);
      eventsError = `Brevo events API error: ${eventsResponse.status} ${errorText}`;
    } else {
      eventsData = await eventsResponse.json();
      console.log(`✅ Retrieved events data from Brevo:`, eventsData);
    }

    // Process unique daily stats and overall unique metrics from events
    const { dailyUniqueStats, uniqueSummary } = processUniqueFromEvents(eventsData?.events || [], startDate, endDate);

    // Create analytics response
    const analytics = {
      summary: {
        // unique metrics preferred; fallback to aggregated if unavailable
        totalSent: uniqueSummary.sent > 0 ? uniqueSummary.sent : (aggregatedData?.requests || 0),
        totalOpened: uniqueSummary.opened,
        totalClicked: uniqueSummary.clicked,
        totalBounced: uniqueSummary.bounced,
        openRate: (uniqueSummary.sent || aggregatedData?.requests || 0) > 0 ? ((uniqueSummary.opened / (uniqueSummary.sent || aggregatedData?.requests || 1)) * 100) : 0,
        clickRate: (uniqueSummary.sent || aggregatedData?.requests || 0) > 0 ? ((uniqueSummary.clicked / (uniqueSummary.sent || aggregatedData?.requests || 1)) * 100) : 0,
        bounceRate: (uniqueSummary.sent || aggregatedData?.requests || 0) > 0 ? ((uniqueSummary.bounced / (uniqueSummary.sent || aggregatedData?.requests || 1)) * 100) : 0,
      },
      totals: {
        // expose raw event totals for transparency
        aggregatedRequests: aggregatedData?.requests || 0,
        aggregatedOpens: aggregatedData?.opens || 0,
        aggregatedClicks: aggregatedData?.clicks || 0,
        aggregatedBounces: aggregatedData?.bounces || 0,
      },
      dailyStats: dailyUniqueStats,
      recentEmails: eventsData?.events?.slice(0, 10) || [],
      dateRange: {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        days
      },
      debug: {
        aggregatedError,
        eventsError,
        message: aggregatedError || eventsError ? "Some data unavailable" : "All data retrieved successfully"
      }
    };

    console.log("✅ Analytics processed successfully:", {
      summary: analytics.summary,
      dailyStatsCount: dailyUniqueStats.length,
      recentEmailsCount: analytics.recentEmails.length,
      aggregatedError,
      eventsError
    });

    return NextResponse.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error("Error fetching email analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch email analytics" },
      { status: 500 }
    );
  }
}

// Helper: compute UNIQUE per-day and overall metrics from events by message-id/email
function processUniqueFromEvents(events: any[], startDate: Date, endDate: Date) {
  const perDay: { [key: string]: { sent: Set<string>; opened: Set<string>; clicked: Set<string>; bounced: Set<string> } } = {};
  const overall = { sent: new Set<string>(), opened: new Set<string>(), clicked: new Set<string>(), bounced: new Set<string>() };

  const initDay = (dateKey: string) => {
    if (!perDay[dateKey]) perDay[dateKey] = { sent: new Set(), opened: new Set(), clicked: new Set(), bounced: new Set() };
  };

  events.forEach((e: any) => {
    const dateKey = (e.date?.split('T')[0]) || '';
    if (!dateKey) return;
    initDay(dateKey);
    const id = (e['message-id'] || e.messageId || '') + '|' + (e.email || '');
    const type = (e.event || '').toLowerCase();
    if (type === 'sent' || type === 'delivered') { perDay[dateKey].sent.add(id); overall.sent.add(id); }
    else if (type === 'opened') { perDay[dateKey].opened.add(id); overall.opened.add(id); }
    else if (type === 'click' || type === 'clicked') { perDay[dateKey].clicked.add(id); overall.clicked.add(id); }
    else if (type.includes('bounce') || type === 'blocked' || type === 'hardbounce' || type === 'softbounce') { perDay[dateKey].bounced.add(id); overall.bounced.add(id); }
  });

  // Initialize missing days
  const current = new Date(startDate);
  while (current <= endDate) {
    const key = current.toISOString().split('T')[0];
    initDay(key);
    current.setDate(current.getDate() + 1);
  }

  const dailyUniqueStats = Object.entries(perDay).sort(([a],[b])=> a.localeCompare(b)).map(([date, sets]) => ({
    date,
    sent: sets.sent.size,
    opened: sets.opened.size,
    clicked: sets.clicked.size,
    bounced: sets.bounced.size,
  }));

  const uniqueSummary = {
    sent: overall.sent.size,
    opened: overall.opened.size,
    clicked: overall.clicked.size,
    bounced: overall.bounced.size,
  };

  return { dailyUniqueStats, uniqueSummary };
}
