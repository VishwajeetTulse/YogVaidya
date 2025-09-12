#!/usr/bin/env tsx

/**
 * Fix delayed sessions with missing time slots
 * Use default duration or manual completion for sessions without valid time slots
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixDelayedSessionsWithMissingTimeSlots() {
  try {
    console.log('🔧 Fixing delayed sessions with missing time slots...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
    }

    const currentTime = new Date();
    console.log(`⏰ Current time: ${currentTime.toISOString()}`);

    // Get delayed sessions
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
      console.log(`\n📋 Processing session: ${session._id}`);
      
      if (!session.manualStartTime) {
        console.log('❌ No manualStartTime found, skipping');
        continue;
      }

      const manualStartTime = new Date(session.manualStartTime);
      let shouldComplete = false;
      let calculatedEndTime: Date;
      let reason = '';

      // Try to find the time slot first
      if (session.timeSlotId) {
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

        if (timeSlot) {
          // Time slot found - use original logic
          const originalStartTime = new Date(timeSlot.startTime);
          const originalEndTime = new Date(timeSlot.endTime);
          const plannedDurationMs = originalEndTime.getTime() - originalStartTime.getTime();
          calculatedEndTime = new Date(manualStartTime.getTime() + plannedDurationMs);
          shouldComplete = calculatedEndTime <= currentTime;
          reason = `Using time slot duration: ${plannedDurationMs / (1000 * 60)} minutes`;
          
          console.log(`✅ Time slot found - planned duration: ${plannedDurationMs / (1000 * 60)} minutes`);
        } else {
          console.log(`❌ Time slot ${session.timeSlotId} not found`);
        }
      }

      // If no time slot found, use default duration logic
      if (!shouldComplete && !reason) {
        // Use default session duration based on session type
        let defaultDurationMinutes = 60; // Default 60 minutes
        
        if (session.sessionType === 'YOGA') {
          defaultDurationMinutes = 60; // 1 hour for yoga
        } else if (session.sessionType === 'MEDITATION') {
          defaultDurationMinutes = 30; // 30 minutes for meditation
        } else if (session.sessionType === 'DIET') {
          defaultDurationMinutes = 45; // 45 minutes for diet consultation
        }

        const defaultDurationMs = defaultDurationMinutes * 60 * 1000;
        calculatedEndTime = new Date(manualStartTime.getTime() + defaultDurationMs);
        shouldComplete = calculatedEndTime <= currentTime;
        reason = `Using default duration for ${session.sessionType}: ${defaultDurationMinutes} minutes`;
        
        console.log(`🔧 Using default duration: ${defaultDurationMinutes} minutes for ${session.sessionType}`);
      }

      console.log(`🚀 Manual start time: ${manualStartTime.toISOString()}`);
      console.log(`🏁 Calculated end time: ${calculatedEndTime!.toISOString()}`);
      console.log(`⏰ Current time: ${currentTime.toISOString()}`);
      console.log(`📝 Reason: ${reason}`);

      if (shouldComplete) {
        const minutesOverdue = Math.round((currentTime.getTime() - calculatedEndTime!.getTime()) / (1000 * 60));
        console.log(`✅ Session SHOULD be completed (${minutesOverdue} minutes overdue)`);
        
        // Complete the session
        await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session._id },
            u: { 
              $set: { 
                status: 'COMPLETED',
                actualEndTime: currentTime,
                completionReason: reason,
                updatedAt: currentTime
              } 
            }
          }]
        });
        
        console.log('✅ Session completed successfully!');
      } else {
        const minutesRemaining = Math.round((calculatedEndTime!.getTime() - currentTime.getTime()) / (1000 * 60));
        console.log(`⏳ Session should continue (${minutesRemaining} minutes remaining)`);
      }
    }

  } catch (error) {
    console.error('❌ Error fixing delayed sessions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixDelayedSessionsWithMissingTimeSlots()
    .then(() => {
      console.log('\n✅ Delayed sessions fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Delayed sessions fix failed:', error);
      process.exit(1);
    });
}

export { fixDelayedSessionsWithMissingTimeSlots };
