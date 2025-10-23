import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(req: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔍 Getting user role for: ${user.email}`);

    const supabase = createServiceClient();
    
    // First check registrationform table for the selected role
    console.log("🔍 Checking registrationform table for role...");
    const { data: formData, error: formError } = await supabase
      .from("registrationform")
      .select("account_role, email")
      .eq("email", user.email)
      .single();

    if (formData && formData.account_role) {
      console.log("✅ Role found in registrationform:", formData.account_role);
      return NextResponse.json({ 
        role: formData.account_role,
        userID: null,
        email: user.email,
        source: "registrationform"
      }, { status: 200 });
    }

    // Fallback: Get user role from User table
    console.log("🔍 No role in registrationform, checking User table...");
    const { data: userData, error } = await supabase
      .from("User")
      .select("Role, UserID, Email")
      .eq("Email", user.email)
      .single();

    if (error) {
      console.error("❌ Error fetching user role:", error);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User role retrieved from User table:", userData.Role);
    return NextResponse.json({ 
      role: userData.Role,
      userID: userData.UserID,
      email: userData.Email,
      source: "User"
    }, { status: 200 });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
