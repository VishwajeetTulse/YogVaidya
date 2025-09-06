// Test script to simulate complete booking flow
const https = require('https');
const http = require('http');

function makeRequest(url, method = 'GET', data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const result = {
            status: res.statusCode,
            headers: res.headers,
            body: body,
            data: body ? JSON.parse(body) : null
          };
          resolve(result);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body,
            data: null
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function testBookingFlow() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing complete booking flow...');
    
    // Step 1: Get mentor's existing time slots
    console.log('\n1. Getting existing time slots...');
    const mentorId = 'p27belqfkUe1sppnuFpG4nSupFZj8Fme';
    const timeSlotsResponse = await makeRequest(`${baseUrl}/api/mentor/timeslots?mentorId=${mentorId}`);
    console.log('Time slots response:', timeSlotsResponse.status);
    
    if (timeSlotsResponse.data && timeSlotsResponse.data.success) {
      console.log(`Found ${timeSlotsResponse.data.data.length} existing time slots`);
      
      if (timeSlotsResponse.data.data.length > 0) {
        const timeSlot = timeSlotsResponse.data.data[0];
        console.log(`Testing with time slot: ${timeSlot._id}`);
        
        // Step 2: Try to book the time slot (this will create a session booking)
        console.log('\n2. Booking time slot...');
        const bookingResponse = await makeRequest(
          `${baseUrl}/api/mentor/timeslots/${timeSlot._id}/book`,
          'POST',
          { notes: 'Test booking from script' }
        );
        
        console.log('Booking response status:', bookingResponse.status);
        console.log('Booking response body:', bookingResponse.body);
        
        if (bookingResponse.data && bookingResponse.data.success) {
          const bookingId = bookingResponse.data.data.bookingId;
          console.log(`✅ Session booking created: ${bookingId}`);
          
          // Step 3: Check if the session booking appears in mentor sessions
          console.log('\n3. Checking mentor sessions...');
          const sessionsResponse = await makeRequest(`${baseUrl}/api/mentor/sessions?mentorId=${mentorId}`);
          console.log('Sessions response status:', sessionsResponse.status);
          
          if (sessionsResponse.data && sessionsResponse.data.success) {
            const sessions = sessionsResponse.data.data;
            console.log(`Found ${sessions.length} session bookings`);
            
            if (sessions.length > 0) {
              console.log('✅ Session booking is visible in mentor dashboard!');
              sessions.forEach((session, index) => {
                console.log(`Session ${index + 1}:`);
                console.log(`- ID: ${session._id}`);
                console.log(`- Status: ${session.status}`);
                console.log(`- Payment Status: ${session.paymentStatus || 'N/A'}`);
                console.log(`- Student: ${session.studentName || 'N/A'}`);
              });
            } else {
              console.log('❌ Session booking not visible in mentor dashboard');
            }
          }
        } else {
          console.log('❌ Failed to create booking:', bookingResponse.body);
        }
      } else {
        console.log('❌ No time slots available for testing');
      }
    } else {
      console.log('❌ Failed to get time slots:', timeSlotsResponse.body);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBookingFlow();
