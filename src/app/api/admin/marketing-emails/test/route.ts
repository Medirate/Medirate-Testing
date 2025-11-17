import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    // Check environment variables
    const envCheck = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      serviceRoleLength: process.env.SUPABASE_SERVICE_ROLE ? process.env.SUPABASE_SERVICE_ROLE.length : 0,
      anonKeyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length : 0
    };

    return NextResponse.json({
      success: true,
      message: "Test endpoint working",
      environment: envCheck,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in test API:", error);
    return NextResponse.json(
      { error: "Test failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
