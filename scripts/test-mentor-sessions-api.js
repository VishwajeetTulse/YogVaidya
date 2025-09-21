async function testMentorSessionsAPI() {
  console.log('🧪 Testing mentor sessions API to check session IDs...');

  try {
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/mentor/sessions', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: In a real test, you'd need to include authentication headers
      }
    });

    console.log(`📡 API Response Status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API call successful');
      console.log(`   Success: ${data.success}`);

      if (data.success && data.data?.sessions) {
        console.log(`   Total sessions: ${data.data.sessions.length}`);

        data.data.sessions.forEach((session, index) => {
          console.log(`   Session ${index}:`, {
            id: session.id,
            idType: typeof session.id,
            title: session.title?.substring(0, 50),
            sessionCategory: session.sessionCategory,
            hasValidId: !!(session.id && typeof session.id === 'string' && session.id.trim().length > 0)
          });

          if (!session.id || typeof session.id !== 'string' || session.id.trim().length === 0) {
            console.log('❌ FOUND INVALID SESSION ID:', session);
          }
        });
      } else {
        console.log('❌ No session data returned');
      }
    } else {
      const errorData = await response.json();
      console.log('❌ API call failed');
      console.log(`   Error: ${errorData.error}`);
    }

  } catch (error) {
    console.log('❌ Network error:', error.message);
    console.log('ℹ️  This is expected if the dev server is not running or authentication is required');
  }
}

// Run the test
testMentorSessionsAPI()
  .then(() => {
    console.log('\n✅ API test completed');
  })
  .catch((error) => {
    console.error('\n💥 API test failed:', error);
  });