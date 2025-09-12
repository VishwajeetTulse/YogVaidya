/**
 * Script to manually complete ongoing sessions that have passed their end time
 * This fixes sessions that are stuck in ONGOING status
 */

import { prisma } from "../src/lib/config/prisma";

interface SessionData {
  _id: string;
  status: string;
  isDelayed?: boolean;
  timeSlotId: string;
  [key: string]: any;
}

interface TimeSlotData {
  _id: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

async function completeDelayedSessions() {
  console.log("🔍 Starting delayed session completion script...");
  
  const currentTime = new Date();
  console.log(`📅 Current time: ${currentTime.toISOString()}`);

  try {
    // 1. Find all ONGOING sessions
    const ongoingSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING'
      }
    });

    let ongoingSessions: SessionData[] = [];
    if (ongoingSessionsResult && 
        typeof ongoingSessionsResult === 'object' && 
        'cursor' in ongoingSessionsResult &&
        ongoingSessionsResult.cursor &&
        typeof ongoingSessionsResult.cursor === 'object' &&
        'firstBatch' in ongoingSessionsResult.cursor &&
        Array.isArray(ongoingSessionsResult.cursor.firstBatch)) {
      ongoingSessions = ongoingSessionsResult.cursor.firstBatch as SessionData[];
    }

    console.log(`📊 Found ${ongoingSessions.length} ongoing sessions`);

    if (ongoingSessions.length === 0) {
      console.log("✅ No ongoing sessions found to complete");
      return;
    }

    let completedCount = 0;

    for (const session of ongoingSessions) {
      console.log(`\n🔍 Processing session ${session._id}...`);
      console.log(`   Status: ${session.status}, Delayed: ${session.isDelayed || 'not set'}`);

      if (!session.timeSlotId) {
        console.log(`   ⚠️  No timeSlotId found, skipping...`);
        continue;
      }

      // Get time slot details
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      let timeSlot: TimeSlotData | null = null;
      if (timeSlotResult && 
          typeof timeSlotResult === 'object' && 
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0] as TimeSlotData;
      }

      if (!timeSlot) {
        console.log(`   ⚠️  TimeSlot not found, skipping...`);
        continue;
      }

      const endTime = new Date(timeSlot.endTime);
      console.log(`   📅 Session end time: ${endTime.toISOString()}`);
      console.log(`   ⏰ Has session ended? ${endTime <= currentTime ? 'YES' : 'NO'}`);

      // Check if session should be completed (has passed end time)
      if (endTime <= currentTime) {
        console.log(`   ✅ Completing session ${session._id}...`);
        
        await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session._id },
            u: { 
              $set: { 
                status: 'COMPLETED',
                updatedAt: currentTime,
                completedAt: currentTime, // Add completion timestamp
                completedBy: 'script' // Mark as completed by script
              } 
            }
          }]
        });

        completedCount++;
        console.log(`   ✅ Session ${session._id} marked as COMPLETED`);
      } else {
        const timeUntilEnd = Math.round((endTime.getTime() - currentTime.getTime()) / (1000 * 60));
        console.log(`   ⏳ Session still has ${timeUntilEnd} minutes remaining`);
      }
    }

    console.log(`\n🎉 Completion script finished!`);
    console.log(`📊 Processed: ${ongoingSessions.length} sessions`);
    console.log(`✅ Completed: ${completedCount} sessions`);
    console.log(`⏳ Still ongoing: ${ongoingSessions.length - completedCount} sessions`);

  } catch (error) {
    console.error("❌ Error in completion script:", error);
    throw error;
  }
}

// Run the script
completeDelayedSessions()
  .then(() => {
    console.log("🎯 Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Script failed:", error);
    process.exit(1);
  });
