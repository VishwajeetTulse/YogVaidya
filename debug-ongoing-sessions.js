/**
 * Debug script to check current ongoing sessions
 */

const { prisma } = require("./src/lib/config/prisma");

async function checkOngoingSessions() {
  try {
    console.log("🔍 Checking ongoing sessions...");

    const result = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: { status: "ONGOING" },
    });

    if (result && result.cursor && result.cursor.firstBatch) {
      const sessions = result.cursor.firstBatch;
      console.log(`📊 Found ${sessions.length} ongoing sessions:`);

      for (const session of sessions) {
        console.log("\n---");
        console.log(`Session ID: ${session._id}`);
        console.log(`Session Type: ${session.sessionType}`);
        console.log(`Status: ${session.status}`);
        console.log(`Scheduled At: ${session.scheduledAt}`);
        console.log(`Created At: ${session.createdAt}`);
        console.log(`Updated At: ${session.updatedAt}`);
        console.log(`Time Slot ID: ${session.timeSlotId}`);
        console.log(`Is Delayed: ${session.isDelayed}`);

        // Check if time slot exists
        if (session.timeSlotId) {
          const timeSlotResult = await prisma.$runCommandRaw({
            find: "mentorTimeSlot",
            filter: { _id: session.timeSlotId },
          });

          if (
            timeSlotResult &&
            timeSlotResult.cursor &&
            timeSlotResult.cursor.firstBatch.length > 0
          ) {
            const timeSlot = timeSlotResult.cursor.firstBatch[0];
            console.log(`Time Slot Start: ${timeSlot.startTime}`);
            console.log(`Time Slot End: ${timeSlot.endTime}`);

            const start = new Date(timeSlot.startTime);
            const end = new Date(timeSlot.endTime);
            const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
            console.log(`Time Slot Duration: ${durationMinutes} minutes`);
          } else {
            console.log("❌ Time slot not found!");
          }
        }
      }
    } else {
      console.log("✅ No ongoing sessions found");
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOngoingSessions();
