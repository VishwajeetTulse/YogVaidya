// Test script to check session bookings via API
const fetch = require('node-fetch');

async function testSessionBookings() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing session bookings API...');
    
    // Get mentor sessions
    const mentorId = 'p27belqfkUe1sppnuFpG4nSupFZj8Fme';
    const response = await fetch(`${baseUrl}/api/mentor/sessions?mentorId=${mentorId}`);
    
    if (!response.ok) {
      console.error('❌ Error response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error body:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Response:', JSON.stringify(data, null, 2));
    
    // Get time slots
    const timeSlotsResponse = await fetch(`${baseUrl}/api/mentor/timeslots?mentorId=${mentorId}`);
    const timeSlotsData = await timeSlotsResponse.json();
    console.log('\n🕐 Time slots:', JSON.stringify(timeSlotsData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSessionBookings();
