import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from("bill_track_50")
      .select("count", { count: "exact", head: true });
    
    return NextResponse.json({
      success: true,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Present" : "Missing",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing",
      data,
      error: error?.message || null
    });
    
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "Present" : "Missing",
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Present" : "Missing"
    }, { status: 500 });
  }
} 