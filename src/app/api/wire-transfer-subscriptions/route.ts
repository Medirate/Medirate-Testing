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

    console.log("🔵 Checking wire transfer subscription status for:", user.email);

    // Check if the current user exists in wire_transfer_subscriptions table
    const { data: wireTransferData, error: wireTransferError } = await supabase
      .from("wire_transfer_subscriptions")
      .select("*")
      .eq("user_email", user.email)
      .eq("status", "active")
      .single();

    if (wireTransferError) {
      if (wireTransferError.code === 'PGRST116') {
        // No rows found - user is not in wire transfer subscriptions
        console.log(`❌ User ${user.email} not found in wire transfer subscriptions`);
        return NextResponse.json({ 
          isWireTransferUser: false,
          wireTransferData: null
        });
      }
      console.error("❌ Error checking wire transfer subscriptions:", wireTransferError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (wireTransferData) {
      console.log(`✅ User ${user.email} found in wire transfer subscriptions`);
      
      // Check if subscription is still active (not expired)
      const now = new Date();
      const endDate = wireTransferData.subscription_end_date ? new Date(wireTransferData.subscription_end_date) : null;
      
      if (endDate && endDate < now) {
        console.log(`❌ Wire transfer subscription for ${user.email} has expired`);
        return NextResponse.json({ 
          isWireTransferUser: false,
          wireTransferData: null,
          reason: "expired"
        });
      }

      return NextResponse.json({ 
        isWireTransferUser: true,
        wireTransferData: {
          userEmail: wireTransferData.user_email,
          subscriptionStartDate: wireTransferData.subscription_start_date,
          subscriptionEndDate: wireTransferData.subscription_end_date,
          status: wireTransferData.status
        }
      });
    }

    return NextResponse.json({ 
      isWireTransferUser: false,
      wireTransferData: null
    });

  } catch (error) {
    console.error("❌ Unexpected error in wire transfer subscriptions check:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST endpoint to add a wire transfer subscription (backend only)
export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userEmail, subscriptionStartDate, subscriptionEndDate } = await request.json();

    if (!userEmail || !subscriptionStartDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("wire_transfer_subscriptions")
      .insert({
        user_email: userEmail,
        subscription_start_date: subscriptionStartDate,
        subscription_end_date: subscriptionEndDate || null,
        status: "active"
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating wire transfer subscription:", error);
      return NextResponse.json({ error: "Failed to create wire transfer subscription" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      wireTransferSubscription: data
    });

  } catch (error) {
    console.error("❌ Unexpected error creating wire transfer subscription:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
