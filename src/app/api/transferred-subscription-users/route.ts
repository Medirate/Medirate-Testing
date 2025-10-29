import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createServiceClient();

// GET endpoint to fetch transferred subscription users
export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔍 Fetching transferred subscription users for:", user.email);

    // Check if user is a primary user in transferred_subscriptions
    const { data: primaryUserData, error: primaryUserError } = await supabase
      .from("transferred_subscriptions")
      .select("*")
      .eq("primary_user_email", user.email)
      .eq("status", "active")
      .is("sub_user_email", null)
      .single();

    if (primaryUserError || !primaryUserData) {
      console.log("❌ User is not a primary user in transferred subscriptions");
      return NextResponse.json({ 
        isTransferredPrimaryUser: false,
        subUsers: []
      });
    }

    // Fetch all sub users for this primary user
    const { data: subUsersData, error: subUsersError } = await supabase
      .from("transferred_subscriptions")
      .select("sub_user_email")
      .eq("primary_user_email", user.email)
      .eq("status", "active")
      .not("sub_user_email", "is", null);

    if (subUsersError) {
      console.error("❌ Error fetching sub users:", subUsersError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const subUsers = subUsersData.map(item => item.sub_user_email).filter(Boolean);

    console.log("✅ Found sub users:", subUsers);

    return NextResponse.json({ 
      isTransferredPrimaryUser: true,
      subUsers: subUsers
    });

  } catch (error) {
    console.error("❌ Unexpected error fetching transferred subscription users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST endpoint to add a sub user to transferred subscription
export async function POST(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`🔍 Adding sub user ${email} to transferred subscription for ${user.email}`);

    // Check if user is a primary user in transferred_subscriptions
    const { data: primaryUserData, error: primaryUserError } = await supabase
      .from("transferred_subscriptions")
      .select("*")
      .eq("primary_user_email", user.email)
      .eq("status", "active")
      .is("sub_user_email", null)
      .single();

    if (primaryUserError || !primaryUserData) {
      console.log("❌ User is not a primary user in transferred subscriptions");
      return NextResponse.json({ error: "Not authorized to add sub users" }, { status: 403 });
    }

    // Check if sub user already exists
    const { data: existingSubUser, error: existingError } = await supabase
      .from("transferred_subscriptions")
      .select("id")
      .eq("primary_user_email", user.email)
      .eq("sub_user_email", email)
      .single();

    if (existingSubUser) {
      return NextResponse.json({ error: "Sub user already exists" }, { status: 400 });
    }

    // Add sub user
    const { data, error } = await supabase
      .from("transferred_subscriptions")
      .insert({
        primary_user_email: user.email,
        sub_user_email: email,
        subscription_start_date: primaryUserData.subscription_start_date,
        subscription_end_date: primaryUserData.subscription_end_date,
        status: "active"
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error adding sub user:", error);
      return NextResponse.json({ error: "Failed to add sub user" }, { status: 500 });
    }

    console.log("✅ Successfully added sub user:", email);

    return NextResponse.json({ 
      success: true,
      subUser: data
    });

  } catch (error) {
    console.error("❌ Unexpected error adding sub user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE endpoint to remove a sub user from transferred subscription
export async function DELETE(request: NextRequest) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    console.log(`🔍 Removing sub user ${email} from transferred subscription for ${user.email}`);

    // Check if user is a primary user in transferred_subscriptions
    const { data: primaryUserData, error: primaryUserError } = await supabase
      .from("transferred_subscriptions")
      .select("*")
      .eq("primary_user_email", user.email)
      .eq("status", "active")
      .is("sub_user_email", null)
      .single();

    if (primaryUserError || !primaryUserData) {
      console.log("❌ User is not a primary user in transferred subscriptions");
      return NextResponse.json({ error: "Not authorized to remove sub users" }, { status: 403 });
    }

    // Remove sub user
    const { error } = await supabase
      .from("transferred_subscriptions")
      .delete()
      .eq("primary_user_email", user.email)
      .eq("sub_user_email", email);

    if (error) {
      console.error("❌ Error removing sub user:", error);
      return NextResponse.json({ error: "Failed to remove sub user" }, { status: 500 });
    }

    console.log("✅ Successfully removed sub user:", email);

    return NextResponse.json({ 
      success: true
    });

  } catch (error) {
    console.error("❌ Unexpected error removing sub user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
