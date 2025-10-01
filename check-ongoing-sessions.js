const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOngoingSessions() {
  console.log('🔍 Checking ongoing sessions...');
  
  try {
    // Get ongoing sessions
    const ongoingResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { status: 'ONGOING' }
    });
    
    let ongoingSessions = [];
    if (ongoingResult?.cursor?.firstBatch) {
      ongoingSessions = ongoingResult.cursor.firstBatch;
    }
    
    console.log(`📊 Found ${ongoingSessions.length} ongoing sessions`);
    
    if (ongoingSessions.length === 0) {
      console.log('✅ No ongoing sessions found');
      return;
    }
    
    for (const session of ongoingSessions) {
      console.log(`\n📋 Session: ${session._id || session.id}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   User: ${session.userId}`);
      console.log(`   Mentor: ${session.mentorId}`);
      console.log(`   Session Type: ${session.sessionType}`);
      
      // Handle different date formats
      const getDateString = (dateField) => {
        if (!dateField) return 'Not set';
        if (typeof dateField === 'object' && dateField.$date) {
          return new Date(dateField.$date).toLocaleString();
        }
        return new Date(dateField).toLocaleString();
      };
      
      console.log(`   Scheduled At: ${getDateString(session.scheduledAt)}`);
      
      if (session.manualStartTime) {
        console.log(`   Manual Start: ${getDateString(session.manualStartTime)}`);
      }
      
      // Calculate expected end time
      if (session.timeSlotId) {
        // Get the timeslot to find planned end time
        const slotResult = await prisma.$runCommandRaw({
          find: 'mentorTimeSlot',
          filter: { _id: session.timeSlotId }
        });
        
        if (slotResult?.cursor?.firstBatch?.[0]) {
          const slot = slotResult.cursor.firstBatch[0];
          const plannedEndTime = getDateString(slot.endTime);
          console.log(`   Planned End Time: ${plannedEndTime}`);
          
          // If manually started, calculate duration-based end time
          if (session.manualStartTime) {
            const startTime = new Date(session.manualStartTime.$date || session.manualStartTime);
            const slotStart = new Date(slot.startTime.$date || slot.startTime);
            const slotEnd = new Date(slot.endTime.$date || slot.endTime);
            const plannedDuration = slotEnd.getTime() - slotStart.getTime();
            const calculatedEnd = new Date(startTime.getTime() + plannedDuration);
            console.log(`   Calculated End (Manual): ${calculatedEnd.toLocaleString()}`);
          }
        }
      } else {
        console.log(`   No timeSlot linked - checking for direct session duration`);
      }
      
      console.log(`   Current Time: ${new Date().toLocaleString()}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkOngoingSessions();
