// Unified sessions API that combines Schedule and SessionBooking data
import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import type { SessionBookingDocument, ScheduleDocument } from "@/lib/types/sessions";
import type { MongoCommandResult, DateValue } from "@/lib/types/mongodb";
import { isMongoDate } from "@/lib/types/mongodb";

export async function GET(_request: NextRequest) {
  try {


    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;


    // Get sessions from SessionBooking collection (new time slot bookings)
    const sessionBookingsResult = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: userId,
            status: { $in: ["SCHEDULED", "ONGOING", "COMPLETED"] },
            paymentStatus: "COMPLETED", // Only show paid sessions
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
            // Standardize fields for unified interface
            id: "$_id",
            title: {
              $concat: [
                { $toUpper: { $substr: ["$sessionType", 0, 1] } },
                { $toLower: { $substr: ["$sessionType", 1, -1] } },
                " Session with ",
                { $ifNull: [{ $arrayElemAt: ["$mentor.name", 0] }, "Mentor"] },
              ],
            },
            scheduledTime: "$scheduledAt",
            duration: { $ifNull: [{ $arrayElemAt: ["$timeSlot.duration", 0] }, 60] }, // Default 60 minutes
            source: "sessionBooking",
          },
        },
        {
          $project: {
            id: 1,
            title: 1,
            scheduledTime: 1,
            duration: 1,
            sessionType: 1,
            status: 1,
            notes: 1,
            source: 1,
            timeSlotId: 1,
            mentor: {
              id: "$mentorData._id",
              name: "$mentorData.name",
              mentorType: "$mentorData.mentorType",
              image: "$mentorData.image",
            },
            sessionLink: { $arrayElemAt: ["$timeSlot.sessionLink", 0] },
            paymentDetails: 1,
          },
        },
      ],
      cursor: {},
    });

    let sessionBookings: SessionBookingDocument[] = [];
    if (
      sessionBookingsResult &&
      typeof sessionBookingsResult === "object" &&
      "cursor" in sessionBookingsResult &&
      sessionBookingsResult.cursor &&
      typeof sessionBookingsResult.cursor === "object" &&
      "firstBatch" in sessionBookingsResult.cursor &&
      Array.isArray(sessionBookingsResult.cursor.firstBatch)
    ) {
      sessionBookings = (
        sessionBookingsResult as unknown as MongoCommandResult<SessionBookingDocument>
      ).cursor!.firstBatch;
    }



    // Get sessions from Schedule collection (legacy sessions)
    const _scheduleSessionsResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            // Note: Schedule doesn't have userId, need to determine matching logic
            // For now, we'll skip legacy schedules or implement mentor-based matching
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
          $addFields: {
            mentorData: { $arrayElemAt: ["$mentor", 0] },
            // Standardize fields for unified interface
            scheduledTime: "$scheduledTime",
            source: "schedule",
          },
        },
        {
          $project: {
            id: "$_id",
            title: 1,
            scheduledTime: 1,
            duration: 1,
            sessionType: 1,
            status: 1,
            link: 1,
            source: 1,
            mentor: {
              id: "$mentorData._id",
              name: "$mentorData.name",
              mentorType: "$mentorData.mentorType",
              image: "$mentorData.image",
            },
          },
        },
      ],
      cursor: {},
    });

    const scheduleSessions: ScheduleDocument[] = [];
    // For now, we'll focus on SessionBooking data since Schedule doesn't have userId
    // This can be extended later if needed

    // Helper to convert dates safely
    const convertDate = (dateValue: DateValue): Date => {
      if (!dateValue) return new Date();
      if (isMongoDate(dateValue)) return new Date(dateValue.$date);
      if (dateValue instanceof Date) return dateValue;
      return new Date(dateValue);
    };

    // Combine and sort sessions
    const allSessions = [...sessionBookings, ...scheduleSessions];
    allSessions.sort((a, b) => {
      const aDate = convertDate(
        (a as SessionBookingDocument).scheduledAt || (a as ScheduleDocument).scheduledTime
      );
      const bDate = convertDate(
        (b as SessionBookingDocument).scheduledAt || (b as ScheduleDocument).scheduledTime
      );
      return aDate.getTime() - bDate.getTime();
    });



    return NextResponse.json({
      success: true,
      data: {
        sessions: allSessions,
        total: allSessions.length,
      },
    });
  } catch (error) {
    console.error("Error fetching unified sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}
