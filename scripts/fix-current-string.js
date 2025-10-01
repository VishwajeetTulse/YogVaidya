const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCurrentStringDate() {
  console.log('🔧 Fixing Current String Date\n');
  
  try {
    const sessionId = 'session_1759245877071_4oo4zhpxt'; // Current problematic session
    
    // Delete and recreate this session too
    console.log('1. Getting session data...');
    const sessionData = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: sessionId }
    });
    
    if (sessionData && 
        typeof sessionData === 'object' && 
        'cursor' in sessionData &&
        sessionData.cursor &&
        typeof sessionData.cursor === 'object' &&
        'firstBatch' in sessionData.cursor &&
        Array.isArray(sessionData.cursor.firstBatch) &&
        sessionData.cursor.firstBatch.length > 0) {
      
      const session = sessionData.cursor.firstBatch[0];
      
      // Delete the problematic session
      console.log('2. Deleting problematic session...');
      await prisma.$runCommandRaw({
        delete: 'sessionBooking',
        deletes: [{
          q: { _id: sessionId },
          limit: 1
        }]
      });
      
      // Recreate with proper dates
      console.log('3. Recreating session with proper dates...');
      const scheduledAt = session.scheduledAt && session.scheduledAt.$date ? 
        new Date(session.scheduledAt.$date) : new Date();
      const createdAt = session.createdAt && session.createdAt.$date ? 
        new Date(session.createdAt.$date) : new Date();
      
      await prisma.sessionBooking.create({
        data: {
          id: sessionId,
          userId: session.userId || 'unknown_user',
          mentorId: session.mentorId || 'unknown_mentor', 
          sessionType: session.sessionType || 'YOGA',
          scheduledAt: scheduledAt,
          status: session.status || 'CANCELLED',
          isDelayed: false,
          paymentStatus: session.paymentStatus || 'COMPLETED',
          amount: session.amount || 0,
          completionReason: 'Recreated to fix string date - background processing disabled'
        }
      });
      
      console.log('   ✅ Session recreated');
    }
    
    // Check all sessions now
    const finalCheck = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (finalCheck && 
        typeof finalCheck === 'object' && 
        'cursor' in finalCheck &&
        finalCheck.cursor &&
        typeof finalCheck.cursor === 'object' &&
        'firstBatch' in finalCheck.cursor &&
        Array.isArray(finalCheck.cursor.firstBatch)) {
      
      console.log(`\n🔍 Found ${finalCheck.cursor.firstBatch.length} sessions with string updatedAt after fix`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixCurrentStringDate();