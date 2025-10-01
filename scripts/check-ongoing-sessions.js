// Check for currently ongoing sessions and their end times
const { PrismaClient } = require('@prisma/client');

async function getCurrentOngoingSessions() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking for Currently Ongoing Sessions');
    console.log(`Current time: ${new Date().toISOString()}`);
    
    // Find all ongoing sessions
    const ongoingSessions = await prisma.sessionBooking.findMany({
      where: {
        status: 'ONGOING'
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        mentor: {
          select: {
            name: true,
            email: true
          }
        },
        timeSlot: {
          select: {
            startTime: true,
            endTime: true,
            sessionType: true
          }
        }
      },
      orderBy: {
        scheduledAt: 'asc'
      }
    });
    
    console.log(`\n📊 Found ${ongoingSessions.length} ongoing sessions`);
    
    if (ongoingSessions.length === 0) {
      console.log('\n✅ No sessions are currently ongoing');
      
      // Check for scheduled sessions that might start soon
      console.log('\n🔍 Checking for scheduled sessions...');
      const scheduledSessions = await prisma.sessionBooking.findMany({
        where: {
          status: 'SCHEDULED'
        },
        include: {
          timeSlot: {
            select: {
              startTime: true,
              endTime: true,
              sessionType: true
            }
          }
        },
        orderBy: {
          scheduledAt: 'asc'
        },
        take: 5
      });
      
      console.log(`\n📅 Next ${scheduledSessions.length} scheduled sessions:`);
      scheduledSessions.forEach((session, index) => {
        const scheduledTime = session.scheduledAt;
        const timeSlotStart = session.timeSlot?.startTime;
        const timeSlotEnd = session.timeSlot?.endTime;
        
        console.log(`\n   ${index + 1}. Session ${session.id}`);
        console.log(`      Scheduled: ${scheduledTime}`);
        if (timeSlotStart && timeSlotEnd) {
          console.log(`      TimeSlot: ${timeSlotStart} - ${timeSlotEnd}`);
          console.log(`      Duration: ${Math.round((timeSlotEnd - timeSlotStart) / (1000 * 60))} minutes`);
        }
        console.log(`      Status: ${session.status}`);
        console.log(`      Type: ${session.timeSlot?.sessionType || 'N/A'}`);
      });
      
    } else {
      console.log('\n🎯 ONGOING SESSIONS DETAILS:');
      
      ongoingSessions.forEach((session, index) => {
        const currentTime = new Date();
        const scheduledTime = session.scheduledAt;
        const manualStartTime = session.manualStartTime;
        const actualStartTime = manualStartTime || scheduledTime;
        
        console.log(`\n📍 Session ${index + 1}: ${session.id}`);
        console.log(`   Student: ${session.user?.name || 'Unknown'} (${session.user?.email})`);
        console.log(`   Mentor: ${session.mentor?.name || 'Unknown'} (${session.mentor?.email})`);
        console.log(`   Session Type: ${session.sessionType}`);
        console.log(`   Status: ${session.status}`);
        
        // Timing information
        console.log(`\n   ⏰ TIMING DETAILS:`);
        console.log(`   Originally Scheduled: ${scheduledTime}`);
        if (manualStartTime) {
          console.log(`   Manually Started: ${manualStartTime}`);
          console.log(`   Start Delay: ${Math.round((manualStartTime - scheduledTime) / (1000 * 60))} minutes`);
        }
        console.log(`   Actual Start Time: ${actualStartTime}`);
        
        // Calculate session duration and expected end time
        if (session.timeSlot) {
          const originalDuration = session.timeSlot.endTime - session.timeSlot.startTime;
          const durationMinutes = Math.round(originalDuration / (1000 * 60));
          const expectedEndTime = new Date(actualStartTime.getTime() + originalDuration);
          
          console.log(`\n   📊 DURATION & END TIME:`);
          console.log(`   Planned Duration: ${durationMinutes} minutes`);
          console.log(`   Expected End Time: ${expectedEndTime.toISOString()}`);
          console.log(`   Expected End Time (Local): ${expectedEndTime.toLocaleString('en-IN')}`);
          
          // Calculate remaining time
          const remainingMs = expectedEndTime.getTime() - currentTime.getTime();
          const remainingMinutes = Math.round(remainingMs / (1000 * 60));
          
          if (remainingMinutes > 0) {
            console.log(`   ⏳ Time Remaining: ${remainingMinutes} minutes`);
            console.log(`   🎯 SESSION WILL END IN: ${remainingMinutes} minutes`);
          } else {
            console.log(`   ⚠️ Session is ${Math.abs(remainingMinutes)} minutes overdue`);
            console.log(`   🚨 SESSION SHOULD HAVE ENDED: ${Math.abs(remainingMinutes)} minutes ago`);
          }
          
          // TimeSlot information
          console.log(`\n   🎯 TIMESLOT INFO:`);
          console.log(`   TimeSlot Start: ${session.timeSlot.startTime}`);
          console.log(`   TimeSlot End: ${session.timeSlot.endTime}`);
          console.log(`   Session Type: ${session.timeSlot.sessionType}`);
        } else {
          console.log(`   ⚠️ No timeSlot information available`);
        }
        
        // Additional session details
        console.log(`\n   📋 ADDITIONAL INFO:`);
        console.log(`   Payment Status: ${session.paymentStatus || 'N/A'}`);
        console.log(`   Amount: ₹${session.amount || 'N/A'}`);
        console.log(`   Is Delayed: ${session.isDelayed || false}`);
        console.log(`   Created: ${session.createdAt}`);
        console.log(`   Updated: ${session.updatedAt}`);
        if (session.notes) {
          console.log(`   Notes: ${session.notes}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 SUMMARY:');
    if (ongoingSessions.length > 0) {
      console.log(`🎯 ${ongoingSessions.length} session(s) currently ongoing`);
      ongoingSessions.forEach((session) => {
        if (session.timeSlot) {
          const actualStartTime = session.manualStartTime || session.scheduledAt;
          const originalDuration = session.timeSlot.endTime - session.timeSlot.startTime;
          const expectedEndTime = new Date(actualStartTime.getTime() + originalDuration);
          const remainingMs = expectedEndTime.getTime() - new Date().getTime();
          const remainingMinutes = Math.round(remainingMs / (1000 * 60));
          
          console.log(`   - Session ${session.id}: ${remainingMinutes > 0 ? `${remainingMinutes} min remaining` : `${Math.abs(remainingMinutes)} min overdue`}`);
        }
      });
    } else {
      console.log('✅ No sessions currently ongoing');
    }
    
  } catch (error) {
    console.error('❌ Error checking ongoing sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCurrentOngoingSessions();