import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createServiceClient();

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Query Supabase to fetch the user by email
    const { data: dbUser, error: userError } = await supabase
      .from("User") // Fetch user data
      .select("UserID, FirstName, LastName, Email, Picture, Role")
      .eq("Email", user.email)
      .single();

    if (userError) {
      console.error("❌ Supabase Error (User):", userError);
      return NextResponse.json({ error: "Database query error" }, { status: 500 });
    }

    // Query Supabase to fetch registration form data by email (optional)
    const { data: registrationData, error: registrationError } = await supabase
      .from("registrationform") // Table name is "registrationform"
      .select("*")
      .eq("email", user.email)
      .maybeSingle(); // Use maybeSingle() instead of single() to handle 0 rows gracefully

    // Don't fail the request if registration form data doesn't exist
    if (registrationError && registrationError.code !== 'PGRST116') {
      console.error("❌ Supabase Error (Registration Form):", registrationError);
      // Only return error for actual database errors, not "no rows found"
      return NextResponse.json({ error: "Database query error" }, { status: 500 });
    }

    return NextResponse.json({
      user: dbUser,
      registration: registrationData || null, // Return null if no registration data exists
    });
  } catch (error) {
    console.error("🚨 Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
