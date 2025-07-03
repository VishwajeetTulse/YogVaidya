# Subscription Status Update Cron Job Implementation

## Overview
A cron job needs to be set up to automatically update subscription statuses daily. This job will:
1. Check for expired subscriptions
2. Update subscription statuses to INACTIVE when needed
3. Sync with Razorpay subscription statuses

## Implementation Steps

### 1. Environment Variables
Add the following to your `.env` file:
```
CRON_SECRET=your-secure-random-string
```

### 2. Vercel Configuration
Add the following to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/update-subscriptions",
    "schedule": "0 0 * * *"
  }]
}
```
This schedules the job to run daily at midnight.

### 3. Alternative Platforms
If not using Vercel, you can set up the cron job using:

#### AWS Lambda with EventBridge:
```yaml
Resources:
  SubscriptionUpdateFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: route.handler
      Events:
        DailyUpdate:
          Type: Schedule
          Properties:
            Schedule: cron(0 0 * * ? *)
```

#### Google Cloud Functions:
```bash
gcloud scheduler jobs create http subscription-update \
  --schedule "0 0 * * *" \
  --uri "YOUR_FUNCTION_URL" \
  --http-method GET \
  --headers "authorization=Bearer YOUR_CRON_SECRET"
```

## Security Considerations
1. Keep the CRON_SECRET secure and rotate it periodically
2. Monitor job execution logs for failures
3. Set up alerts for job failures
4. Consider implementing retry logic for failed updates

## Monitoring
1. Set up logging to track:
   - Number of subscriptions processed
   - Success/failure rates
   - Error patterns
2. Create alerts for:
   - Job failures
   - High error rates
   - Unexpected subscription status changes

## Testing
Before deploying:
1. Test the endpoint with invalid auth tokens
2. Test with expired subscriptions
3. Test with valid Razorpay and invalid Razorpay IDs
4. Verify status updates are correct
5. Test error handling and logging

## Maintenance
1. Review logs daily for the first week
2. Monitor error rates
3. Adjust schedule if needed
4. Update security tokens periodically
5. Clean up old logs

## Contact
For any issues with the cron job implementation, contact:
- Technical Team Lead
- DevOps Team

Last Updated: July 3, 2025
