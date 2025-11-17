import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";
import Stripe from "stripe";

const supabase = createServiceClient();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
});

interface AccessCheckResult {
  email: string;
  canAuthenticate: boolean; // Can log in via Kinde
  hasAccess: boolean; // Can access protected pages
  accessReason: string;
  details: {
    hasActiveStripeSubscription: boolean;
    stripeStatus: string | null;
    isSubUser: boolean;
    primaryUserEmail: string | null;
    primaryUserHasActiveSubscription: boolean;
    isWireTransferUser: boolean;
    isAdmin: boolean;
    inSubscriptionUsersTable: boolean;
    subscriptionUsersRole: "primary" | "sub-user" | "none";
  };
}

export async function POST(req: Request) {
  try {
    const { emails } = await req.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Please provide an array of emails to check" },
        { status: 400 }
      );
    }

    const results: AccessCheckResult[] = [];

    for (const email of emails) {
      const emailLower = email.toLowerCase().trim();
      const result: AccessCheckResult = {
        email: emailLower,
        canAuthenticate: true, // Anyone can authenticate via Kinde
        hasAccess: false,
        accessReason: "",
        details: {
          hasActiveStripeSubscription: false,
          stripeStatus: null,
          isSubUser: false,
          primaryUserEmail: null,
          primaryUserHasActiveSubscription: false,
          isWireTransferUser: false,
          isAdmin: false,
          inSubscriptionUsersTable: false,
          subscriptionUsersRole: "none",
        },
      };

      // 1. Check Stripe subscription
      try {
        const customers = await stripe.customers.list({
          email: emailLower,
          limit: 1,
        });

        if (customers.data.length > 0) {
          const customer = customers.data[0];
          const subscriptions = await stripe.subscriptions.list({
            customer: customer.id,
            status: "all",
            expand: ["data.latest_invoice", "data.default_payment_method"],
          });

          const validSubscriptions = subscriptions.data.filter((sub) => {
            if (sub.status === "canceled") {
              const now = Math.floor(Date.now() / 1000);
              return sub.current_period_end > now;
            }
            return ["active", "trialing", "past_due", "incomplete"].includes(
              sub.status
            );
          });

          if (validSubscriptions.length > 0) {
            const subscription = validSubscriptions[0];
            result.details.hasActiveStripeSubscription = true;
            result.details.stripeStatus = subscription.status;
            result.hasAccess = true;
            result.accessReason = `Active Stripe subscription (status: ${subscription.status})`;
          } else {
            result.details.stripeStatus = "no_active_subscription";
          }
        } else {
          result.details.stripeStatus = "no_customer_found";
        }
      } catch (stripeError) {
        console.error(`Error checking Stripe for ${emailLower}:`, stripeError);
        result.details.stripeStatus = "error";
      }

      // 2. Check subscription_users table
      try {
        const { data: allRecords, error: searchError } = await supabase
          .from("subscription_users")
          .select("primary_user, sub_users");

        if (!searchError && allRecords) {
          // Check if user is a sub-user (case-insensitive)
          for (const record of allRecords) {
            if (record.sub_users && Array.isArray(record.sub_users)) {
              // Case-insensitive check: compare lowercase versions
              const isSubUser = record.sub_users.some(sub => 
                typeof sub === 'string' && sub.toLowerCase() === emailLower
              );
              
              if (isSubUser) {
                result.details.isSubUser = true;
                result.details.primaryUserEmail = record.primary_user;
                result.details.inSubscriptionUsersTable = true;
                result.details.subscriptionUsersRole = "sub-user";

                // Check if primary user has active subscription
                try {
                  const primaryCustomers = await stripe.customers.list({
                    email: record.primary_user,
                    limit: 1,
                  });

                  if (primaryCustomers.data.length > 0) {
                    const primaryCustomer = primaryCustomers.data[0];
                    const primarySubscriptions =
                      await stripe.subscriptions.list({
                        customer: primaryCustomer.id,
                        status: "all",
                      });

                    const validPrimarySubscriptions =
                      primarySubscriptions.data.filter((sub) => {
                        if (sub.status === "canceled") {
                          const now = Math.floor(Date.now() / 1000);
                          return sub.current_period_end > now;
                        }
                        return ["active", "trialing", "past_due", "incomplete"].includes(
                          sub.status
                        );
                      });

                    if (validPrimarySubscriptions.length > 0) {
                      result.details.primaryUserHasActiveSubscription = true;
                      result.hasAccess = true;
                      result.accessReason = `Sub-user with access through primary user ${record.primary_user} (active subscription)`;
                    }
                  }
                } catch (primaryStripeError) {
                  console.error(
                    `Error checking primary user Stripe:`,
                    primaryStripeError
                  );
                }

                break;
              }
            }
          }

          // Check if user is a primary user
          const { data: primaryRecord } = await supabase
            .from("subscription_users")
            .select("sub_users")
            .eq("primary_user", emailLower)
            .single();

          if (primaryRecord) {
            result.details.inSubscriptionUsersTable = true;
            result.details.subscriptionUsersRole = "primary";
          }
        }
      } catch (subUserError) {
        console.error(
          `Error checking subscription_users for ${emailLower}:`,
          subUserError
        );
      }

      // 3. Check wire transfer subscriptions
      try {
        const { data: wireTransferData, error: wireTransferError } =
          await supabase
            .from("wire_transfer_subscriptions")
            .select("*")
            .eq("user_email", emailLower)
            .eq("status", "active")
            .single();

        if (!wireTransferError && wireTransferData) {
          result.details.isWireTransferUser = true;
          result.hasAccess = true;
          result.accessReason = result.accessReason
            ? `${result.accessReason} + Wire transfer subscription`
            : "Wire transfer subscription (active)";
        }
      } catch (wireTransferError) {
        console.error(
          `Error checking wire transfer for ${emailLower}:`,
          wireTransferError
        );
      }

      // 4. Check admin users
      try {
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("*")
          .eq("email", emailLower)
          .single();

        if (!adminError && adminData) {
          result.details.isAdmin = true;
          result.hasAccess = true;
          result.accessReason = result.accessReason
            ? `${result.accessReason} + Admin access`
            : "Admin user";
        }
      } catch (adminError) {
        // Not an admin, that's fine
      }

      // Set final access reason if no access
      if (!result.hasAccess) {
        result.accessReason =
          "No active subscription, not a sub-user, not a wire transfer user, and not an admin";
      }

      results.push(result);
    }

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      results,
      summary: {
        totalChecked: results.length,
        canAccess: results.filter((r) => r.hasAccess).length,
        cannotAccess: results.filter((r) => !r.hasAccess).length,
      },
    });
  } catch (error) {
    console.error("Error in check-email-access API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

