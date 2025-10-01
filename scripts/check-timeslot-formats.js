const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTimeSlotDataFormats() {
  console.log('🔍 Checking TimeSlot Data Formats\n');
  
  try {
    // Check raw timeslot data formats
    console.log('1. Raw MentorTimeSlot data from database:');
    const rawTimeSlots = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {},
      limit: 3
    });
    
    if (rawTimeSlots && 
        typeof rawTimeSlots === 'object' && 
        'cursor' in rawTimeSlots &&
        rawTimeSlots.cursor &&
        typeof rawTimeSlots.cursor === 'object' &&
        'firstBatch' in rawTimeSlots.cursor &&
        Array.isArray(rawTimeSlots.cursor.firstBatch)) {
      
      rawTimeSlots.cursor.firstBatch.forEach((slot, index) => {
        console.log(`   TimeSlot ${index + 1}:`);
        console.log(`     _id: ${slot._id}`);
        console.log(`     startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
        console.log(`     endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
        console.log('');
      });
    }
    
    // Check what Prisma client returns
    console.log('2. Prisma client data:');
    try {
      const prismaTimeSlots = await prisma.mentorTimeSlot.findMany({
        take: 2,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          mentorId: true
        }
      });
      
      prismaTimeSlots.forEach((slot, index) => {
        console.log(`   Prisma TimeSlot ${index + 1}:`);
        console.log(`     id: ${slot.id}`);
        console.log(`     startTime: ${slot.startTime} (${typeof slot.startTime})`);
        console.log(`     endTime: ${slot.endTime} (${typeof slot.endTime})`);
        console.log('');
      });
    } catch (error) {
      console.log('   ❌ Prisma timeslot query failed:', error.message);
    }
    
    // Test what happens when we try to create a Date from these formats
    console.log('3. Testing Date conversion:');
    const testExtendedJson = {"$date":"2025-09-30T15:40:00Z"};
    const testString = "2025-09-30T15:40:00Z";
    
    console.log(`   Extended JSON: ${JSON.stringify(testExtendedJson)}`);
    console.log(`   As Date: ${new Date(testExtendedJson)} (${typeof new Date(testExtendedJson)})`);
    console.log(`   Valid: ${!isNaN(new Date(testExtendedJson).getTime())}`);
    
    console.log(`   String: ${testString}`);
    console.log(`   As Date: ${new Date(testString)} (${typeof new Date(testString)})`);
    console.log(`   Valid: ${!isNaN(new Date(testString).getTime())}`);
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeSlotDataFormats();