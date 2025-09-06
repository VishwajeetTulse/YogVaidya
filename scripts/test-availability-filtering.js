// Test script to verify time slot availability filtering
console.log('🧪 Testing time slot availability filtering...');

async function testAvailabilityFiltering() {
  const baseUrl = 'http://localhost:3000';
  const mentorId = 'p27belqfkUe1sppnuFpG4nSupFZj8Fme';
  
  try {
    // Test 1: Get all time slots (without availability filter)
    console.log('\n1️⃣ Getting all time slots...');
    const allSlotsResponse = await fetch(`${baseUrl}/api/mentor/timeslots?mentorId=${mentorId}`);
    const allSlotsData = await allSlotsResponse.json();
    
    if (allSlotsData.success) {
      console.log(`📅 Total time slots: ${allSlotsData.data.length}`);
      allSlotsData.data.forEach(slot => {
        console.log(`- Slot ${slot._id}: ${slot.currentStudents || 0}/${slot.maxStudents} students`);
      });
    }
    
    // Test 2: Get only available time slots
    console.log('\n2️⃣ Getting available time slots only...');
    const availableSlotsResponse = await fetch(`${baseUrl}/api/mentor/timeslots?mentorId=${mentorId}&available=true`);
    const availableSlotsData = await availableSlotsResponse.json();
    
    if (availableSlotsData.success) {
      console.log(`✅ Available time slots: ${availableSlotsData.data.length}`);
      availableSlotsData.data.forEach(slot => {
        console.log(`- Available slot ${slot._id}: ${slot.currentStudents || 0}/${slot.maxStudents} students`);
      });
      
      if (availableSlotsData.data.length === 0) {
        console.log('ℹ️ No available slots found - this means filtering is working if slots exist but are booked');
      }
    }
    
    // Test 3: Try to book an available slot (if any)
    if (availableSlotsData.success && availableSlotsData.data.length > 0) {
      const slotToBook = availableSlotsData.data[0];
      console.log(`\n3️⃣ Testing booking of slot: ${slotToBook._id}...`);
      
      const bookingResponse = await fetch(`${baseUrl}/api/mentor/timeslots/${slotToBook._id}/book`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          notes: 'Test booking to verify availability filtering'
        })
      });
      
      const bookingData = await bookingResponse.json();
      console.log(`📝 Booking response: ${bookingResponse.status}`);
      
      if (bookingData.success) {
        console.log(`✅ Booking created: ${bookingData.data.bookingId}`);
        
        // Test 4: Check if the slot is now hidden from available slots
        console.log('\n4️⃣ Checking if slot is now hidden from checkout...');
        const postBookingResponse = await fetch(`${baseUrl}/api/mentor/timeslots?mentorId=${mentorId}&available=true`);
        const postBookingData = await postBookingResponse.json();
        
        if (postBookingData.success) {
          const stillAvailable = postBookingData.data.find(slot => slot._id === slotToBook._id);
          if (!stillAvailable) {
            console.log('✅ SUCCESS: Booked slot is now hidden from checkout!');
          } else {
            console.log('❌ ISSUE: Booked slot is still showing in checkout');
          }
          console.log(`📊 Available slots after booking: ${postBookingData.data.length}`);
        }
      } else {
        console.log(`❌ Booking failed: ${bookingData.error}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

// Run the test
testAvailabilityFiltering();
