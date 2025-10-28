// Direct script to add devreddy923@gmail.com to transferred_subscriptions table
// Run with: node add-devreddy-to-table.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const addDevreddyToTransferred = async () => {
  try {
    console.log('🔍 Adding devreddy923@gmail.com to transferred_subscriptions table...');
    
    const { data, error } = await supabase
      .from('transferred_subscriptions')
      .insert({
        primary_user_email: 'dev@metasysconsulting.com',
        sub_user_email: 'devreddy923@gmail.com',
        subscription_start_date: '2024-01-01T00:00:00.000Z',
        subscription_end_date: '2025-12-31T23:59:59.000Z',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error adding user to transferred subscriptions:', error);
      return;
    }

    console.log('✅ Successfully added devreddy923@gmail.com to transferred subscriptions!');
    console.log('📋 Record details:', data);
    
    // Verify the insertion
    const { data: verifyData, error: verifyError } = await supabase
      .from('transferred_subscriptions')
      .select('*')
      .eq('sub_user_email', 'devreddy923@gmail.com');

    if (verifyError) {
      console.error('❌ Error verifying insertion:', verifyError);
    } else {
      console.log('✅ Verification successful - found record:', verifyData);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
};

// Run the script
addDevreddyToTransferred();
