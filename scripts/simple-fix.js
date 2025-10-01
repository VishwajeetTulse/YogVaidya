const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function simpleFixProblematicSession() {
  console.log('🔧 Simple Fix for Problematic Session\n');
  
  try {
    const sessionId = 'session_1759245260291_e5lzspwbe';
    
    // Use regular update command
    const result = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [{
        q: { _id: sessionId },
        u: {
          $set: {
            updatedAt: new Date(),
            isDelayed: false,
            completionReason: 'Fixed string date issue - no further processing needed'
          }
        }
      }]
    });
    
    console.log('✅ Update result:', result);
    
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
      console.log('\n📋 After fix:');
      console.log('   updatedAt:', session.updatedAt, `(${typeof session.updatedAt})`);
      console.log('   isDelayed:', session.isDelayed);
      console.log('   status:', session.status);
      console.log('   completionReason:', session.completionReason);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleFixProblematicSession();