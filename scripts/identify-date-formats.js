const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function identifyDateFormatIssues() {
  console.log('🔍 Identifying Date Format Issues in Frontend Data\n');
  
  try {
    // Check what actual data formats are being returned from the database
    console.log('1. Checking SessionBooking date formats...');
    
    const sessionBookings = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {},
      limit: 5
    });
    
    if (sessionBookings && 
        typeof sessionBookings === 'object' && 
        'cursor' in sessionBookings &&
        sessionBookings.cursor &&
        typeof sessionBookings.cursor === 'object' &&
        'firstBatch' in sessionBookings.cursor &&
        Array.isArray(sessionBookings.cursor.firstBatch)) {
      
      sessionBookings.cursor.firstBatch.forEach((session, index) => {
        console.log(`   Session ${index + 1}:`);
        console.log(`     scheduledAt: ${JSON.stringify(session.scheduledAt)} (${typeof session.scheduledAt})`);
        console.log(`     createdAt: ${JSON.stringify(session.createdAt)} (${typeof session.createdAt})`);
        console.log(`     updatedAt: ${JSON.stringify(session.updatedAt)} (${typeof session.updatedAt})`);
        console.log('');
      });
    }
    
    // Check MentorTimeSlot formats
    console.log('2. Checking MentorTimeSlot date formats...');
    
    const timeSlots = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {},
      limit: 3
    });
    
    if (timeSlots && 
        typeof timeSlots === 'object' && 
        'cursor' in timeSlots &&
        timeSlots.cursor &&
        typeof timeSlots.cursor === 'object' &&
        'firstBatch' in timeSlots.cursor &&
        Array.isArray(timeSlots.cursor.firstBatch)) {
      
      timeSlots.cursor.firstBatch.forEach((slot, index) => {
        console.log(`   TimeSlot ${index + 1}:`);
        console.log(`     startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
        console.log(`     endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
        console.log(`     createdAt: ${JSON.stringify(slot.createdAt)} (${typeof slot.createdAt})`);
        console.log('');
      });
    }
    
    // Check how Prisma client returns these
    console.log('3. Checking Prisma client data formats...');
    
    try {
      const prismaSession = await prisma.sessionBooking.findFirst({
        select: {
          id: true,
          scheduledAt: true,
          createdAt: true,
          updatedAt: true
        }
      });
      
      if (prismaSession) {
        console.log('   Prisma SessionBooking:');
        console.log(`     scheduledAt: ${prismaSession.scheduledAt} (${typeof prismaSession.scheduledAt})`);
        console.log(`     createdAt: ${prismaSession.createdAt} (${typeof prismaSession.createdAt})`);
        console.log(`     updatedAt: ${prismaSession.updatedAt} (${typeof prismaSession.updatedAt})`);
      }
    } catch (error) {
      console.log('   ❌ Prisma query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Investigation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

identifyDateFormatIssues();