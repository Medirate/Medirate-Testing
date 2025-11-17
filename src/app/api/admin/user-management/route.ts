import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Check if user exists
    const { data, error } = await supabase
      .from("User")
      .select("Email")
      .eq("Email", email)
      .single();
    
    if (error && error.code !== "PGRST116") { // Ignore "no rows found" error
      console.error("Error fetching user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ exists: !!data, user: data });
    
  } catch (error: any) {
    console.error("Error in user management API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    const { kindeUserId, email, role } = await req.json();
    
    if (!kindeUserId || !email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Insert new user
    const { data, error } = await supabase
      .from("User")
      .insert({
        KindeUserID: kindeUserId,
        Email: email,
        Role: role,
        UpdatedAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("Error in user management API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    const { email, role } = await req.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Update user role
    const { data, error } = await supabase
      .from("User")
      .update({ Role: role, UpdatedAt: new Date().toISOString() })
      .eq("Email", email)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("Error in user management API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
