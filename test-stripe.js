// Test script to check Stripe subscription status
// Run this in browser console on the subscribe page

async function testStripeSubscription() {
  const email = 'dev@metasysconsulting.com'; // Replace with your actual email
  
  console.log('🔍 Testing Stripe subscription for:', email);
  
  try {
    const response = await fetch('/api/stripe/subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    });
    
    console.log('📊 Response status:', response.status);
    const data = await response.json();
    console.log('📊 Response data:', data);
    
    if (data.status === 'active') {
      console.log('✅ Active subscription found!');
    } else {
      console.log('❌ No active subscription:', data.status);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testStripeSubscription();
