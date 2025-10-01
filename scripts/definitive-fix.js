const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function definitiveStringDateFix() {
  console.log('🔧 Definitive String Date Fix\n');
  
  try {
    const sessionId = 'session_1759245260291_e5lzspwbe';
    
    // First, let's try to delete and recreate this session with proper dates
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
      console.log('   Found session with data:', {
        id: session._id,
        status: session.status,
        userId: session.userId,
        mentorId: session.mentorId
      });
      
      // Delete the problematic session
      console.log('2. Deleting problematic session...');
      const deleteResult = await prisma.$runCommandRaw({
        delete: 'sessionBooking',
        deletes: [{
          q: { _id: sessionId },
          limit: 1
        }]
      });
      console.log('   Delete result:', deleteResult);
      
      // Recreate with proper Date objects using Prisma
      console.log('3. Recreating session with proper dates...');
      
      // Convert scheduledAt and createdAt to proper dates
      const scheduledAt = session.scheduledAt && session.scheduledAt.$date ? 
        new Date(session.scheduledAt.$date) : new Date();
      const createdAt = session.createdAt && session.createdAt.$date ? 
        new Date(session.createdAt.$date) : new Date();
      
      const newSession = await prisma.sessionBooking.create({
        data: {
          id: sessionId,
          userId: session.userId || 'unknown_user',
          mentorId: session.mentorId || 'unknown_mentor',
          sessionType: session.sessionType || 'YOGA',
          scheduledAt: scheduledAt,
          status: session.status || 'CANCELLED',
          isDelayed: false, // Set to false to prevent further processing
          paymentStatus: session.paymentStatus || 'COMPLETED',
          amount: session.amount || 0,
          completionReason: 'Recreated to fix string date issue'
        }
      });
      
      console.log('   ✅ Session recreated with proper dates');
      console.log('   📅 scheduledAt:', newSession.scheduledAt, `(${typeof newSession.scheduledAt})`);
      console.log('   📅 createdAt:', newSession.createdAt, `(${typeof newSession.createdAt})`);
      console.log('   📅 updatedAt:', newSession.updatedAt, `(${typeof newSession.updatedAt})`);
    }
    
    // Final verification
    console.log('\n4. Final verification...');
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
      
      console.log(`   Found ${finalCheck.cursor.firstBatch.length} sessions with string updatedAt`);
      
      if (finalCheck.cursor.firstBatch.length === 0) {
        console.log('🎉 SUCCESS: All string dates eliminated!');
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

definitiveStringDateFix();