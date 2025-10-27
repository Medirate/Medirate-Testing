import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const BREVO_API_KEY = process.env.BREVO_API_KEY;

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  
  try {
    logs.push("🔍 Starting email notification process...");
    
    // Check environment variables
    if (!BREVO_API_KEY) {
      logs.push("❌ BREVO_API_KEY environment variable is missing");
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: "BREVO_API_KEY not configured" 
      }, { status: 500 });
    }
    
    logs.push("✅ Environment variables configured");
    
    // Test Supabase connection first
    logs.push("🔗 Testing Supabase connection...");
    
    try {
      const { data: testData, error: testError } = await supabase
        .from("bill_track_50")
        .select("count", { count: "exact", head: true });
      
      if (testError) {
        logs.push(`❌ Supabase connection failed: ${testError.message}`);
        return NextResponse.json({ 
          success: false, 
          logs, 
          error: `Supabase connection failed: ${testError.message}` 
        }, { status: 500 });
      }
      
      logs.push("✅ Supabase connection successful");
    } catch (connectionError: any) {
      logs.push(`❌ Supabase connection error: ${connectionError.message}`);
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: `Supabase connection error: ${connectionError.message}` 
      }, { status: 500 });
    }
    
    // Fetch new alerts
    logs.push("📊 Fetching new alerts...");
    
    const { data: bills, error: billsError } = await supabase
      .from("bill_track_50")
      .select("*")
      .eq("is_new", "yes");
    
    if (billsError) {
      logs.push(`❌ Error fetching bills: ${billsError.message}`);
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: `Error fetching bills: ${billsError.message}` 
      }, { status: 500 });
    }
    
    const { data: alerts, error: alertsError } = await supabase
      .from("provider_alerts")
      .select("*")
      .eq("is_new", "yes");
    
    if (alertsError) {
      logs.push(`❌ Error fetching alerts: ${alertsError.message}`);
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: `Error fetching alerts: ${alertsError.message}` 
      }, { status: 500 });
    }
    
    logs.push(`✅ Found ${bills?.length || 0} new bills and ${alerts?.length || 0} new alerts`);
    
    // Fetch users
    logs.push("👥 Fetching users...");
    
    const { data: users, error: usersError } = await supabase
      .from("user_email_preferences")
      .select("*");
    
    if (usersError) {
      logs.push(`❌ Error fetching users: ${usersError.message}`);
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: `Error fetching users: ${usersError.message}` 
      }, { status: 500 });
    }
    
    logs.push(`✅ Found ${users?.length || 0} users`);
    
    if (!users || users.length === 0) {
      logs.push("⚠️ No users found");
      return NextResponse.json({ 
        success: true, 
        logs, 
        emailsSent: 0,
        message: "No users to send emails to"
      });
    }
    
    // For now, just send a test email to the first user
    logs.push("📧 Sending test email...");
    
    const testUser = users[0];
    const testEmail = testUser.user_email;
    
    if (!testEmail) {
      logs.push("❌ No valid email found in first user");
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: "No valid email found" 
      }, { status: 500 });
    }
    
    // Send test email via Brevo
    try {
      const emailData = {
        to: [{ email: testEmail }],
        sender: { email: "contact@medirate.net", name: "MediRate Test" },
        subject: "Test Email from MediRate Admin",
        htmlContent: `
          <html>
            <body>
              <h1>Test Email</h1>
              <p>This is a test email to verify the email system is working.</p>
              <p>Time: ${new Date().toISOString()}</p>
              <p>New bills: ${bills?.length || 0}</p>
              <p>New alerts: ${alerts?.length || 0}</p>
            </body>
          </html>
        `
      };
      
      const response = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': BREVO_API_KEY
        },
        body: JSON.stringify(emailData)
      });
      
      if (response.ok) {
        logs.push(`✅ Test email sent successfully to ${testEmail}`);
        return NextResponse.json({ 
          success: true, 
          logs, 
          emailsSent: 1,
          testEmail
        });
      } else {
        const errorText = await response.text();
        logs.push(`❌ Failed to send test email: ${response.status} - ${errorText}`);
        return NextResponse.json({ 
          success: false, 
          logs, 
          error: `Email sending failed: ${response.status} - ${errorText}` 
        }, { status: 500 });
      }
      
    } catch (emailError: any) {
      logs.push(`❌ Email sending error: ${emailError.message}`);
      return NextResponse.json({ 
        success: false, 
        logs, 
        error: `Email sending error: ${emailError.message}` 
      }, { status: 500 });
    }
    
  } catch (error: any) {
    logs.push(`❌ Critical error: ${error.message}`);
    return NextResponse.json({ 
      success: false, 
      logs, 
      error: error.message 
    }, { status: 500 });
  }
} 