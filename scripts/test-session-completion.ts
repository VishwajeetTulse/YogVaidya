#!/usr/bin/env tsx

/**
 * Test script to verify automatic session completion functionality
 */

import { config } from 'dotenv';
import { updateSessionStatuses } from '../src/lib/services/session-status-service';

// Load environment variables
config({ path: '.env.local' });

async function testSessionCompletion() {
  try {
    console.log('🧪 Testing automatic session completion...');

    const updates = await updateSessionStatuses();

    console.log(`✅ Session completion test completed:`);
    console.log(`   - Total updates: ${updates.length}`);
    console.log(`   - Sessions completed: ${updates.filter(u => u.newStatus === 'COMPLETED').length}`);
    console.log(`   - Sessions started: ${updates.filter(u => u.newStatus === 'ONGOING').length}`);

    if (updates.length > 0) {
      console.log('\n📋 Update details:');
      updates.forEach(update => {
        console.log(`   - ${update.sessionId}: ${update.oldStatus} → ${update.newStatus}`);
        console.log(`     Reason: ${update.reason}`);
      });
    } else {
      console.log('ℹ️  No sessions needed updating at this time');
    }

  } catch (error) {
    console.error('❌ Error testing session completion:', error);
  }
}

// Run the test
testSessionCompletion();