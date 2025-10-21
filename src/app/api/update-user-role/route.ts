import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { email, role } = await req.json();
    
    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    }

    // Validate role
    const validRoles = ['user', 'subscription_manager'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Invalid role. Must be 'user' or 'subscription_manager'" }, { status: 400 });
    }

    console.log(`🔄 Updating user role for: ${email} to: ${role}`);

    const supabase = createServiceClient();
    
    // Update user role
    const { data, error } = await supabase
      .from("User")
      .update({ 
        Role: role, 
        UpdatedAt: new Date().toISOString() 
      })
      .eq("Email", email)
      .select("UserID, Email, Role")
      .single();

    if (error) {
      console.error("❌ Error updating user role:", error);
      return NextResponse.json({ error: "Failed to update user role" }, { status: 500 });
    }

    console.log("✅ User role updated successfully:", data);
    return NextResponse.json({ 
      success: true, 
      message: "User role updated successfully",
      user: data 
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
