const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSessionRestrictions() {
  try {
    console.log('🔍 Testing Session Restrictions...\n');

    // Get all users and mentors
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true }
    });

    const mentorApps = await prisma.mentorApplication.findMany({
      where: { status: 'APPROVED' },
      select: { id: true, userId: true, user: { select: { name: true, email: true } } }
    });

    console.log('👥 Available Users:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - ID: ${user.id}`);
    });

    console.log('\n🧑‍🏫 Available Mentors:');
    mentorApps.forEach(mentor => {
      console.log(`  - ${mentor.user.name} (${mentor.user.email}) - Mentor ID: ${mentor.id}, User ID: ${mentor.userId}`);
    });

    // Get all session bookings
    const sessions = await prisma.sessionBooking.findMany({
      include: {
        user: { select: { name: true, email: true } },
        mentorApplication: { 
          include: { 
            user: { select: { name: true, email: true } } 
          } 
        }
      }
    });

    console.log('\n📅 Current Session Bookings:');
    if (sessions.length === 0) {
      console.log('  No sessions found');
    } else {
      sessions.forEach(session => {
        console.log(`  - ${session.user.name} → ${session.mentorApplication.user.name}`);
        console.log(`    Status: ${session.status}, Date: ${session.sessionDate}, Time: ${session.sessionTime}`);
        console.log(`    Payment: ${session.paymentStatus}, Amount: ₹${session.amount}`);
        console.log(`    Session ID: ${session.id}\n`);
      });
    }

    // Test session checking logic for specific combinations
    if (users.length > 0 && mentorApps.length > 0) {
      const testUserId = users[0].id;
      const testMentorId = mentorApps[0].id;

      console.log(`🧪 Testing session check for User: ${users[0].name} with Mentor: ${mentorApps[0].user.name}`);
      
      // Raw MongoDB query to check sessions (same logic as API)
      const activeSessionsResult = await prisma.$runCommandRaw({
        find: "SessionBooking",
        filter: {
          userId: testUserId,
          mentorApplicationId: testMentorId,
          status: { $in: ["PENDING", "CONFIRMED"] },
          paymentStatus: "COMPLETED"
        }
      });

      const completedSessionsResult = await prisma.$runCommandRaw({
        find: "SessionBooking",
        filter: {
          userId: testUserId,
          mentorApplicationId: testMentorId,
          status: "COMPLETED",
          paymentStatus: "COMPLETED"
        }
      });

      const activeSessions = activeSessionsResult.cursor.firstBatch || [];
      const completedSessions = completedSessionsResult.cursor.firstBatch || [];

      console.log(`📊 Results:`);
      console.log(`  - Active sessions: ${activeSessions.length}`);
      console.log(`  - Completed sessions: ${completedSessions.length}`);
      console.log(`  - Can book new session: ${activeSessions.length === 0}`);
    }

  } catch (error) {
    console.error('❌ Error testing session restrictions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSessionRestrictions();
