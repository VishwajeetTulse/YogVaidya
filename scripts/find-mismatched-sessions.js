const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findMismatchedSessions() {
  try {
    console.log('Looking for sessions with duration mismatches...\n');
    
    // Get sessions that have both actualEndTime and calculable planned duration
    const result = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { 
        status: 'COMPLETED',
        actualEndTime: { $exists: true },
        scheduledAt: { $exists: true }
      },
      limit: 20
    });

    let sessions = [];
    if (result && result.cursor && result.cursor.firstBatch) {
      sessions = result.cursor.firstBatch;
    }

    console.log(`Found ${sessions.length} completed sessions with timing data\n`);

    sessions.forEach((session, index) => {
      console.log(`Session ${index + 1}: ${session._id}`);
      
      let scheduledTime = session.scheduledAt;
      let endTime = session.actualEndTime;
      
      // Parse MongoDB dates
      if (typeof scheduledTime === 'object' && scheduledTime.$date) {
        scheduledTime = scheduledTime.$date;
      }
      if (typeof endTime === 'object' && endTime.$date) {
        endTime = endTime.$date;
      }

      try {
        const startDate = new Date(scheduledTime);
        const endDate = new Date(endTime);
        const actualMinutes = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
        
        console.log(`  Scheduled: ${startDate.toISOString()}`);
        console.log(`  Ended: ${endDate.toISOString()}`);
        console.log(`  Actual runtime: ${actualMinutes} minutes`);
        console.log(`  Stored actualDuration: ${session.actualDuration || 'NULL'}`);
        
        if (session.actualDuration && session.actualDuration !== actualMinutes) {
          console.log(`  ❌ MISMATCH! Stored: ${session.actualDuration}, Actual: ${actualMinutes}`);
        } else if (!session.actualDuration) {
          console.log(`  ⚠️  Missing actualDuration field`);
        } else {
          console.log(`  ✅ Duration correct`);
        }

        // Check if this is a short session (ended early)
        if (actualMinutes < 15) {
          console.log(`  🔥 SHORT SESSION: Only ${actualMinutes} minutes!`);
        }
        
      } catch (err) {
        console.log(`  Error: ${err.message}`);
      }
      
      console.log('');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findMismatchedSessions();