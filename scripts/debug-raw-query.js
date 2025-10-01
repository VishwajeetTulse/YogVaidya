// Debug the raw query to see what's happening
const { PrismaClient } = require('@prisma/client');

async function debugRawQuery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Debugging Raw Query');
    
    // First, let's see what mentors we have
    console.log('\n1. Available mentors:');
    const mentors = await prisma.user.findMany({
      where: { role: 'MENTOR' },
      select: { id: true, email: true }
    });
    
    mentors.forEach(mentor => {
      console.log(`   - ${mentor.id} (${mentor.email})`);
    });
    
    // Check timeslots using Prisma first
    console.log('\n2. Timeslots via Prisma:');
    const timeslots = await prisma.mentorTimeSlot.findMany({
      take: 3,
      select: {
        id: true,
        mentorId: true,
        startTime: true,
        endTime: true,
        isBooked: true
      }
    });
    
    timeslots.forEach(slot => {
      console.log(`   - ID: ${slot.id}, Mentor: ${slot.mentorId}, Booked: ${slot.isBooked}`);
      console.log(`     Start: ${slot.startTime}, End: ${slot.endTime}`);
    });
    
    // Now try raw query with all timeslots
    console.log('\n3. Raw query (all timeslots):');
    const rawAll = await prisma.$runCommandRaw({
      find: 'MentorTimeSlot',
      filter: {},
      limit: 5
    });
    
    console.log('Raw result structure:', Object.keys(rawAll));
    if (rawAll.cursor) {
      console.log('Cursor structure:', Object.keys(rawAll.cursor));
      if (rawAll.cursor.firstBatch) {
        console.log(`Found ${rawAll.cursor.firstBatch.length} slots in raw query`);
        rawAll.cursor.firstBatch.forEach((slot, index) => {
          console.log(`   Slot ${index + 1}:`);
          console.log(`     ID: ${slot._id}`);
          console.log(`     MentorId: ${slot.mentorId}`);
          console.log(`     StartTime: ${JSON.stringify(slot.startTime)}`);
          console.log(`     EndTime: ${JSON.stringify(slot.endTime)}`);
          console.log(`     IsBooked: ${slot.isBooked}`);
        });
      }
    }
    
    // Try with specific mentor filter
    if (timeslots.length > 0) {
      const mentorId = timeslots[0].mentorId;
      console.log(`\n4. Raw query filtered by mentor: ${mentorId}`);
      
      const rawFiltered = await prisma.$runCommandRaw({
        find: 'MentorTimeSlot',
        filter: {
          mentorId: mentorId,
          isBooked: false
        }
      });
      
      if (rawFiltered.cursor && rawFiltered.cursor.firstBatch) {
        console.log(`Found ${rawFiltered.cursor.firstBatch.length} unbooked slots for this mentor`);
        rawFiltered.cursor.firstBatch.forEach((slot, index) => {
          console.log(`   Slot ${index + 1}:`);
          console.log(`     StartTime: ${JSON.stringify(slot.startTime)}`);
          console.log(`     EndTime: ${JSON.stringify(slot.endTime)}`);
        });
      }
    }
    
  } catch (error) {
    console.error('Error in debug query:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugRawQuery();