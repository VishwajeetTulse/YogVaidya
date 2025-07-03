import { NextResponse } from 'next/server';
import { batchUpdateSubscriptionStatuses } from '@/lib/subscriptions';

export const runtime = 'edge';

/**
 * Cron job endpoint to update subscription statuses
 * This endpoint should be called daily to:
 * 1. Check for expired subscriptions
 * 2. Update subscription statuses
 * 3. Sync with Razorpay status
 */
export async function GET(request: Request) {
  try {
    // Verify the request is from the cron job service
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Run the batch update
    const result = await batchUpdateSubscriptionStatuses();
    
    if (!result.success) {
      console.error('Cron job failed:', result.error);
      return NextResponse.json(
        { error: 'Failed to update subscription statuses' },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in subscription update cron:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
