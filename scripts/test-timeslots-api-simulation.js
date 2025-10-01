// Test the actual timeslots API endpoint
const { PrismaClient } = require('@prisma/client');

// Simulate the API route logic
async function testTimeslotsAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Timeslots API Endpoint Logic');
    
    // This simulates what the API route does
    const mentorId = 'p27belqfkUe1sppnuFpG4nSupFZj8Fme'; // Use the actual mentor ID we found
    
    console.log(`\n1. Fetching timeslots for mentor: ${mentorId}`);
    
    // Get raw data (what $runCommandRaw returns)
    const rawData = await prisma.$runCommandRaw({
      find: 'MentorTimeSlot',
      filter: {
        mentorId: mentorId,
        isBooked: false
      },
      sort: { startTime: 1 }
    });
    
    console.log('\n2. Raw MongoDB data format:');
    if (rawData.cursor && rawData.cursor.firstBatch) {
      rawData.cursor.firstBatch.forEach((slot, index) => {
        console.log(`   Slot ${index + 1}:`);
        console.log(`     startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
        console.log(`     endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
      });
    }
    
    // Convert dates like our API does
    function convertDateToString(obj) {
      if (obj && typeof obj === 'object' && obj.$date) {
        return obj.$date;
      }
      return obj;
    }
    
    console.log('\n3. After API conversion:');
    const convertedSlots = rawData.cursor.firstBatch.map(slot => ({
      ...slot,
      startTime: convertDateToString(slot.startTime),
      endTime: convertDateToString(slot.endTime)
    }));
    
    convertedSlots.forEach((slot, index) => {
      console.log(`   Slot ${index + 1}:`);
      console.log(`     startTime: ${slot.startTime} (${typeof slot.startTime})`);
      console.log(`     endTime: ${slot.endTime} (${typeof slot.endTime})`);
      
      // Test if these can create valid Date objects
      const startDate = new Date(slot.startTime);
      const endDate = new Date(slot.endTime);
      console.log(`     Valid dates: ${!isNaN(startDate.getTime())} / ${!isNaN(endDate.getTime())}`);
    });
    
    console.log('\n4. Testing frontend date formatting:');
    
    // Test the formatDateTime function from our component
    function formatDateTime(dateInput) {
      let date;
      
      if (typeof dateInput === 'string') {
        date = new Date(dateInput);
      } else if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
        date = new Date(dateInput.$date);
      } else if (dateInput instanceof Date) {
        date = dateInput;
      } else {
        console.error('Invalid date input:', dateInput);
        return 'Invalid Date';
      }
      
      if (isNaN(date.getTime())) {
        console.error('Invalid date created from:', dateInput);
        return 'Invalid Date';
      }
      
      return date.toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric', 
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
    
    convertedSlots.forEach((slot, index) => {
      console.log(`   Slot ${index + 1} formatted:`);
      const formattedStart = formatDateTime(slot.startTime);
      const formattedEnd = formatDateTime(slot.endTime);
      console.log(`     Start: ${formattedStart}`);
      console.log(`     End: ${formattedEnd}`);
    });
    
  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimeslotsAPI();