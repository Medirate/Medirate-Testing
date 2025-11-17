import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export async function GET(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email') || user.email;

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("user_email_preferences")
      .select("id, preferences")
      .eq("user_email", userEmail)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // No preferences found, return empty state
        return NextResponse.json({ 
          id: null, 
          preferences: { states: [], categories: [] } 
        });
      }
      console.error("Error fetching email preferences:", error);
      return NextResponse.json({ error: "Failed to fetch preferences" }, { status: 500 });
    }

    return NextResponse.json({
      id: data.id,
      preferences: data.preferences || { states: [], categories: [] }
    });
  } catch (error) {
    console.error("Error in email preferences GET API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_email, preferences } = await request.json();
    
    // Ensure user can only create preferences for themselves
    if (user_email !== user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("user_email_preferences")
      .insert({ 
        user_email, 
        preferences: preferences || { states: [], categories: [] } 
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating email preferences:", error);
      return NextResponse.json({ error: "Failed to create preferences" }, { status: 500 });
    }

    return NextResponse.json({ id: data.id });
  } catch (error) {
    console.error("Error in email preferences POST API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, preferences } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    
    // First verify the user owns this preference record
    const { data: existingPref, error: fetchError } = await supabase
      .from("user_email_preferences")
      .select("user_email")
      .eq("id", id)
      .single();

    if (fetchError || !existingPref) {
      return NextResponse.json({ error: "Preference not found" }, { status: 404 });
    }

    if (existingPref.user_email !== user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update the preferences
    const { error } = await supabase
      .from("user_email_preferences")
      .update({ preferences })
      .eq("id", id);

    if (error) {
      console.error("Error updating email preferences:", error);
      return NextResponse.json({ error: "Failed to update preferences" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in email preferences PUT API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
