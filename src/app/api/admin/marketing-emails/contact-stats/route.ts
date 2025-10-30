import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth } from "@/lib/admin-auth";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

export async function POST(req: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const { days = 30 } = await req.json();

    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: "Brevo API key not configured" }, { status: 500 });
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch events from Brevo (limit 1000, if you need more, implement pagination)
    const eventsUrl = `${BREVO_API_URL}/smtp/statistics/events?limit=1000&startDate=${startDateStr}&endDate=${endDateStr}`;
    
    const eventsResponse = await fetch(eventsUrl, {
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY
      }
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("Brevo events API error:", eventsResponse.status, errorText);
      return NextResponse.json({ 
        error: "Failed to fetch Brevo events", 
        details: `Status ${eventsResponse.status}` 
      }, { status: 500 });
    }

    const eventsData = await eventsResponse.json();
    const events = eventsData?.events || [];

    // Build per-contact statistics
    const contactStats: Record<string, {
      email: string;
      sent: number;
      opened: number;
      clicked: number;
      bounced: number;
      spam: number;
      unsubscribed: number;
      blocked: number;
      deferred: number;
      invalid: number;
      lastActivity: string;
    }> = {};

    events.forEach((e: any) => {
      const email = e.email || 'unknown';
      const eventType = (e.event || '').toLowerCase();
      const eventDate = e.date || e.ts_event || '';

      if (!contactStats[email]) {
        contactStats[email] = {
          email,
          sent: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
          spam: 0,
          unsubscribed: 0,
          blocked: 0,
          deferred: 0,
          invalid: 0,
          lastActivity: eventDate
        };
      }

      const stat = contactStats[email];

      // Update last activity if this event is newer
      if (eventDate && eventDate > stat.lastActivity) {
        stat.lastActivity = eventDate;
      }

      // Count events
      if (eventType === 'sent' || eventType === 'delivered') stat.sent++;
      else if (eventType === 'opened' || eventType === 'open') stat.opened++;
      else if (eventType === 'click' || eventType === 'clicked') stat.clicked++;
      else if (eventType.includes('bounce') || eventType === 'hardbounce' || eventType === 'softbounce') stat.bounced++;
      else if (eventType === 'spam' || eventType === 'spamreport' || eventType === 'complaint') stat.spam++;
      else if (eventType === 'unsubscribed' || eventType === 'unsubscribe') stat.unsubscribed++;
      else if (eventType === 'blocked') stat.blocked++;
      else if (eventType === 'deferred') stat.deferred++;
      else if (eventType === 'invalid') stat.invalid++;
    });

    // Convert to array and sort by sent count descending
    const contactList = Object.values(contactStats).sort((a, b) => b.sent - a.sent);

    return NextResponse.json({
      success: true,
      contacts: contactList,
      totalContacts: contactList.length,
      dateRange: { start: startDateStr, end: endDateStr }
    });

  } catch (error) {
    console.error("Error fetching contact stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact statistics", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

