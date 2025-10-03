const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkActualDuration() {
  try {
    console.log('Checking completed sessions for actualDuration field...\n');
    
    // Use raw MongoDB query to avoid DateTime conversion issues
    const result = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { status: 'COMPLETED' },
      sort: { updatedAt: -1 },
      limit: 10
    });

    let completedSessions = [];
    if (result && result.cursor && result.cursor.firstBatch) {
      completedSessions = result.cursor.firstBatch;
    }

    console.log(`Found ${completedSessions.length} completed sessions (showing latest 10):\n`);
    
    completedSessions.forEach((session, index) => {
      console.log(`Session ${index + 1}:`);
      console.log(`  ID: ${session._id}`);
      console.log(`  Status: ${session.status}`);
      console.log(`  actualDuration: ${session.actualDuration !== undefined ? session.actualDuration + ' minutes' : 'NULL/MISSING'}`);
      console.log(`  expectedDuration: ${session.expectedDuration !== undefined ? session.expectedDuration + ' minutes' : 'NULL/MISSING'}`);
      console.log(`  manualStartTime: ${session.manualStartTime || 'NULL/MISSING'}`);
      console.log(`  actualEndTime: ${session.actualEndTime || 'NULL/MISSING'}`);
      
      if (session.manualStartTime && session.actualEndTime) {
        try {
          // Handle MongoDB date format
          let startTime = session.manualStartTime;
          let endTime = session.actualEndTime;
          
          if (typeof startTime === 'object' && startTime.$date) {
            startTime = startTime.$date;
          }
          if (typeof endTime === 'object' && endTime.$date) {
            endTime = endTime.$date;
          }
          
          const calculatedDuration = Math.round(
            (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
          );
          console.log(`  calculated duration: ${calculatedDuration} minutes`);
        } catch (err) {
          console.log(`  calculated duration: Error - ${err.message}`);
        }
      }
      console.log('');
    });

    // Summary statistics
    const total = completedSessions.length;
    const withActualDuration = completedSessions.filter(s => s.actualDuration !== null).length;
    const withoutActualDuration = total - withActualDuration;

    console.log('\nSummary:');
    console.log(`  Total completed sessions checked: ${total}`);
    console.log(`  With actualDuration: ${withActualDuration}`);
    console.log(`  Without actualDuration: ${withoutActualDuration}`);
    
    if (withoutActualDuration > 0) {
      console.log('\n⚠️  WARNING: Some completed sessions are missing actualDuration!');
      console.log('   This means the session completion logic is not storing the duration.');
    } else {
      console.log('\n✅ All checked completed sessions have actualDuration stored!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkActualDuration();
