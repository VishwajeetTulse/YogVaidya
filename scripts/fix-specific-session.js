const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixSpecificSessionRecord() {
  console.log('🔧 Fixing specific session record with string updatedAt...\n');
  
  try {
    // Fix the specific session we identified
    const sessionId = 'session_1759245260291_e5lzspwbe';
    
    const result = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [{
        q: { _id: sessionId, updatedAt: { $type: "string" } },
        u: [{
          $set: {
            updatedAt: {
              $dateFromString: {
                dateString: "$updatedAt"
              }
            }
          }
        }]
      }]
    });
    
    console.log(`Fixed session ${sessionId}:`, result);
    
    // Verify the fix
    const verification = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: sessionId }
    });
    
    if (verification && 
        typeof verification === 'object' && 
        'cursor' in verification &&
        verification.cursor &&
        typeof verification.cursor === 'object' &&
        'firstBatch' in verification.cursor &&
        Array.isArray(verification.cursor.firstBatch) &&
        verification.cursor.firstBatch.length > 0) {
      
      const session = verification.cursor.firstBatch[0];
      console.log('✅ Verification - Session after fix:');
      console.log(`  updatedAt: ${session.updatedAt} (${typeof session.updatedAt})`);
      console.log(`  createdAt: ${session.createdAt} (${typeof session.createdAt})`);
      console.log(`  scheduledAt: ${session.scheduledAt} (${typeof session.scheduledAt})`);
    }
    
  } catch (error) {
    console.error('Error fixing session record:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificSessionRecord();