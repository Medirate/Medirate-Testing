import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase";

function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const codeHash = hashCode(code);

    const { data, error } = await supabase
      .from("email_verifications")
      .select("email, code_hash, expires_at, verified_at")
      .eq("email", email.toLowerCase())
      .single();

    if (error) {
      return NextResponse.json({ error: "Verification not found" }, { status: 404 });
    }

    if (data.verified_at) {
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    const now = new Date();
    if (!data.expires_at || now > new Date(data.expires_at)) {
      return NextResponse.json({ error: "Verification code expired" }, { status: 400 });
    }

    if (data.code_hash !== codeHash) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from("email_verifications")
      .update({ verified_at: new Date().toISOString() })
      .eq("email", email.toLowerCase());

    if (updateError) {
      return NextResponse.json({ error: "Failed to update verification" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Unknown error" }, { status: 500 });
  }
}


