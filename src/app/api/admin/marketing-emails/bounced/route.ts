import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

interface BrevoBouncedEmail {
  event: string;
  email: string;
  id: number;
  date: string;
  ts: number;
  'message-id': string;
  ts_event: number;
  subject: string;
  reason?: string;
  tag?: string;
  sending_ip?: string;
  ts_epoch: number;
  tags?: string[];
}

export async function POST(req: NextRequest) {
  try {
    console.log("📊 Bounced emails request received");

    // Get parameters from request body
    const body = await req.json();
    const days = parseInt(body.days?.toString() || '30');
    const limit = parseInt(body.limit?.toString() || '100');
    const offset = parseInt(body.offset?.toString() || '0');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    console.log(`📅 Date range: ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);

    // Get bounced emails from Brevo events API
    const eventsUrl = new URL('https://api.brevo.com/v3/smtp/statistics/events');
    eventsUrl.searchParams.set('limit', Math.min(limit, 300).toString()); // Increase limit for bounced emails
    eventsUrl.searchParams.set('offset', offset.toString());
    eventsUrl.searchParams.set('startDate', startDate.toISOString().split('T')[0]);
    eventsUrl.searchParams.set('endDate', endDate.toISOString().split('T')[0]);
    // Get all events first, then filter for bounces (Brevo doesn't accept bounce event names directly)
    // eventsUrl.searchParams.set('event', 'bounces'); // Try this format instead

    console.log("🔍 Fetching bounced emails from:", eventsUrl.toString());

    const eventsResponse = await fetch(eventsUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'api-key': BREVO_API_KEY!,
      },
    });

    if (!eventsResponse.ok) {
      const errorText = await eventsResponse.text();
      console.error("❌ Bounced emails API error:", eventsResponse.status, errorText);
      return NextResponse.json(
        { error: `Brevo bounced emails error: ${eventsResponse.status} ${errorText}` },
        { status: eventsResponse.status }
      );
    }

    const eventsData = await eventsResponse.json();
    const events: BrevoBouncedEmail[] = eventsData.events || [];
    
    console.log(`✅ Retrieved ${events.length} bounced email events`);

    // Filter and process bounced emails only
    const bounceEvents = events.filter((event: any) => {
      const eventType = event.event?.toLowerCase() || '';
      return eventType.includes('bounce') || eventType === 'blocked';
    });

    console.log(`🔍 Found ${bounceEvents.length} bounce events out of ${events.length} total events`);

    const bouncedEmails = bounceEvents.map((event: any) => ({
      email: event.email || 'Unknown',
      subject: event.subject || 'N/A',
      date: event.date || new Date().toISOString(),
      bounceType: event.event?.toLowerCase().includes('hard') ? 'Hard Bounce' : 'Soft Bounce',
      reason: event.reason || 'No reason provided',
      ts: new Date(event.date || new Date()).getTime() / 1000,
      messageId: event['message-id'] || '',
      tags: event.tags || []
    }));

    // Group by email to get unique bounced addresses
    const uniqueBouncedEmails = bouncedEmails.reduce((acc: any, bounce: any) => {
      if (!acc[bounce.email]) {
        acc[bounce.email] = {
          email: bounce.email,
          latestBounce: bounce,
          bounceCount: 1,
          bounceTypes: [bounce.bounceType],
          reasons: [bounce.reason]
        };
      } else {
        acc[bounce.email].bounceCount++;
        if (!acc[bounce.email].bounceTypes.includes(bounce.bounceType)) {
          acc[bounce.email].bounceTypes.push(bounce.bounceType);
        }
        if (!acc[bounce.email].reasons.includes(bounce.reason)) {
          acc[bounce.email].reasons.push(bounce.reason);
        }
        // Keep the most recent bounce
        if (bounce.ts > acc[bounce.email].latestBounce.ts) {
          acc[bounce.email].latestBounce = bounce;
        }
      }
      return acc;
    }, {});

    const processedBounces = Object.values(uniqueBouncedEmails).sort((a: any, b: any) => 
      b.latestBounce.ts - a.latestBounce.ts
    );

    console.log("✅ Bounced emails processed successfully:", {
      totalEvents: events.length,
      uniqueEmails: processedBounces.length
    });

    return NextResponse.json({
      success: true,
      data: {
        bouncedEmails: processedBounces,
        allBounceEvents: bouncedEmails,
        totalEvents: events.length,
        uniqueEmails: processedBounces.length,
        dateRange: {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          days
        }
      }
    });

  } catch (error) {
    console.error("Error fetching bounced emails:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounced emails" },
      { status: 500 }
    );
  }
}
