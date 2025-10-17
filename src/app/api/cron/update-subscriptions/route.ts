import { NextResponse } from "next/server";
import { batchUpdateSubscriptionStatuses } from "@/lib/subscriptions";
import { logSystemEvent, logError } from "@/lib/utils/logger";


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
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Log cron job start
    await logSystemEvent(
      "CRON_SUBSCRIPTION_UPDATE_STARTED",
      "Daily subscription status update initiated",
      "INFO",
      {
        startTime: new Date().toISOString(),
        trigger: "cron_job",
      }
    );

    const startTime = Date.now();

    // Run the batch update
    const result = await batchUpdateSubscriptionStatuses();

    const duration = Date.now() - startTime;

    if (!result.success) {
      console.error("Cron job failed:", result.error);

      // Log cron job failure
      await logError(
        "CRON_SUBSCRIPTION_UPDATE_FAILED",
        "SYSTEM",
        "Subscription update cron job failed",
        undefined,
        {
          error: result.error,
          duration,
          errorDetail: result.errorDetail,
        }
      );

      return NextResponse.json(
        { error: "Failed to update subscription statuses" },
        { status: 500 }
      );
    }

    // Log successful cron job completion
    await logSystemEvent(
      "CRON_SUBSCRIPTION_UPDATE_COMPLETED",
      `Processed ${result.totalProcessed || 0} subscriptions`,
      "INFO",
      {
        totalProcessed: result.totalProcessed || 0,
        succeeded: result.summary?.succeeded || 0,
        failed: result.summary?.failed || 0,
        duration,
        completionTime: new Date().toISOString(),
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in subscription update cron:", error);

    // Log unexpected cron job error
    await logError(
      "CRON_SUBSCRIPTION_UPDATE_ERROR",
      "SYSTEM",
      "Unexpected error in subscription update cron job",
      undefined,
      {
        error: (error as Error).message,
        stack: (error as Error).stack,
      },
      error as Error
    );

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
