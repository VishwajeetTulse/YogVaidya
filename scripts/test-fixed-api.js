// Test the actual timeslots API logic with correct collection name
const { PrismaClient } = require('@prisma/client');

async function testFixedTimeslotsAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Fixed Timeslots API Logic');
    
    const mentorId = 'p27belqfkUe1sppnuFpG4nSupFZj8Fme'; // Use the mentor we know exists
    
    console.log(`\n1. Testing API query with mentorId: ${mentorId}`);
    
    // This matches the API route query
    const filter = {
      mentorId: mentorId,
      isActive: true
    };
    
    const timeSlotsResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot', // Correct collection name (camelCase)
      filter: filter,
      sort: { startTime: -1 }
    });
    
    console.log('\n2. Raw API response structure:');
    console.log('   Keys:', Object.keys(timeSlotsResult));
    
    let timeSlots = [];
    if (timeSlotsResult && 
        typeof timeSlotsResult === 'object' && 
        'cursor' in timeSlotsResult &&
        timeSlotsResult.cursor &&
        typeof timeSlotsResult.cursor === 'object' &&
        'firstBatch' in timeSlotsResult.cursor &&
        Array.isArray(timeSlotsResult.cursor.firstBatch)) {
      timeSlots = timeSlotsResult.cursor.firstBatch;
    }
    
    console.log(`\n3. Found ${timeSlots.length} timeslots`);
    
    if (timeSlots.length > 0) {
      // Apply the date conversion function like the API does
      function convertDateToString(obj) {
        if (obj && typeof obj === 'object' && obj.$date) {
          return obj.$date;
        }
        return obj;
      }
      
      console.log('\n4. Before date conversion:');
      timeSlots.forEach((slot, index) => {
        console.log(`   Slot ${index + 1}:`);
        console.log(`     startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
        console.log(`     endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
      });
      
      // Convert dates
      const convertedSlots = timeSlots.map(slot => ({
        ...slot,
        startTime: convertDateToString(slot.startTime),
        endTime: convertDateToString(slot.endTime),
        createdAt: convertDateToString(slot.createdAt),
        updatedAt: convertDateToString(slot.updatedAt)
      }));
      
      console.log('\n5. After date conversion:');
      convertedSlots.forEach((slot, index) => {
        console.log(`   Slot ${index + 1}:`);
        console.log(`     startTime: ${slot.startTime} (${typeof slot.startTime})`);
        console.log(`     endTime: ${slot.endTime} (${typeof slot.endTime})`);
        
        // Test Date constructor
        const startDate = new Date(slot.startTime);
        const endDate = new Date(slot.endTime);
        console.log(`     Valid dates: start=${!isNaN(startDate.getTime())}, end=${!isNaN(endDate.getTime())}`);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          console.log(`     Formatted: ${startDate.toLocaleString('en-IN')} - ${endDate.toLocaleString('en-IN')}`);
        }
      });
      
      console.log('\n6. Testing frontend formatting functions:');
      
      // Frontend formatDateTime function
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
      
      function getDuration(startInput, endInput) {
        let startDate, endDate;
        
        if (typeof startInput === 'string') {
          startDate = new Date(startInput);
        } else if (startInput && typeof startInput === 'object' && startInput.$date) {
          startDate = new Date(startInput.$date);
        } else if (startInput instanceof Date) {
          startDate = startInput;
        } else {
          return 'Invalid Duration';
        }
        
        if (typeof endInput === 'string') {
          endDate = new Date(endInput);
        } else if (endInput && typeof endInput === 'object' && endInput.$date) {
          endDate = new Date(endInput.$date);
        } else if (endInput instanceof Date) {
          endDate = endInput;
        } else {
          return 'Invalid Duration';
        }
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return 'Invalid Duration';
        }
        
        const diffMs = endDate - startDate;
        const diffMins = Math.round(diffMs / (1000 * 60));
        
        if (diffMins < 60) {
          return `${diffMins} mins`;
        } else {
          const hours = Math.floor(diffMins / 60);
          const mins = diffMins % 60;
          return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
        }
      }
      
      convertedSlots.forEach((slot, index) => {
        console.log(`\n   Slot ${index + 1} frontend display:`);
        const formattedStart = formatDateTime(slot.startTime);
        const formattedEnd = formatDateTime(slot.endTime);
        const duration = getDuration(slot.startTime, slot.endTime);
        
        console.log(`     Start: ${formattedStart}`);
        console.log(`     End: ${formattedEnd}`);
        console.log(`     Duration: ${duration}`);
        console.log(`     Session Type: ${slot.sessionType}`);
        console.log(`     Max Students: ${slot.maxStudents}`);
        console.log(`     Available: ${!slot.isBooked}`);
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFixedTimeslotsAPI();