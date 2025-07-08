# Database Cleanup Scripts

This directory contains maintenance scripts for the YogaVaidya database.

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

## Future Maintenance

With the updated trial expiration logic in place, this cleanup should happen automatically when trials expire. This script is mainly for:
- Historical data cleanup
- One-time fixes
- Emergency cleanup if the automatic process fails
