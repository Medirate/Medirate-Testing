#!/usr/bin/env node

/**
 * Detailed debug script to check email access
 * Shows exactly what's in the database and what Stripe keys are being used
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const stripeKey = process.env.STRIPE_SECRET_KEY;

console.log('🔍 DEBUG MODE - Detailed Email Access Check\n');
console.log('═'.repeat(70));

// Check Stripe key type
if (stripeKey) {
  const isLiveKey = stripeKey.startsWith('sk_live_');
  const isTestKey = stripeKey.startsWith('sk_test_');
  console.log('💳 STRIPE KEY STATUS:');
  console.log(`   Key Type: ${isLiveKey ? '✅ LIVE (Production)' : isTestKey ? '⚠️ TEST (Development)' : '❓ UNKNOWN'}`);
  console.log(`   Key Preview: ${stripeKey.substring(0, 12)}...${stripeKey.substring(stripeKey.length - 4)}`);
} else {
  console.log('❌ STRIPE KEY: Not found in environment variables');
}
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const emails = ['ford@teamsvc.com', 'April@teamsvc.com', 'bryan@teamsvc.com'];

async function debugEmailAccess() {
  console.log('📊 DATABASE INSPECTION\n');
  
  // 1. Get ALL records from subscription_users table
  console.log('1️⃣ Fetching ALL records from subscription_users table...');
  const { data: allRecords, error: allError } = await supabase
    .from('subscription_users')
    .select('*');

  if (allError) {
    console.error('❌ Error fetching subscription_users:', allError);
  } else {
    console.log(`   Found ${allRecords?.length || 0} total records\n`);
    
    if (allRecords && allRecords.length > 0) {
      console.log('   📋 ALL RECORDS IN subscription_users TABLE:');
      allRecords.forEach((record, idx) => {
        console.log(`\n   Record #${idx + 1}:`);
        console.log(`      Primary User: ${record.primary_user}`);
        console.log(`      Sub Users: ${JSON.stringify(record.sub_users)}`);
        console.log(`      Sub Users Type: ${typeof record.sub_users}`);
        console.log(`      Is Array: ${Array.isArray(record.sub_users)}`);
        if (Array.isArray(record.sub_users)) {
          console.log(`      Sub Users Count: ${record.sub_users.length}`);
          record.sub_users.forEach((sub, i) => {
            console.log(`         [${i}] "${sub}" (type: ${typeof sub}, lower: "${sub?.toLowerCase()}")`);
          });
        }
      });
    } else {
      console.log('   ⚠️ No records found in subscription_users table');
    }
  }

  console.log('\n' + '─'.repeat(70));
  console.log('2️⃣ Checking specific emails...\n');

  // 2. Check each email in detail
  for (const email of emails) {
    const emailLower = email.toLowerCase().trim();
    const emailOriginal = email.trim();
    
    console.log(`\n📧 Checking: ${emailOriginal}`);
    console.log(`   Normalized: ${emailLower}`);
    
    // Check as primary user
    const { data: primaryData, error: primaryError } = await supabase
      .from('subscription_users')
      .select('*')
      .eq('primary_user', emailOriginal)
      .single();
    
    const { data: primaryDataLower, error: primaryErrorLower } = await supabase
      .from('subscription_users')
      .select('*')
      .eq('primary_user', emailLower)
      .single();

    console.log(`   As Primary User (exact match "${emailOriginal}"):`);
    if (primaryData) {
      console.log(`      ✅ FOUND: ${JSON.stringify(primaryData)}`);
    } else if (primaryError?.code === 'PGRST116') {
      console.log(`      ❌ NOT FOUND`);
    } else {
      console.log(`      ⚠️ ERROR: ${primaryError?.message}`);
    }

    console.log(`   As Primary User (lowercase "${emailLower}"):`);
    if (primaryDataLower) {
      console.log(`      ✅ FOUND: ${JSON.stringify(primaryDataLower)}`);
    } else if (primaryErrorLower?.code === 'PGRST116') {
      console.log(`      ❌ NOT FOUND`);
    } else {
      console.log(`      ⚠️ ERROR: ${primaryErrorLower?.message}`);
    }

    // Check as sub-user
    console.log(`   As Sub-User (searching in all records):`);
    let foundAsSubUser = false;
    if (allRecords) {
      for (const record of allRecords) {
        if (record.sub_users) {
          const subUsers = Array.isArray(record.sub_users) ? record.sub_users : [];
          const exactMatch = subUsers.includes(emailOriginal);
          const lowerMatch = subUsers.some(sub => sub?.toLowerCase() === emailLower);
          const caseInsensitiveMatch = subUsers.some(sub => 
            typeof sub === 'string' && sub.toLowerCase() === emailLower
          );
          
          if (exactMatch || lowerMatch || caseInsensitiveMatch) {
            foundAsSubUser = true;
            console.log(`      ✅ FOUND in sub_users array for primary: ${record.primary_user}`);
            console.log(`      Exact match: ${exactMatch}`);
            console.log(`      Lowercase match: ${lowerMatch}`);
            console.log(`      Case-insensitive match: ${caseInsensitiveMatch}`);
            console.log(`      Full array: ${JSON.stringify(subUsers)}`);
            break;
          }
        }
      }
    }
    
    if (!foundAsSubUser) {
      console.log(`      ❌ NOT FOUND in any sub_users array`);
    }

    // Check admin
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', emailOriginal)
      .single();
    
    const { data: adminDataLower, error: adminErrorLower } = await supabase
      .from('admin_users')
      .select('*')
      .eq('email', emailLower)
      .single();

    console.log(`   In Admin Users (exact match "${emailOriginal}"):`);
    if (adminData) {
      console.log(`      ✅ FOUND: Admin user`);
    } else if (adminError?.code === 'PGRST116') {
      console.log(`      ❌ NOT FOUND`);
    } else {
      console.log(`      ⚠️ ERROR: ${adminError?.message}`);
    }

    console.log(`   In Admin Users (lowercase "${emailLower}"):`);
    if (adminDataLower) {
      console.log(`      ✅ FOUND: Admin user`);
    } else if (adminErrorLower?.code === 'PGRST116') {
      console.log(`      ❌ NOT FOUND`);
    } else {
      console.log(`      ⚠️ ERROR: ${adminErrorLower?.message}`);
    }
  }

  console.log('\n' + '═'.repeat(70));
  console.log('✨ Debug complete!');
}

debugEmailAccess().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

