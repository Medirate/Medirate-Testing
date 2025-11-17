import { NextRequest, NextResponse } from "next/server";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export async function POST(req: NextRequest) {
  try {
    // Test email data
    const emailData = {
      to: [{ email: "test@example.com" }],
      sender: { email: "contact@medirate.net", name: "MediRate Test" },
      subject: "Test Email from MediRate Admin",
      htmlContent: `
        <html>
          <body>
            <h1>Test Email</h1>
            <p>This is a test email to verify the Brevo API integration is working.</p>
            <p>Time: ${new Date().toISOString()}</p>
          </body>
        </html>
      `
    };
    
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY!
      },
      body: JSON.stringify(emailData)
    });
    
    const responseData = await response.text();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      responseData,
      apiKeyPresent: !!BREVO_API_KEY,
      apiKeyLength: BREVO_API_KEY?.length || 0
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      apiKeyPresent: !!BREVO_API_KEY,
      apiKeyLength: BREVO_API_KEY?.length || 0
    }, { status: 500 });
  }
} 