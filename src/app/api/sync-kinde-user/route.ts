import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

// ✅ Initialize Supabase with service role for server-side operations
const supabase = createServiceClient();

// ✅ Define the POST function for App Router
export async function POST(req: Request) {
  try {
    // ✅ Parse the request body
    const body = await req.json();
    const { email, firstName, lastName, kindeId } = body;

    if (!email || !kindeId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log("🔄 Starting user sync for:", { email, firstName, lastName, kindeId });

    // Check if user already exists
    const { data: existingUser, error: selectError } = await supabase
      .from("User")
      .select("*")
      .eq("Email", email)
      .maybeSingle();

    if (selectError) {
      console.error("❌ Error checking existing user:", selectError);
      return NextResponse.json({ error: "Failed to check user existence" }, { status: 500 });
    }

    let userData;

    if (existingUser) {
      // Update existing user
      console.log("🔄 Updating existing user:", email);
      const now = new Date().toISOString();
      const { data: updatedUser, error: updateError } = await supabase
        .from("User")
        .update({
          FirstName: firstName,
          LastName: lastName,
          KindeUserID: kindeId,
          UpdatedAt: now
        })
        .eq("Email", email)
        .select("*")
        .single();

      if (updateError) {
        console.error("❌ Error updating user:", updateError);
        console.error("❌ Update error details:", JSON.stringify(updateError, null, 2));
        return NextResponse.json({ 
          error: "Failed to update user", 
          details: updateError.message 
        }, { status: 500 });
      }
      
      userData = updatedUser;
    } else {
      // Create new user
      console.log("✅ Creating new user:", email);
      const now = new Date().toISOString();
      const { data: newUser, error: insertError } = await supabase
        .from("User")
        .insert({
          Email: email,
          FirstName: firstName,
          LastName: lastName,
          KindeUserID: kindeId,
          CreatedOn: now,
          CreatedAt: now,
          UpdatedAt: now,
          Role: "user"
        })
        .select("*")
        .single();

      if (insertError) {
        console.error("❌ Error creating user:", insertError);
        console.error("❌ Insert error details:", JSON.stringify(insertError, null, 2));
        return NextResponse.json({ 
          error: "Failed to create user", 
          details: insertError.message 
        }, { status: 500 });
      }
      
      userData = newUser;
    }

    console.log("✅ User synced successfully:", userData);
    return NextResponse.json({ 
      message: "User synced successfully",
      user: userData
    }, { status: 200 });
    
  } catch (error) {
    console.error("❌ Sync error:", error);
    return NextResponse.json({ error: "Unexpected error occurred." }, { status: 500 });
  }
}