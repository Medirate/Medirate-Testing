#!/usr/bin/env node

/**
 * Direct email access checker - queries database directly
 * Usage: node scripts/check-emails-direct.js
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

if (!stripeKey) {
  console.error('❌ Missing Stripe key. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const stripe = new Stripe(stripeKey, {
  apiVersion: '2025-02-24.acacia',
});

const emails = ['ford@teamsvc.com', 'April@teamsvc.com', 'bryan@teamsvc.com'];

async function checkEmailAccess(email) {
  const emailLower = email.toLowerCase().trim();
  const result = {
    email: emailLower,
    canAuthenticate: true,
    hasAccess: false,
    accessReason: '',
    details: {
      hasActiveStripeSubscription: false,
      stripeStatus: null,
      isSubUser: false,
      primaryUserEmail: null,
      primaryUserHasActiveSubscription: false,
      isWireTransferUser: false,
      isAdmin: false,
      inSubscriptionUsersTable: false,
      subscriptionUsersRole: 'none',
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
        status: 'all',
      });

      const validSubscriptions = subscriptions.data.filter((sub) => {
        if (sub.status === 'canceled') {
          const now = Math.floor(Date.now() / 1000);
          return sub.current_period_end > now;
        }
        return ['active', 'trialing', 'past_due', 'incomplete'].includes(sub.status);
      });

      if (validSubscriptions.length > 0) {
        const subscription = validSubscriptions[0];
        result.details.hasActiveStripeSubscription = true;
        result.details.stripeStatus = subscription.status;
        result.hasAccess = true;
        result.accessReason = `Active Stripe subscription (status: ${subscription.status})`;
      } else {
        result.details.stripeStatus = 'no_active_subscription';
      }
    } else {
      result.details.stripeStatus = 'no_customer_found';
    }
  } catch (stripeError) {
    console.error(`Error checking Stripe for ${emailLower}:`, stripeError.message);
    result.details.stripeStatus = 'error';
  }

  // 2. Check subscription_users table
  try {
    const { data: allRecords, error: searchError } = await supabase
      .from('subscription_users')
      .select('primary_user, sub_users');

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
            result.details.subscriptionUsersRole = 'sub-user';

            // Check if primary user has active subscription
            try {
              const primaryCustomers = await stripe.customers.list({
                email: record.primary_user,
                limit: 1,
              });

              if (primaryCustomers.data.length > 0) {
                const primaryCustomer = primaryCustomers.data[0];
                const primarySubscriptions = await stripe.subscriptions.list({
                  customer: primaryCustomer.id,
                  status: 'all',
                });

                const validPrimarySubscriptions = primarySubscriptions.data.filter((sub) => {
                  if (sub.status === 'canceled') {
                    const now = Math.floor(Date.now() / 1000);
                    return sub.current_period_end > now;
                  }
                  return ['active', 'trialing', 'past_due', 'incomplete'].includes(sub.status);
                });

                if (validPrimarySubscriptions.length > 0) {
                  result.details.primaryUserHasActiveSubscription = true;
                  result.hasAccess = true;
                  result.accessReason = `Sub-user with access through primary user ${record.primary_user} (active subscription)`;
                }
              }
            } catch (primaryStripeError) {
              console.error(`Error checking primary user Stripe:`, primaryStripeError.message);
            }

            break;
          }
        }
      }

      // Check if user is a primary user
      const { data: primaryRecord } = await supabase
        .from('subscription_users')
        .select('sub_users')
        .eq('primary_user', emailLower)
        .single();

      if (primaryRecord) {
        result.details.inSubscriptionUsersTable = true;
        result.details.subscriptionUsersRole = 'primary';
      }
    }
  } catch (subUserError) {
    console.error(`Error checking subscription_users for ${emailLower}:`, subUserError.message);
  }

  // 3. Check wire transfer subscriptions
  try {
    const { data: wireTransferData, error: wireTransferError } = await supabase
      .from('wire_transfer_subscriptions')
      .select('*')
      .eq('user_email', emailLower)
      .eq('status', 'active')
      .single();

    if (!wireTransferError && wireTransferData) {
      result.details.isWireTransferUser = true;
      result.hasAccess = true;
      result.accessReason = result.accessReason
        ? `${result.accessReason} + Wire transfer subscription`
        : 'Wire transfer subscription (active)';
    }
  } catch (wireTransferError) {
    // Not a wire transfer user, that's fine
  }

  // 4. Check admin users
  try {
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', emailLower)
      .single();

    if (!adminError && adminData) {
      result.details.isAdmin = true;
      result.hasAccess = true;
      result.accessReason = result.accessReason
        ? `${result.accessReason} + Admin access`
        : 'Admin user';
    }
  } catch (adminError) {
    // Not an admin, that's fine
  }

  // Set final access reason if no access
  if (!result.hasAccess) {
    result.accessReason =
      'No active subscription, not a sub-user, not a wire transfer user, and not an admin';
  }

  return result;
}

async function main() {
  console.log('🔍 Checking email access status...\n');
  console.log('📧 Emails to check:', emails.join(', '));
  console.log('');

  const results = [];

  for (const email of emails) {
    console.log(`⏳ Checking ${email}...`);
    const result = await checkEmailAccess(email);
    results.push(result);
  }

  // Display results
  console.log('\n' + '═'.repeat(65));
  console.log('📊 EMAIL ACCESS CHECK RESULTS');
  console.log('═'.repeat(65));
  console.log(`Checked: ${results.length} emails`);
  console.log(`✅ Can Access: ${results.filter((r) => r.hasAccess).length}`);
  console.log(`❌ Cannot Access: ${results.filter((r) => !r.hasAccess).length}`);
  console.log('');

  results.forEach((result, index) => {
    console.log(`\n${'─'.repeat(65)}`);
    console.log(`📧 Email #${index + 1}: ${result.email}`);
    console.log(`${'─'.repeat(65)}`);

    console.log(`🔐 Can Authenticate (Login): ${result.canAuthenticate ? '✅ YES' : '❌ NO'}`);
    console.log(`🔓 Can Access Protected Pages: ${result.hasAccess ? '✅ YES' : '❌ NO'}`);
    console.log(`📝 Access Reason: ${result.accessReason}`);
    console.log('');
    console.log('📋 Details:');
    console.log(`   • Stripe Subscription: ${result.details.hasActiveStripeSubscription ? '✅ Active' : '❌ None'} (${result.details.stripeStatus || 'N/A'})`);
    console.log(`   • Is Sub-User: ${result.details.isSubUser ? '✅ YES' : '❌ NO'}`);
    if (result.details.isSubUser) {
      console.log(`   • Primary User: ${result.details.primaryUserEmail || 'N/A'}`);
      console.log(`   • Primary Has Active Subscription: ${result.details.primaryUserHasActiveSubscription ? '✅ YES' : '❌ NO'}`);
    }
    console.log(`   • Wire Transfer User: ${result.details.isWireTransferUser ? '✅ YES' : '❌ NO'}`);
    console.log(`   • Admin User: ${result.details.isAdmin ? '✅ YES' : '❌ NO'}`);
    console.log(`   • In Subscription Users Table: ${result.details.inSubscriptionUsersTable ? '✅ YES' : '❌ NO'}`);
    if (result.details.inSubscriptionUsersTable) {
      console.log(`   • Role in Table: ${result.details.subscriptionUsersRole}`);
    }
  });

  console.log('\n' + '═'.repeat(65));
  console.log('✨ Check complete!');
  console.log('═'.repeat(65));
}

main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

