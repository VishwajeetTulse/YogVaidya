/**
 * Robust Schedule Truncation Script - Handles Data Type Issues
 * 
 * This version handles database inconsistencies and data type issues gracefully
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkScheduleData() {
  try {
    console.log("🔍 Checking Schedule collection data...");
    
    // First, get basic count using raw query to avoid type issues
    const countResult = await prisma.$runCommandRaw({
      aggregate: 'schedule',
      pipeline: [
        { $count: "total" }
      ],
      cursor: {}
    });
    
    let totalCount = 0;
    if (countResult && 
        countResult.cursor && 
        countResult.cursor.firstBatch && 
        countResult.cursor.firstBatch.length > 0) {
      totalCount = countResult.cursor.firstBatch[0].total;
    }
    
    console.log(`📊 Total schedule records: ${totalCount}`);
    
    if (totalCount === 0) {
      console.log("✅ Schedule collection is already empty.");
      return { totalCount: 0, sampleData: [] };
    }
    
    // Get sample data using raw query to handle type issues
    console.log("📋 Getting sample data...");
    const sampleResult = await prisma.$runCommandRaw({
      aggregate: 'schedule',
      pipeline: [
        {
          $project: {
            _id: 1,
            id: 1,
            title: 1,
            scheduledTime: 1,
            sessionType: 1,
            status: 1,
            mentorId: 1,
            createdAt: 1,
            updatedAt: 1
          }
        },
        { $limit: 3 }
      ],
      cursor: {}
    });
    
    let sampleData = [];
    if (sampleResult && 
        sampleResult.cursor && 
        sampleResult.cursor.firstBatch) {
      sampleData = sampleResult.cursor.firstBatch;
    }
    
    console.log("📋 Sample records:");
    sampleData.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.title || 'Untitled'} - ${record.sessionType || 'Unknown'}`);
      console.log(`      Status: ${record.status || 'Unknown'}`);
      console.log(`      Scheduled: ${record.scheduledTime || 'Not set'}`);
      console.log(`      Mentor ID: ${record.mentorId || 'Unknown'}`);
      console.log(`      ID: ${record._id || record.id || 'Unknown'}`);
      console.log();
    });
    
    if (totalCount > 3) {
      console.log(`   ... and ${totalCount - 3} more records`);
    }
    
    return { totalCount, sampleData };
    
  } catch (error) {
    console.error("❌ Error checking data:", error.message);
    throw error;
  }
}

async function performTruncation(dryRun = false) {
  try {
    if (dryRun) {
      console.log("🔍 DRY RUN MODE - No data will actually be deleted");
      return { count: 0, dryRun: true };
    }
    
    console.log("🗑️  Performing truncation using raw command...");
    
    // Use raw MongoDB command to delete all documents
    const deleteResult = await prisma.$runCommandRaw({
      delete: 'schedule',
      deletes: [
        {
          q: {}, // Empty query matches all documents
          limit: 0 // 0 means delete all matching documents
        }
      ]
    });
    
    const deletedCount = deleteResult.n || 0;
    console.log(`✅ Successfully deleted ${deletedCount} schedule records`);
    
    return { count: deletedCount };
    
  } catch (error) {
    console.error("❌ Error during truncation:", error.message);
    throw error;
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  try {
    console.log("🚀 Robust Schedule Truncation Script");
    console.log("=" + "=".repeat(50));
    
    if (dryRun) {
      console.log("🔍 DRY RUN MODE ENABLED - No changes will be made");
    }
    
    // Check environment
    const dbUrl = process.env.DATABASE_URL;
    console.log("🔍 Environment Check:");
    console.log(`   DATABASE_URL: ${dbUrl ? 'set' : 'not set'}`);
    console.log(`   Dry Run: ${dryRun ? 'YES' : 'NO'}`);
    
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable is not set!");
    }
    
    // Check data
    const { totalCount, sampleData } = await checkScheduleData();
    
    if (totalCount === 0) {
      console.log("✅ Nothing to delete - collection is already empty.");
      return;
    }
    
    // Confirmation
    if (!dryRun) {
      console.log("\n⚠️  FINAL WARNING: This will permanently delete ALL schedule data!");
      console.log("💡 Add interactive confirmation here for production use");
      console.log("🔄 Proceeding with truncation in 2 seconds...");
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Perform truncation
    const result = await performTruncation(dryRun);
    
    if (!dryRun) {
      // Verify deletion
      const { totalCount: finalCount } = await checkScheduleData();
      console.log(`📊 Verification: ${finalCount} records remaining`);
      
      if (finalCount === 0) {
        console.log("✅ Schedule collection successfully truncated!");
      } else {
        console.log(`⚠️  Warning: ${finalCount} records still remain`);
      }
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("🎯 Operation completed successfully");
    console.log("=" + "=".repeat(50));
    
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Show usage
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📖 Usage: node truncate-schedule-robust.js [options]

Options:
  --dry-run    Show what would be deleted without actually deleting
  --help       Show this help message

Examples:
  node scripts/truncate-schedule-robust.js --dry-run    # Test run
  node scripts/truncate-schedule-robust.js              # Actual run
`);
  process.exit(0);
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = { checkScheduleData, performTruncation, main };