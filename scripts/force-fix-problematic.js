const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceFixProblematicSession() {
  console.log('🔧 Force Fixing Problematic Session\n');
  
  try {
    const sessionId = 'session_1759245260291_e5lzspwbe';
    
    // Use the bulk write approach that worked before
    const result = await prisma.$runCommandRaw({
      bulkWrite: 'sessionBooking',
      requests: [{
        updateOne: {
          filter: { _id: sessionId },
          update: { 
            $set: { 
              updatedAt: new Date(),
              // Also mark it as not delayed to prevent further automated updates
              isDelayed: false,
              // Add a completion reason to prevent cron job processing
              completionReason: 'Session cancelled - no further processing needed'
            } 
          }
        }
      }]
    });
    
    console.log('✅ Bulk update result:', result);
    
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
      console.log('   completionReason:', session.completionReason);
    }
    
    // Run final comprehensive check
    console.log('\n🔍 Final database check...');
    const allCheck = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (allCheck && 
        typeof allCheck === 'object' && 
        'cursor' in allCheck &&
        allCheck.cursor &&
        typeof allCheck.cursor === 'object' &&
        'firstBatch' in allCheck.cursor &&
        Array.isArray(allCheck.cursor.firstBatch)) {
      
      console.log(`   Found ${allCheck.cursor.firstBatch.length} sessions with string updatedAt after fix`);
      
      if (allCheck.cursor.firstBatch.length === 0) {
        console.log('🎉 SUCCESS: All string dates have been eliminated!');
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFixProblematicSession();