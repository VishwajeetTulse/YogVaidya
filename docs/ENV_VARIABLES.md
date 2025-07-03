# Environment Variables Documentation

## Cron Job Configuration

### Required Variables
- `CRON_SECRET`: Secret key for authenticating cron job requests
  - Must be a secure, randomly generated string
  - Keep this secret and never expose it in client-side code
  - Example: `crn_2025_hx8K9pL5mN3qR7vT4wY2jA6bD9gF`

### Optional Variables
- `CRON_MONITORING_ENABLED`: Enable/disable detailed monitoring
  - Values: `true` or `false`
  - Default: `false`

- `CRON_ALERT_EMAIL`: Email address for cron job alerts
  - Used for notifications about job failures or issues
  - Should be a valid email address

- `CRON_MAX_RETRY_ATTEMPTS`: Maximum number of retry attempts for failed updates
  - Default: `3`
  - Recommended range: 1-5

- `CRON_TIMEZONE`: Timezone for cron job scheduling
  - Default: `UTC`
  - Use standard timezone format (e.g., `Asia/Kolkata`)

## Generating Secure CRON_SECRET

To generate a secure CRON_SECRET, you can use one of these methods:

```bash
# Using OpenSSL (recommended)
openssl rand -base64 32

# Using Node.js
node -e "console.log('crn_' + require('crypto').randomBytes(32).toString('hex'))"
```

## Security Best Practices

1. Never commit the actual values to version control
2. Rotate CRON_SECRET periodically
3. Use different secrets for development and production
4. Monitor failed authentication attempts
5. Keep the secret length at least 32 characters

## Monitoring Configuration

The monitoring system will use these variables to:
1. Send alerts when jobs fail
2. Track retry attempts
3. Log execution times and results
4. Manage timezone-specific executions

## Update Procedure

When updating these variables:
1. Generate new secrets
2. Update the deployment platform's environment variables
3. Update the cron job configuration
4. Test the new configuration
5. Monitor for any issues

Last Updated: July 3, 2025
