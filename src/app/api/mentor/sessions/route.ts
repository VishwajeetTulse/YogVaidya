import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import type { SessionBookingDocument } from "@/lib/types/sessions";
import type { MongoCommandResult } from "@/lib/types/mongodb";

import { AuthenticationError, AuthorizationError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse, noContentResponse, successResponse } from "@/lib/utils/response-handler";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    // Get mentorId from query params or use session user id
    const url = new URL(request.url);
    const mentorId = url.searchParams.get("mentorId") || session.user.id;

    // Verify the user is authorized to access this mentor's sessions
    if (mentorId !== session.user.id) {
      throw new AuthorizationError("Forbidden");
    }

    // Check if user is a mentor
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        role: "MENTOR",
      },
    });

    if (!user) {
      throw new AuthorizationError("Only mentors can view session bookings");
    }

    // First, let's check if there are any session bookings at all
    const allBookings = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: {},
    });

    let totalBookings: SessionBookingDocument[] = [];
    if (
      allBookings &&
      typeof allBookings === "object" &&
      "cursor" in allBookings &&
      allBookings.cursor &&
      typeof allBookings.cursor === "object" &&
      "firstBatch" in allBookings.cursor &&
      Array.isArray(allBookings.cursor.firstBatch)
    ) {
      totalBookings = (allBookings as unknown as MongoCommandResult<SessionBookingDocument>).cursor!
        .firstBatch;
    }

    if (totalBookings.length > 0) {
    }

    // Use MongoDB raw command to fetch session bookings
    const sessionBookings = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            mentorId: mentorId,
          },
        },
        {
          $lookup: {
            from: "user",
            localField: "userId",
            foreignField: "_id",
            as: "student",
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
            studentName: { $arrayElemAt: ["$student.name", 0] },
            studentEmail: { $arrayElemAt: ["$student.email", 0] },
            studentImage: { $arrayElemAt: ["$student.image", 0] },
            sessionLink: { $arrayElemAt: ["$timeSlot.sessionLink", 0] },
            sessionTitle: {
              $concat: [
                { $toUpper: { $substr: ["$sessionType", 0, 1] } },
                { $toLower: { $substr: ["$sessionType", 1, -1] } },
                " Session with ",
                { $ifNull: [{ $arrayElemAt: ["$student.name", 0] }, "Student"] },
              ],
            },
            notes: {
              $cond: {
                if: { $gt: [{ $size: "$timeSlot" }, 0] },
                then: { $arrayElemAt: ["$timeSlot.notes", 0] },
                else: "$notes",
              },
            },
            startTime: "$scheduledAt",
            endTime: {
              $cond: {
                if: { $gt: [{ $size: "$timeSlot" }, 0] },
                then: { $arrayElemAt: ["$timeSlot.endTime", 0] },
                else: "$scheduledAt", // Use scheduledAt as fallback without calculations
              },
            },
            canStart: {
              $and: [{ $eq: ["$status", "SCHEDULED"] }, { $eq: ["$paymentStatus", "COMPLETED"] }],
            },
            isUpcoming: {
              $and: [{ $in: ["$status", ["SCHEDULED", "ONGOING"]] }],
            },
          },
        },
        {
          $sort: { scheduledAt: -1 }, // Changed to -1 to show recent sessions first
        },
      ],
      cursor: {},
    });

    let bookings: SessionBookingDocument[] = [];
    if (
      sessionBookings &&
      typeof sessionBookings === "object" &&
      "cursor" in sessionBookings &&
      sessionBookings.cursor &&
      typeof sessionBookings.cursor === "object" &&
      "firstBatch" in sessionBookings.cursor &&
      Array.isArray(sessionBookings.cursor.firstBatch)
    ) {
      bookings = (sessionBookings as unknown as MongoCommandResult<SessionBookingDocument>).cursor!
        .firstBatch;
    }

    // Preserve Date objects instead of converting to ISO strings
    const processedBookings = bookings.map((booking) => ({
      ...booking,
      startTime: booking.startTime,
      endTime: booking.endTime,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: processedBookings,
    });
  } catch (error) {
    console.error("Error fetching mentor sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
