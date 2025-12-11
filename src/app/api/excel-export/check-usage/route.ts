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
 * Priority: Stripe > Wire Transfer
 */
async function getPrimaryUserEmail(userEmail: string): Promise<{ primaryUserEmail: string; subscriptionType: 'stripe' | 'wire_transfer' }> {
  // First, check if user is a sub-user
  const { data: allRecords } = await supabase
    .from("subscription_users")
    .select("primary_user, sub_users");

  let primaryUserEmail = userEmail;
  if (allRecords) {
    const userEmailLower = userEmail.toLowerCase();
    for (const record of allRecords) {
      if (record.sub_users && Array.isArray(record.sub_users)) {
        const isSubUser = record.sub_users.some(sub => 
          typeof sub === 'string' && sub.toLowerCase() === userEmailLower
        );
        if (isSubUser) {
          // User is a sub-user, use their primary user
          primaryUserEmail = record.primary_user;
          break;
        }
      }
    }
  }

  // Check if primary user has Stripe subscription (priority)
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
        return { primaryUserEmail, subscriptionType: 'stripe' };
      }
    }
  } catch (error) {
    console.error("Error checking Stripe:", error);
  }

  // Check if primary user is a wire transfer user
  const { data: wireTransferData, error: wireError } = await supabase
    .from("wire_transfer_subscriptions")
    .select("user_email, subscription_start_date, subscription_end_date")
    .eq("user_email", primaryUserEmail.toLowerCase())
    .eq("status", "active")
    .maybeSingle();

  if (wireTransferData && !wireError) {
    // Validate subscription is not expired
    const now = new Date();
    const startDate = wireTransferData.subscription_start_date ? new Date(wireTransferData.subscription_start_date) : null;
    const endDate = wireTransferData.subscription_end_date ? new Date(wireTransferData.subscription_end_date) : null;
    
    // Check if subscription is valid
    if (startDate && (!endDate || endDate >= now) && startDate <= now) {
      return { primaryUserEmail, subscriptionType: 'wire_transfer' };
    }
  }

  // Default: user is their own primary user (even if no active subscription)
  return { primaryUserEmail, subscriptionType: 'stripe' };
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
    const { data: wireTransferData, error: wireError } = await supabase
      .from("wire_transfer_subscriptions")
      .select("subscription_start_date, subscription_end_date")
      .eq("user_email", primaryUserEmail.toLowerCase())
      .eq("status", "active")
      .maybeSingle();

    if (wireError && wireError.code !== 'PGRST116') {
      console.error("Error fetching wire transfer subscription:", wireError);
    }

    if (wireTransferData && wireTransferData.subscription_start_date) {
      const startDate = new Date(wireTransferData.subscription_start_date);
      const now = new Date();
      
      // Validate start date is not in the future
      if (startDate > now) {
        console.warn(`Wire transfer subscription start date is in the future for ${primaryUserEmail}`);
        // Use current month as fallback
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return { periodStart, periodEnd };
      }
      
      // Check if subscription has expired
      if (wireTransferData.subscription_end_date) {
        const endDate = new Date(wireTransferData.subscription_end_date);
        if (endDate < now) {
          console.warn(`Wire transfer subscription has expired for ${primaryUserEmail}`);
          // Return expired period (no exports allowed)
          return {
            periodStart: endDate,
            periodEnd: endDate,
          };
        }
      }
      
      // Get the day of month from the start date (anniversary day)
      const anniversaryDay = startDate.getDate();
      
      // Calculate current period start (same day of month as start date, in current or previous month)
      let periodStart = new Date(now.getFullYear(), now.getMonth(), anniversaryDay);
      periodStart.setHours(0, 0, 0, 0);
      
      // If the anniversary day hasn't occurred yet this month, use previous month
      if (now.getDate() < anniversaryDay) {
        periodStart.setMonth(periodStart.getMonth() - 1);
        // Handle edge case: if anniversary day doesn't exist in previous month (e.g., Jan 31 -> Dec 31)
        if (periodStart.getDate() !== anniversaryDay) {
          // Use last day of previous month
          periodStart = new Date(now.getFullYear(), now.getMonth(), 0, 0, 0, 0, 0);
        }
      }
      
      // Ensure period start is not before subscription start date
      if (periodStart < startDate) {
        periodStart = new Date(startDate);
        periodStart.setHours(0, 0, 0, 0);
      }
      
      // Calculate period end (one month from period start, same day of month)
      let periodEnd = new Date(periodStart);
      periodEnd.setMonth(periodEnd.getMonth() + 1);
      
      // Try to set the anniversary day
      const targetMonth = periodEnd.getMonth();
      const targetYear = periodEnd.getFullYear();
      
      // Get the last day of the target month
      const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      
      // Use anniversary day if it exists in target month, otherwise use last day
      const targetDay = Math.min(anniversaryDay, lastDayOfTargetMonth);
      periodEnd.setDate(targetDay);
      periodEnd.setHours(23, 59, 59, 999);
      
      // Verify the date is correct (handles leap years, month length variations)
      if (periodEnd.getMonth() !== targetMonth) {
        // If month changed, we went too far - use last day of target month
        periodEnd = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
      }
      
      // If subscription has an end date and period end exceeds it, use subscription end
      if (wireTransferData.subscription_end_date) {
        const subEndDate = new Date(wireTransferData.subscription_end_date);
        subEndDate.setHours(23, 59, 59, 999);
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
 * Handles edge cases: invalid dates, period mismatches, expired subscriptions
 */
async function getOrCreateUsageRecord(
  primaryUserEmail: string,
  subscriptionType: 'stripe' | 'wire_transfer'
): Promise<{ rowsUsed: number; rowsLimit: number; periodStart: Date; periodEnd: Date }> {
  // Get current billing period
  const { periodStart, periodEnd } = await getBillingPeriod(primaryUserEmail, subscriptionType);

  // Validate period dates
  if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime())) {
    console.error(`Invalid period dates for ${primaryUserEmail}`);
    throw new Error("Invalid billing period dates");
  }

  if (periodStart >= periodEnd) {
    console.error(`Period start is after period end for ${primaryUserEmail}`);
    // If period is invalid (e.g., expired subscription), return zero usage
    return {
      rowsUsed: ROWS_LIMIT, // Set to limit to prevent exports
      rowsLimit: ROWS_LIMIT,
      periodStart,
      periodEnd,
    };
  }

  // Check if usage record exists
  const { data: existingRecord, error: fetchError } = await supabase
    .from("excel_export_usage")
    .select("*")
    .eq("primary_user_email", primaryUserEmail.toLowerCase())
    .eq("subscription_type", subscriptionType)
    .maybeSingle();

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

  // Validate existing record dates
  const existingPeriodStart = new Date(existingRecord.current_period_start);
  const existingPeriodEnd = new Date(existingRecord.current_period_end);
  const now = new Date();

  // If existing dates are invalid, reset the record
  if (isNaN(existingPeriodStart.getTime()) || isNaN(existingPeriodEnd.getTime())) {
    console.warn(`Invalid dates in usage record for ${primaryUserEmail}, resetting`);
    const { data: updatedRecord, error: updateError } = await supabase
      .from("excel_export_usage")
      .update({
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        rows_used: 0,
      })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error resetting invalid usage record:", updateError);
      throw new Error("Failed to reset usage record");
    }

    return {
      rowsUsed: 0,
      rowsLimit: ROWS_LIMIT,
      periodStart,
      periodEnd,
    };
  }

  // Check if period has changed (monthly reset)
  // Use a small buffer (1 second) to handle edge cases at exact boundary
  const periodEndWithBuffer = new Date(existingPeriodEnd.getTime() + 1000);

  // If current period has ended, reset usage
  if (now > periodEndWithBuffer) {
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

  // If period dates don't match calculated period (subscription changed), update them
  // Allow 1 day tolerance for timezone/calculation differences
  const periodStartDiff = Math.abs(periodStart.getTime() - existingPeriodStart.getTime());
  const periodEndDiff = Math.abs(periodEnd.getTime() - existingPeriodEnd.getTime());
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (periodStartDiff > oneDayMs || periodEndDiff > oneDayMs) {
    console.warn(`Period mismatch for ${primaryUserEmail}, updating dates`);
    const { data: updatedRecord, error: updateError } = await supabase
      .from("excel_export_usage")
      .update({
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        // Keep existing rows_used - don't reset if period just shifted
      })
      .eq("id", existingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating period dates:", updateError);
      // Continue with existing record if update fails
    } else if (updatedRecord) {
      return {
        rowsUsed: updatedRecord.rows_used || 0,
        rowsLimit: updatedRecord.rows_limit || ROWS_LIMIT,
        periodStart,
        periodEnd,
      };
    }
  }

  // Return existing usage
  return {
    rowsUsed: existingRecord.rows_used || 0,
    rowsLimit: existingRecord.rows_limit || ROWS_LIMIT,
    periodStart: existingPeriodStart,
    periodEnd: existingPeriodEnd,
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
    
    // Check user role to determine if they are subscription manager or primary user
    let userRole: 'subscription_manager' | 'primary_user' | 'sub_user' = 'primary_user';
    
    // Check registrationform table for account_role
    const { data: formData } = await supabase
      .from("registrationform")
      .select("account_role")
      .eq("email", user.email.toLowerCase())
      .single();
    
    if (formData?.account_role === 'subscription_manager') {
      userRole = 'subscription_manager';
    } else {
      // Check if current user is the primary user or a sub-user
      const isCurrentUserPrimary = user.email.toLowerCase() === primaryUserEmail.toLowerCase();
      userRole = isCurrentUserPrimary ? 'primary_user' : 'sub_user';
    }

    const response: UsageInfo & { primaryUserEmail?: string; userRole?: 'subscription_manager' | 'primary_user' | 'sub_user' } = {
      rowsUsed: usage.rowsUsed,
      rowsLimit: usage.rowsLimit,
      rowsRemaining,
      currentPeriodStart: usage.periodStart.toISOString(),
      currentPeriodEnd: usage.periodEnd.toISOString(),
      canExport: rowsRemaining > 0,
      primaryUserEmail,
      userRole,
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

    // Validate row count with comprehensive checks
    if (typeof rowCount !== 'number' || isNaN(rowCount) || !isFinite(rowCount)) {
      return NextResponse.json({ error: "Invalid row count: must be a valid number" }, { status: 400 });
    }

    if (rowCount < 0) {
      return NextResponse.json({ error: "Invalid row count: cannot be negative" }, { status: 400 });
    }

    if (rowCount > ROWS_LIMIT) {
      return NextResponse.json({ 
        error: `Invalid row count: cannot exceed limit of ${ROWS_LIMIT.toLocaleString()} rows per export` 
      }, { status: 400 });
    }

    if (rowCount === 0) {
      return NextResponse.json({ 
        error: "Invalid row count: must be greater than 0" 
      }, { status: 400 });
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

    // Re-fetch usage to ensure we have the latest data (handles race conditions)
    const latestUsage = await getOrCreateUsageRecord(primaryUserEmail, subscriptionType);
    const latestRowsRemaining = latestUsage.rowsLimit - latestUsage.rowsUsed;

    // Double-check with latest data
    if (rowCount > latestRowsRemaining) {
      return NextResponse.json({
        canExport: false,
        rowsUsed: latestUsage.rowsUsed,
        rowsLimit: latestUsage.rowsLimit,
        rowsRemaining: latestRowsRemaining,
        requestedRows: rowCount,
        message: `You cannot export ${rowCount.toLocaleString()} rows. You have ${latestRowsRemaining.toLocaleString()} rows remaining in your subscription.`,
      });
    }

    // Update usage (reserve the rows) - use atomic increment to prevent race conditions
    const { data: updatedRecord, error: updateError } = await supabase
      .from("excel_export_usage")
      .update({
        rows_used: latestUsage.rowsUsed + rowCount,
      })
      .eq("primary_user_email", primaryUserEmail.toLowerCase())
      .eq("subscription_type", subscriptionType)
      .select()
      .single();

    if (updateError) {
      console.error("Error updating usage:", updateError);
      return NextResponse.json({ error: "Failed to update usage" }, { status: 500 });
    }

    // Verify the update was successful
    if (!updatedRecord || updatedRecord.rows_used === undefined) {
      console.error("Usage update returned invalid data");
      return NextResponse.json({ error: "Failed to update usage" }, { status: 500 });
    }

    const newRowsRemaining = updatedRecord.rows_limit - updatedRecord.rows_used;

    return NextResponse.json({
      canExport: true,
      rowsUsed: updatedRecord.rows_used,
      rowsLimit: updatedRecord.rows_limit,
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

