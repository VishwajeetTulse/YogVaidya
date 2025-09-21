import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugSubscriptionSessions() {
  console.log('🔍 Debugging subscription sessions API...');

  try {
    // Test 1: Check if we can query schedules
    console.log('\n📅 Test 1: Querying schedules');
    const schedules = await prisma.schedule.findMany({
      take: 5
    });

    console.log(`Found ${schedules.length} schedules`);
    if (schedules.length > 0) {
      console.log('First schedule:', {
        id: schedules[0].id,
        title: schedules[0].title,
        scheduledTime: schedules[0].scheduledTime,
        createdAt: schedules[0].createdAt,
        updatedAt: schedules[0].updatedAt,
        status: schedules[0].status
      });
    }

    // Test 2: Check for datetime conversion issues
    console.log('\n⏰ Test 2: Testing datetime conversion');
    for (const schedule of schedules.slice(0, 2)) {
      try {
        const isoScheduled = schedule.scheduledTime.toISOString();
        const isoCreated = schedule.createdAt.toISOString();
        const isoUpdated = schedule.updatedAt.toISOString();

        console.log(`✅ Schedule ${schedule.id} datetime conversion successful`);
        console.log(`   Scheduled: ${isoScheduled}`);
        console.log(`   Created: ${isoCreated}`);
        console.log(`   Updated: ${isoUpdated}`);
      } catch (error) {
        console.log(`❌ Schedule ${schedule.id} datetime conversion failed:`, error.message);
      }
    }

    // Test 3: Check user subscriptions
    console.log('\n👥 Test 3: Checking user subscriptions');
    const users = await prisma.user.findMany({
      where: {
        role: 'USER',
        subscriptionStatus: 'ACTIVE'
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      },
      take: 10
    });

    console.log(`Found ${users.length} active users`);
    const planCounts = {
      SEED: users.filter(u => u.subscriptionPlan === 'SEED').length,
      BLOOM: users.filter(u => u.subscriptionPlan === 'BLOOM').length,
      FLOURISH: users.filter(u => u.subscriptionPlan === 'FLOURISH').length,
    };
    console.log('Plan distribution:', planCounts);

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug
debugSubscriptionSessions()
  .then(() => {
    console.log('\n✅ Debug completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Debug failed:', error);
    process.exit(1);
  });