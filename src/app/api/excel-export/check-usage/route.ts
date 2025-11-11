import { NextResponse } from "next/server";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createServiceClient } from "@/lib/supabase";
import Stripe from "stripe";

const supabase = createServiceClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

const ROWS_LIMIT = 20000; // 20k rows per subscription per month

interface UsageInfo {
  rowsUsed: number;
  rowsLimit: number;
  rowsRemaining: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  canExport: boolean;
  message?: string;
}

/**
 * Get primary user email for the current user
 * Returns the subscription owner's email (primary user)
 */
async function getPrimaryUserEmail(userEmail: string): Promise<{ primaryUserEmail: string; subscriptionType: 'stripe' | 'wire_transfer' }> {
  // First, check if user is a sub-user
  const { data: allRecords } = await supabase
    .from("subscription_users")
    .select("primary_user, sub_users");

  if (allRecords) {
    const userEmailLower = userEmail.toLowerCase();
    for (const record of allRecords) {
      if (record.sub_users && Array.isArray(record.sub_users)) {
        const isSubUser = record.sub_users.some(sub => 
          typeof sub === 'string' && sub.toLowerCase() === userEmailLower
        );
        if (isSubUser) {
          // User is a sub-user, return their primary user
          return { primaryUserEmail: record.primary_user, subscriptionType: 'stripe' };
        }
      }
    }
  }

  // User is not a sub-user, check if they have Stripe subscription
  try {
    const customers = await stripe.customers.list({ email: userEmail.toLowerCase(), limit: 1 });
    if (customers.data.length > 0) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: "all",
      });
      const validSubscriptions = subscriptions.data.filter(sub => {
        if (sub.status === 'canceled') {
          const now = Math.floor(Date.now() / 1000);
          return sub.current_period_end > now;
        }
        return ['active', 'trialing', 'past_due', 'incomplete'].includes(sub.status);
      });
      if (validSubscriptions.length > 0) {
        return { primaryUserEmail: userEmail, subscriptionType: 'stripe' };
      }
    }
  } catch (error) {
    console.log("Error checking Stripe:", error);
  }

  // Check if user is a wire transfer user
  const { data: wireTransferData } = await supabase
    .from("wire_transfer_subscriptions")
    .select("user_email")
    .eq("user_email", userEmail.toLowerCase())
    .eq("status", "active")
    .single();

  if (wireTransferData) {
    return { primaryUserEmail: userEmail, subscriptionType: 'wire_transfer' };
  }

  // Default: user is their own primary user
  return { primaryUserEmail: userEmail, subscriptionType: 'stripe' };
}

/**
 * Get billing period dates based on subscription type
 */
async function getBillingPeriod(
  primaryUserEmail: string,
  subscriptionType: 'stripe' | 'wire_transfer'
): Promise<{ periodStart: Date; periodEnd: Date }> {
  if (subscriptionType === 'stripe') {
    try {
      const customers = await stripe.customers.list({ email: primaryUserEmail.toLowerCase(), limit: 1 });
      if (customers.data.length > 0) {
        const subscriptions = await stripe.subscriptions.list({
          customer: customers.data[0].id,
          status: "all",
        });
        const validSubscriptions = subscriptions.data.filter(sub => {
          if (sub.status === 'canceled') {
            const now = Math.floor(Date.now() / 1000);
            return sub.current_period_end > now;
          }
          return ['active', 'trialing', 'past_due', 'incomplete'].includes(sub.status);
        });
        if (validSubscriptions.length > 0) {
          const subscription = validSubscriptions[0];
          return {
            periodStart: new Date(subscription.current_period_start * 1000),
            periodEnd: new Date(subscription.current_period_end * 1000),
          };
        }
      }
    } catch (error) {
      console.error("Error fetching Stripe billing period:", error);
    }
  } else {
    // Wire transfer: calculate monthly cycles from subscription dates
    // Resets on the same day each month (anniversary date)
    const { data: wireTransferData } = await supabase
      .from("wire_transfer_subscriptions")
      .select("subscription_start_date, subscription_end_date")
      .eq("user_email", primaryUserEmail.toLowerCase())
      .eq("status", "active")
      .single();

    if (wireTransferData && wireTransferData.subscription_start_date) {
      const startDate = new Date(wireTransferData.subscription_start_date);
      const now = new Date();
      
      // Get the day of month from the start date (anniversary day)
      const anniversaryDay = startDate.getDate();
      
      // Calculate current period start (same day of month as start date, in current or previous month)
      const periodStart = new Date(now.getFullYear(), now.getMonth(), anniversaryDay);
      periodStart.setHours(0, 0, 0, 0);
      
      // If the anniversary day hasn't occurred yet this month, use previous month
      if (now.getDate() < anniversaryDay) {
        periodStart.setMonth(periodStart.getMonth() - 1);
      }
      
      // Ensure period start is not before subscription start date
      if (periodStart < startDate) {
        periodStart.setTime(startDate.getTime());
        periodStart.setHours(0, 0, 0, 0);
      }
      
      // Calculate period end (one month from period start, same day of month)
      const periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      periodEnd.setDate(anniversaryDay);
      periodEnd.setHours(23, 59, 59, 999);
      
      // Handle months with fewer days (e.g., Jan 31 -> Feb 28/29)
      // If the target day doesn't exist in the next month, use last day of that month
      if (periodEnd.getDate() !== anniversaryDay) {
        periodEnd.setDate(0); // Last day of previous month (which is the target month)
        periodEnd.setHours(23, 59, 59, 999);
      }
      
      // If subscription has an end date and period end exceeds it, use subscription end
      if (wireTransferData.subscription_end_date) {
        const subEndDate = new Date(wireTransferData.subscription_end_date);
        if (periodEnd > subEndDate) {
          return {
            periodStart,
            periodEnd: subEndDate,
          };
        }
      }
      
      return { periodStart, periodEnd };
    }
  }

  // Fallback: current month
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  return { periodStart, periodEnd };
}

/**
 * Check or create usage record, reset if period has changed
 */
async function getOrCreateUsageRecord(
  primaryUserEmail: string,
  subscriptionType: 'stripe' | 'wire_transfer'
): Promise<{ rowsUsed: number; rowsLimit: number; periodStart: Date; periodEnd: Date }> {
  // Get current billing period
  const { periodStart, periodEnd } = await getBillingPeriod(primaryUserEmail, subscriptionType);

  // Check if usage record exists
  const { data: existingRecord, error: fetchError } = await supabase
    .from("excel_export_usage")
    .select("*")
    .eq("primary_user_email", primaryUserEmail.toLowerCase())
    .eq("subscription_type", subscriptionType)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    console.error("Error fetching usage record:", fetchError);
    throw new Error("Failed to fetch usage record");
  }

  // If no record exists, create one
  if (!existingRecord) {
    const { data: newRecord, error: insertError } = await supabase
      .from("excel_export_usage")
      .insert({
        primary_user_email: primaryUserEmail.toLowerCase(),
        subscription_type: subscriptionType,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        rows_used: 0,
        rows_limit: ROWS_LIMIT,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating usage record:", insertError);
      throw new Error("Failed to create usage record");
    }

    return {
      rowsUsed: 0,
      rowsLimit: ROWS_LIMIT,
      periodStart,
      periodEnd,
    };
  }

  // Check if period has changed (monthly reset)
  const existingPeriodEnd = new Date(existingRecord.current_period_end);
  const now = new Date();

  // If current period has ended, reset usage
  if (now > existingPeriodEnd) {
    const { data: updatedRecord, error: updateError } = await supabase
      .from("excel_export_usage")
      .update({
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        rows_used: 0, // Reset to 0
      })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error resetting usage record:", updateError);
      throw new Error("Failed to reset usage record");
    }

    return {
      rowsUsed: 0,
      rowsLimit: ROWS_LIMIT,
      periodStart,
      periodEnd,
    };
  }

  // Return existing usage
  return {
    rowsUsed: existingRecord.rows_used,
    rowsLimit: existingRecord.rows_limit,
    periodStart: new Date(existingRecord.current_period_start),
    periodEnd: new Date(existingRecord.current_period_end),
  };
}

export async function GET() {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { primaryUserEmail, subscriptionType } = await getPrimaryUserEmail(user.email);
    const usage = await getOrCreateUsageRecord(primaryUserEmail, subscriptionType);

    const rowsRemaining = Math.max(0, usage.rowsLimit - usage.rowsUsed);

    const response: UsageInfo & { primaryUserEmail?: string } = {
      rowsUsed: usage.rowsUsed,
      rowsLimit: usage.rowsLimit,
      rowsRemaining,
      currentPeriodStart: usage.periodStart.toISOString(),
      currentPeriodEnd: usage.periodEnd.toISOString(),
      canExport: rowsRemaining > 0,
      primaryUserEmail,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking Excel export usage:", error);
    return NextResponse.json(
      { error: "Failed to check usage", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to check if export is allowed and reserve rows
 * This is called before the actual export to validate and reserve the rows
 */
export async function POST(req: Request) {
  try {
    const { getUser } = getKindeServerSession();
    const user = await getUser();

    if (!user || !user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rowCount } = await req.json();

    if (typeof rowCount !== 'number' || rowCount < 0) {
      return NextResponse.json({ error: "Invalid row count" }, { status: 400 });
    }

    const { primaryUserEmail, subscriptionType } = await getPrimaryUserEmail(user.email);
    const usage = await getOrCreateUsageRecord(primaryUserEmail, subscriptionType);

    const rowsRemaining = usage.rowsLimit - usage.rowsUsed;

    if (rowCount > rowsRemaining) {
      return NextResponse.json({
        canExport: false,
        rowsUsed: usage.rowsUsed,
        rowsLimit: usage.rowsLimit,
        rowsRemaining,
        requestedRows: rowCount,
        message: `You cannot export ${rowCount.toLocaleString()} rows. You have ${rowsRemaining.toLocaleString()} rows remaining in your subscription.`,
      });
    }

    // Update usage (reserve the rows)
    const { data: updatedRecord, error: updateError } = await supabase
      .from("excel_export_usage")
      .update({
        rows_used: usage.rowsUsed + rowCount,
      })
      .eq("primary_user_email", primaryUserEmail.toLowerCase())
      .eq("subscription_type", subscriptionType)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating usage:", updateError);
      return NextResponse.json({ error: "Failed to update usage" }, { status: 500 });
    }

    const newRowsRemaining = usage.rowsLimit - (usage.rowsUsed + rowCount);

    return NextResponse.json({
      canExport: true,
      rowsUsed: usage.rowsUsed + rowCount,
      rowsLimit: usage.rowsLimit,
      rowsRemaining: newRowsRemaining,
      requestedRows: rowCount,
      message: `Export approved. ${rowCount.toLocaleString()} rows will be used. ${newRowsRemaining.toLocaleString()} rows remaining.`,
    });
  } catch (error) {
    console.error("Error validating Excel export:", error);
    return NextResponse.json(
      { error: "Failed to validate export", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

