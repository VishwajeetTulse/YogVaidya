const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function detailedDateAudit() {
  console.log('🔍 Detailed Date Inconsistency Analysis\n');
  
  try {
    // Check sessionBooking collection in detail
    console.log('📋 SessionBooking Collection Analysis:');
    
    const stringUpdatedAtSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (stringUpdatedAtSessions && 
        typeof stringUpdatedAtSessions === 'object' && 
        'cursor' in stringUpdatedAtSessions &&
        stringUpdatedAtSessions.cursor &&
        typeof stringUpdatedAtSessions.cursor === 'object' &&
        'firstBatch' in stringUpdatedAtSessions.cursor &&
        Array.isArray(stringUpdatedAtSessions.cursor.firstBatch)) {
      
      const sessions = stringUpdatedAtSessions.cursor.firstBatch;
      console.log(`Found ${sessions.length} sessions with string updatedAt:`);
      
      sessions.forEach(session => {
        console.log(`  - ID: ${session._id}`);
        console.log(`    updatedAt: ${session.updatedAt} (${typeof session.updatedAt})`);
        console.log(`    createdAt: ${session.createdAt} (${typeof session.createdAt})`);
        console.log(`    scheduledAt: ${session.scheduledAt} (${typeof session.scheduledAt})`);
        console.log(`    status: ${session.status}`);
        console.log('');
      });
    } else {
      console.log('No sessions with string updatedAt found.');
    }
    
    // Also check for sessions with string scheduledAt
    const stringScheduledAtSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { scheduledAt: { $type: "string" } }
    });
    
    if (stringScheduledAtSessions && 
        typeof stringScheduledAtSessions === 'object' && 
        'cursor' in stringScheduledAtSessions &&
        stringScheduledAtSessions.cursor &&
        typeof stringScheduledAtSessions.cursor === 'object' &&
        'firstBatch' in stringScheduledAtSessions.cursor &&
        Array.isArray(stringScheduledAtSessions.cursor.firstBatch) &&
        stringScheduledAtSessions.cursor.firstBatch.length > 0) {
      
      console.log(`Found ${stringScheduledAtSessions.cursor.firstBatch.length} sessions with string scheduledAt:`);
      stringScheduledAtSessions.cursor.firstBatch.forEach(session => {
        console.log(`  - ID: ${session._id}, scheduledAt: ${session.scheduledAt}`);
      });
    }
    
  } catch (error) {
    console.error('Error in detailed audit:', error);
  } finally {
    await prisma.$disconnect();
  }
}

detailedDateAudit();