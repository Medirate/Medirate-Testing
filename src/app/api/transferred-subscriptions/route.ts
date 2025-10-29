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

    console.log("🔵 Checking transferred subscription status for:", user.email);

    // First check if user is a primary user in transferred_subscriptions
    const { data: primaryUserData, error: primaryUserError } = await supabase
      .from("transferred_subscriptions")
      .select("*")
      .eq("primary_user_email", user.email)
      .eq("status", "active")
      .is("sub_user_email", null) // Primary user has null sub_user_email
      .single();

    if (primaryUserData) {
      console.log(`✅ User ${user.email} is primary user in transferred subscriptions`);
      
      // Check if subscription is still active (not expired)
      const now = new Date();
      const endDate = primaryUserData.subscription_end_date ? new Date(primaryUserData.subscription_end_date) : null;
      
      if (endDate && endDate < now) {
        console.log(`❌ Transferred subscription for ${user.email} has expired`);
        return NextResponse.json({ 
          isTransferredUser: false,
          isTransferredPrimaryUser: false,
          transferredData: null,
          reason: "expired"
        });
      }

      return NextResponse.json({ 
        isTransferredUser: true,
        isTransferredPrimaryUser: true,
        transferredData: {
          primaryUserEmail: primaryUserData.primary_user_email,
          subscriptionStartDate: primaryUserData.subscription_start_date,
          subscriptionEndDate: primaryUserData.subscription_end_date,
          transferDate: primaryUserData.transfer_date,
          status: primaryUserData.status
        }
      });
    }

    // If not a primary user, check if user is a sub user in transferred_subscriptions
    const { data: subUserData, error: subUserError } = await supabase
      .from("transferred_subscriptions")
      .select("*")
      .eq("sub_user_email", user.email)
      .eq("status", "active")
      .single();

    if (subUserError) {
      if (subUserError.code === 'PGRST116') {
        // No rows found - user is not in transferred subscriptions
        console.log(`❌ User ${user.email} not found in transferred subscriptions`);
        return NextResponse.json({ 
          isTransferredUser: false,
          isTransferredPrimaryUser: false,
          transferredData: null
        });
      }
      console.error("❌ Error checking transferred subscriptions:", subUserError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (subUserData) {
      console.log(`✅ User ${user.email} found as sub user in transferred subscriptions under ${subUserData.primary_user_email}`);
      
      // Check if subscription is still active (not expired)
      const now = new Date();
      const endDate = subUserData.subscription_end_date ? new Date(subUserData.subscription_end_date) : null;
      
      if (endDate && endDate < now) {
        console.log(`❌ Transferred subscription for ${user.email} has expired`);
        return NextResponse.json({ 
          isTransferredUser: false,
          isTransferredPrimaryUser: false,
          transferredData: null,
          reason: "expired"
        });
      }

      return NextResponse.json({ 
        isTransferredUser: true,
        isTransferredPrimaryUser: false,
        transferredData: {
          primaryUserEmail: subUserData.primary_user_email,
          subscriptionStartDate: subUserData.subscription_start_date,
          subscriptionEndDate: subUserData.subscription_end_date,
          transferDate: subUserData.transfer_date,
          status: subUserData.status
        }
      });
    }

    return NextResponse.json({ 
      isTransferredUser: false,
      transferredData: null
    });

  } catch (error) {
    console.error("❌ Unexpected error in transferred subscriptions check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a transferred subscription
export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { primaryUserEmail, subUserEmail, subscriptionStartDate, subscriptionEndDate } = await request.json();

    if (!primaryUserEmail || !subUserEmail || !subscriptionStartDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("transferred_subscriptions")
      .insert({
        primary_user_email: primaryUserEmail,
        sub_user_email: subUserEmail,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate || null,
        status: "active"
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating transferred subscription:", error);
      return NextResponse.json({ error: "Failed to create transferred subscription" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      transferredSubscription: data
    });

  } catch (error) {
    console.error("❌ Unexpected error creating transferred subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
