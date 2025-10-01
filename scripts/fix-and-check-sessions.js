// Fix string dates in sessionBooking and then check ongoing sessions
const { PrismaClient } = require('@prisma/client');

async function fixSessionBookingDatesAndCheckOngoing() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 Fixing SessionBooking String Dates...');
    
    // Find sessions with string dates using raw query
    const rawSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {}
    });
    
    if (rawSessions.cursor && rawSessions.cursor.firstBatch) {
      let corruptedCount = 0;
      const corruptedSessions = [];
      
      rawSessions.cursor.firstBatch.forEach((session) => {
        const hasStringDates = 
          typeof session.createdAt === 'string' ||
          typeof session.updatedAt === 'string' ||
          typeof session.scheduledAt === 'string' ||
          typeof session.manualStartTime === 'string' ||
          typeof session.actualEndTime === 'string';
          
        if (hasStringDates) {
          corruptedCount++;
          corruptedSessions.push({
            id: session._id,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            scheduledAt: session.scheduledAt,
            manualStartTime: session.manualStartTime,
            actualEndTime: session.actualEndTime,
            status: session.status
          });
        }
      });
      
      console.log(`Found ${corruptedCount}/${rawSessions.cursor.firstBatch.length} sessions with string dates`);
      
      if (corruptedCount > 0) {
        console.log('\n🗑️ Deleting corrupted sessions...');
        
        for (const session of corruptedSessions) {
          try {
            console.log(`   Deleting session: ${session.id} (status: ${session.status})`);
            const deleteResult = await prisma.$runCommandRaw({
              delete: 'sessionBooking',
              deletes: [{
                q: { _id: session.id },
                limit: 1
              }]
            });
            console.log(`   ${deleteResult.n > 0 ? '✅ Deleted' : '❌ Failed'}`);
          } catch (error) {
            console.log(`   ❌ Failed to delete ${session.id}: ${error.message}`);
          }
        }
      }
    }
    
    console.log('\n🔍 Now checking for ongoing sessions...');
    
    // Check for ongoing sessions
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
      }
    });
    
    console.log(`\n📊 Found ${ongoingSessions.length} ongoing sessions`);
    
    if (ongoingSessions.length === 0) {
      console.log('\n✅ No sessions are currently ongoing');
      
      // Check for scheduled sessions
      const scheduledSessions = await prisma.sessionBooking.findMany({
        where: {
          status: 'SCHEDULED'
        },
        select: {
          id: true,
          scheduledAt: true,
          status: true,
          sessionType: true,
          isDelayed: true
        },
        orderBy: {
          scheduledAt: 'asc'
        },
        take: 3
      });
      
      console.log(`\n📅 Next ${scheduledSessions.length} scheduled sessions:`);
      scheduledSessions.forEach((session, index) => {
        console.log(`   ${index + 1}. ${session.id}`);
        console.log(`      Scheduled: ${session.scheduledAt}`);
        console.log(`      Status: ${session.status}`);
        console.log(`      Type: ${session.sessionType}`);
        console.log(`      Delayed: ${session.isDelayed}`);
      });
      
    } else {
      console.log('\n🎯 ONGOING SESSIONS:');
      
      ongoingSessions.forEach((session, index) => {
        const currentTime = new Date();
        const scheduledTime = session.scheduledAt;
        const manualStartTime = session.manualStartTime;
        const actualStartTime = manualStartTime || scheduledTime;
        
        console.log(`\n📍 Session ${index + 1}: ${session.id}`);
        console.log(`   Student: ${session.user?.name || 'Unknown'}`);
        console.log(`   Mentor: ${session.mentor?.name || 'Unknown'}`);
        console.log(`   Session Type: ${session.sessionType}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Scheduled: ${scheduledTime}`);
        if (manualStartTime) {
          console.log(`   Manually Started: ${manualStartTime}`);
        }
        
        // Calculate end time
        if (session.timeSlot) {
          const originalDuration = session.timeSlot.endTime - session.timeSlot.startTime;
          const durationMinutes = Math.round(originalDuration / (1000 * 60));
          const expectedEndTime = new Date(actualStartTime.getTime() + originalDuration);
          
          console.log(`\n   ⏰ TIMING:`);
          console.log(`   Duration: ${durationMinutes} minutes`);
          console.log(`   Expected End: ${expectedEndTime.toISOString()}`);
          console.log(`   Expected End (Local): ${expectedEndTime.toLocaleString('en-IN')}`);
          
          // Calculate remaining time
          const remainingMs = expectedEndTime.getTime() - currentTime.getTime();
          const remainingMinutes = Math.round(remainingMs / (1000 * 60));
          
          if (remainingMinutes > 0) {
            console.log(`   🎯 TIME REMAINING: ${remainingMinutes} minutes`);
          } else {
            console.log(`   ⚠️ OVERDUE BY: ${Math.abs(remainingMinutes)} minutes`);
          }
        } else {
          console.log(`   ⚠️ No timeSlot information available`);
        }
      });
    }
    
    // Final summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 CURRENT STATUS:');
    console.log(`Current time: ${new Date().toLocaleString('en-IN')}`);
    
    if (ongoingSessions.length > 0) {
      ongoingSessions.forEach((session) => {
        if (session.timeSlot) {
          const actualStartTime = session.manualStartTime || session.scheduledAt;
          const originalDuration = session.timeSlot.endTime - session.timeSlot.startTime;
          const expectedEndTime = new Date(actualStartTime.getTime() + originalDuration);
          const remainingMs = expectedEndTime.getTime() - new Date().getTime();
          const remainingMinutes = Math.round(remainingMs / (1000 * 60));
          
          console.log(`🎯 Session ${session.id}:`);
          console.log(`   Will end at: ${expectedEndTime.toLocaleString('en-IN')}`);
          console.log(`   ${remainingMinutes > 0 ? `${remainingMinutes} minutes remaining` : `${Math.abs(remainingMinutes)} minutes overdue`}`);
        }
      });
    } else {
      console.log('✅ No ongoing sessions to track');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSessionBookingDatesAndCheckOngoing();