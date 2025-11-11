import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// Utility: Convert Excel serial date or string to MM/DD/YYYY (copied from edit page)
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

export async function PUT(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    const { id, ...updateData } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    // Format date fields if they're Excel serial dates
    if (updateData['Effective Date'] || updateData.effective_date) {
      const effectiveDate = updateData['Effective Date'] || updateData.effective_date;
      updateData['Effective Date'] = formatExcelOrStringDate(effectiveDate);
      delete updateData.effective_date; // Remove snake_case version if present
    }
    
    if (updateData['Approval Date'] || updateData.approval_date) {
      const approvalDate = updateData['Approval Date'] || updateData.approval_date;
      updateData['Approval Date'] = formatExcelOrStringDate(approvalDate);
      delete updateData.approval_date; // Remove snake_case version if present
    }
    
    // Handle Transmittal Number (map both variations)
    if (updateData.transmittal_number && !updateData['Transmittal Number']) {
      updateData['Transmittal Number'] = updateData.transmittal_number;
      delete updateData.transmittal_number;
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Update the state plan amendment
    const { data, error } = await supabase
      .from("state_plan_amendments")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating state plan amendment:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("Error in update state plan amendment API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

