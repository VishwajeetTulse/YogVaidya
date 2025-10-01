const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTimeSlotAPI() {
  console.log('🧪 Testing TimeSlot API Response\n');
  
  try {
    // Simulate what the API endpoint does
    console.log('1. Fetching raw timeslot data...');
    const timeSlotsResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: { isActive: true },
      limit: 2
    });

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

    console.log('2. Raw data format:');
    timeSlots.forEach((slot, index) => {
      console.log(`   Slot ${index + 1}:`);
      console.log(`     startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
      console.log(`     endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
    });

    // Test the conversion function
    console.log('\n3. Testing date conversion:');
    const convertDateToString = (dateValue) => {
      if (dateValue && typeof dateValue === 'object' && dateValue.$date) {
        return dateValue.$date;
      }
      return dateValue;
    };

    timeSlots.forEach((slot, index) => {
      const convertedStartTime = convertDateToString(slot.startTime);
      const convertedEndTime = convertDateToString(slot.endTime);
      
      console.log(`   Slot ${index + 1} converted:`);
      console.log(`     startTime: ${convertedStartTime} (${typeof convertedStartTime})`);
      console.log(`     endTime: ${convertedEndTime} (${typeof convertedEndTime})`);
      
      // Test if these can be converted to valid Date objects
      const startDate = new Date(convertedStartTime);
      const endDate = new Date(convertedEndTime);
      
      console.log(`     startDate: ${startDate} (valid: ${!isNaN(startDate.getTime())})`);
      console.log(`     endDate: ${endDate} (valid: ${!isNaN(endDate.getTime())})`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTimeSlotAPI();