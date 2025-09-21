/**
 * TypeScript Script to delete data from the sessionBooking collection
 *
 * This script provides multiple options for deleting session booking data:
 * 1. Delete all records (complete truncation)
 * 2. Delete records by status (e.g., only cancelled bookings)
 * 3. Delete records by payment status (e.g., only failed payments)
 * 4. Delete records older than a specified date
 * 5. Delete records for specific users or mentors
 *
 * WARNING: This operation is irreversible! Deleted data cannot be recovered.
 */

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables from .env.local
config({ path: '.env.local' });

const prisma = new PrismaClient();

interface SessionBookingSummary {
  _id: string;
  userId: string;
  mentorId: string;
  sessionType: string;
  status: string;
  paymentStatus: string;
  scheduledAt?: Date;
  createdAt?: Date;
}

interface DeletionOptions {
  mode: 'all' | 'status' | 'paymentStatus' | 'olderThan' | 'user' | 'mentor';
  status?: string;
  paymentStatus?: string;
  olderThanDays?: number;
  userId?: string;
  mentorId?: string;
  dryRun?: boolean;
}

async function deleteSessionBookingData(options: DeletionOptions): Promise<void> {
  try {
    console.log("🗑️  SessionBooking Data Deletion Script");
    console.log("=" + "=".repeat(50));

    let query: any = {};
    let description = "";

    // Build query based on mode
    switch (options.mode) {
      case 'all':
        query = {};
        description = "ALL session booking records";
        break;

      case 'status':
        if (!options.status) {
          throw new Error("Status must be specified for status mode");
        }
        query.status = options.status;
        description = `session bookings with status: ${options.status}`;
        break;

      case 'paymentStatus':
        if (!options.paymentStatus) {
          throw new Error("Payment status must be specified for paymentStatus mode");
        }
        query.paymentStatus = options.paymentStatus;
        description = `session bookings with payment status: ${options.paymentStatus}`;
        break;

      case 'olderThan':
        if (!options.olderThanDays) {
          throw new Error("Number of days must be specified for olderThan mode");
        }
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - options.olderThanDays);
        query.createdAt = { $lt: cutoffDate };
        description = `session bookings older than ${options.olderThanDays} days (${cutoffDate.toISOString().split('T')[0]})`;
        break;

      case 'user':
        if (!options.userId) {
          throw new Error("User ID must be specified for user mode");
        }
        query.userId = options.userId;
        description = `session bookings for user: ${options.userId}`;
        break;

      case 'mentor':
        if (!options.mentorId) {
          throw new Error("Mentor ID must be specified for mentor mode");
        }
        query.mentorId = options.mentorId;
        description = `session bookings for mentor: ${options.mentorId}`;
        break;

      default:
        throw new Error(`Unknown mode: ${options.mode}`);
    }

    if (options.dryRun) {
      console.log("🔍 DRY RUN MODE - No data will be deleted");
      console.log(`📋 Query: ${JSON.stringify(query, null, 2)}`);
    } else {
      console.log("⚠️  WARNING: This will permanently delete the following data:");
    }
    console.log(`   ${description}`);
    console.log("=" + "=".repeat(50));

    // Count matching records
    console.log("\n📊 Checking matching records...");
    const countResult = await prisma.$runCommandRaw({
      count: 'sessionBooking',
      query: query
    });

    const matchingCount = (countResult as any).n || 0;
    console.log(`📅 Found ${matchingCount} matching session booking records`);

    if (matchingCount === 0) {
      console.log("✅ No matching records found. Nothing to delete.");
      return;
    }

    // Show sample records before deletion (first 3)
    console.log("\n📋 Sample records that will be affected:");
    const sampleResult = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        { $match: query },
        {
          $project: {
            _id: 1,
            userId: 1,
            mentorId: 1,
            sessionType: 1,
            status: 1,
            paymentStatus: 1,
            scheduledAt: 1,
            createdAt: 1
          }
        },
        { $limit: 3 }
      ],
      cursor: {}
    });

    let sampleRecords: SessionBookingSummary[] = [];
    if (sampleResult &&
        typeof sampleResult === 'object' &&
        'cursor' in sampleResult &&
        sampleResult.cursor &&
        typeof sampleResult.cursor === 'object' &&
        'firstBatch' in sampleResult.cursor &&
        Array.isArray(sampleResult.cursor.firstBatch)) {
      sampleRecords = sampleResult.cursor.firstBatch as unknown as SessionBookingSummary[];
    }

    sampleRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.sessionType} Session`);
      console.log(`      User ID: ${record.userId}`);
      console.log(`      Mentor ID: ${record.mentorId}`);
      console.log(`      Status: ${record.status}`);
      console.log(`      Payment Status: ${record.paymentStatus}`);
      console.log(`      Scheduled: ${record.scheduledAt ? new Date(record.scheduledAt).toISOString() : 'Not set'}`);
      console.log(`      Created: ${record.createdAt ? new Date(record.createdAt).toISOString() : 'Unknown'}`);
      console.log(`      ID: ${record._id}`);
      console.log();
    });

    if (matchingCount > 3) {
      console.log(`   ... and ${matchingCount - 3} more records`);
    }

    if (options.dryRun) {
      console.log("🔍 Dry run completed. No data was deleted.");
      console.log(`💡 To actually delete these records, run without --dry-run flag`);
      return;
    }

    // Confirmation prompt simulation (in a real interactive environment, you'd use readline)
    console.log("⚠️  FINAL WARNING: Proceeding will DELETE the matching data!");
    console.log("💡 In a production environment, you should add user confirmation here.");
    console.log("\n🔄 Proceeding with deletion...");

    // Perform the deletion
    console.log("\n🗑️  Deleting matching session booking records...");
    const deleteResult = await prisma.$runCommandRaw({
      delete: 'sessionBooking',
      deletes: [
        {
          q: query,
          limit: 0 // Delete all matching documents
        }
      ]
    });

    const deletedCount = (deleteResult as any).nRemoved || 0;
    console.log(`✅ Successfully deleted ${deletedCount} session booking records`);

    // Verify the deletion
    const finalCountResult = await prisma.$runCommandRaw({
      count: 'sessionBooking',
      query: query
    });

    const remainingCount = (finalCountResult as any).n || 0;
    console.log(`📊 Final count verification: ${remainingCount} matching records remaining`);

    if (remainingCount === 0) {
      console.log("✅ All matching records successfully deleted!");
    } else {
      console.log(`⚠️  Warning: ${remainingCount} matching records still remain`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("🎯 Deletion operation completed");
    console.log("=" + "=".repeat(50));

  } catch (error: any) {
    console.error("❌ Error during deletion:", error);

    if (error.code === 'P1001') {
      console.error("💡 Database connection failed. Check your DATABASE_URL environment variable.");
    } else {
      console.error("💡 Full error details:", {
        name: error.name,
        message: error.message,
        code: error.code
      });
    }

    throw error;
  } finally {
    // Always disconnect from the database
    await prisma.$disconnect();
    console.log("🔌 Disconnected from database");
  }
}

function checkEnvironment(): void {
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

function parseCommandLineArgs(): DeletionOptions {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage: tsx delete-session-bookings.ts <mode> [options]");
    console.log("\nModes:");
    console.log("  all                    - Delete all session bookings");
    console.log("  status <status>        - Delete bookings with specific status");
    console.log("  paymentStatus <status> - Delete bookings with specific payment status");
    console.log("  olderThan <days>       - Delete bookings older than X days");
    console.log("  user <userId>          - Delete bookings for specific user");
    console.log("  mentor <mentorId>      - Delete bookings for specific mentor");
    console.log("\nOptions:");
    console.log("  --dry-run              - Preview what would be deleted without deleting");
    console.log("\nExamples:");
    console.log("  tsx delete-session-bookings.ts all");
    console.log("  tsx delete-session-bookings.ts status CANCELLED");
    console.log("  tsx delete-session-bookings.ts paymentStatus FAILED --dry-run");
    console.log("  tsx delete-session-bookings.ts olderThan 30");
    process.exit(1);
  }

  const mode = args[0] as DeletionOptions['mode'];
  const dryRun = args.includes('--dry-run');

  let options: DeletionOptions = { mode, dryRun };

  switch (mode) {
    case 'status':
      if (args.length < 2) {
        console.error("❌ Status mode requires a status value");
        process.exit(1);
      }
      options.status = args[1];
      break;

    case 'paymentStatus':
      if (args.length < 2) {
        console.error("❌ Payment status mode requires a payment status value");
        process.exit(1);
      }
      options.paymentStatus = args[1];
      break;

    case 'olderThan':
      if (args.length < 2) {
        console.error("❌ Older than mode requires a number of days");
        process.exit(1);
      }
      const days = parseInt(args[1]);
      if (isNaN(days) || days <= 0) {
        console.error("❌ Days must be a positive number");
        process.exit(1);
      }
      options.olderThanDays = days;
      break;

    case 'user':
      if (args.length < 2) {
        console.error("❌ User mode requires a user ID");
        process.exit(1);
      }
      options.userId = args[1];
      break;

    case 'mentor':
      if (args.length < 2) {
        console.error("❌ Mentor mode requires a mentor ID");
        process.exit(1);
      }
      options.mentorId = args[1];
      break;

    case 'all':
      // No additional parameters needed
      break;

    default:
      console.error(`❌ Unknown mode: ${mode}`);
      process.exit(1);
  }

  return options;
}

// Main execution function
async function main(): Promise<void> {
  console.log("🚀 Starting SessionBooking Data Deletion Script\n");

  try {
    checkEnvironment();
    const options = parseCommandLineArgs();
    await deleteSessionBookingData(options);
    console.log("✅ Script completed successfully");
  } catch (error: any) {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch((error) => {
    console.error("❌ Unhandled error:", error);
    process.exit(1);
  });
}

export {
  deleteSessionBookingData,
  checkEnvironment,
  parseCommandLineArgs,
  main
};