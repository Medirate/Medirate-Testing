import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: "Email parameter is required" }, { status: 400 });
    }

    console.log("🔍 Fetching user profile for:", email);

    const supabase = getSupabaseServiceRole();
    
    const { data, error } = await supabase
      .from("User")
      .select("FirstName, LastName, Email, Picture")
      .eq("Email", email)
      .maybeSingle();

    if (error) {
      console.error("❌ Error fetching user profile:", error);
      return NextResponse.json({ error: "Failed to fetch user profile" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User profile fetched successfully:", data);
    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected error occurred" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { email, FirstName, LastName, Picture } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log("🔄 Updating user profile for:", email);

    const supabase = getSupabaseServiceRole();
    
    const { data, error } = await supabase
      .from("User")
      .update({
        FirstName,
        LastName,
        Picture
      })
      .eq("Email", email)
      .select("FirstName, LastName, Email, Picture")
      .single();

    if (error) {
      console.error("❌ Error updating user profile:", error);
      return NextResponse.json({ error: "Failed to update user profile" }, { status: 500 });
    }

    console.log("✅ User profile updated successfully:", data);
    return NextResponse.json({ data }, { status: 200 });

  } catch (error) {
    console.error("❌ Unexpected error:", error);
    return NextResponse.json({ error: "Unexpected error occurred" }, { status: 500 });
  }
}