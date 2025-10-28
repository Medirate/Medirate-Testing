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
      console.error("❌ Unauthorized: User or email is missing.");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("🔵 Checking subscription status for:", user.email);

    // First, check if the current user is a sub-user by searching through all records
    const { data: allRecords, error: searchError } = await supabase
      .from("subscription_users")
      .select("primary_user, sub_users");

    if (searchError) {
      console.error("❌ Error searching for sub-user status:", searchError);
      return NextResponse.json({ error: "Database search error" }, { status: 500 });
    }

    // Check if current user exists as a sub-user in any record
    let isSubUser = false;
    let primaryUserEmail = null;

    if (allRecords) {
      for (const record of allRecords) {
        if (record.sub_users && Array.isArray(record.sub_users) && record.sub_users.includes(user.email)) {
          isSubUser = true;
          primaryUserEmail = record.primary_user;
          console.log(`✅ User ${user.email} found as sub-user under primary user: ${primaryUserEmail}`);
          break;
        }
      }
    }

    if (isSubUser) {
      // User is a sub-user, return their status
      console.log(`✅ User ${user.email} is a sub-user under ${primaryUserEmail}`);
      return NextResponse.json({ 
        isSubUser: true, 
        primaryUser: primaryUserEmail,
        subUsers: [] // Sub-users don't have their own sub-users
      });
    }

    // User is not a sub-user, so they might be a primary user
    console.log(`🔍 User ${user.email} is not a sub-user, checking if they are a primary user...`);

    // Check if the user is a primary user
    const { data: primaryUserRecord, error: primaryError } = await supabase
      .from("subscription_users")
      .select("sub_users")
      .eq("primary_user", user.email)
      .single();

    if (primaryError) {
      // If no entry exists, return that user is not in subscription_users table
      if (primaryError.code === "PGRST116") { // PGRST116 is the code for "No rows found"
        console.log("🟡 No primary user entry found - user is not in subscription_users table.");
        return NextResponse.json({ 
          isSubUser: false,
          primaryUser: null,
          subUsers: []
        });
      }

      console.error("❌ Supabase Error:", primaryError);
      return NextResponse.json({ error: "Database query error" }, { status: 500 });
    }

    console.log("✅ Primary user record found:", primaryUserRecord?.sub_users || []);
    return NextResponse.json({ 
      isSubUser: false,
      primaryUser: user.email,
      subUsers: primaryUserRecord?.sub_users || [] 
    });
  } catch (error) {
    console.error("🚨 Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { email, subUsers } = body;

    // If adding a single user via email
    if (email) {
      console.log(`🔵 Adding sub user ${email} to primary user ${user.email}`);
      
      // Get current sub users for this primary user
      const { data: currentRecord, error: fetchError } = await supabase
        .from("subscription_users")
        .select("sub_users")
        .eq("primary_user", user.email)
        .single();

      let currentSubUsers = [];
      if (currentRecord && currentRecord.sub_users) {
        currentSubUsers = Array.isArray(currentRecord.sub_users) ? currentRecord.sub_users : [];
      }

      // Check if user is already added
      if (currentSubUsers.includes(email)) {
        return NextResponse.json({ error: "User is already added to this subscription" }, { status: 400 });
      }

      // Add the new user
      currentSubUsers.push(email);

      // Upsert the updated sub-users for the primary user
      const { error } = await supabase
        .from("subscription_users")
        .upsert({ primary_user: user.email, sub_users: currentSubUsers });

      if (error) {
        console.error("❌ Supabase Error:", error);
        return NextResponse.json({ error: "Database update error" }, { status: 500 });
      }

      console.log(`✅ Successfully added ${email} as sub user to ${user.email}`);
      return NextResponse.json({ success: true, addedUser: email });
    }

    // If updating multiple users via subUsers array (legacy support)
    if (subUsers) {
      const { error } = await supabase
        .from("subscription_users")
        .upsert({ primary_user: user.email, sub_users: subUsers });

      if (error) {
        console.error("❌ Supabase Error:", error);
        return NextResponse.json({ error: "Database update error" }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "No email or subUsers provided" }, { status: 400 });

  } catch (error) {
    console.error("🚨 Unexpected error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 