import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return authError;
    }
    
    const { table, email, firstname, lastname, company_name } = await req.json();
    
    if (!table || !email) {
      return NextResponse.json(
        { error: "Table and email are required" },
        { status: 400 }
      );
    }

    if (!["test_email_list", "marketing_email_list"].includes(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from(table)
      .upsert({
        email: email.trim(),
        firstname: (firstname || "").trim(),
        lastname: (lastname || "").trim(),
        company_name: (company_name || "").trim()
      })
      .select();

    if (error) {
      console.error(`Error upserting to ${table}:`, error);
      return NextResponse.json(
        { error: "Failed to save email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Error in marketing emails rows API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return authError;
    }
    
    const { table, email, firstname, lastname, company_name } = await req.json();
    
    if (!table || !email) {
      return NextResponse.json(
        { error: "Table and email are required" },
        { status: 400 }
      );
    }

    if (!["test_email_list", "marketing_email_list"].includes(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { data, error } = await supabase
      .from(table)
      .update({
        firstname: (firstname || "").trim(),
        lastname: (lastname || "").trim(),
        company_name: (company_name || "").trim()
      })
      .eq("email", email)
      .select();

    if (error) {
      console.error(`Error updating ${table}:`, error);
      return NextResponse.json(
        { error: "Failed to update email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error("Error in marketing emails rows API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return authError;
    }
    
    const { table, email } = await req.json();
    
    if (!table || !email) {
      return NextResponse.json(
        { error: "Table and email are required" },
        { status: 400 }
      );
    }

    if (!["test_email_list", "marketing_email_list"].includes(table)) {
      return NextResponse.json(
        { error: "Invalid table name" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();
    
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("email", email);

    if (error) {
      console.error(`Error deleting from ${table}:`, error);
      return NextResponse.json(
        { error: "Failed to delete email" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error in marketing emails rows API:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
