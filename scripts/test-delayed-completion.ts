#!/usr/bin/env tsx

/**
 * Test delayed session auto-completion logic
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function testDelayedSessionCompletion() {
  try {
    console.log('🧪 Testing delayed session auto-completion logic...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
    }

    const currentTime = new Date();
    console.log(`⏰ Current time: ${currentTime.toISOString()}`);

    // Get the delayed session
    const delayedSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        isDelayed: true,
        manualStartTime: { $exists: true, $ne: null }
      }
    });

    let delayedSessions: any[] = [];
    if (delayedSessionsResult && 
        typeof delayedSessionsResult === 'object' && 
        'cursor' in delayedSessionsResult &&
        delayedSessionsResult.cursor &&
        typeof delayedSessionsResult.cursor === 'object' &&
        'firstBatch' in delayedSessionsResult.cursor &&
        Array.isArray(delayedSessionsResult.cursor.firstBatch)) {
      delayedSessions = delayedSessionsResult.cursor.firstBatch;
    }

    console.log(`🔄 Found ${delayedSessions.length} delayed sessions to check`);

    for (const session of delayedSessions) {
      console.log(`\n📋 Checking session: ${session._id}`);
      
      if (!session.timeSlotId || !session.manualStartTime) {
        console.log('❌ Missing timeSlotId or manualStartTime');
        continue;
      }

      // Get time slot details
      const timeSlotResult = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: { _id: session.timeSlotId }
      });

      let timeSlot: any = null;
      if (timeSlotResult && 
          typeof timeSlotResult === 'object' && 
          'cursor' in timeSlotResult &&
          timeSlotResult.cursor &&
          typeof timeSlotResult.cursor === 'object' &&
          'firstBatch' in timeSlotResult.cursor &&
          Array.isArray(timeSlotResult.cursor.firstBatch) &&
          timeSlotResult.cursor.firstBatch.length > 0) {
        timeSlot = timeSlotResult.cursor.firstBatch[0];
      }

      if (!timeSlot) {
        console.log('❌ Time slot not found');
        continue;
      }

      const originalStartTime = new Date(timeSlot.startTime);
      const originalEndTime = new Date(timeSlot.endTime);
      const manualStartTime = new Date(session.manualStartTime);
      
      // Calculate planned duration
      const plannedDurationMs = originalEndTime.getTime() - originalStartTime.getTime();
      const plannedDurationMinutes = plannedDurationMs / (1000 * 60);
      
      // Calculate when this delayed session should end
      const calculatedEndTime = new Date(manualStartTime.getTime() + plannedDurationMs);
      
      console.log(`📅 Original time slot: ${originalStartTime.toISOString()} - ${originalEndTime.toISOString()}`);
      console.log(`⏱️  Planned duration: ${plannedDurationMinutes} minutes`);
      console.log(`🚀 Manual start time: ${manualStartTime.toISOString()}`);
      console.log(`🏁 Calculated end time: ${calculatedEndTime.toISOString()}`);
      console.log(`⏰ Current time: ${currentTime.toISOString()}`);
      
      const shouldComplete = calculatedEndTime <= currentTime;
      const timeRemaining = calculatedEndTime.getTime() - currentTime.getTime();
      const minutesRemaining = Math.round(timeRemaining / (1000 * 60));
      
      if (shouldComplete) {
        console.log('✅ Session SHOULD be completed (calculated end time has passed)');
        console.log(`   Time overdue: ${Math.abs(minutesRemaining)} minutes`);
        
        // Actually complete the session
        console.log('🔄 Completing the session...');
        await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session._id },
            u: { 
              $set: { 
                status: 'COMPLETED',
                actualEndTime: currentTime,
                updatedAt: currentTime
              } 
            }
          }]
        });
        console.log('✅ Session completed successfully!');
        
      } else {
        console.log('⏳ Session should continue running');
        console.log(`   Time remaining: ${minutesRemaining} minutes`);
      }
    }

  } catch (error) {
    console.error('❌ Error testing delayed session completion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  testDelayedSessionCompletion()
    .then(() => {
      console.log('\n✅ Delayed session completion test completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Delayed session completion test failed:', error);
      process.exit(1);
    });
}

export { testDelayedSessionCompletion };
