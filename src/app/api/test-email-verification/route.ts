import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    
    // Test the email verification API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/email-verification/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    return NextResponse.json({
      success: response.ok,
      status: response.status,
      result,
      brevoApiKeyExists: !!process.env.BREVO_API_KEY,
      environment: process.env.NODE_ENV
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      brevoApiKeyExists: !!process.env.BREVO_API_KEY,
      environment: process.env.NODE_ENV
    }, { status: 500 });
  }
}
