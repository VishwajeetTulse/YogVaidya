// Unified sessions API for students to see their own booked sessions
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import type { SessionBookingDocument } from "@/lib/types/sessions";
import type { MongoCommandResult } from "@/lib/types/mongodb";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

import { AuthenticationError } from "@/lib/utils/error-handler";

export async function GET(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    const userId = session.user.id;

    // Use Redis cache with 1 minute TTL for user sessions
    const sessions = await withCache(
      `students:sessions:${userId}`,
      async () => {
        // Get user's session bookings with mentor and time slot details
        const sessionBookingsResult = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: userId,
            status: { $in: ["SCHEDULED", "ONGOING", "COMPLETED"] },
            // Include both PENDING and COMPLETED payments so students can see their bookings
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "mentorId",
            foreignField: "_id",
            as: "mentor",
          },
        },
        {
          $lookup: {
            from: "mentorTimeSlot",
            localField: "timeSlotId",
            foreignField: "_id",
            as: "timeSlot",
          },
        },
        {
          $addFields: {
            mentorData: { $arrayElemAt: ["$mentor", 0] },
            timeSlotData: { $arrayElemAt: ["$timeSlot", 0] },
            // Enhanced session information
            sessionTitle: {
              $concat: [
                { $toUpper: { $substr: ["$sessionType", 0, 1] } },
                { $toLower: { $substr: ["$sessionType", 1, -1] } },
                " Session with ",
                { $ifNull: ["$mentorData.name", "Mentor"] },
              ],
            },
            sessionDuration: { $literal: 60 }, // Default 60 minutes
            canJoin: {
              $and: [{ $eq: ["$status", "ONGOING"] }, { $eq: ["$paymentStatus", "COMPLETED"] }],
            },
            canStart: {
              $and: [{ $eq: ["$status", "SCHEDULED"] }, { $eq: ["$paymentStatus", "COMPLETED"] }],
            },
          },
        },
        {
          $project: {
            id: "$_id",
            title: "$sessionTitle",
            scheduledTime: "$scheduledAt",
            duration: "$sessionDuration",
            sessionType: 1,
            status: 1,
            paymentStatus: 1,
            notes: 1,
            canJoin: 1,
            canStart: 1,
            mentor: {
              id: "$mentorData._id",
              name: "$mentorData.name",
              email: "$mentorData.email",
              mentorType: "$mentorData.mentorType",
              image: "$mentorData.image",
            },
            timeSlot: {
              id: "$timeSlotData._id",
              sessionLink: "$timeSlotData.sessionLink",
              startTime: "$timeSlotData.startTime",
              endTime: "$timeSlotData.endTime",
            },
            paymentDetails: 1,
            createdAt: 1,
          },
        },
        {
          $sort: { scheduledTime: 1 }, // Upcoming sessions first
        },
      ],
      cursor: {},
    });

    let sessions: SessionBookingDocument[] = [];
    if (
      sessionBookingsResult &&
      typeof sessionBookingsResult === "object" &&
      "cursor" in sessionBookingsResult &&
      sessionBookingsResult.cursor &&
      typeof sessionBookingsResult.cursor === "object" &&
      "firstBatch" in sessionBookingsResult.cursor &&
      Array.isArray(sessionBookingsResult.cursor.firstBatch)
    ) {
      sessions = (sessionBookingsResult as unknown as MongoCommandResult<SessionBookingDocument>)
        .cursor!.firstBatch;
    }

    // Preserve Date objects instead of converting to ISO strings
    const processedSessions = sessions.map((session) => {
      const timeSlot = session.timeSlot as Record<string, unknown> | undefined;
      return {
        ...session,
        scheduledTime: session.scheduledTime,
        createdAt: session.createdAt,
        timeSlot: timeSlot
          ? {
              ...timeSlot,
              startTime: timeSlot.startTime,
              endTime: timeSlot.endTime,
            }
          : timeSlot,
      };
    });

    // Separate sessions by status for better organization
    const upcomingSessions = processedSessions.filter((s) => s.status === "SCHEDULED");
    const ongoingSessions = processedSessions.filter((s) => s.status === "ONGOING");
    const completedSessions = processedSessions.filter((s) => s.status === "COMPLETED");

        return {
          allSessions: processedSessions,
          upcomingSessions,
          ongoingSessions,
          completedSessions,
          total: processedSessions.length,
        };
      },
      CACHE_TTL.SHORT // 1 minute - sessions change frequently
    );

    return NextResponse.json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch your sessions" },
      { status: 500 }
    );
  }
}

// POST - Invalidate user sessions cache
export async function POST(_request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    await invalidateCache(`students:sessions:${session.user.id}`);
    return NextResponse.json({ success: true, message: "Cache invalidated" });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { success: false, error: "Failed to invalidate cache" },
      { status: 500 }
    );
  }
}
