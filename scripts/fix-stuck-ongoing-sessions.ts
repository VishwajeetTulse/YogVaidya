/**
 * Script to fix existing ONGOING sessions that might be stuck
 * This handles sessions started before the improved auto-completion logic
 */
import { prisma } from "../src/lib/config/prisma";

async function main() {
  console.log("🔧 Starting to fix stuck ONGOING sessions...");
  
  try {
    // Find all ONGOING sessions without manualStartTime
    const stuckSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        $or: [
          { manualStartTime: { $exists: false } },
          { manualStartTime: null }
        ]
      }
    });

    let stuckSessions: any[] = [];
    if (stuckSessionsResult &&
        typeof stuckSessionsResult === 'object' &&
        'cursor' in stuckSessionsResult &&
        stuckSessionsResult.cursor &&
        typeof stuckSessionsResult.cursor === 'object' &&
        'firstBatch' in stuckSessionsResult.cursor &&
        Array.isArray(stuckSessionsResult.cursor.firstBatch)) {
      stuckSessions = stuckSessionsResult.cursor.firstBatch;
    }

    console.log(`📊 Found ${stuckSessions.length} stuck ONGOING sessions`);

    if (stuckSessions.length === 0) {
      console.log("✅ No stuck sessions found!");
      return;
    }

    // Process each stuck session
    for (const session of stuckSessions) {
      console.log(`🔧 Processing session ${session.id}...`);
      
      // Option 1: Set manualStartTime to scheduledAt (assume they started on time)
      const scheduledTime = new Date(session.scheduledAt);
      const currentTime = new Date();
      
      // Calculate expected duration
      let expectedDurationMinutes = 60; // Default
      if (session.sessionType === 'MEDITATION') {
        expectedDurationMinutes = 30;
      } else if (session.sessionType === 'DIET') {
        expectedDurationMinutes = 45;
      }
      
      // Calculate if session should already be completed
      const expectedEndTime = new Date(scheduledTime.getTime() + (expectedDurationMinutes * 60 * 1000));
      
      if (expectedEndTime <= currentTime) {
        // Session should be completed
        console.log(`✅ Completing overdue session ${session.id} (was scheduled to end at ${expectedEndTime.toISOString()})`);
        
        await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session.id },
            u: {
              $set: {
                status: 'COMPLETED',
                manualStartTime: scheduledTime,
                actualEndTime: new Date(), // Ensure this is a proper Date object
                expectedDuration: expectedDurationMinutes,
                completionReason: 'Auto-completed by fix script - session was overdue',
                updatedAt: new Date() // Ensure this is a proper Date object
              }
            }
          }]
        });
        
        console.log(`✅ Session ${session.id} marked as COMPLETED`);
      } else {
        // Session is still ongoing, just add the missing fields
        console.log(`⏰ Updating ongoing session ${session.id} with proper start time tracking`);
        
        await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session.id },
            u: {
              $set: {
                manualStartTime: scheduledTime, // Assume started at scheduled time
                expectedDuration: expectedDurationMinutes,
                updatedAt: new Date() // Ensure this is a proper Date object
              }
            }
          }]
        });
        
        console.log(`✅ Session ${session.id} updated with proper tracking`);
      }
    }
    
    console.log("🎉 All stuck sessions have been fixed!");
    
  } catch (error) {
    console.error("❌ Error fixing stuck sessions:", error);
    throw error;
  }
}

// Run the script
main()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });