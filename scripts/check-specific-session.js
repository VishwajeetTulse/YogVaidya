const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixSpecificSession() {
  try {
    console.log('Fixing the session with incorrect actualDuration...\n');
    
    const sessionId = 'session_1759491569239_knub9ohcy';
    
    // Get the session details using raw query
    const result = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: sessionId }
    });

    let session = null;
    if (result && result.cursor && result.cursor.firstBatch && result.cursor.firstBatch.length > 0) {
      session = result.cursor.firstBatch[0];
    }

    if (!session) {
      console.log('Session not found');
      return;
    }

    console.log('Before fix:');
    console.log(`  actualDuration: ${session.actualDuration} minutes`);
    console.log(`  scheduledAt: ${JSON.stringify(session.scheduledAt)}`);
    console.log(`  actualEndTime: ${JSON.stringify(session.actualEndTime)}`);

    // Calculate correct duration from scheduledAt to actualEndTime
    let scheduledTime = session.scheduledAt;
    let endTime = session.actualEndTime;
    
    if (typeof scheduledTime === 'object' && scheduledTime.$date) {
      scheduledTime = scheduledTime.$date;
    }
    if (typeof endTime === 'object' && endTime.$date) {
      endTime = endTime.$date;
    }

    const startDate = new Date(scheduledTime);
    const endDate = new Date(endTime);
    const correctDuration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);

    console.log(`\nCalculated correct duration: ${correctDuration} minutes`);
    console.log(`Start: ${startDate.toISOString()}`);
    console.log(`End: ${endDate.toISOString()}`);

    // Update the session with correct duration
    await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [{
        q: { _id: sessionId },
        u: { 
          $set: { 
            actualDuration: correctDuration,
            updatedAt: new Date()
          }
        }
      }]
    });

    console.log(`\n✅ Updated session ${sessionId} with correct actualDuration: ${correctDuration} minutes`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificSession();