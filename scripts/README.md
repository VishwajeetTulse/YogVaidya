# Database Cleanup Scripts

This directory contains maintenance scripts for the YogaVaidya database.

## Prerequisites

Before running any script, ensure:
1. Your `.env.local` file contains the `DATABASE_URL` variable
2. The database is accessible and running
3. You have the necessary permissions to modify data

## Scripts Available

### 1. Cleanup Expired Trials (`cleanup-expired-trials.js/ts`)

This script cleans up users whose trial periods have expired but still have subscription details in their user records.

#### What it does:
- Finds users with expired trials (trialEndDate < current date)
- Clears all subscription-related fields for these users
- Sets them to appear as users with no subscription
- Updates their status to INACTIVE

#### Fields that get cleared:
- `subscriptionPlan` → `null`
- `subscriptionStartDate` → `null`
- `subscriptionEndDate` → `null`

### 2. Clear Tickets (`clear-all-tickets.js/ts`)

Simple scripts to clear all tickets from the database.

#### What it does:
- Counts existing tickets
- Deletes all tickets using Prisma
- Verifies deletion was successful
- Provides detailed logging

#### Usage:
```bash
# JavaScript version
node scripts/clear-all-tickets.js

# TypeScript version (if ts-node is available)
npx ts-node scripts/clear-all-tickets.ts
```

### 3. Advanced Ticket Cleanup (`clear-tickets-advanced.js`)

Advanced ticket cleanup script with filtering and preview options.

### 4. Fix Date Inconsistencies (`fix-date-inconsistencies.js/ts`)

This script fixes inconsistent date field types in the database where some dates are stored as strings instead of proper DateTime objects, which causes Prisma type conversion errors.

#### What it does:
- Audits all collections for date field inconsistencies
- Converts string dates to proper DateTime objects
- Handles null values gracefully
- Provides detailed progress reporting
- Runs a final audit to verify fixes

#### Collections and fields fixed:
- **Schedule**: `scheduledTime`, `createdAt`, `updatedAt`
- **SessionBooking**: `scheduledAt`, `createdAt`, `updatedAt`, `manualStartTime`, `actualEndTime`
- **MentorTimeSlot**: `startTime`, `endTime`, `createdAt`, `updatedAt`
- **User**: `createdAt`, `updatedAt`, `subscriptionStartDate`, `subscriptionEndDate`, `lastPaymentDate`, `nextBillingDate`, `trialEndDate`

#### Usage:
```bash
# JavaScript version (recommended)
node scripts/fix-date-inconsistencies.js

# TypeScript version
npx ts-node scripts/fix-date-inconsistencies.ts
```

#### Safety features:
- Pre-fix audit to show what will be changed
- Error handling for invalid date strings
- Post-fix audit to verify results
- Non-destructive conversion (preserves null values)

#### Features:
- Filter by ticket status (OPEN, RESOLVED, CLOSED, etc.)
- Clear tickets older than X days
- Clear only unassigned tickets
- Dry run mode to preview changes
- Detailed logging and confirmation

#### Usage:
```bash
# Clear all tickets
node scripts/clear-tickets-advanced.js all

# Clear only resolved tickets
node scripts/clear-tickets-advanced.js resolved

# Clear only closed tickets
node scripts/clear-tickets-advanced.js closed

# Clear tickets older than 30 days (default)
node scripts/clear-tickets-advanced.js old

# Clear tickets older than 7 days
node scripts/clear-tickets-advanced.js old 7

# Clear unassigned tickets only
node scripts/clear-tickets-advanced.js unassigned

# Preview what would be deleted (dry run)
node scripts/clear-tickets-advanced.js preview
node scripts/clear-tickets-advanced.js preview RESOLVED
```

#### Common Use Cases:
- **Development**: Clear test tickets with `node scripts/clear-all-tickets.js`
- **Maintenance**: Archive old resolved tickets with `node scripts/clear-tickets-advanced.js resolved`
- **Storage Cleanup**: Remove old tickets with `node scripts/clear-tickets-advanced.js old 90`
- **Preview Changes**: Always run with `preview` first to see what will be deleted
- `nextBillingDate` → `null`
- `billingPeriod` → `null`
- `razorpaySubscriptionId` → `null`
- `razorpayCustomerId` → `null`
- `lastPaymentDate` → `null`
- `paymentAmount` → `null`
- `autoRenewal` → `null`
- `isTrialActive` → `false`
- `subscriptionStatus` → `'INACTIVE'`
- `trialEndDate` → `null`

## Usage

### Run the cleanup script

```bash
# Using Node.js (production)
npm run cleanup-trials

# Using TypeScript (development)
npm run cleanup-trials:ts

# Dry run (development mode - shows what would be changed)
npm run cleanup-trials:dry-run
```

### Safety Features

1. **Production Confirmation**: In production environment, the script asks for confirmation before making changes
2. **Batch Processing**: Updates users in batches of 10 to avoid overwhelming the database
3. **Error Handling**: Continues processing even if some updates fail
4. **Verification**: Automatically verifies the cleanup was successful
5. **Detailed Logging**: Shows exactly which users are being updated and the results

### Example Output

```
🧹 Starting cleanup of expired trial users...
📊 Found 5 users with expired trials to clean up

👥 Users to be updated:
1. user1@example.com (John Doe) - Trial ended: 1/5/2025
   Current plan: FLOURISH, Status: INACTIVE
2. user2@example.com (Jane Smith) - Trial ended: 1/3/2025
   Current plan: FLOURISH, Status: INACTIVE

🔄 Processing batch 1/1
✅ Updated: user1@example.com
✅ Updated: user2@example.com

📈 Cleanup Summary:
✅ Successfully updated: 5 users
❌ Errors: 0 users
📊 Total processed: 5 users

🎉 All expired trial users have been successfully cleaned up!

🔍 Verifying cleanup...
✅ Verification passed: No remaining issues found
```

## When to Run

- After deploying the updated trial expiration logic
- Periodically to clean up any users whose trials expired before the automatic cleanup was implemented
- If you notice users with expired trials still showing subscription details in the UI

## Important Notes

⚠️ **Backup First**: Always backup your database before running cleanup scripts in production

⚠️ **Test in Development**: Run the script in development first to understand what it will do

⚠️ **Review Users**: The script shows which users will be affected before making changes

## Troubleshooting

If the script fails:
1. Check database connectivity
2. Ensure the user running the script has appropriate database permissions
3. Review error messages for specific issues
4. Run in development mode first to test

### 6. Delete Session Bookings (`delete-session-bookings.ts`)

Flexible script to delete data from the sessionBooking collection with multiple deletion modes.

#### What it does:
- Provides multiple deletion modes (all, by status, by payment status, by age, by user, by mentor)
- Shows sample records before deletion
- Supports dry-run mode to preview changes
- Verifies deletion success
- Provides detailed logging throughout the process

#### Deletion Modes:
- `all` - Delete all session booking records
- `status <status>` - Delete bookings with specific status (SCHEDULED, ONGOING, COMPLETED, CANCELLED)
- `paymentStatus <status>` - Delete bookings with specific payment status (PENDING, COMPLETED, FAILED)
- `olderThan <days>` - Delete bookings older than specified number of days
- `user <userId>` - Delete bookings for a specific user
- `mentor <mentorId>` - Delete bookings for a specific mentor

#### Usage:
```bash
# Delete all session bookings
npm run delete-session-bookings all

# Delete only cancelled bookings
npm run delete-session-bookings status CANCELLED

# Delete bookings with failed payments
npm run delete-session-bookings paymentStatus FAILED

# Delete bookings older than 30 days
npm run delete-session-bookings olderThan 30

# Delete bookings for a specific user
npm run delete-session-bookings user user123

# Preview what would be deleted (dry run)
npm run delete-session-bookings all --dry-run
```

#### Safety Features:
- Environment check (warns if DATABASE_URL not set)
- Production environment detection with warnings
- Sample record preview before deletion
- Dry-run mode to preview changes without deleting
- Final count verification after deletion
- Detailed error handling and logging

#### Example Output:
```
🗑️  SessionBooking Data Deletion Script
==================================================
⚠️  WARNING: This will permanently delete session bookings with status: CANCELLED
==================================================

📊 Checking matching records...
📅 Found 15 matching session booking records

📋 Sample records that will be affected:
   1. YOGA Session
      User ID: user123
      Mentor ID: mentor456
      Status: CANCELLED
      Payment Status: COMPLETED
      Scheduled: 2025-01-15T10:00:00.000Z
      Created: 2025-01-10T08:30:00.000Z
      ID: 507f1f77bcf86cd799439011

🗑️  Deleting matching session booking records...
✅ Successfully deleted 15 session booking records
📊 Final count verification: 0 matching records remaining
✅ All matching records successfully deleted!
```

#### When to Use:
- Development/testing environment cleanup
- Removing test or invalid bookings
- Cleaning up old cancelled bookings
- Removing bookings for deactivated users
- Emergency data cleanup (with proper backups)
- Selective data removal based on criteria

⚠️ **Critical Warning**: This permanently deletes session booking data including payment information, user bookings, and session history. Always backup first and use dry-run mode to preview changes!

## Future Maintenance

With the updated trial expiration logic in place, this cleanup should happen automatically when trials expire. This script is mainly for:
- Historical data cleanup
- One-time fixes
- Emergency cleanup if the automatic process fails
