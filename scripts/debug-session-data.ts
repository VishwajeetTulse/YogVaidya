#!/usr/bin/env tsx

/**
 * Debug session and time slot data to understand the relationship
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function debugSessionData() {
  try {
    console.log('🔍 Debugging session and time slot data...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
    }

    // Get the delayed session with full details
    const delayedSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        isDelayed: true
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

    console.log(`🔄 Found ${delayedSessions.length} delayed sessions`);

    for (const session of delayedSessions) {
      console.log(`\n📋 Session details:`);
      console.log(JSON.stringify(session, null, 2));
      
      if (session.timeSlotId) {
        console.log(`\n🔍 Looking for time slot with ID: ${session.timeSlotId}`);
        
        // Try to find the time slot
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
            Array.isArray(timeSlotResult.cursor.firstBatch)) {
          timeSlot = timeSlotResult.cursor.firstBatch;
        }

        if (timeSlot && timeSlot.length > 0) {
          console.log(`✅ Time slot found:`);
          console.log(JSON.stringify(timeSlot[0], null, 2));
        } else {
          console.log(`❌ Time slot not found`);
          
          // Let's check what time slots exist
          console.log(`\n🔍 Checking all time slots in mentorTimeSlot collection:`);
          const allTimeSlotsResult = await prisma.$runCommandRaw({
            find: 'mentorTimeSlot',
            filter: {}
          });

          let allTimeSlots: any[] = [];
          if (allTimeSlotsResult && 
              typeof allTimeSlotsResult === 'object' && 
              'cursor' in allTimeSlotsResult &&
              allTimeSlotsResult.cursor &&
              typeof allTimeSlotsResult.cursor === 'object' &&
              'firstBatch' in allTimeSlotsResult.cursor &&
              Array.isArray(allTimeSlotsResult.cursor.firstBatch)) {
            allTimeSlots = allTimeSlotsResult.cursor.firstBatch;
          }

          console.log(`📊 Total time slots in mentorTimeSlot: ${allTimeSlots.length}`);
          
          if (allTimeSlots.length > 0) {
            console.log(`📋 Sample time slot IDs:`);
            allTimeSlots.slice(0, 3).forEach((slot, index) => {
              console.log(`  ${index + 1}. ${slot._id}`);
            });
          }
        }
      } else {
        console.log(`❌ Session has no timeSlotId`);
      }
    }

    // Also check if there are any time slots in different collections
    console.log(`\n🔍 Checking TimeSlot collection (different casing):`);
    try {
      const timeSlotAltResult = await prisma.$runCommandRaw({
        find: 'TimeSlot',
        filter: {}
      });

      let timeSlotAlt: any[] = [];
      if (timeSlotAltResult && 
          typeof timeSlotAltResult === 'object' && 
          'cursor' in timeSlotAltResult &&
          timeSlotAltResult.cursor &&
          typeof timeSlotAltResult.cursor === 'object' &&
          'firstBatch' in timeSlotAltResult.cursor &&
          Array.isArray(timeSlotAltResult.cursor.firstBatch)) {
        timeSlotAlt = timeSlotAltResult.cursor.firstBatch;
      }

      console.log(`📊 Time slots in TimeSlot collection: ${timeSlotAlt.length}`);
      if (timeSlotAlt.length > 0) {
        console.log(`📋 Sample TimeSlot IDs:`);
        timeSlotAlt.slice(0, 3).forEach((slot, index) => {
          console.log(`  ${index + 1}. ${slot._id}`);
        });
      }
    } catch (error) {
      console.log(`❌ TimeSlot collection not found or error: ${error}`);
    }

  } catch (error) {
    console.error('❌ Error debugging session data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  debugSessionData()
    .then(() => {
      console.log('\n✅ Session data debugging completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Session data debugging failed:', error);
      process.exit(1);
    });
}

export { debugSessionData };
