// Unified sessions API for students to see their own booked sessions
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";

export async function GET(request: NextRequest) {
  try {
    console.log("📅 Fetching student's booked sessions...");
    
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    console.log(`👤 Fetching booked sessions for student: ${userId}`);

    // Get user's session bookings with mentor and time slot details
    const sessionBookingsResult = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        {
          $match: {
            userId: userId,
            status: { $in: ["SCHEDULED", "ONGOING", "COMPLETED"] }
            // Include both PENDING and COMPLETED payments so students can see their bookings
          }
        },
        {
          $lookup: {
            from: 'user',
            localField: 'mentorId',
            foreignField: '_id',
            as: 'mentor'
          }
        },
        {
          $lookup: {
            from: 'mentorTimeSlot',
            localField: 'timeSlotId',
            foreignField: '_id',
            as: 'timeSlot'
          }
        },
        {
          $addFields: {
            mentorData: { $arrayElemAt: ['$mentor', 0] },
            timeSlotData: { $arrayElemAt: ['$timeSlot', 0] },
            // Enhanced session information
            sessionTitle: {
              $concat: [
                { $toUpper: { $substr: ['$sessionType', 0, 1] } },
                { $toLower: { $substr: ['$sessionType', 1, -1] } },
                ' Session with ',
                { $ifNull: ['$mentorData.name', 'Mentor'] }
              ]
            },
            sessionDuration: { $literal: 60 }, // Default 60 minutes
            canJoin: {
              $and: [
                { $eq: ['$status', 'ONGOING'] },
                { $eq: ['$paymentStatus', 'COMPLETED'] }
              ]
            },
            canStart: {
              $and: [
                { $eq: ['$status', 'SCHEDULED'] },
                { $eq: ['$paymentStatus', 'COMPLETED'] }
              ]
            }
          }
        },
        {
          $project: {
            id: '$_id',
            title: '$sessionTitle',
            scheduledTime: '$scheduledAt',
            duration: '$sessionDuration',
            sessionType: 1,
            status: 1,
            paymentStatus: 1,
            notes: 1,
            canJoin: 1,
            canStart: 1,
            mentor: {
              id: '$mentorData._id',
              name: '$mentorData.name',
              email: '$mentorData.email',
              mentorType: '$mentorData.mentorType',
              image: '$mentorData.image'
            },
            timeSlot: {
              id: '$timeSlotData._id',
              sessionLink: '$timeSlotData.sessionLink',
              startTime: '$timeSlotData.startTime',
              endTime: '$timeSlotData.endTime'
            },
            paymentDetails: 1,
            createdAt: 1
          }
        },
        {
          $sort: { scheduledTime: 1 } // Upcoming sessions first
        }
      ],
      cursor: {}
    });

    let sessions: any[] = [];
    if (sessionBookingsResult && 
        typeof sessionBookingsResult === 'object' && 
        'cursor' in sessionBookingsResult &&
        sessionBookingsResult.cursor &&
        typeof sessionBookingsResult.cursor === 'object' &&
        'firstBatch' in sessionBookingsResult.cursor &&
        Array.isArray(sessionBookingsResult.cursor.firstBatch)) {
      sessions = sessionBookingsResult.cursor.firstBatch;
    }

    console.log(`📊 Found ${sessions.length} booked sessions for student`);

    // Separate sessions by status for better organization
    const upcomingSessions = sessions.filter(s => s.status === 'SCHEDULED');
    const ongoingSessions = sessions.filter(s => s.status === 'ONGOING');
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');

    console.log(`📅 Sessions breakdown: ${upcomingSessions.length} upcoming, ${ongoingSessions.length} ongoing, ${completedSessions.length} completed`);

    return NextResponse.json({
      success: true,
      data: {
        allSessions: sessions,
        upcomingSessions,
        ongoingSessions,
        completedSessions,
        total: sessions.length
      }
    });

  } catch (error) {
    console.error("Error fetching student sessions:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch your sessions" },
      { status: 500 }
    );
  }
}
