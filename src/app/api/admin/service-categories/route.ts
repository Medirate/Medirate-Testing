import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function GET() {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Fetch service categories
    const { data, error } = await supabase
      .from("service_category_list")
      .select("id, categories");
    
    if (error) {
      console.error("Error fetching service categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ data });
    
  } catch (error: any) {
    console.error("Error in service categories API:", error);
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
    
    const { categories } = await req.json();
    
    if (!categories || !categories.trim()) {
      return NextResponse.json({ error: "Categories is required" }, { status: 400 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Insert new service category
    const { data, error } = await supabase
      .from("service_category_list")
      .insert({ categories: categories.trim() })
      .select()
      .single();
    
    if (error) {
      console.error("Error inserting service category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("Error in service categories API:", error);
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
    
    const { id, categories } = await req.json();
    
    if (!id || !categories || !categories.trim()) {
      return NextResponse.json({ error: "ID and categories are required" }, { status: 400 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Update service category
    const { data, error } = await supabase
      .from("service_category_list")
      .update({ categories: categories.trim() })
      .eq("id", id)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating service category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
    
  } catch (error: any) {
    console.error("Error in service categories API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // SECURITY: Validate admin authentication and authorization
    const { validateAdminAuth } = await import("@/lib/admin-auth");
    const { user: adminUser, error: authError } = await validateAdminAuth();
    
    if (authError) {
      return NextResponse.json({ error: "Admin privileges required" }, { status: 403 });
    }
    
    const { id } = await req.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }
    
    // Initialize Supabase service client to bypass RLS
    const supabase = createServiceClient();
    
    // Delete the service category
    const { error } = await supabase
      .from("service_category_list")
      .delete()
      .eq("id", id);
    
    if (error) {
      console.error("Error deleting service category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error("Error in delete service category API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
