const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testCriticalDateOperations() {
  console.log('🧪 Testing Critical Date Operations\n');
  
  try {
    console.log('1. Testing Prisma Date Queries...');
    
    // Test 1: Find sessions by date range (this was causing the original error)
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    try {
      const sessions = await prisma.sessionBooking.findMany({
        where: {
          scheduledAt: {
            gte: yesterday,
            lte: tomorrow
          }
        },
        take: 5
      });
      console.log('   ✅ Date range query successful, found', sessions.length, 'sessions');
    } catch (error) {
      console.log('   ❌ Date range query failed:', error.message);
    }
    
    // Test 2: Find mentor time slots (this was also causing issues)
    try {
      const timeSlots = await prisma.mentorTimeSlot.findMany({
        where: {
          startTime: {
            gte: now
          }
        },
        take: 5
      });
      console.log('   ✅ MentorTimeSlot query successful, found', timeSlots.length, 'slots');
    } catch (error) {
      console.log('   ❌ MentorTimeSlot query failed:', error.message);
    }
    
    // Test 3: Create a test session booking (simulating the booking process)
    console.log('\n2. Testing Session Booking Creation...');
    try {
      const testBookingId = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const testScheduledAt = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
      
      // Create test booking using Prisma (this should work now)
      const testBooking = await prisma.sessionBooking.create({
        data: {
          id: testBookingId,
          userId: 'test_user_id',
          mentorId: 'test_mentor_id',
          sessionType: 'YOGA',
          scheduledAt: testScheduledAt,
          status: 'SCHEDULED',
          amount: 500,
          paymentStatus: 'COMPLETED'
        }
      });
      
      console.log('   ✅ Session booking created successfully');
      console.log('   📝 ID:', testBooking.id);
      console.log('   📅 Scheduled:', testBooking.scheduledAt);
      console.log('   📅 Created:', testBooking.createdAt);
      console.log('   📅 Updated:', testBooking.updatedAt);
      
      // Test reading it back
      const retrieved = await prisma.sessionBooking.findUnique({
        where: { id: testBookingId }
      });
      
      if (retrieved) {
        console.log('   ✅ Session booking retrieved successfully');
        console.log('   🔍 All date fields are proper Date objects:', {
          scheduledAt: retrieved.scheduledAt instanceof Date,
          createdAt: retrieved.createdAt instanceof Date,
          updatedAt: retrieved.updatedAt instanceof Date
        });
      }
      
      // Clean up test data
      await prisma.sessionBooking.delete({
        where: { id: testBookingId }
      });
      console.log('   🧹 Test data cleaned up');
      
    } catch (error) {
      console.log('   ❌ Session booking test failed:', error.message);
    }
    
    // Test 4: Test UpdateSessionStatus function
    console.log('\n3. Testing UpdateSessionStatus Function...');
    try {
      // Create a test session first
      const testSessionId = `status_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await prisma.sessionBooking.create({
        data: {
          id: testSessionId,
          userId: 'test_user_id',
          mentorId: 'test_mentor_id',
          sessionType: 'MEDITATION',
          scheduledAt: new Date(),
          status: 'SCHEDULED'
        }
      });
      
      // Import and test the UpdateSessionStatus function
      const { UpdateSessionStatus } = require('../src/lib/session.ts');
      const result = await UpdateSessionStatus('COMPLETED', testSessionId);
      
      console.log('   ✅ UpdateSessionStatus completed:', result);
      
      // Verify the update worked
      const updatedSession = await prisma.sessionBooking.findUnique({
        where: { id: testSessionId }
      });
      
      if (updatedSession && updatedSession.status === 'COMPLETED') {
        console.log('   ✅ Status update verified, updatedAt is:', typeof updatedSession.updatedAt);
      } else {
        console.log('   ❌ Status update verification failed');
      }
      
      // Clean up
      await prisma.sessionBooking.delete({
        where: { id: testSessionId }
      });
      console.log('   🧹 Test session cleaned up');
      
    } catch (error) {
      console.log('   ❌ UpdateSessionStatus test failed:', error.message);
    }
    
    console.log('\n🎉 All critical date operation tests completed!');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCriticalDateOperations();