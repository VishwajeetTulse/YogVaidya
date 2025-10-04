import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("🚀 Fetching mentor session bookings...");

    const session = await auth.api.getSession({ headers: await headers() });
    console.log("👤 Current session user:", session?.user?.id, "role:", session?.user?.role);

    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Get mentorId from query params or use session user id
    const url = new URL(request.url);
    const mentorId = url.searchParams.get("mentorId") || session.user.id;
    console.log("🎯 Looking for sessions for mentorId:", mentorId);

    // Verify the user is authorized to access this mentor's sessions
    if (mentorId !== session.user.id) {
      console.log("❌ User not authorized to access this mentor's sessions");
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // Check if user is a mentor
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        role: "MENTOR",
      },
    });

    console.log("🔍 User lookup result:", user ? "FOUND MENTOR" : "NOT A MENTOR");

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Only mentors can view session bookings" },
        { status: 403 }
      );
    }

    console.log(`🔍 Searching for session bookings for mentor: ${mentorId}`);

    // First, let's check if there are any session bookings at all
    const allBookings = await prisma.$runCommandRaw({
      find: "sessionBooking",
      filter: {},
    });

    let totalBookings: any[] = [];
    if (
      allBookings &&
      typeof allBookings === "object" &&
      "cursor" in allBookings &&
      allBookings.cursor &&
      typeof allBookings.cursor === "object" &&
      "firstBatch" in allBookings.cursor &&
      Array.isArray(allBookings.cursor.firstBatch)
    ) {
      totalBookings = allBookings.cursor.firstBatch;
    }

    console.log(`📊 Total session bookings in database: ${totalBookings.length}`);
    if (totalBookings.length > 0) {
      console.log(
        "📋 All booking mentorIds:",
        totalBookings.map((b) => b.mentorId)
      );
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

    let bookings: any[] = [];
    if (
      sessionBookings &&
      typeof sessionBookings === "object" &&
      "cursor" in sessionBookings &&
      sessionBookings.cursor &&
      typeof sessionBookings.cursor === "object" &&
      "firstBatch" in sessionBookings.cursor &&
      Array.isArray(sessionBookings.cursor.firstBatch)
    ) {
      bookings = sessionBookings.cursor.firstBatch;
    }

    console.log(`📊 Found ${bookings.length} session bookings for mentor ${mentorId}`);
    console.log("📋 Raw session bookings:", JSON.stringify(bookings, null, 2));

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
