// Script to add devreddy923@gmail.com to transferred_subscriptions table
// Run this with: node add-devreddy-to-transferred.js

const addTransferredUser = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/add-transferred-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // You'll need to add your auth token here if running from outside the app
      },
      body: JSON.stringify({
        primaryUserEmail: 'dev@metasysconsulting.com',  // Primary user
        subUserEmail: 'devreddy923@gmail.com',          // Your email
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

// Run the script
addTransferredUser();
