import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

import { createServiceClient } from "@/lib/supabase";

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "contact@MediRate.net";
const SENDER_NAME = process.env.BREVO_SENDER_NAME || "MediRate";
const COOLDOWN_SECONDS = parseInt(process.env.EMAIL_VERIFICATION_COOLDOWN || '15');
const IP_WINDOW_SECONDS = parseInt(process.env.EMAIL_VERIFICATION_IP_WINDOW || '900'); // 15 minutes
const IP_WINDOW_LIMIT = parseInt(process.env.EMAIL_VERIFICATION_IP_LIMIT || '10');

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    if (!BREVO_API_KEY) {
      return NextResponse.json({ error: "BREVO_API_KEY not configured" }, { status: 500 });
    }

    const { email } = await req.json();

    // Extract requester IP (best-effort)
    const xfwd = req.headers.get('x-forwarded-for') || '';
    const ip = (xfwd.split(',')[0] || '').trim() || 'unknown';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    const code = generateCode();
    const codeHash = hashCode(code);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    const supabase = createServiceClient();

    // Simple IP throttling using a rolling window
    try {
      const { data: ipRow } = await supabase
        .from('email_verification_ip_throttle')
        .select('ip, window_start, count')
        .eq('ip', ip)
        .maybeSingle();

      const now = Date.now();
      const windowStart = ipRow?.window_start ? new Date(ipRow.window_start).getTime() : 0;
      const inWindow = windowStart && (now - windowStart) < IP_WINDOW_SECONDS * 1000;
      const currentCount = inWindow ? (ipRow?.count || 0) : 0;

      if (inWindow && currentCount >= IP_WINDOW_LIMIT) {
        const secondsLeft = Math.max(0, Math.ceil((IP_WINDOW_SECONDS * 1000 - (now - windowStart)) / 1000));
        return NextResponse.json({ error: `Too many requests from this IP. Try again in ${secondsLeft}s.` }, { status: 429 });
      }

      const nextCount = inWindow ? currentCount + 1 : 1;
      const nextWindowStart = inWindow ? new Date(windowStart).toISOString() : new Date().toISOString();

      const { error: ipUpsertError } = await supabase
        .from('email_verification_ip_throttle')
        .upsert({ ip, window_start: nextWindowStart, count: nextCount }, { onConflict: 'ip' });

      if (ipUpsertError) {
        // Non-fatal: continue without blocking if upsert fails
        console.error('IP throttle upsert error:', ipUpsertError.message);
      }
    } catch (throttleErr) {
      // Non-fatal: continue
      console.error('IP throttle check failed:', throttleErr);
    }

    // Rate-limit by email using updated_at
    const { data: existing } = await supabase
      .from('email_verifications')
      .select('updated_at')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing?.updated_at) {
      const last = new Date(existing.updated_at).getTime();
      const diffSec = Math.floor((Date.now() - last) / 1000);
      if (diffSec < COOLDOWN_SECONDS) {
        return NextResponse.json({ error: `Please wait ${COOLDOWN_SECONDS - diffSec}s before requesting another code.` }, { status: 429 });
      }
    }

    // Upsert verification record
    const { error: upsertError } = await supabase
      .from("email_verifications")
      .upsert(
        {
          email: email.toLowerCase(),
          code_hash: codeHash,
          expires_at: expiresAt,
          verified_at: null,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
        { onConflict: "email" }
      );

    if (upsertError) {
      return NextResponse.json({ error: `Failed to store verification: ${upsertError.message}` }, { status: 500 });
    }

    // Send email via Brevo
    const htmlContent = `
      <html>
        <body>
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color:#012C61;">Verify your email</h2>
            <p>Use the following verification code to continue your subscription process:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 4px; padding: 12px 16px; background:#f5f7ff; border:1px solid #cdd5ff; border-radius: 8px; display: inline-block;">${code}</div>
            <p style="margin-top: 16px; color:#555;">This code will expire in 10 minutes.</p>
            <p style="margin-top: 24px; color:#888; font-size: 12px;">If you didn’t request this, you can safely ignore this email.</p>
          </div>
        </body>
      </html>
    `;

    const emailData = {
      sender: { email: SENDER_EMAIL, name: SENDER_NAME },
      to: [{ email }],
      subject: "Your MediRate verification code",
      htmlContent,
      tags: ["email-verification"],
    };

    const response = await fetch(BREVO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_API_KEY,
      },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Brevo error: ${response.status} ${errorText}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}


