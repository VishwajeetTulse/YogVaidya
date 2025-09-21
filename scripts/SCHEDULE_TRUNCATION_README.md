# Schedule Truncation Scripts

This directory contains scripts to truncate (delete all data) from the Schedule collection in the MongoDB database.

## ⚠️ **IMPORTANT WARNING**

**These scripts will permanently delete ALL data from the Schedule collection. This operation is irreversible!**

Always:
- Create backups before running in production
- Test with `--dry-run` first
- Verify the environment you're working in
- Have a recovery plan ready

## Available Scripts

### 1. Basic Truncation Script (`truncate-schedule.js`)

Simple script that deletes all schedule records with basic safety checks.

```bash
npm run truncate-schedule
# or
node scripts/truncate-schedule.js
```

### 2. TypeScript Version (`truncate-schedule.ts`)

Type-safe version with better error handling.

```bash
npm run truncate-schedule-ts
# or
tsx scripts/truncate-schedule.ts
```

### 3. Advanced Script with Features (`truncate-schedule-advanced.js`)

Full-featured script with backup, dry-run, and safety features.

```bash
# Basic run
npm run truncate-schedule-advanced

# Dry run (see what would be deleted without deleting)
npm run truncate-schedule-dry-run

# Force mode (skip confirmations)
npm run truncate-schedule-force

# Custom options
node scripts/truncate-schedule-advanced.js --dry-run --no-backup
```

## Command Line Options (Advanced Script)

| Option | Description |
|--------|-------------|
| `--dry-run` | Show what would be deleted without actually deleting |
| `--force` | Skip confirmation prompts |
| `--no-backup` | Skip creating backup file |
| `--help` | Show usage information |

## Features

### Basic Scripts
- ✅ Database connection validation
- ✅ Environment checks
- ✅ Record count verification
- ✅ Error handling with meaningful messages
- ✅ Safe database disconnection

### Advanced Script
- ✅ **Backup Creation**: Automatic JSON backup before deletion
- ✅ **Dry Run Mode**: Test what would be deleted
- ✅ **Interactive Confirmation**: Safety prompts (can be bypassed with --force)
- ✅ **Detailed Statistics**: Shows counts by status, type, and mentor
- ✅ **Environment Detection**: Warns when running in production
- ✅ **Comprehensive Logging**: Detailed progress and error reporting

## Usage Examples

### Safe Testing
```bash
# First, see what would be deleted
npm run truncate-schedule-dry-run

# Create backup and delete with confirmation
npm run truncate-schedule-advanced

# Skip prompts but create backup
node scripts/truncate-schedule-advanced.js --force
```

### Production Use
```bash
# Always test first in production
node scripts/truncate-schedule-advanced.js --dry-run

# Production run with backup
node scripts/truncate-schedule-advanced.js --force
```

## Environment Requirements

### Required
- Node.js
- DATABASE_URL environment variable set
- Prisma client configured

### Optional
- TypeScript/tsx for TypeScript version
- Write permissions for backup directory

## Output Examples

### Dry Run Output
```
🚀 Advanced Schedule Truncation Script
==================================================
🔍 DRY RUN MODE ENABLED - No changes will be made

🔍 Environment Check:
   NODE_ENV: development
   DATABASE_URL: set
   Dry Run: YES
   Create Backup: YES
   Force Mode: NO

📊 Analyzing Schedule collection...

📈 Schedule Collection Statistics:
   Total Records: 15
   By Status:
     SCHEDULED: 8
     COMPLETED: 5
     CANCELLED: 2
   By Session Type:
     YOGA: 6
     MEDITATION: 5
     DIET: 4
   Unique Mentors: 3

💾 Creating backup before truncation...
✅ Backup created: ./backups/schedule-backup-2025-09-20T10-30-45-123Z.json
📊 Backed up 15 schedule records

🔍 DRY RUN MODE - No data will actually be deleted
✅ Dry run completed - would have deleted all schedule records

==================================================
🎯 Operation completed successfully
💾 Backup saved to: ./backups/schedule-backup-2025-09-20T10-30-45-123Z.json
==================================================
```

### Actual Truncation Output
```
🚀 Advanced Schedule Truncation Script
==================================================

[... same as above until ...]

🗑️  Executing truncation...
✅ Successfully deleted 15 schedule records
📊 Verification: 0 records remaining
✅ Schedule collection successfully truncated!

==================================================
🎯 Operation completed successfully
💾 Backup saved to: ./backups/schedule-backup-2025-09-20T10-30-45-123Z.json
==================================================
```

## Backup Files

Backups are created in JSON format with this structure:

```json
{
  "metadata": {
    "timestamp": "2025-09-20T10:30:45.123Z",
    "totalRecords": 15,
    "backupReason": "schedule-truncation",
    "databaseUrl": "set"
  },
  "data": [
    {
      "id": "schedule-id-1",
      "title": "Morning Yoga Session",
      "scheduledTime": "2025-09-21T06:00:00.000Z",
      "sessionType": "YOGA",
      "status": "SCHEDULED",
      "mentor": {
        "id": "mentor-id-1",
        "name": "John Yoga",
        "email": "john@example.com",
        "mentorType": "YOGAMENTOR"
      }
    }
  ]
}
```

## Error Handling

The scripts handle common errors:

- **P1001**: Database connection failed
- **P2025**: No records found to delete
- Missing DATABASE_URL
- Backup creation failures
- File system permissions

## Safety Features

1. **Environment Detection**: Warns when running in production
2. **Backup Creation**: Automatic backup before deletion
3. **Dry Run Mode**: Test without making changes
4. **Confirmation Prompts**: Interactive safety checks
5. **Verification**: Counts records before and after
6. **Error Recovery**: Detailed error messages and codes

## Best Practices

1. **Always test first**: Use `--dry-run` to see what will be deleted
2. **Create backups**: Don't use `--no-backup` unless absolutely sure
3. **Review the output**: Check the statistics before confirming
4. **Test in staging**: Run in a staging environment first
5. **Have a rollback plan**: Know how to restore from backup if needed

## Troubleshooting

### "DATABASE_URL not set"
- Ensure your `.env` file has the DATABASE_URL variable
- Check that you're in the correct directory

### "No records found"
- The Schedule collection is already empty
- This is normal if you've already truncated

### "Backup creation failed"
- Check write permissions in the backup directory
- Ensure sufficient disk space

### Connection errors
- Verify your MongoDB connection string
- Check if the database is accessible
- Ensure Prisma client is properly configured