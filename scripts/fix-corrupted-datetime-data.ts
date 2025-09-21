import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixCorruptedDatetimeData() {
  console.log('🔧 Fixing corrupted datetime data in Schedule collection...');

  try {
    // Get all schedules to check for corrupted data
    const schedules = await prisma.schedule.findMany({
      select: {
        id: true,
        updatedAt: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${schedules.length} schedules to check`);

    let fixedCount = 0;

    for (const schedule of schedules) {
      let needsFix = false;
      let fixedData: any = {};

      // Check if updatedAt is a string (corrupted)
      if (typeof schedule.updatedAt === 'string') {
        console.log(`🔧 Fixing updatedAt for schedule ${schedule.id}: ${schedule.updatedAt}`);
        fixedData.updatedAt = new Date(schedule.updatedAt);
        needsFix = true;
      }

      // Check if createdAt is a string (corrupted)
      if (typeof schedule.createdAt === 'string') {
        console.log(`🔧 Fixing createdAt for schedule ${schedule.id}: ${schedule.createdAt}`);
        fixedData.createdAt = new Date(schedule.createdAt);
        needsFix = true;
      }

      // Update the record if it needs fixing
      if (needsFix) {
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: fixedData
        });
        fixedCount++;
        console.log(`✅ Fixed schedule ${schedule.id}`);
      }
    }

    console.log(`🎉 Fixed ${fixedCount} corrupted datetime records`);

    // Verify the fix worked
    console.log('\n🔍 Verifying fix...');
    const testSchedule = await prisma.schedule.findFirst();
    if (testSchedule) {
      console.log('✅ Test query successful');
      console.log(`   Schedule ID: ${testSchedule.id}`);
      console.log(`   Created At: ${testSchedule.createdAt} (${typeof testSchedule.createdAt})`);
      console.log(`   Updated At: ${testSchedule.updatedAt} (${typeof testSchedule.updatedAt})`);
    }

  } catch (error) {
    console.error('❌ Error fixing corrupted data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix
fixCorruptedDatetimeData()
  .then(() => {
    console.log('\n✅ Datetime data fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });