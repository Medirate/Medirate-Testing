import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import fetch from "node-fetch";

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

// US state mapping
const US_STATE_MAP: { [key: string]: string } = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas', 'CA': 'California', 'CO': 'Colorado',
  'CT': 'Connecticut', 'DE': 'Delaware', 'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas', 'KY': 'Kentucky', 'LA': 'Louisiana',
  'ME': 'Maine', 'MD': 'Maryland', 'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada', 'NH': 'New Hampshire', 'NJ': 'New Jersey',
  'NM': 'New Mexico', 'NY': 'New York', 'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina', 'SD': 'South Dakota',
  'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah', 'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington',
  'WV': 'West Virginia', 'WI': 'Wisconsin', 'WY': 'Wyoming',
};

const US_STATE_MAP_REV: { [key: string]: string } = Object.fromEntries(
  Object.entries(US_STATE_MAP).map(([k, v]) => [v.toUpperCase(), k])
);

function getFullStateName(stateVal: string | null): string {
  if (!stateVal) return "Unknown State";
  const state = stateVal.trim().toUpperCase();
  if (state in US_STATE_MAP) {
    return US_STATE_MAP[state];
  } else if (state in US_STATE_MAP_REV) {
    return stateVal;
  } else {
    return stateVal;
  }
}

function normalizeState(val: string | null): Set<string> {
  if (!val) return new Set();
  const state = val.trim().toUpperCase();
  const results = new Set<string>();
  
  if (state in US_STATE_MAP) {
    results.add(state);
    results.add(US_STATE_MAP[state].toUpperCase());
  } else if (state in US_STATE_MAP_REV) {
    results.add(state);
    results.add(US_STATE_MAP_REV[state]);
  } else {
    results.add(state);
  }
  return results;
}

// Utility: Convert Excel serial date or string to MM/DD/YYYY (copied from edit page)
function formatExcelOrStringDate(val: any): string {
  if (val == null || val === "") return "";
  // If it's a number or a string that looks like a number (Excel serial)
  const serial = typeof val === "number" ? val : (typeof val === "string" && /^\d{5,6}$/.test(val.trim()) ? parseInt(val, 10) : null);
  if (serial && serial > 20000 && serial < 90000) { // Excel serial range
    // Excel's epoch starts at 1899-12-31, but there is a bug for 1900 leap year, so add 1
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(date.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
  }
  // Try parsing as a date string (prefer US format)
  let d = new Date(val);
  if (!isNaN(d.getTime())) {
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return d.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
    }
  }
  // Fallback: just return as string
  return String(val);
}

export async function POST(req: NextRequest) {
  const logs: string[] = [];
  
  try {
    // Get mode from request body (preview, test, or production)
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || 'production'; // preview, test, or production
    
    logs.push(`🔍 Starting email notification process (mode: ${mode})...`);
    
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      logs.push('❌ Admin authentication failed');
      return NextResponse.json({ success: false, logs, error: "Admin privileges required" }, { status: 403 });
    }
    
    logs.push(`✅ Admin access validated for user: ${adminUser.email}`);
    
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
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    logs.push("✅ Supabase service client initialized");
    
    // 1. Fetch new alerts from all three tables (is_new = 'yes')
    logs.push("📊 Fetching new alerts from database...");
    
    let bills: any[] = [];
    let alerts: any[] = [];
    let statePlanAmendments: any[] = [];
    
    try {
      const billsResult = await supabase
        .from("bill_track_50")
        .select("*")
        .eq("is_new", "yes");
      
      if (billsResult.error) {
        logs.push(`❌ Error fetching bills: ${billsResult.error.message}`);
        throw new Error(`Error fetching bills: ${billsResult.error.message}`);
      }
      bills = billsResult.data || [];
      
      const alertsResult = await supabase
        .from("provider_alerts")
        .select("*")
        .eq("is_new", "yes");
      
      if (alertsResult.error) {
        logs.push(`❌ Error fetching provider alerts: ${alertsResult.error.message}`);
        throw new Error(`Error fetching provider alerts: ${alertsResult.error.message}`);
      }
      alerts = alertsResult.data || [];
      
      // Fetch state plan amendments (handle case where is_new column might not exist yet)
      logs.push("🔍 Fetching state plan amendments with is_new = 'yes'...");
      const spaResult = await supabase
        .from("state_plan_amendments")
        .select("*")
        .eq("is_new", "yes");
      
      if (spaResult.error) {
        // If error is about missing column, log warning but continue
        if (spaResult.error.message.includes('is_new') && spaResult.error.message.includes('schema cache')) {
          logs.push(`⚠️ is_new column does not exist in state_plan_amendments yet. Skipping state plan amendments.`);
        } else {
          logs.push(`❌ Error fetching state plan amendments: ${spaResult.error.message}`);
          logs.push(`❌ Error details: ${JSON.stringify(spaResult.error)}`);
          // Don't throw, just log the error and continue
        }
      } else {
        statePlanAmendments = spaResult.data || [];
        logs.push(`✅ State plan amendments query returned ${statePlanAmendments.length} rows`);
        
        // Debug: Check if there are any state plan amendments at all (regardless of is_new)
        const allSpaResult = await supabase
          .from("state_plan_amendments")
          .select("id, is_new, state, subject")
          .limit(5);
        
        if (!allSpaResult.error && allSpaResult.data) {
          logs.push(`🔍 Debug: Sample state plan amendments in DB (first 5): ${JSON.stringify(allSpaResult.data.map(r => ({ id: r.id, is_new: r.is_new, state: r.state })))}`);
        }
      }
      
      logs.push(`✅ Found ${bills.length} new bills, ${alerts.length} new provider alerts, and ${statePlanAmendments.length} new state plan amendments`);
    } catch (dbError: unknown) {
      const errorMsg =
        dbError instanceof Error
          ? dbError.message
          : typeof dbError === "string"
          ? dbError
          : JSON.stringify(dbError);
      logs.push(`❌ Database connection error: ${errorMsg}`);
      throw new Error(`Database connection error: ${errorMsg}`);
    }
    
    // If no new alerts, return early
    if (bills.length === 0 && alerts.length === 0 && statePlanAmendments.length === 0) {
      logs.push("ℹ️ No new alerts found (is_new = 'yes')");
      return NextResponse.json({ 
        success: true, 
        logs, 
        emailsSent: 0,
        message: "No new alerts to send emails for"
      });
    }
    
    // 2. Fetch users and their preferences
    logs.push("👥 Fetching users and preferences...");
    
    let users: any[] = [];
    let testEmails: Set<string> = new Set();
    
    try {
      // Fetch test email list if in test mode
      if (mode === 'test') {
        const testResult = await supabase
          .from("test_email_list")
          .select("email");
        
        if (!testResult.error && testResult.data) {
          testEmails = new Set(testResult.data.map((row: any) => row.email.toLowerCase()));
          logs.push(`✅ Found ${testEmails.size} test emails`);
        }
      }
      
      const usersResult = await supabase
        .from("user_email_preferences")
        .select("*");
      
      if (usersResult.error) {
        logs.push(`❌ Error fetching users: ${usersResult.error.message}`);
        throw new Error(`Error fetching users: ${usersResult.error.message}`);
      }
      
      let allUsers = usersResult.data || [];
      
      // Filter users based on mode
      if (mode === 'test') {
        users = allUsers.filter((u: any) => testEmails.has(u.user_email.toLowerCase()));
        logs.push(`✅ Filtered to ${users.length} test users out of ${allUsers.length} total users`);
      } else {
        users = allUsers;
      }
      
      logs.push(`✅ Found ${users.length} users with preferences`);
      
      if (users.length === 0) {
        logs.push(`⚠️ No users found to send emails to (mode: ${mode})`);
        return NextResponse.json({ success: true, logs, emailsSent: 0, mode });
      }
    } catch (dbError: unknown) {
      const errorMsg =
        dbError instanceof Error
          ? dbError.message
          : typeof dbError === "string"
          ? dbError
          : JSON.stringify(dbError);
      logs.push(`❌ Database connection error: ${errorMsg}`);
      throw new Error(`Database connection error: ${errorMsg}`);
    }
    
    // 3. Process alerts for matching (same logic as Python code)
    logs.push("🔍 Processing alerts for matching...");
    
    interface ProcessedAlert {
      alert: any;
      source: 'bill' | 'provider_alert' | 'state_plan_amendment';
      state: string;
      stateNorm: Set<string>;
      serviceLines: Set<string>;
    }
    
    const processedAlerts: ProcessedAlert[] = [];
    
    // Process bills (same structure as Python code)
    for (const bill of bills) {
      const state = (bill.state || "").trim().toUpperCase();
      const stateNorm = normalizeState(state);
      const serviceLines = new Set<string>();
      
      // Check service line columns (same as Python: [4,5,6,7] indices)
      for (const col of ['service_lines_impacted', 'service_lines_impacted_1', 'service_lines_impacted_2', 'service_lines_impacted_3']) {
        const val = bill[col];
        if (val && String(val).trim() && String(val).trim().toUpperCase() !== 'NULL') {
          serviceLines.add(String(val).trim().toUpperCase());
        }
      }
      
      processedAlerts.push({
        alert: bill,
        source: 'bill',
        state,
        stateNorm,
        serviceLines
      });
    }
    
    // Process provider alerts (same structure as Python code)
    for (const alert of alerts) {
      const state = (alert.state || "").trim().toUpperCase();
      const stateNorm = normalizeState(state);
      const serviceLines = new Set<string>();
      
      // Check service line columns (same as Python: [4,5,6,7] indices)
      for (const col of ['service_lines_impacted', 'service_lines_impacted_1', 'service_lines_impacted_2', 'service_lines_impacted_3']) {
        const val = alert[col];
        if (val && String(val).trim() && String(val).trim().toUpperCase() !== 'NULL') {
          serviceLines.add(String(val).trim().toUpperCase());
        }
      }
      
      processedAlerts.push({
        alert,
        source: 'provider_alert',
        state,
        stateNorm,
        serviceLines
      });
    }
    
    // Process state plan amendments
    for (const spa of statePlanAmendments) {
      const state = (spa.state || "").trim().toUpperCase();
      const stateNorm = normalizeState(state);
      const serviceLines = new Set<string>();
      
      // Check service line columns
      for (const col of ['service_lines_impacted', 'service_lines_impacted_1', 'service_lines_impacted_2']) {
        const val = spa[col];
        if (val && String(val).trim() && String(val).trim().toUpperCase() !== 'NULL') {
          serviceLines.add(String(val).trim().toUpperCase());
        }
      }
      
      processedAlerts.push({
        alert: spa,
        source: 'state_plan_amendment',
        state,
        stateNorm,
        serviceLines
      });
    }
    
    logs.push(`✅ Processed ${processedAlerts.length} total alerts for matching`);
    
    // Debug: Log breakdown by type
    const billsCount = processedAlerts.filter(pa => pa.source === 'bill').length;
    const providerAlertsCount = processedAlerts.filter(pa => pa.source === 'provider_alert').length;
    const spaCount = processedAlerts.filter(pa => pa.source === 'state_plan_amendment').length;
    logs.push(`📊 Alert breakdown: ${billsCount} bills, ${providerAlertsCount} provider alerts, ${spaCount} state plan amendments`);
    
    // 4. Generate email preview or send personalized emails
    if (mode === 'preview') {
      // Preview mode: generate a sample email for the first user with relevant alerts
      logs.push("👁️ Generating email preview...");
      
      // Find first user with relevant alerts for preview
      let previewUser: any = null;
      let previewHtml = '';
      let previewSubject = '';
      
      for (const user of users) {
        const email = user.user_email;
        const preferences = user.preferences as any;
        
        if (!preferences) continue;
        
        const userStatesRaw = Array.isArray(preferences.states)
          ? preferences.states.filter((s: any) => typeof s === "string" && s.trim())
          : [];
        const userStates = new Set<string>();
        for (const s of userStatesRaw) {
          normalizeState(String(s)).forEach(state => userStates.add(state));
        }
        
        const userCategories = new Set<string>();
        if (Array.isArray(preferences.categories)) {
          for (const c of preferences.categories) {
            if (typeof c === "string" && c.trim()) {
              userCategories.add(c.trim().toUpperCase());
            }
          }
        }
        
        if (userStates.size === 0 || userCategories.size === 0) continue;
        
        const relevantAlerts = processedAlerts.filter(pa => {
          const stateMatch = Array.from(pa.stateNorm).some(state => userStates.has(state));
          const categoryMatch = Array.from(pa.serviceLines).some(category => userCategories.has(category));
          const isRelevant = stateMatch && categoryMatch;
          
          // Debug: Log why each alert is or isn't relevant
          if (pa.source === 'state_plan_amendment') {
            const alertState = getFullStateName(pa.alert.state);
            const alertServiceLines = Array.from(pa.serviceLines).join(', ') || 'N/A';
            logs.push(`🔍 SPA Match Check: State="${alertState}" (normalized: ${Array.from(pa.stateNorm).join(', ')}), ServiceLines="${alertServiceLines}"`);
            logs.push(`   User States: ${Array.from(userStates).join(', ')}`);
            logs.push(`   User Categories: ${Array.from(userCategories).join(', ')}`);
            logs.push(`   State Match: ${stateMatch}, Category Match: ${categoryMatch}, Relevant: ${isRelevant}`);
          }
          
          return isRelevant;
        });
        
        if (relevantAlerts.length > 0) {
          previewUser = user;
          // Generate email HTML for this user
          // Group alerts by type
          const billsAlerts = relevantAlerts.filter(pa => pa.source === 'bill');
          const providerAlerts = relevantAlerts.filter(pa => pa.source === 'provider_alert');
          const spaAlerts = relevantAlerts.filter(pa => pa.source === 'state_plan_amendment');
          
          // Debug: Log what types of alerts are in relevantAlerts
          const alertTypes = relevantAlerts.map(pa => pa.source);
          logs.push(`📊 Preview: Found ${relevantAlerts.length} relevant alerts - Types: ${alertTypes.join(', ')}`);
          logs.push(`📊 Preview: Breakdown - ${billsAlerts.length} bills, ${providerAlerts.length} provider alerts, ${spaAlerts.length} state plan amendments`);
          
          // Helper function to generate alert card HTML
          const generateAlertCard = (pa: ProcessedAlert) => {
            const alert = pa.alert;
            const source = pa.source;
            const state = getFullStateName(alert.state);
            // For state plan amendments, use 'link' field; for bills/provider alerts, use 'url' field
            const url = source === 'state_plan_amendment' 
              ? (alert.link || "#")
              : (alert.url || alert.link || "#");
            const serviceLines = pa.serviceLines.size > 0 ? Array.from(pa.serviceLines).join(', ') : "N/A";
            
            // Debug: Log each alert being processed
            logs.push(`📋 Preview: Processing ${source} - State: ${state}, Service Lines: ${serviceLines}`);
            
            if (source === 'bill') {
              const title = alert.name || alert.bill_number || "No Title";
              const summary = alert.ai_summary || "No summary available.";
              const status = alert.bill_progress;
              const lastAction = alert.last_action;
              const actionDate = alert.action_date;
              const sponsors = alert.sponsor_list;
              
              const details: string[] = [];
              if (status) details.push(`<b>Status:</b> ${status}`);
              if (lastAction) details.push(`<b>Last Action:</b> ${lastAction}`);
              if (actionDate) details.push(`<b>Action Date:</b> ${formatExcelOrStringDate(actionDate)}`);
              if (sponsors) details.push(`<b>Sponsors:</b> ${sponsors}`);
              
              return `
                <div class="alert-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                  <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#0F3557;">
                    ${state}: ${title}
                  </div>
                  <div style="font-size:14px; margin-bottom:4px;">
                    <span style="font-weight:600; color:#1e293b;">Service Lines:</span>
                    <span style="color:#334155;">${serviceLines}</span>
                  </div>
                  <div style="font-size:14px; margin-bottom:12px;">
                    <span style="font-weight:600; color:#1e293b;">Summary:</span>
                    <span style="color:#334155;">${summary}</span>
                  </div>
                  ${details.length > 0 ? `<div style="font-size:13px; margin-bottom:8px;">${details.join('<br>')}</div>` : ''}
                  <a href="${url}" style="display:inline-block; background:#0F3557; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; margin-top:8px;">
                    View Details
                  </a>
                </div>
              `;
            } else if (source === 'provider_alert') {
              const subject = alert.subject || "No Title";
              const summary = alert.summary || "";
              const announcementDate = alert.announcement_date;
              
              const details: string[] = [];
              if (announcementDate) details.push(`<b>Announcement Date:</b> ${formatExcelOrStringDate(announcementDate)}`);
              
              return `
                <div class="alert-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                  <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#0F3557;">
                    ${state}: ${subject}
                  </div>
                  <div style="font-size:14px; margin-bottom:4px;">
                    <span style="font-weight:600; color:#1e293b;">Service Lines:</span>
                    <span style="color:#334155;">${serviceLines}</span>
                  </div>
                  ${summary ? `<div style="font-size:14px; margin-bottom:12px;"><span style="font-weight:600; color:#1e293b;">Summary:</span> <span style="color:#334155;">${summary}</span></div>` : ''}
                  ${details.length > 0 ? `<div style="font-size:13px; margin-bottom:8px;">${details.join('<br>')}</div>` : ''}
                  <a href="${url}" style="display:inline-block; background:#0F3557; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; margin-top:8px;">
                    View Details
                  </a>
                </div>
              `;
            } else if (source === 'state_plan_amendment') {
              const subject = alert.subject || alert['Transmittal Number'] || alert.transmittal_number || "No Title";
              const transmittalNumber = alert['Transmittal Number'] || alert.transmittal_number || "";
              const effectiveDate = alert['Effective Date'] || alert.effective_date;
              const approvalDate = alert['Approval Date'] || alert.approval_date;
              
              const details: string[] = [];
              if (transmittalNumber) details.push(`<b>Transmittal Number:</b> ${transmittalNumber}`);
              if (effectiveDate) details.push(`<b>Effective Date:</b> ${formatExcelOrStringDate(effectiveDate)}`);
              if (approvalDate) details.push(`<b>Approval Date:</b> ${formatExcelOrStringDate(approvalDate)}`);
              
              return `
                <div class="alert-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
                  <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#0F3557;">
                    ${state}: ${subject}
                  </div>
                  <div style="font-size:14px; margin-bottom:4px;">
                    <span style="font-weight:600; color:#1e293b;">Service Lines:</span>
                    <span style="color:#334155;">${serviceLines}</span>
                  </div>
                  ${details.length > 0 ? `<div style="font-size:13px; margin-bottom:8px;">${details.join('<br>')}</div>` : ''}
                  <a href="${url}" style="display:inline-block; background:#0F3557; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; margin-top:8px;">
                    View Details
                  </a>
                </div>
              `;
            }
            return '';
          };
          
          // Generate cards for each category
          const billsCards = billsAlerts.map(generateAlertCard).join("\n");
          const providerCards = providerAlerts.map(generateAlertCard).join("\n");
          const spaCards = spaAlerts.map(generateAlertCard).join("\n");
          
          // Build category sections
          const categorySections: string[] = [];
          
          if (billsAlerts.length > 0) {
            categorySections.push(`
              <div style="margin:40px 48px 20px 48px;">
                <h3 style="color:#0F3557; font-size:20px; font-weight:bold; margin-bottom:16px; border-bottom:2px solid #0F3557; padding-bottom:8px;">
                  📜 Legislative Updates (${billsAlerts.length})
                </h3>
                ${billsCards}
              </div>
            `);
          }
          
          if (providerAlerts.length > 0) {
            categorySections.push(`
              <div style="margin:40px 48px 20px 48px;">
                <h3 style="color:#0F3557; font-size:20px; font-weight:bold; margin-bottom:16px; border-bottom:2px solid #0F3557; padding-bottom:8px;">
                  📢 Provider Alerts (${providerAlerts.length})
                </h3>
                ${providerCards}
              </div>
            `);
          }
          
          if (spaAlerts.length > 0) {
            categorySections.push(`
              <div style="margin:40px 48px 20px 48px;">
                <h3 style="color:#0F3557; font-size:20px; font-weight:bold; margin-bottom:16px; border-bottom:2px solid #0F3557; padding-bottom:8px;">
                  📋 State Plan Amendments (${spaAlerts.length})
                </h3>
                ${spaCards}
              </div>
            `);
          }
          
          const alertCardsHtml = categorySections.join("\n");
          previewHtml = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Medicaid Alerts</title>
                <style>
                @media only screen and (max-width: 600px) {
                    .alert-card {
                    padding: 16px 4% !important;
                    font-size: 15px !important;
                    margin: 16px 2% !important;
                  }
                  .main-content {
                    padding: 0 !important;
                        }
                    }
                </style>
            </head>
            <body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">
              <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Header -->
                    <div style="background:#0F3557; padding:30px 0 20px 0; border-radius:0;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td align="left" style="padding-left:30px;">
                            <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-word.png" alt="MediRate Wordmark" style="max-width:200px; width:90%; display:block;">
                          </td>
                          <td align="right" style="padding-right:30px;">
                            <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-logo.png" alt="MediRate Logo" style="max-width:80px; width:80px; display:block;">
                          </td>
                        </tr>
                      </table>
                    </div>
                    <!-- Main Content -->
                    <div class="main-content" style="padding:0; margin:0;">
                      <h2 style="color:#0F3557; font-size:22px; margin:30px 0 10px 0; text-align:center;">New Medicaid Alerts Available</h2>
                      <p style="color:#555; text-align:center; margin:0 0 20px 0;">Here are the latest updates related to Medicaid provider changes:</p>
                      <!-- Dynamic Alert Cards -->
                      ${alertCardsHtml}
                      <div style="text-align:center; margin:30px 0;">
                        <a href="https://MediRate-developement.vercel.app/rate-developments" style="background:#0F3557; color:#fff; text-decoration:none; padding:14px 28px; border-radius:5px; font-weight:bold; font-size:16px; display:inline-block;">View Full Rate Developments</a>
                        </div>
                    </div>
                    <!-- Footer -->
                    <div style="background:#0F3557; color:#fff; font-size:13px; padding:12px; border-radius:0; text-align:center;">
                      © 2024 MediRate. All rights reserved.
                </div>
                  </td>
                </tr>
              </table>
            </body>
            </html>
          `;
          previewSubject = `New Medicaid Alerts Relevant to You - ${relevantAlerts.length} Updates`;
          break;
        }
      }
      
      if (!previewUser) {
        logs.push("⚠️ No users with relevant alerts found for preview");
        return NextResponse.json({ 
          success: true, 
          logs, 
          mode: 'preview',
          previewHtml: null,
          previewSubject: null,
          message: "No users with relevant alerts found for preview"
        });
      }
      
      logs.push(`✅ Generated preview for user: ${previewUser.user_email} with ${processedAlerts.filter(pa => {
        const preferences = previewUser.preferences as any;
        const userStatesRaw = Array.isArray(preferences.states) ? preferences.states.filter((s: any) => typeof s === "string" && s.trim()) : [];
        const userStates = new Set<string>();
        for (const s of userStatesRaw) {
          normalizeState(String(s)).forEach(state => userStates.add(state));
        }
        const userCategories = new Set<string>();
        if (Array.isArray(preferences.categories)) {
          for (const c of preferences.categories) {
            if (typeof c === "string" && c.trim()) {
              userCategories.add(c.trim().toUpperCase());
            }
          }
        }
        const stateMatch = Array.from(pa.stateNorm).some(state => userStates.has(state));
        const categoryMatch = Array.from(pa.serviceLines).some(category => userCategories.has(category));
        return stateMatch && categoryMatch;
      }).length} relevant alerts`);
      
      return NextResponse.json({ 
        success: true, 
        logs, 
        mode: 'preview',
        previewHtml,
        previewSubject,
        previewUser: previewUser.user_email,
        totalAlerts: processedAlerts.length
      });
    }
    
    // 4. Send personalized emails (same logic as Python code)
    logs.push("📧 Sending personalized email notifications...");
    
    let emailsSent = 0;
    let usersWithAlerts = 0;
    
    for (const user of users) {
      const email = user.user_email;
      const preferences = user.preferences as any;
      
      if (!preferences) {
        logs.push(`⚠️ ${email}: No preferences found, skipping`);
        continue;
      }
      
      // Process user states (same logic as Python)
      const userStatesRaw = Array.isArray(preferences.states)
        ? preferences.states.filter((s: any) => typeof s === "string" && s.trim())
        : [];
      const userStates = new Set<string>();
      for (const s of userStatesRaw) {
        normalizeState(String(s)).forEach(state => userStates.add(state));
      }
      
      // Process user categories (same logic as Python)
      const userCategories = new Set<string>();
      if (Array.isArray(preferences.categories)) {
        for (const c of preferences.categories) {
          if (typeof c === "string" && c.trim()) {
            userCategories.add(c.trim().toUpperCase());
          }
        }
      }
      
      logs.push(`👤 ${email} preferences: States = [${Array.from(userStates).join(', ')}], Categories = [${Array.from(userCategories).join(', ')}]`);
      
      if (userStates.size === 0 || userCategories.size === 0) {
        logs.push(`⚠️ ${email}: No states or categories configured, skipping`);
        continue;
      }
      
      // Find relevant alerts (same matching logic as Python)
      const relevantAlerts = processedAlerts.filter(pa => {
        const stateMatch = Array.from(pa.stateNorm).some(state => userStates.has(state));
        const categoryMatch = Array.from(pa.serviceLines).some(category => userCategories.has(category));
        return stateMatch && categoryMatch;
      });
      
      // Detailed per-user alert log (relevant and not relevant)
      let alertLog = `ℹ️ Alerts for ${email}:`;
      for (const pa of processedAlerts) {
        const alert = pa.alert;
        const type = pa.source === 'bill' ? 'Bill' : pa.source === 'provider_alert' ? 'Provider' : 'State Plan Amendment';
        const state = getFullStateName(alert.state);
        const title = pa.source === 'bill'
          ? (alert.name || alert.bill_number || 'No Title')
          : pa.source === 'provider_alert'
          ? (alert.subject || 'No Title')
          : (alert.subject || alert['Transmittal Number'] || alert.transmittal_number || 'No Title');
        const categories = Array.from(pa.serviceLines).join(', ') || 'N/A';
        const stateMatch = Array.from(pa.stateNorm).some(state => userStates.has(state));
        const categoryMatch = Array.from(pa.serviceLines).some(category => userCategories.has(category));
        if (stateMatch && categoryMatch) {
          alertLog += `\n  ✅ [${type}] ${state}: ${title} (categories: ${categories}) — Relevant (matches user preferences)`;
        } else {
          let reason = [];
          if (!stateMatch) reason.push('state does not match');
          if (!categoryMatch) reason.push('category does not match');
          alertLog += `\n  ❌ [${type}] ${state}: ${title} (categories: ${categories}) — Not relevant (${reason.join(' and ')})`;
        }
      }
      logs.push(alertLog);
      
      if (relevantAlerts.length === 0) {
        logs.push(`ℹ️ ${email}: No relevant alerts found`);
        continue;
      }
      
      usersWithAlerts++;

      // Build email content using the HTML template
      // Group alerts by type
      const billsAlerts = relevantAlerts.filter(pa => pa.source === 'bill');
      const providerAlerts = relevantAlerts.filter(pa => pa.source === 'provider_alert');
      const spaAlerts = relevantAlerts.filter(pa => pa.source === 'state_plan_amendment');
      
      // Helper function to generate alert card HTML (same as preview)
      const generateAlertCard = (pa: ProcessedAlert) => {
        const alert = pa.alert;
        const source = pa.source;
        const state = getFullStateName(alert.state);
        // State plan amendments use 'link', bills and provider alerts use 'url'
        const url = source === 'state_plan_amendment' 
          ? (alert.link || "#")
          : (alert.url || alert.link || "#");
        
        const serviceLines = pa.serviceLines.size > 0 ? Array.from(pa.serviceLines).join(', ') : "N/A";
        
        if (source === 'bill') {
          const title = alert.name || alert.bill_number || "No Title";
          const summary = alert.ai_summary || "No summary available.";
          const status = alert.bill_progress;
          const lastAction = alert.last_action;
          const actionDate = alert.action_date;
          const sponsors = alert.sponsor_list;
          
          const details: string[] = [];
          if (status) details.push(`<b>Status:</b> ${status}`);
          if (lastAction) details.push(`<b>Last Action:</b> ${lastAction}`);
          if (actionDate) details.push(`<b>Action Date:</b> ${formatExcelOrStringDate(actionDate)}`);
          if (sponsors) details.push(`<b>Sponsors:</b> ${sponsors}`);
          
          return `
            <div class="alert-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
              <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#0F3557;">
                ${state}: ${title}
              </div>
              <div style="font-size:14px; margin-bottom:4px;">
                <span style="font-weight:600; color:#1e293b;">Service Lines:</span>
                <span style="color:#334155;">${serviceLines}</span>
              </div>
              <div style="font-size:14px; margin-bottom:12px;">
                <span style="font-weight:600; color:#1e293b;">Summary:</span>
                <span style="color:#334155;">${summary}</span>
              </div>
              ${details.length > 0 ? `<div style="font-size:13px; margin-bottom:8px;">${details.join('<br>')}</div>` : ''}
              <a href="${url}" style="display:inline-block; background:#0F3557; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; margin-top:8px;">
                View Details
              </a>
            </div>
          `;
        } else if (source === 'provider_alert') {
          const subject = alert.subject || "No Title";
          const summary = alert.summary || "";
          const announcementDate = alert.announcement_date;
          
          const details: string[] = [];
          if (announcementDate) details.push(`<b>Announcement Date:</b> ${formatExcelOrStringDate(announcementDate)}`);
          
          return `
            <div class="alert-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
              <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#0F3557;">
                ${state}: ${subject}
              </div>
              <div style="font-size:14px; margin-bottom:4px;">
                <span style="font-weight:600; color:#1e293b;">Service Lines:</span>
                <span style="color:#334155;">${serviceLines}</span>
              </div>
              ${summary ? `<div style="font-size:14px; margin-bottom:12px;"><span style="font-weight:600; color:#1e293b;">Summary:</span> <span style="color:#334155;">${summary}</span></div>` : ''}
              ${details.length > 0 ? `<div style="font-size:13px; margin-bottom:8px;">${details.join('<br>')}</div>` : ''}
              <a href="${url}" style="display:inline-block; background:#0F3557; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; margin-top:8px;">
                View Details
              </a>
            </div>
          `;
        } else if (source === 'state_plan_amendment') {
          const subject = alert.subject || alert['Transmittal Number'] || alert.transmittal_number || "No Title";
          const transmittalNumber = alert['Transmittal Number'] || alert.transmittal_number || "";
          const effectiveDate = alert['Effective Date'] || alert.effective_date;
          const approvalDate = alert['Approval Date'] || alert.approval_date;
          
          const details: string[] = [];
          if (transmittalNumber) details.push(`<b>Transmittal Number:</b> ${transmittalNumber}`);
          if (effectiveDate) details.push(`<b>Effective Date:</b> ${formatExcelOrStringDate(effectiveDate)}`);
          if (approvalDate) details.push(`<b>Approval Date:</b> ${formatExcelOrStringDate(approvalDate)}`);
          
          return `
            <div class="alert-card" style="background:#f8fafc; border-radius:0; box-shadow:none; border-top:1px solid #e2e8f0; border-bottom:1px solid #e2e8f0; padding:32px 40px; font-family:Arial,sans-serif; color:#0F3557; box-sizing:border-box; margin:32px 48px;">
              <div style="font-size:16px; font-weight:bold; margin-bottom:8px; color:#0F3557;">
                ${state}: ${subject}
              </div>
              <div style="font-size:14px; margin-bottom:4px;">
                <span style="font-weight:600; color:#1e293b;">Service Lines:</span>
                <span style="color:#334155;">${serviceLines}</span>
              </div>
              ${details.length > 0 ? `<div style="font-size:13px; margin-bottom:8px;">${details.join('<br>')}</div>` : ''}
              <a href="${url}" style="display:inline-block; background:#0F3557; color:#fff; text-decoration:none; padding:10px 20px; border-radius:6px; font-weight:bold; font-size:14px; margin-top:8px;">
                View Details
              </a>
            </div>
          `;
        }
        return '';
      };
      
      // Generate cards for each category
      const billsCards = billsAlerts.map(generateAlertCard).join("\n");
      const providerCards = providerAlerts.map(generateAlertCard).join("\n");
      const spaCards = spaAlerts.map(generateAlertCard).join("\n");
      
      // Build category sections
      const categorySections: string[] = [];
      
      if (billsAlerts.length > 0) {
        categorySections.push(`
          <div style="margin:40px 48px 20px 48px;">
            <h3 style="color:#0F3557; font-size:20px; font-weight:bold; margin-bottom:16px; border-bottom:2px solid #0F3557; padding-bottom:8px;">
              📜 Legislative Updates (${billsAlerts.length})
            </h3>
            ${billsCards}
          </div>
        `);
      }
      
      if (providerAlerts.length > 0) {
        categorySections.push(`
          <div style="margin:40px 48px 20px 48px;">
            <h3 style="color:#0F3557; font-size:20px; font-weight:bold; margin-bottom:16px; border-bottom:2px solid #0F3557; padding-bottom:8px;">
              📢 Provider Alerts (${providerAlerts.length})
            </h3>
            ${providerCards}
          </div>
        `);
      }
      
      if (spaAlerts.length > 0) {
        categorySections.push(`
          <div style="margin:40px 48px 20px 48px;">
            <h3 style="color:#0F3557; font-size:20px; font-weight:bold; margin-bottom:16px; border-bottom:2px solid #0F3557; padding-bottom:8px;">
              📋 State Plan Amendments (${spaAlerts.length})
            </h3>
            ${spaCards}
          </div>
        `);
      }
      
      // Create email HTML content using the provided template
      const alertCardsHtml = categorySections.join("\n");
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Medicaid Alerts</title>
            <style>
            @media only screen and (max-width: 600px) {
                .alert-card {
                padding: 16px 4% !important;
                font-size: 15px !important;
                margin: 16px 2% !important;
              }
              .main-content {
                padding: 0 !important;
                    }
                }
            </style>
        </head>
        <body style="margin:0; padding:0; background:#f4f4f4; font-family: Arial, sans-serif;">
          <table width="100%" bgcolor="#f4f4f4" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td>
                <!-- Header -->
                <div style="background:#0F3557; padding:30px 0 20px 0; border-radius:0;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td align="left" style="padding-left:30px;">
                        <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-word.png" alt="MediRate Wordmark" style="max-width:200px; width:90%; display:block;">
                      </td>
                      <td align="right" style="padding-right:30px;">
                        <img src="https://raw.githubusercontent.com/Medirate/Medirate-Developement/main/public/top-black-just-logo.png" alt="MediRate Logo" style="max-width:80px; width:80px; display:block;">
                      </td>
                    </tr>
                  </table>
                </div>
                <!-- Main Content -->
                <div class="main-content" style="padding:0; margin:0;">
                  <h2 style="color:#0F3557; font-size:22px; margin:30px 0 10px 0; text-align:center;">New Medicaid Alerts Available</h2>
                  <p style="color:#555; text-align:center; margin:0 0 20px 0;">Here are the latest updates related to Medicaid provider changes:</p>
                  <!-- Dynamic Alert Cards -->
                  ${alertCardsHtml}
                  <div style="text-align:center; margin:30px 0;">
                    <a href="https://MediRate-developement.vercel.app/rate-developments" style="background:#0F3557; color:#fff; text-decoration:none; padding:14px 28px; border-radius:5px; font-weight:bold; font-size:16px; display:inline-block;">View Full Rate Developments</a>
                    </div>
                </div>
                <!-- Footer -->
                <div style="background:#0F3557; color:#fff; font-size:13px; padding:12px; border-radius:0; text-align:center;">
                  © 2024 MediRate. All rights reserved.
            </div>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `;
      
      // Send email via Brevo API
      try {
        const emailData = {
          to: [{ email }],
          sender: { email: "contact@medirate.net", name: "MediRate" },
          subject: `New Medicaid Alerts Relevant to You - ${relevantAlerts.length} Updates`,
          htmlContent: htmlContent
        };
        
        const response = await fetch(BREVO_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': BREVO_API_KEY!
          },
          body: JSON.stringify(emailData)
        });
        
        if (response.ok) {
          emailsSent++;
          logs.push(`✅ Email sent to ${email} with ${relevantAlerts.length} alerts`);
        } else {
          const errorData = String(await response.text());
          logs.push(`❌ Failed to send email to ${email}: ${String(response.status)} - ${errorData}`);
        }
      } catch (emailError: unknown) {
        const errorMsg =
          emailError instanceof Error
            ? emailError.message
            : typeof emailError === "string"
            ? emailError
            : JSON.stringify(emailError);
        logs.push(`❌ Failed to send email to ${email}: ${errorMsg}`);
      }
    }
    
    // Note: is_new flags are NOT reset after sending emails
    // They should only be reset during the database update process
    // This allows the same new/updated entries to be sent multiple times if needed
    // until the next database update cycle
    logs.push("ℹ️ is_new flags preserved - they will only be reset during next database update");
    
    // Summary
    logs.push(`📊 Email Summary:`);
    logs.push(`   - Total users: ${users.length}`);
    logs.push(`   - Users with relevant alerts: ${usersWithAlerts}`);
    logs.push(`   - Emails successfully sent: ${emailsSent}`);
    
    return NextResponse.json({ 
      success: true, 
      logs, 
      emailsSent,
      usersWithAlerts,
      totalUsers: users.length,
      mode
    });
    
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : JSON.stringify(error);
    logs.push(`❌ Critical error: ${errorMsg}`);
    return NextResponse.json({ 
      success: false, 
      logs, 
      error: errorMsg 
    }, { status: 500 });
  }
} 