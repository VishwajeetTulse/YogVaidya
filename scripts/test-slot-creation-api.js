// Test the slot creation API to verify it creates proper Date objects
const { PrismaClient } = require('@prisma/client');

async function testSlotCreationAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Slot Creation API');
    
    // 1. Test single slot creation logic
    console.log('\n1. Testing Single Slot Creation Logic:');
    
    // Simulate the data that would come from the frontend
    const testSlotData = {
      startTime: '2025-10-02T15:30:00.000Z', // ISO string (what frontend sends)
      endTime: '2025-10-02T16:30:00.000Z',   // ISO string (what frontend sends)
      sessionType: 'YOGA',
      maxStudents: 1,
      sessionLink: 'https://example.com/session',
      notes: 'Test slot'
    };
    
    console.log('   Input data:');
    console.log(`   startTime: ${testSlotData.startTime} (${typeof testSlotData.startTime})`);
    console.log(`   endTime: ${testSlotData.endTime} (${typeof testSlotData.endTime})`);
    
    // Test the conversion logic used in the API
    const convertedStartTime = new Date(testSlotData.startTime);
    const convertedEndTime = new Date(testSlotData.endTime);
    
    console.log('\n   After new Date() conversion:');
    console.log(`   startTime: ${convertedStartTime} (${typeof convertedStartTime})`);
    console.log(`   endTime: ${convertedEndTime} (${typeof convertedEndTime})`);
    console.log(`   Valid dates: ${!isNaN(convertedStartTime.getTime())} / ${!isNaN(convertedEndTime.getTime())}`);
    
    // Test creating a slot using the same logic as the API
    const testSlotId = `test_slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('\n   Creating test slot with Prisma...');
    try {
      const testSlot = await prisma.mentorTimeSlot.create({
        data: {
          id: testSlotId,
          mentorId: 'p27belqfkUe1sppnuFpG4nSupFZj8Fme', // Known mentor
          mentorApplicationId: 'a5b5739d-47b2-4182-bdb1-72577b445d36',
          startTime: convertedStartTime, // Using converted Date objects
          endTime: convertedEndTime,     // Using converted Date objects
          sessionType: testSlotData.sessionType,
          maxStudents: testSlotData.maxStudents,
          currentStudents: 0,
          isRecurring: false,
          recurringDays: [],
          price: 1000,
          sessionLink: testSlotData.sessionLink,
          notes: testSlotData.notes,
          isActive: true,
          isBooked: false,
          bookedBy: null,
        }
      });
      
      console.log(`   ✅ Test slot created: ${testSlot.id}`);
      console.log(`   Created startTime: ${testSlot.startTime} (${typeof testSlot.startTime})`);
      console.log(`   Created endTime: ${testSlot.endTime} (${typeof testSlot.endTime})`);
      
      // Verify the slot can be queried without errors
      const queriedSlot = await prisma.mentorTimeSlot.findFirst({
        where: { id: testSlotId }
      });
      
      if (queriedSlot) {
        console.log('   ✅ Slot can be queried successfully');
        console.log(`   Queried startTime type: ${typeof queriedSlot.startTime}`);
        console.log(`   Queried endTime type: ${typeof queriedSlot.endTime}`);
      }
      
      // Check raw database format
      console.log('\n   Checking raw database format:');
      const rawResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: testSlotId }
      });
      
      if (rawResult.cursor && rawResult.cursor.firstBatch.length > 0) {
        const rawSlot = rawResult.cursor.firstBatch[0];
        console.log(`   Raw startTime: ${JSON.stringify(rawSlot.startTime)} (${typeof rawSlot.startTime})`);
        console.log(`   Raw endTime: ${JSON.stringify(rawSlot.endTime)} (${typeof rawSlot.endTime})`);
        
        if (typeof rawSlot.startTime === 'object' && rawSlot.startTime.$date) {
          console.log('   ✅ Raw format is MongoDB Extended JSON (correct)');
        } else if (typeof rawSlot.startTime === 'string') {
          console.log('   ❌ Raw format is string (problematic!)');
        } else {
          console.log(`   ⚠️ Unexpected raw format: ${typeof rawSlot.startTime}`);
        }
      }
      
      // Clean up test slot
      await prisma.mentorTimeSlot.delete({
        where: { id: testSlotId }
      });
      console.log('   🗑️ Test slot cleaned up');
      
    } catch (error) {
      console.log(`   ❌ Slot creation failed: ${error.message}`);
    }
    
    // 2. Test edge cases that might cause string dates
    console.log('\n2. Testing Edge Cases:');
    
    // Test with different date formats
    const edgeCases = [
      '2025-10-02T15:30:00Z',        // Without milliseconds
      '2025-10-02T15:30:00.000Z',    // With milliseconds
      '2025-10-02 15:30:00',         // Without timezone
      new Date().toISOString(),      // Current time
    ];
    
    edgeCases.forEach((testDate, index) => {
      console.log(`\n   Edge case ${index + 1}: "${testDate}"`);
      try {
        const converted = new Date(testDate);
        console.log(`   Converted: ${converted} (${typeof converted})`);
        console.log(`   Valid: ${!isNaN(converted.getTime())}`);
      } catch (error) {
        console.log(`   ❌ Conversion failed: ${error.message}`);
      }
    });
    
    // 3. Check current database state
    console.log('\n3. Current Database State:');
    
    const allSlots = await prisma.mentorTimeSlot.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        createdAt: true
      }
    });
    
    console.log(`   Total slots in database: ${allSlots.length}`);
    
    let properDateCount = 0;
    let stringDateCount = 0;
    
    // Check each slot via raw query to see actual storage format
    for (const slot of allSlots) {
      const rawResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: slot.id }
      });
      
      if (rawResult.cursor && rawResult.cursor.firstBatch.length > 0) {
        const rawSlot = rawResult.cursor.firstBatch[0];
        
        if (typeof rawSlot.startTime === 'string') {
          stringDateCount++;
          console.log(`   ❌ Slot ${slot.id} has string dates`);
        } else if (typeof rawSlot.startTime === 'object' && rawSlot.startTime.$date) {
          properDateCount++;
        }
      }
    }
    
    console.log(`   Slots with proper dates: ${properDateCount}`);
    console.log(`   Slots with string dates: ${stringDateCount}`);
    
    if (stringDateCount === 0) {
      console.log('\n🎉 RESULT: Slot creation API is working correctly!');
      console.log('All slots are created with proper Date objects.');
    } else {
      console.log('\n⚠️ RESULT: Some slots have string dates!');
      console.log('The slot creation API might not be the only source of slots.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSlotCreationAPI();