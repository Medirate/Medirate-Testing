import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client with service role for admin operations
const supabase = createServiceClient();

// GET - Check if current user is admin
export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    if (adminError) {
      if (adminError.code === "PGRST116") {
        // User not found in admin table
        return NextResponse.json({ isAdmin: false });
      }
      console.error("Error checking admin access:", adminError);
      return NextResponse.json({ error: "Failed to check admin access" }, { status: 500 });
    }

    return NextResponse.json({ 
      isAdmin: true, 
      adminUser: adminData 
    });
  } catch (error) {
    console.error("Error in admin check:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Add new admin user (requires existing admin)
export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requesting user is an admin
    const { data: requestingAdmin, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("role, permissions")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    if (adminCheckError || !requestingAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { email, role = "admin", permissions = {} } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // Add new admin user
    const { data: newAdmin, error: insertError } = await supabase
      .from("admin_users")
      .insert({
        email,
        role,
        permissions,
        is_active: true
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error adding admin user:", insertError);
      return NextResponse.json({ error: "Failed to add admin user" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      adminUser: newAdmin 
    });
  } catch (error) {
    console.error("Error adding admin user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update admin user
export async function PUT(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requesting user is an admin
    const { data: requestingAdmin, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("role, permissions")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    if (adminCheckError || !requestingAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { id, role, permissions, is_active } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "Admin user ID is required" }, { status: 400 });
    }

    // Update admin user
    const { data: updatedAdmin, error: updateError } = await supabase
      .from("admin_users")
      .update({
        role,
        permissions,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating admin user:", updateError);
      return NextResponse.json({ error: "Failed to update admin user" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      adminUser: updatedAdmin 
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove admin user
export async function DELETE(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the requesting user is an admin
    const { data: requestingAdmin, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("role, permissions")
      .eq("email", user.email)
      .eq("is_active", true)
      .single();

    if (adminCheckError || !requestingAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Admin user ID is required" }, { status: 400 });
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from("admin_users")
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq("id", id);

    if (deleteError) {
      console.error("Error removing admin user:", deleteError);
      return NextResponse.json({ error: "Failed to remove admin user" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing admin user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 