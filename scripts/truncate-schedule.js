/**
 * Script to truncate (delete all data) from the Schedule collection
 * 
 * This script will:
 * 1. Connect to the MongoDB database using Prisma
 * 2. Delete all records from the Schedule collection
 * 3. Display the count of deleted records
 * 4. Safely disconnect from the database
 * 
 * WARNING: This operation is irreversible! All schedule data will be permanently deleted.
 */

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function truncateScheduleCollection() {
  try {
    console.log("🗑️  Schedule Collection Truncation Script");
    console.log("=" + "=".repeat(50));
    console.log("⚠️  WARNING: This will permanently delete ALL schedule data!");
    console.log("=" + "=".repeat(50));
    
    // First, let's check how many records exist
    console.log("\n📊 Checking current data...");
    const currentCount = await prisma.schedule.count();
    console.log(`📅 Current schedule records: ${currentCount}`);
    
    if (currentCount === 0) {
      console.log("✅ Schedule collection is already empty. Nothing to delete.");
      return;
    }
    
    // Show some sample records before deletion (first 3)
    console.log("\n📋 Sample records that will be deleted:");
    const sampleRecords = await prisma.schedule.findMany({
      take: 3,
      select: {
        id: true,
        title: true,
        scheduledTime: true,
        sessionType: true,
        status: true,
        mentorId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    sampleRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.title} - ${record.sessionType}`);
      console.log(`      Scheduled: ${record.scheduledTime.toISOString()}`);
      console.log(`      Status: ${record.status}`);
      console.log(`      Mentor ID: ${record.mentorId}`);
      console.log(`      ID: ${record.id}`);
      console.log();
    });
    
    if (currentCount > 3) {
      console.log(`   ... and ${currentCount - 3} more records`);
    }
    
    // Confirmation prompt simulation (in a real interactive environment, you'd use readline)
    console.log("⚠️  FINAL WARNING: Proceeding will DELETE ALL schedule data!");
    console.log("💡 In a production environment, you should add user confirmation here.");
    console.log("\n🔄 Proceeding with truncation...");
    
    // Perform the truncation
    console.log("\n🗑️  Deleting all schedule records...");
    const deleteResult = await prisma.schedule.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deleteResult.count} schedule records`);
    
    // Verify the collection is empty
    const finalCount = await prisma.schedule.count();
    console.log(`📊 Final count verification: ${finalCount} records remaining`);
    
    if (finalCount === 0) {
      console.log("✅ Schedule collection successfully truncated!");
    } else {
      console.log(`⚠️  Warning: ${finalCount} records still remain`);
    }
    
    console.log("\n" + "=".repeat(50));
    console.log("🎯 Truncation operation completed");
    console.log("=" + "=".repeat(50));
    
  } catch (error) {
    console.error("❌ Error during truncation:", error);
    
    if (error.code === 'P1001') {
      console.error("💡 Database connection failed. Check your DATABASE_URL environment variable.");
    } else if (error.code === 'P2025') {
      console.error("💡 No records found to delete.");
    } else {
      console.error("💡 Full error details:", {
        name: error.name,
        message: error.message,
        code: error.code
      });
    }
    
    process.exit(1);
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database");
  }
}

// Add a safety check for production
function checkEnvironment() {
  const nodeEnv = process.env.NODE_ENV;
  const dbUrl = process.env.DATABASE_URL;
  
  console.log("🔍 Environment Check:");
  console.log(`   NODE_ENV: ${nodeEnv || 'not set'}`);
  console.log(`   DATABASE_URL: ${dbUrl ? 'set' : 'not set'}`);
  
  if (nodeEnv === 'production') {
    console.log("⚠️  PRODUCTION ENVIRONMENT DETECTED!");
    console.log("💡 Consider adding additional safety checks for production use.");
  }
  
  if (!dbUrl) {
    console.error("❌ DATABASE_URL environment variable is not set!");
    process.exit(1);
  }
}

// Run the script
async function main() {
  console.log("🚀 Starting Schedule Truncation Script\n");
  
  try {
    checkEnvironment();
    await truncateScheduleCollection();
    console.log("✅ Script completed successfully");
  } catch (error) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

module.exports = {
  truncateScheduleCollection,
  checkEnvironment
};