const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugSubscriptionSessions() {
  try {
    console.log('🔍 Debugging subscription sessions...\n');

    // Check for any recently created sessions
    const recentSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      sort: { createdAt: -1 },
      limit: 10
    });

    console.log('📋 Recent sessions found:');
    if (recentSessions && 
        typeof recentSessions === 'object' && 
        'cursor' in recentSessions &&
        recentSessions.cursor &&
        typeof recentSessions.cursor === 'object' &&
        'firstBatch' in recentSessions.cursor &&
        Array.isArray(recentSessions.cursor.firstBatch)) {
      
      const sessions = recentSessions.cursor.firstBatch;
      console.log(`Found ${sessions.length} recent sessions:`);
      
      sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. Session ID: ${session._id}`);
        console.log(`   Status: ${session.status}`);
        console.log(`   Type: ${session.sessionType}`);
        console.log(`   Scheduled: ${session.scheduledAt}`);
        console.log(`   Amount: ${session.amount || 0}`);
        console.log(`   Payment Status: ${session.paymentStatus || 'N/A'}`);
        console.log(`   Created: ${session.createdAt}`);
        console.log(`   Time Slot ID: ${session.timeSlotId || 'N/A'}`);
        console.log(`   Notes: ${session.notes || 'N/A'}`);
        if (session.isDelayed) console.log(`   🔴 DELAYED SESSION`);
        if (session.manualStartTime) console.log(`   Manual Start: ${session.manualStartTime}`);
      });
    } else {
      console.log('❌ No sessions found or unexpected response format');
    }

    // Check for scheduled sessions specifically
    console.log('\n📅 Checking scheduled sessions...');
    const scheduledSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { status: 'SCHEDULED' },
      sort: { scheduledAt: 1 }
    });

    if (scheduledSessions && 
        typeof scheduledSessions === 'object' && 
        'cursor' in scheduledSessions &&
        scheduledSessions.cursor &&
        typeof scheduledSessions.cursor === 'object' &&
        'firstBatch' in scheduledSessions.cursor &&
        Array.isArray(scheduledSessions.cursor.firstBatch)) {
      
      const sessions = scheduledSessions.cursor.firstBatch;
      console.log(`Found ${sessions.length} scheduled sessions`);
      
      sessions.forEach((session, index) => {
        console.log(`\n${index + 1}. ID: ${session._id}`);
        console.log(`   Scheduled for: ${session.scheduledAt}`);
        console.log(`   Type: ${session.sessionType}`);
        console.log(`   Status: ${session.status}`);
      });
    }

    // Test finding a specific session by ID if we have any
    if (recentSessions && 
        typeof recentSessions === 'object' && 
        'cursor' in recentSessions &&
        recentSessions.cursor &&
        typeof recentSessions.cursor === 'object' &&
        'firstBatch' in recentSessions.cursor &&
        Array.isArray(recentSessions.cursor.firstBatch) &&
        recentSessions.cursor.firstBatch.length > 0) {
      
      const firstSession = recentSessions.cursor.firstBatch[0];
      console.log(`\n🔍 Testing session lookup for ID: ${firstSession._id}`);
      
      const testLookup = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: { _id: firstSession._id }
      });

      if (testLookup && 
          typeof testLookup === 'object' && 
          'cursor' in testLookup &&
          testLookup.cursor &&
          typeof testLookup.cursor === 'object' &&
          'firstBatch' in testLookup.cursor &&
          Array.isArray(testLookup.cursor.firstBatch) &&
          testLookup.cursor.firstBatch.length > 0) {
        console.log('✅ Session lookup successful');
      } else {
        console.log('❌ Session lookup failed - this might be the issue!');
      }
    }

  } catch (error) {
    console.error('❌ Error debugging sessions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugSubscriptionSessions();