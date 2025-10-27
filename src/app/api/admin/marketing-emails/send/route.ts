import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return authError;
    }
    
    const { emails, subject, htmlContent, target } = await req.json();
    
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Email list is required and must be non-empty" },
        { status: 400 }
      );
    }

    if (!subject || !htmlContent) {
      return NextResponse.json(
        { error: "Subject and HTML content are required" },
        { status: 400 }
      );
    }

    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    if (!BREVO_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      );
    }

    const logs: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Send emails individually to track success/failure
    for (const email of emails) {
      try {
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "api-key": BREVO_API_KEY,
          },
          body: JSON.stringify({
            sender: {
              name: "MediRate",
              email: "contact@MediRate.net",
            },
            to: [{ email }],
            subject,
            htmlContent,
            tags: ["marketing-email", target || "general"],
            // Enable tracking
            headers: {
              "X-Mailin-custom": "campaign_id:marketing_blast",
            },
          }),
        });

        if (response.ok) {
          successCount++;
          logs.push(`✅ Successfully sent to ${email}`);
        } else {
          const errorData = await response.text();
          errorCount++;
          logs.push(`❌ Failed to send to ${email}: ${response.status} ${errorData}`);
        }
      } catch (error) {
        errorCount++;
        logs.push(`❌ Network error sending to ${email}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    logs.push(`📊 Summary: ${successCount} sent successfully, ${errorCount} failed`);

    return NextResponse.json({
      success: true,
      emailsSent: successCount,
      emailsFailed: errorCount,
      logs,
      target
    });

  } catch (error) {
    console.error("Error in marketing emails send API:", error);
    return NextResponse.json(
      { error: "Failed to send emails" },
      { status: 500 }
    );
  }
}
