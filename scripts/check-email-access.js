#!/usr/bin/env node

/**
 * Script to check email access status
 * Usage: node scripts/check-email-access.js <email1> <email2> ...
 * Or: node scripts/check-email-access.js (uses default test emails)
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

async function checkEmailAccess(emails) {
  try {
    console.log('🔍 Checking access status for emails:', emails.join(', '));
    console.log('📡 API URL:', `${BASE_URL}/api/check-email-access`);
    console.log('');

    const response = await fetch(`${BASE_URL}/api/check-email-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Display results
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('📊 EMAIL ACCESS CHECK RESULTS');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`Checked: ${data.summary.totalChecked} emails`);
    console.log(`✅ Can Access: ${data.summary.canAccess}`);
    console.log(`❌ Cannot Access: ${data.summary.cannotAccess}`);
    console.log('');

    data.results.forEach((result, index) => {
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

    return data;
  } catch (error) {
    console.error('❌ Error checking email access:', error.message);
    if (error.message.includes('fetch')) {
      console.error('\n💡 Make sure the Next.js server is running:');
      console.error('   pnpm dev');
    }
    process.exit(1);
  }
}

// Get emails from command line arguments or use defaults
const args = process.argv.slice(2);
const emails = args.length > 0 
  ? args 
  : ['ford@teamsvc.com', 'April@teamsvc.com', 'bryan@teamsvc.com'];

// Run the check
checkEmailAccess(emails).catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

