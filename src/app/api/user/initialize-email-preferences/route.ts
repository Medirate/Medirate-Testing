import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Full list of U.S. states and territories
const ALL_STATES = [
  "ALABAMA", "ALASKA", "ARIZONA", "ARKANSAS", "CALIFORNIA", "COLORADO",
  "CONNECTICUT", "DELAWARE", "FLORIDA", "GEORGIA", "HAWAII", "IDAHO",
  "ILLINOIS", "INDIANA", "IOWA", "KANSAS", "KENTUCKY", "LOUISIANA",
  "MAINE", "MARYLAND", "MASSACHUSETTS", "MICHIGAN", "MINNESOTA",
  "MISSISSIPPI", "MISSOURI", "MONTANA", "NEBRASKA", "NEVADA",
  "NEW HAMPSHIRE", "NEW JERSEY", "NEW MEXICO", "NEW YORK",
  "NORTH CAROLINA", "NORTH DAKOTA", "OHIO", "OKLAHOMA", "OREGON",
  "PENNSYLVANIA", "RHODE ISLAND", "SOUTH CAROLINA", "SOUTH DAKOTA",
  "TENNESSEE", "TEXAS", "UTAH", "VERMONT", "VIRGINIA", "WASHINGTON",
  "WEST VIRGINIA", "WISCONSIN", "WYOMING",
  "AMERICAN SAMOA", "U.S. VIRGIN ISLANDS", "NORTHERN MARIANA ISLANDS"
];

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { user_email } = await request.json();
    
    // Ensure user can only initialize preferences for themselves
    if (user_email !== user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();

    // Check if preferences already exist
    const { data: existingPrefs, error: checkError } = await supabase
      .from("user_email_preferences")
      .select("id")
      .eq("user_email", user_email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing preferences:", checkError);
      return NextResponse.json({ error: "Failed to check preferences" }, { status: 500 });
    }

    // If preferences already exist, return success without creating new ones
    if (existingPrefs) {
      console.log(`✅ Email preferences already exist for ${user_email}, skipping initialization`);
      return NextResponse.json({ 
        success: true, 
        message: "Preferences already exist",
        id: existingPrefs.id 
      });
    }

    // Fetch all available service categories
    let allCategories: string[] = [];
    try {
      const { data: categoryData, error: categoryError } = await supabase
        .from("service_category_list")
        .select("categories");

      if (categoryError) {
        console.error("Error fetching service categories:", categoryError);
        // Continue with empty categories if fetch fails
      } else {
        allCategories = categoryData?.map(cat => cat.categories) || [];
      }
    } catch (error) {
      console.error("Error fetching service categories:", error);
      // Continue with empty categories if fetch fails
    }

    // Create new preferences with all states and categories enabled
    const defaultPreferences = {
      states: ALL_STATES,
      categories: allCategories
    };

    const { data, error } = await supabase
      .from("user_email_preferences")
      .insert({ 
        user_email, 
        preferences: defaultPreferences 
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error creating email preferences:", error);
      return NextResponse.json({ error: "Failed to create preferences" }, { status: 500 });
    }

    console.log(`✅ Initialized email preferences for ${user_email} with all states and ${allCategories.length} categories enabled`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Preferences initialized successfully",
      id: data.id,
      preferences: defaultPreferences
    });
  } catch (error) {
    console.error("Error in initialize email preferences API:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
