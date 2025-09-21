/**
 * Daily Recurring Slots Maintenance Script
 * This script should be run daily as a cron job to maintain the 7-day rolling window
 * 
 * Usage: npx ts-node scripts/daily-recurring-maintenance.ts
 * 
 * What it does:
 * 1. Removes old recurring slots (older than today)
 * 2. Generates new recurring slots to maintain 7-day window
 * 3. Logs the maintenance activity
 */

import { maintainRecurringSlots } from '../src/lib/recurring-slots-generator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function runDailyMaintenance(): Promise<void> {
  console.log(`🕐 Starting daily recurring slots maintenance at ${new Date().toISOString()}`);
  console.log('='.repeat(60));
  
  try {
    const result = await maintainRecurringSlots();
    
    if (result.success) {
      console.log('✅ Daily maintenance completed successfully!');
      console.log(`🗑️  Cleaned up ${result.slotsDeleted} expired slots`);
      console.log(`➕ Generated ${result.slotsGenerated} new slots`);
      console.log(`📊 Total operations: ${result.slotsDeleted + result.slotsGenerated}`);
    } else {
      console.error('❌ Daily maintenance failed:', result.error);
      process.exit(1);
    }
  } catch (error) {
    console.error('💥 Fatal error during maintenance:', error);
    process.exit(1);
  }
  
  console.log('='.repeat(60));
  console.log(`🕐 Maintenance completed at ${new Date().toISOString()}`);
}

// Run the maintenance if this script is executed directly
if (require.main === module) {
  runDailyMaintenance()
    .then(() => {
      console.log('🎉 Daily maintenance process finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💀 Daily maintenance process crashed:', error);
      process.exit(1);
    });
}

export { runDailyMaintenance };