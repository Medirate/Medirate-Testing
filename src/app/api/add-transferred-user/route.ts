import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

// Initialize Supabase Client
const supabase = createServiceClient();

export async function POST(request: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { primaryUserEmail, subUserEmail, subscriptionStartDate, subscriptionEndDate } = await request.json();

    if (!primaryUserEmail || !subUserEmail) {
      return NextResponse.json({ error: "Primary user email and sub user email are required" }, { status: 400 });
    }

    // Insert the transferred subscription record
    const { data, error } = await supabase
      .from("transferred_subscriptions")
      .insert({
        primary_user_email: primaryUserEmail,
        sub_user_email: subUserEmail,
        subscription_start_date: subscriptionStartDate || new Date().toISOString(),
        subscription_end_date: subscriptionEndDate || null,
        status: "active"
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Error creating transferred subscription:", error);
      return NextResponse.json({ error: "Failed to create transferred subscription", details: error.message }, { status: 500 });
    }

    console.log("✅ Successfully created transferred subscription:", data);

    return NextResponse.json({ 
      success: true,
      message: "Transferred subscription created successfully",
      data: data
    });

  } catch (error) {
    console.error("❌ Unexpected error creating transferred subscription:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
