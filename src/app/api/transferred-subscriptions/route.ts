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

    // Check if the current user exists in transferred_subscriptions table
    const { data: transferredData, error: transferredError } = await supabase
      .from("transferred_subscriptions")
      .select("*")
      .eq("sub_user_email", user.email)
      .eq("status", "active")
      .single();

    if (transferredError) {
      if (transferredError.code === 'PGRST116') {
        // No rows found - user is not in transferred subscriptions
        console.log(`❌ User ${user.email} not found in transferred subscriptions`);
        return NextResponse.json({ 
          isTransferredUser: false,
          transferredData: null
        });
      }
      console.error("❌ Error checking transferred subscriptions:", transferredError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (transferredData) {
      console.log(`✅ User ${user.email} found in transferred subscriptions under ${transferredData.primary_user_email}`);
      
      // Check if subscription is still active (not expired)
      const now = new Date();
      const endDate = transferredData.subscription_end_date ? new Date(transferredData.subscription_end_date) : null;
      
      if (endDate && endDate < now) {
        console.log(`❌ Transferred subscription for ${user.email} has expired`);
        return NextResponse.json({ 
          isTransferredUser: false,
          transferredData: null,
          reason: "expired"
        });
      }

      return NextResponse.json({ 
        isTransferredUser: true,
        transferredData: {
          primaryUserEmail: transferredData.primary_user_email,
          subscriptionStartDate: transferredData.subscription_start_date,
          subscriptionEndDate: transferredData.subscription_end_date,
          transferDate: transferredData.transfer_date,
          status: transferredData.status
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
