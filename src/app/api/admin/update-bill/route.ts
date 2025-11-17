import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Utility: Convert Excel serial date or string to proper date format
function formatExcelOrStringDate(val: any): string | null {
  if (val == null || val === "") return null;
  
  // If it's a number or a string that looks like a number (Excel serial)
  const serial = typeof val === "number" ? val : (typeof val === "string" && /^\d{5,6}$/.test(val.trim()) ? parseInt(val, 10) : null);
  if (serial && serial > 20000 && serial < 90000) { // Excel serial range
    // Excel's epoch starts at 1899-12-31, but there is a bug for 1900 leap year, so add 1
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + serial * 86400000);
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(date.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return date.toISOString();
    }
  }
  
  // Try parsing as a date string (prefer US format)
  let d = new Date(val);
  if (!isNaN(d.getTime())) {
    // If the date is within 2 years of today, it's probably correct
    const now = new Date();
    if (Math.abs(d.getTime() - now.getTime()) < 2 * 365 * 86400000) {
      return d.toISOString();
    }
  }
  
  // Fallback: just return as string
  return String(val);
}

export async function PUT(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    const { url, ...updateData } = await req.json();
    
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }
    
    // Format date fields if they're Excel serial dates
    if (updateData.action_date) {
      updateData.action_date = formatExcelOrStringDate(updateData.action_date);
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Update the bill
    const { data, error } = await supabase
      .from("bill_track_50")
      .update(updateData)
      .eq("url", url)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating bill:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("Error in update bill API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
