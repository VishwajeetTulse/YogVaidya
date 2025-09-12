#!/usr/bin/env tsx

/**
 * Fix existing delayed sessions by adding manualStartTime field
 * This script updates delayed sessions that don't have manualStartTime set
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function fixDelayedSessions() {
  try {
    console.log('🔧 Starting delayed sessions fix...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
    }

    console.log('📡 Database connection configured successfully');

    // Find all delayed sessions without manualStartTime
    const delayedSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        status: 'ONGOING',
        isDelayed: true,
        manualStartTime: { $exists: false }
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

    console.log(`📅 Found ${delayedSessions.length} delayed sessions without manualStartTime`);

    if (delayedSessions.length === 0) {
      console.log('✅ No delayed sessions need fixing');
      return;
    }

    // Update each delayed session with manualStartTime based on updatedAt
    for (const session of delayedSessions) {
      const manualStartTime = session.updatedAt || new Date();
      
      await prisma.$runCommandRaw({
        update: 'sessionBooking',
        updates: [{
          q: { _id: session._id },
          u: { 
            $set: { 
              manualStartTime: manualStartTime
            } 
          }
        }]
      });

      console.log(`✅ Updated session ${session._id} with manualStartTime: ${manualStartTime}`);
    }

    console.log(`🎉 Successfully fixed ${delayedSessions.length} delayed sessions`);

  } catch (error) {
    console.error('❌ Error fixing delayed sessions:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  fixDelayedSessions()
    .then(() => {
      console.log('✅ Delayed sessions fix completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Delayed sessions fix failed:', error);
      process.exit(1);
    });
}

export { fixDelayedSessions };
