// Simple script to check if there are any timeslots in the database
const { PrismaClient } = require('@prisma/client');

async function checkTimeslots() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking for timeslots in database...');
    
    // Check total count
    const count = await prisma.mentorTimeSlot.count();
    console.log(`Total timeslots: ${count}`);
    
    if (count > 0) {
      // Get a few sample timeslots using Prisma
      const prismaSlots = await prisma.mentorTimeSlot.findMany({
        take: 3,
        select: {
          id: true,
          startTime: true,
          endTime: true,
          isBooked: true,
          mentorId: true
        },
        orderBy: {
          startTime: 'asc'
        }
      });
      
      console.log('\n📅 Sample timeslots (via Prisma):');
      prismaSlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. ID: ${slot.id}`);
        console.log(`     Start: ${slot.startTime} (${typeof slot.startTime})`);
        console.log(`     End: ${slot.endTime} (${typeof slot.endTime})`);
        console.log(`     Booked: ${slot.isBooked}`);
        console.log(`     MentorId: ${slot.mentorId}`);
        console.log('');
      });
      
      // Also check raw format
      console.log('🔧 Raw database format:');
      const rawSlots = await prisma.$runCommandRaw({
        find: 'MentorTimeSlot',
        filter: {},
        limit: 2,
        sort: { startTime: 1 }
      });
      
      if (rawSlots.cursor && rawSlots.cursor.firstBatch) {
        rawSlots.cursor.firstBatch.forEach((slot, index) => {
          console.log(`  ${index + 1}. Raw startTime:`, slot.startTime);
          console.log(`     Raw endTime:`, slot.endTime);
          console.log('');
        });
      }
    }
    
  } catch (error) {
    console.error('Error checking timeslots:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeslots();