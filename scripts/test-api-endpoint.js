async function testSubscriptionSessionsAPI() {
  console.log('🧪 Testing subscription sessions API endpoint...');

  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/mentor/subscription-sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include authentication headers
        // For now, we'll just test the endpoint structure
      }
    });

    console.log(`📡 API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log(`   Success: ${data.success}`);
      if (data.data) {
        console.log(`   Sessions found: ${data.data.length}`);
        if (data.data.length > 0) {
          console.log('   First session:', {
            id: data.data[0].id,
            title: data.data[0].title,
            scheduledTime: data.data[0].scheduledTime,
            sessionFormat: data.data[0].sessionFormat,
            totalBookings: data.data[0].totalBookings
          });
        }
      }
    } else {
      const errorData = await response.json();
      console.log('❌ API call failed');
      console.log(`   Error: ${errorData.error}`);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('ℹ️  This is expected if the dev server is not running');
  }
}

// Run the test
testSubscriptionSessionsAPI()
  .then(() => {
    console.log('\n✅ API test completed');
  })
  .catch((error) => {
    console.error('\n💥 API test failed:', error);
  });