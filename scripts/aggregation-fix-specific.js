const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function aggregationFixSpecific() {
  console.log('🔧 Aggregation Fix for Specific Session\n');
  
  try {
    const sessionId = 'session_1759245260291_e5lzspwbe';
    
    // Use aggregation pipeline to fix this specific session
    const result = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        {
          $match: { _id: sessionId }
        },
        {
          $addFields: {
            updatedAt: new Date(), // Current timestamp as Date object
            isDelayed: false,
            completionReason: 'Fixed persistent string date - automated processing disabled'
          }
        },
        {
          $merge: {
            into: "sessionBooking",
            whenMatched: "replace"
          }
        }
      ],
      cursor: {}
    });
    
    console.log('✅ Aggregation result:', result);
    
    // Wait a moment for the operation to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
      console.log('\n📋 After aggregation fix:');
      console.log('   updatedAt:', session.updatedAt, `(${typeof session.updatedAt})`);
      console.log('   isDelayed:', session.isDelayed);
      console.log('   completionReason:', session.completionReason);
    }
    
    // Check all sessions with string dates
    console.log('\n🔍 Checking all sessions with string dates...');
    const allStringCheck = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (allStringCheck && 
        typeof allStringCheck === 'object' && 
        'cursor' in allStringCheck &&
        allStringCheck.cursor &&
        typeof allStringCheck.cursor === 'object' &&
        'firstBatch' in allStringCheck.cursor &&
        Array.isArray(allStringCheck.cursor.firstBatch)) {
      
      console.log(`   Found ${allStringCheck.cursor.firstBatch.length} sessions with string updatedAt`);
    }
    
  } catch (error) {
    console.error('❌ Aggregation fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

aggregationFixSpecific();