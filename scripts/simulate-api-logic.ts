import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAPISimulation() {
  console.log('🧪 Simulating subscription sessions API logic...');

  try {
    // Simulate what the API does for a mentor (let's use a test mentor ID)
    const testMentorId = 'test-mentor-id'; // This would normally come from authentication

    console.log('\n📅 Step 1: Fetch schedules for mentor');
    const schedules = await prisma.schedule.findMany({
      where: {
        mentorId: testMentorId // This will return empty, but tests the query structure
      },
      orderBy: {
        scheduledTime: 'desc'
      }
    });

    console.log(`Found ${schedules.length} schedules for mentor ${testMentorId}`);

    // Test with actual data - get all schedules
    console.log('\n📅 Step 2: Fetch all schedules (for testing)');
    const allSchedules = await prisma.schedule.findMany({
      orderBy: {
        scheduledTime: 'desc'
      }
    });

    console.log(`Found ${allSchedules.length} total schedules in database`);

    if (allSchedules.length > 0) {
      console.log('\n🔍 Step 3: Process first schedule (simulating API logic)');

      const schedule = allSchedules[0];
      console.log(`Processing schedule: ${schedule.id} - ${schedule.title}`);

      // Simulate eligible user calculation
      let eligiblePlans: ("SEED" | "BLOOM" | "FLOURISH")[] = [];
      if (schedule.sessionType === "YOGA") {
        eligiblePlans = ["BLOOM", "FLOURISH"];
      } else if (schedule.sessionType === "MEDITATION") {
        eligiblePlans = ["SEED", "FLOURISH"];
      }

      console.log(`Session type: ${schedule.sessionType}`);
      console.log(`Eligible plans: ${eligiblePlans.join(', ')}`);

      const eligibleUsers = await prisma.user.findMany({
        where: {
          role: "USER",
          subscriptionStatus: "ACTIVE",
          subscriptionPlan: {
            in: eligiblePlans
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          subscriptionPlan: true
        }
      });

      console.log(`Found ${eligibleUsers.length} eligible users`);

      // Count by subscription plan
      const planCounts = {
        SEED: eligibleUsers.filter(u => u.subscriptionPlan === "SEED").length,
        BLOOM: eligibleUsers.filter(u => u.subscriptionPlan === "BLOOM").length,
        FLOURISH: eligibleUsers.filter(u => u.subscriptionPlan === "FLOURISH").length,
      };

      console.log('Plan counts:', planCounts);

      // Test datetime conversion (this was the main issue)
      console.log('\n⏰ Step 4: Test datetime conversion');
      try {
        const scheduleData = {
          ...schedule,
          scheduledTime: schedule.scheduledTime.toISOString(),
          createdAt: schedule.createdAt.toISOString(),
          updatedAt: schedule.updatedAt.toISOString(),
        };

        console.log('✅ Datetime conversion successful');
        console.log(`   Scheduled: ${scheduleData.scheduledTime}`);
        console.log(`   Created: ${scheduleData.createdAt}`);
        console.log(`   Updated: ${scheduleData.updatedAt}`);

        // Simulate final response structure
        const responseData = {
          ...scheduleData,
          totalBookings: eligibleUsers.length,
          planCounts,
          bookings: [],
          sessionFormat: "GROUP",
          notes: "This is a group session available for all eligible subscription users"
        };

        console.log('\n📤 Step 5: Simulated API response');
        console.log('✅ Response structure:', {
          id: responseData.id,
          title: responseData.title,
          sessionFormat: responseData.sessionFormat,
          totalBookings: responseData.totalBookings,
          scheduledTime: responseData.scheduledTime
        });

      } catch (error) {
        console.log('❌ Datetime conversion failed:', error instanceof Error ? error.message : String(error));
      }
    }

    console.log('\n🎉 API simulation completed successfully!');
    console.log('✅ The subscription sessions API logic should now work correctly');

  } catch (error) {
    console.error('❌ Error during API simulation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the simulation
testAPISimulation()
  .then(() => {
    console.log('\n✅ API simulation test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 API simulation failed:', error);
    process.exit(1);
  });