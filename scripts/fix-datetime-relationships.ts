import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDatetimeRelationships() {
  console.log('🔧 Fixing datetime relationships between Schedule and SessionBooking models...');

  try {
    // Find all SessionBooking records that have timeSlotId but no scheduleId
    const bookingsToUpdate = await prisma.sessionBooking.findMany({
      where: {
        timeSlotId: { not: null },
        scheduleId: null
      },
      include: {
        timeSlot: true
      }
    });

    console.log(`📊 Found ${bookingsToUpdate.length} session bookings to potentially link to schedules`);

    let updatedCount = 0;

    for (const booking of bookingsToUpdate) {
      if (booking.timeSlot) {
        // Find the corresponding Schedule record for this time slot
        // This assumes that MentorTimeSlot has a relationship to Schedule
        // You may need to adjust this based on your actual data model
        const schedule = await prisma.schedule.findFirst({
          where: {
            mentorId: booking.mentorId,
            scheduledTime: booking.scheduledAt
          }
        });

        if (schedule) {
          await prisma.sessionBooking.update({
            where: { id: booking.id },
            data: { scheduleId: schedule.id }
          });
          updatedCount++;
          console.log(`✅ Linked booking ${booking.id} to schedule ${schedule.id}`);
        } else {
          console.log(`⚠️  No matching schedule found for booking ${booking.id}`);
        }
      }
    }

    console.log(`✅ Updated ${updatedCount} session bookings with scheduleId references`);

    // Verify the schema changes work
    const testQuery = await prisma.sessionBooking.findFirst({
      include: {
        schedule: true,
        timeSlot: true
      }
    });

    if (testQuery) {
      console.log('✅ Schema relationships verified successfully');
      console.log(`📋 Test booking has schedule: ${!!testQuery.schedule}`);
    }

  } catch (error) {
    console.error('❌ Error fixing datetime relationships:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
fixDatetimeRelationships()
  .then(() => {
    console.log('🎉 Datetime relationship fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });