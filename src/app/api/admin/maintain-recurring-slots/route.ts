/**
 * API endpoint for manually triggering recurring slots maintenance
 * POST /api/admin/maintain-recurring-slots
 *
 * This endpoint allows administrators to manually run the maintenance
 * without waiting for the daily cron job
 */

import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { maintainRecurringSlots } from "@/lib/recurring-slots-generator";

import { AuthenticationError, AuthorizationError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

// Interface for statistics data from MongoDB
interface StatisticsData {
  totalRecurringSlots: number;
  futureSlots: number;
  pastSlots: number;
}

export async function POST(_request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized - Please log in");
    }

    // Optional: Check if user is admin/moderator for extra security
    const { prisma } = await import("@/lib/config/prisma");
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        role: { in: ["ADMIN", "MODERATOR", "MENTOR"] }, // Allow mentors to trigger for testing
      },
    });

    if (!user) {
      throw new AuthorizationError("Access denied - Admin/Moderator/Mentor role required");
    }

    // Run the maintenance function
    const result = await maintainRecurringSlots();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Maintenance completed successfully`,
        data: {
          slotsGenerated: result.slotsGenerated,
          slotsDeleted: result.slotsDeleted,
          netChange: result.slotsGenerated - result.slotsDeleted,
          timestamp: new Date().toISOString(),
          triggeredBy: user.role,
        },
      });
    } else {
      console.error(`❌ Manual maintenance failed:`, result.error);

      return NextResponse.json(
        {
          success: false,
          error: result.error || "Maintenance failed",
          timestamp: new Date().toISOString(),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Error in manual maintenance API:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error during maintenance",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint to check maintenance status
export async function GET(_request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const { prisma } = await import("@/lib/config/prisma");

    // Get statistics about current recurring slots
    const stats = await prisma.$runCommandRaw({
      aggregate: "mentorTimeSlot",
      pipeline: [
        {
          $match: {
            isRecurring: true,
            isActive: true,
          },
        },
        {
          $group: {
            _id: null,
            totalRecurringSlots: { $sum: 1 },
            futureSlots: {
              $sum: {
                $cond: [{ $gte: ["$startTime", new Date()] }, 1, 0],
              },
            },
            pastSlots: {
              $sum: {
                $cond: [{ $lt: ["$startTime", new Date()] }, 1, 0],
              },
            },
          },
        },
      ],
      cursor: {},
    });

    let statistics = {
      totalRecurringSlots: 0,
      futureSlots: 0,
      pastSlots: 0,
    };

    if (
      stats &&
      typeof stats === "object" &&
      "cursor" in stats &&
      stats.cursor &&
      typeof stats.cursor === "object" &&
      "firstBatch" in stats.cursor &&
      Array.isArray((stats.cursor as { firstBatch: unknown[] }).firstBatch) &&
      (stats.cursor as { firstBatch: unknown[] }).firstBatch.length > 0
    ) {
      statistics = (stats.cursor as unknown as { firstBatch: StatisticsData[] }).firstBatch[0];
    }

    return NextResponse.json({
      success: true,
      data: {
        currentTime: new Date().toISOString(),
        recurringSlots: statistics,
        maintenanceInfo: {
          description: "Recurring slots maintenance manages the 7-day rolling window",
          schedule: "Should run daily via cron job",
          manualTrigger: "POST to this endpoint to run manually",
        },
      },
    });
  } catch (error) {
    console.error("Error getting maintenance status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get maintenance status" },
      { status: 500 }
    );
  }
}
