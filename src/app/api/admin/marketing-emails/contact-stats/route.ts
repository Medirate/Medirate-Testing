import { NextRequest, NextResponse } from "next/server";
import { validateAdminAuth } from "@/lib/admin-auth";
import { createServiceClient } from "@/lib/supabase";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

export async function POST(req: NextRequest) {
  try {
    // Validate admin authentication
    const authResult = await validateAdminAuth();
    if (authResult.error) {
      return authResult.error;
    }

    const { days = 90 } = await req.json(); // Default to 90 days (Brevo's API limit)

    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: "Brevo API key not configured" }, { status: 500 });
    }

    const endDate = new Date();
    const startDate = new Date();
    // Brevo events API has a 90-day limit
    startDate.setDate(startDate.getDate() - Math.min(days, 90));

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Fetch ALL events from Brevo with pagination (max 1000 per call)
    let allEvents: any[] = [];
    let offset = 0;
    const limit = 1000;
    let hasMore = true;

    console.log(`[contact-stats] Fetching Brevo events from ${startDateStr} to ${endDateStr}...`);

    while (hasMore) {
      const eventsUrl = `${BREVO_API_URL}/smtp/statistics/events?limit=${limit}&offset=${offset}&startDate=${startDateStr}&endDate=${endDateStr}`;
      
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
      
      if (events.length === 0) {
        hasMore = false;
      } else {
        allEvents = allEvents.concat(events);
        offset += limit;
        console.log(`[contact-stats] Fetched ${allEvents.length} events so far...`);
        
        // Safety: stop after 10k events to avoid timeouts
        if (allEvents.length >= 10000) {
          console.warn(`[contact-stats] Reached 10k events limit, stopping pagination`);
          hasMore = false;
        }
      }
    }

    console.log(`[contact-stats] Total events fetched: ${allEvents.length}`);
    const events = allEvents;

    // Build per-contact statistics with UNIQUE message tracking
    const contactStats: Record<string, {
      email: string;
      sent: Set<string>;
      opened: Set<string>;
      clicked: Set<string>;
      bounced: Set<string>;
      spam: Set<string>;
      unsubscribed: Set<string>;
      blocked: Set<string>;
      deferred: Set<string>;
      invalid: Set<string>;
      lastActivity: string;
    }> = {};

    events.forEach((e: any) => {
      const email = e.email || 'unknown';
      const eventType = (e.event || '').toLowerCase();
      const eventDate = e.date || e.ts_event || '';
      const messageId = e['message-id'] || e.messageId || `${email}-${eventDate}`;

      if (!contactStats[email]) {
        contactStats[email] = {
          email,
          sent: new Set<string>(),
          opened: new Set<string>(),
          clicked: new Set<string>(),
          bounced: new Set<string>(),
          spam: new Set<string>(),
          unsubscribed: new Set<string>(),
          blocked: new Set<string>(),
          deferred: new Set<string>(),
          invalid: new Set<string>(),
          lastActivity: eventDate
        };
      }

      const stat = contactStats[email];

      // Update last activity if this event is newer
      if (eventDate && eventDate > stat.lastActivity) {
        stat.lastActivity = eventDate;
      }

      // Track UNIQUE messages per event type
      if (eventType === 'sent' || eventType === 'delivered') stat.sent.add(messageId);
      else if (eventType === 'opened' || eventType === 'open') stat.opened.add(messageId);
      else if (eventType === 'click' || eventType === 'clicked') stat.clicked.add(messageId);
      else if (eventType.includes('bounce') || eventType === 'hardbounce' || eventType === 'softbounce') stat.bounced.add(messageId);
      else if (eventType === 'spam' || eventType === 'spamreport' || eventType === 'complaint') stat.spam.add(messageId);
      else if (eventType === 'unsubscribed' || eventType === 'unsubscribe') stat.unsubscribed.add(messageId);
      else if (eventType === 'blocked') stat.blocked.add(messageId);
      else if (eventType === 'deferred') stat.deferred.add(messageId);
      else if (eventType === 'invalid') stat.invalid.add(messageId);
    });

    // Optionally fetch ALL emails from marketing list directly from DB (to show everyone, not just those with events)
    try {
      const supabase = createServiceClient();
      const { data: marketingData } = await supabase
        .from('marketing_email_list')
        .select('email');
      
      if (marketingData) {
        marketingData.forEach((row: any) => {
          const email = row.email;
          if (!contactStats[email]) {
            contactStats[email] = {
              email,
              sent: new Set<string>(),
              opened: new Set<string>(),
              clicked: new Set<string>(),
              bounced: new Set<string>(),
              spam: new Set<string>(),
              unsubscribed: new Set<string>(),
              blocked: new Set<string>(),
              deferred: new Set<string>(),
              invalid: new Set<string>(),
              lastActivity: ''
            };
          }
        });
      }
    } catch (dbError) {
      console.warn('Could not fetch marketing list from DB, showing only contacts with events:', dbError);
    }

    // Convert Sets to counts and create final array
    const contactList = Object.values(contactStats).map(stat => ({
      email: stat.email,
      sent: stat.sent.size,
      opened: stat.opened.size,
      clicked: stat.clicked.size,
      bounced: stat.bounced.size,
      spam: stat.spam.size,
      unsubscribed: stat.unsubscribed.size,
      blocked: stat.blocked.size,
      deferred: stat.deferred.size,
      invalid: stat.invalid.size,
      lastActivity: stat.lastActivity
    })).sort((a, b) => b.sent - a.sent);

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

