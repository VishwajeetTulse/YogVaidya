#!/usr/bin/env tsx

/**
 * Check session status overview to understand current system state
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

async function checkSessionStatus() {
  try {
    console.log('🔍 Checking session status overview...');

    // Check if DATABASE_URL is available
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set. Please check your .env.local file.');
    }

    console.log('📡 Database connection configured successfully');

    // Get all session bookings
    const allSessionsResult = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {}
    });

    let allSessions: any[] = [];
    if (allSessionsResult && 
        typeof allSessionsResult === 'object' && 
        'cursor' in allSessionsResult &&
        allSessionsResult.cursor &&
        typeof allSessionsResult.cursor === 'object' &&
        'firstBatch' in allSessionsResult.cursor &&
        Array.isArray(allSessionsResult.cursor.firstBatch)) {
      allSessions = allSessionsResult.cursor.firstBatch;
    }

    console.log(`📊 Total sessions found: ${allSessions.length}`);

    // Group by status
    const statusGroups: { [key: string]: any[] } = {};
    allSessions.forEach(session => {
      const status = session.status || 'UNKNOWN';
      if (!statusGroups[status]) {
        statusGroups[status] = [];
      }
      statusGroups[status].push(session);
    });

    console.log('\n📈 Sessions by status:');
    Object.entries(statusGroups).forEach(([status, sessions]) => {
      console.log(`  ${status}: ${sessions.length} sessions`);
      
      if (status === 'ONGOING') {
        console.log('    📋 ONGOING sessions details:');
        sessions.forEach(session => {
          console.log(`      - ID: ${session._id}`);
          console.log(`        isDelayed: ${session.isDelayed || false}`);
          console.log(`        manualStartTime: ${session.manualStartTime || 'Not set'}`);
          console.log(`        scheduledAt: ${session.scheduledAt || 'Not set'}`);
          console.log(`        updatedAt: ${session.updatedAt || 'Not set'}`);
          console.log('        ---');
        });
      }
    });

    // Check specifically for delayed sessions
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

    console.log(`\n🔄 Delayed sessions: ${delayedSessions.length}`);
    
    if (delayedSessions.length > 0) {
      console.log('📋 Delayed sessions details:');
      delayedSessions.forEach(session => {
        console.log(`  - ID: ${session._id}`);
        console.log(`    manualStartTime: ${session.manualStartTime || 'NOT SET'}`);
        console.log(`    scheduledAt: ${session.scheduledAt}`);
        console.log(`    updatedAt: ${session.updatedAt}`);
        console.log('    ---');
      });
    }

  } catch (error) {
    console.error('❌ Error checking session status:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  checkSessionStatus()
    .then(() => {
      console.log('\n✅ Session status check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Session status check failed:', error);
      process.exit(1);
    });
}

export { checkSessionStatus };
