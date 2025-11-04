#!/usr/bin/env node

/**
 * Check environment variables to see which database/Stripe we're using
 */

require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

console.log('🔍 ENVIRONMENT VARIABLES CHECK\n');
console.log('═'.repeat(70));

// Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📊 SUPABASE:');
console.log(`   URL: ${supabaseUrl ? supabaseUrl.substring(0, 40) + '...' : '❌ NOT SET'}`);
console.log(`   Anon Key: ${supabaseAnonKey ? supabaseAnonKey.substring(0, 20) + '...' : '❌ NOT SET'}`);
console.log(`   Service Key: ${supabaseServiceKey ? supabaseServiceKey.substring(0, 20) + '...' : '❌ NOT SET'}`);
console.log('');

// Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

console.log('💳 STRIPE:');
if (stripeSecretKey) {
  const isLive = stripeSecretKey.startsWith('sk_live_');
  const isTest = stripeSecretKey.startsWith('sk_test_');
  console.log(`   Secret Key Type: ${isLive ? '✅ LIVE (Production)' : isTest ? '⚠️ TEST (Development)' : '❓ UNKNOWN'}`);
  console.log(`   Secret Key: ${stripeSecretKey.substring(0, 12)}...${stripeSecretKey.substring(stripeSecretKey.length - 4)}`);
} else {
  console.log(`   Secret Key: ❌ NOT SET`);
}

if (stripePublishableKey) {
  const isLivePub = stripePublishableKey.startsWith('pk_live_');
  const isTestPub = stripePublishableKey.startsWith('pk_test_');
  console.log(`   Publishable Key Type: ${isLivePub ? '✅ LIVE (Production)' : isTestPub ? '⚠️ TEST (Development)' : '❓ UNKNOWN'}`);
  console.log(`   Publishable Key: ${stripePublishableKey.substring(0, 12)}...${stripePublishableKey.substring(stripePublishableKey.length - 4)}`);
} else {
  console.log(`   Publishable Key: ❌ NOT SET`);
}

console.log('');
console.log('═'.repeat(70));
console.log('\n⚠️  IMPORTANT:');
console.log('   - If you see TEST keys, you\'re checking the development environment');
console.log('   - If the user added sub-users in production, you need LIVE keys');
console.log('   - The database URL determines which Supabase project you\'re checking');
console.log('');

