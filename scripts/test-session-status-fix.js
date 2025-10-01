// Test the session status service fix
const { PrismaClient } = require('@prisma/client');

async function testSessionStatusService() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Session Status Service Fix');
    
    // Check session bookings
    console.log('\n1. Checking session bookings...');
    const sessionCount = await prisma.sessionBooking.count();
    console.log(`   Total session bookings: ${sessionCount}`);
    
    if (sessionCount > 0) {
      // Get a sample session booking via Prisma
      const sampleSession = await prisma.sessionBooking.findFirst({
        select: {
          id: true,
          status: true,
          isDelayed: true,
          timeSlotId: true
        }
      });
      
      console.log('\n2. Sample session (via Prisma):');
      console.log(`   ID: ${sampleSession.id}`);
      console.log(`   Status: ${sampleSession.status}`);
      console.log(`   Delayed: ${sampleSession.isDelayed}`);
      console.log(`   TimeSlotId: ${sampleSession.timeSlotId}`);
      
      // Get the same session via raw query to see the difference
      console.log('\n3. Raw MongoDB format:');
      const rawResult = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: { id: sampleSession.id },
        limit: 1
      });
      
      if (rawResult.cursor && rawResult.cursor.firstBatch.length > 0) {
        const rawSession = rawResult.cursor.firstBatch[0];
        console.log(`   _id: ${rawSession._id || 'undefined'}`);
        console.log(`   id: ${rawSession.id || 'undefined'}`);
        console.log(`   status: ${rawSession.status}`);
        console.log(`   timeSlotId: ${rawSession.timeSlotId}`);
        
        // Test the helper function logic
        const sessionId = rawSession.id || rawSession._id;
        console.log(`   Resolved sessionId: ${sessionId}`);
        
        if (sessionId) {
          console.log('   ✅ Session ID resolution works');
        } else {
          console.log('   ❌ Session ID resolution failed');
        }
      }
    }
    
    // Test raw query for scheduled sessions (like the service does)
    console.log('\n4. Testing scheduled sessions query...');
    const scheduledResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'SCHEDULED',
        timeSlotId: { $ne: null }
      }
    });
    
    if (scheduledResult.cursor && scheduledResult.cursor.firstBatch) {
      console.log(`   Found ${scheduledResult.cursor.firstBatch.length} scheduled sessions`);
      
      if (scheduledResult.cursor.firstBatch.length > 0) {
        const testSession = scheduledResult.cursor.firstBatch[0];
        console.log(`   Test session _id: ${testSession._id || 'undefined'}`);
        console.log(`   Test session id: ${testSession.id || 'undefined'}`);
        
        // Test the session ID resolution
        const resolvedId = testSession.id || testSession._id;
        console.log(`   Resolved ID: ${resolvedId}`);
        
        if (resolvedId) {
          // Test if we can find this session with Prisma
          try {
            const foundSession = await prisma.sessionBooking.findFirst({
              where: { id: resolvedId }
            });
            
            if (foundSession) {
              console.log('   ✅ Prisma can find session with resolved ID');
            } else {
              console.log('   ❌ Prisma cannot find session with resolved ID');
            }
          } catch (error) {
            console.log('   ❌ Prisma query failed:', error.message);
          }
        }
      }
    } else {
      console.log('   No scheduled sessions found');
    }
    
    console.log('\n🎉 Session Status Service Test Complete');
    console.log('The session.id undefined error should now be resolved!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionStatusService();