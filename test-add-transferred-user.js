// Test script to add devreddy923@gmail.com to transferred subscriptions
// Run this in your browser console while logged in to the app

const addDevreddyToTransferred = async () => {
  try {
    const response = await fetch('/api/add-transferred-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primaryUserEmail: 'dev@metasysconsulting.com',
        subUserEmail: 'devreddy923@gmail.com',
        subscriptionStartDate: '2024-01-01T00:00:00.000Z',
        subscriptionEndDate: '2025-12-31T23:59:59.000Z',
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Successfully added devreddy923@gmail.com to transferred subscriptions');
      console.log('Result:', result);
    } else {
      console.error('❌ Failed to add user:', result);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

// Run the function
addDevreddyToTransferred();
