const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function analyzeProblematicSession() {
  console.log('🕵️ Analyzing Problematic Session Record\n');
  
  try {
    const sessionId = 'session_1759245260291_e5lzspwbe';
    
    // Get the full session details
    const sessionResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: sessionId }
    });
    
    if (sessionResult && 
        typeof sessionResult === 'object' && 
        'cursor' in sessionResult &&
        sessionResult.cursor &&
        typeof sessionResult.cursor === 'object' &&
        'firstBatch' in sessionResult.cursor &&
        Array.isArray(sessionResult.cursor.firstBatch) &&
        sessionResult.cursor.firstBatch.length > 0) {
      
      const session = sessionResult.cursor.firstBatch[0];
      console.log('📋 Session Details:');
      console.log('   ID:', session._id);
      console.log('   Status:', session.status);
      console.log('   User ID:', session.userId);
      console.log('   Mentor ID:', session.mentorId);
      console.log('   Session Type:', session.sessionType);
      console.log('   Scheduled At:', session.scheduledAt, `(${typeof session.scheduledAt})`);
      console.log('   Created At:', session.createdAt, `(${typeof session.createdAt})`);
      console.log('   Updated At:', session.updatedAt, `(${typeof session.updatedAt})`);
      console.log('   Is Delayed:', session.isDelayed);
      console.log('   Manual Start Time:', session.manualStartTime);
      console.log('   Actual End Time:', session.actualEndTime);
      console.log('   Payment Status:', session.paymentStatus);
      
      // Check if this session is being processed by cron jobs
      if (session.status === 'CANCELLED') {
        console.log('\n💡 Analysis:');
        console.log('   This is a CANCELLED session.');
        console.log('   It might be getting updated by:');
        console.log('   - Session completion cron job');
        console.log('   - Session status monitoring');
        console.log('   - UpdateSessionStatus function calls');
        
        // Since this is a cancelled session, let's check if any processes are still trying to update it
        console.log('\n🔧 Applying permanent fix for this specific session...');
        
        // Apply the fix using aggregation pipeline one more time, but this time more forcefully
        const fixResult = await prisma.$runCommandRaw({
          updateOne: 'sessionBooking',
          filter: { _id: sessionId },
          update: [{
            $set: {
              updatedAt: { $dateFromString: { dateString: "$updatedAt" } }
            }
          }]
        });
        
        console.log('   Fix result:', fixResult);
        
        // Verify the fix
        const verifyResult = await prisma.$runCommandRaw({
          find: 'sessionBooking',
          filter: { _id: sessionId }
        });
        
        if (verifyResult && 
            typeof verifyResult === 'object' && 
            'cursor' in verifyResult &&
            verifyResult.cursor &&
            typeof verifyResult.cursor === 'object' &&
            'firstBatch' in verifyResult.cursor &&
            Array.isArray(verifyResult.cursor.firstBatch) &&
            verifyResult.cursor.firstBatch.length > 0) {
          
          const updated = verifyResult.cursor.firstBatch[0];
          console.log('   After fix - updatedAt:', updated.updatedAt, `(${typeof updated.updatedAt})`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeProblematicSession();