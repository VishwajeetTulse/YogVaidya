"use server";

import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { headers } from "next/headers";

export interface MentorSessionData {
  id: string;
  title: string;
  scheduledTime: Date;
  duration: number;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  link: string;
  createdAt: Date;
  updatedAt: Date;
  eligibleStudents: {
    total: number;
    active: number;
    byPlan: {
      SEED: number;
      BLOOM: number;
      FLOURISH: number;
    };
  };
  potentialStudents: Array<{
    id: string;
    name: string | null;
    email: string;
    subscriptionPlan: string | null;
    subscriptionStatus: string;
  }>;
}

export interface MentorSessionsResponse {
  success: boolean;
  data?: {
    mentorInfo: {
      id: string;
      name: string | null;
      email: string;
      mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
    };
    sessions: MentorSessionData[];
    totalSessions: number;
  };
  error?: string;
}

/**
 * Get mentor's sessions with details about eligible students
 */
export async function getMentorSessions(): Promise<MentorSessionsResponse> {
  try {
    // Get the session using headers
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user details and verify they are a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mentorType: true,
      }
    });

    if (!user || user.role !== "MENTOR") {
      return { success: false, error: "Only mentors can access this data" };
    }

    // Get mentor's scheduled sessions from both sources
    console.log("📊 Fetching mentor sessions from both Schedule and SessionBooking collections...");
    console.log(`👤 Mentor ID: ${user.id}`);
    
    // 1. Get sessions from Schedule collection (legacy sessions)
    const legacySessions = await prisma.schedule.findMany({
      where: { mentorId: user.id },
      orderBy: { scheduledTime: 'desc' },
      take: 100 // Limit to 100 sessions
    });
    
    console.log(`📅 Found ${legacySessions.length} legacy sessions from Schedule collection`);

    // 2. Get sessions from SessionBooking collection (new time slot bookings)
    const sessionBookingsResult = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        {
          $match: {
            mentorId: user.id,
            status: { $in: ["SCHEDULED", "ONGOING", "COMPLETED"] },
            paymentStatus: "COMPLETED" // Only show paid sessions
          }
        },
        {
          $lookup: {
            from: 'user',
            localField: 'userId',
            foreignField: '_id',
            as: 'student'
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
            studentData: { $arrayElemAt: ['$student', 0] },
            timeSlotData: { $arrayElemAt: ['$timeSlot', 0] }
          }
        },
        {
          $project: {
            id: '$_id',
            title: {
              $concat: [
                { $toUpper: { $substr: ['$sessionType', 0, 1] } },
                { $toLower: { $substr: ['$sessionType', 1, -1] } },
                ' Session with ',
                { $ifNull: ['$studentData.name', 'Student'] }
              ]
            },
            scheduledTime: {
              $cond: {
                if: { $and: [{ $ne: ['$scheduledAt', null] }, { $ne: ['$scheduledAt', ''] }] },
                then: {
                  $dateToString: {
                    format: '%Y-%m-%dT%H:%M:%S.%LZ',
                    date: '$scheduledAt'
                  }
                },
                else: null
              }
            },
            duration: { $literal: 60 }, // Default 60 minutes duration
            sessionType: 1,
            status: 1,
            link: '$timeSlotData.sessionLink',
            createdAt: 1,
            updatedAt: 1,
            studentId: '$userId',
            studentName: '$studentData.name',
            studentEmail: '$studentData.email',
            paymentStatus: 1
          }
        },
        {
          $sort: { scheduledTime: -1 }
        }
      ],
      cursor: {}
    });

    let sessionBookings: any[] = [];
    if (sessionBookingsResult && 
        typeof sessionBookingsResult === 'object' && 
        'cursor' in sessionBookingsResult &&
        sessionBookingsResult.cursor &&
        typeof sessionBookingsResult.cursor === 'object' &&
        'firstBatch' in sessionBookingsResult.cursor &&
        Array.isArray(sessionBookingsResult.cursor.firstBatch)) {
      sessionBookings = sessionBookingsResult.cursor.firstBatch;
    }

    console.log(`📅 Found ${sessionBookings.length} session bookings from SessionBooking collection`);

    // 3. Combine both session types into unified format
    const allSessions = [
      // Legacy sessions from Schedule collection
      ...legacySessions.map(session => ({
        ...session,
        source: 'schedule', // Mark as legacy session
        studentId: null, // Legacy sessions don't have pre-assigned students
        studentName: null,
        studentEmail: null,
        paymentStatus: null
      })),
      // Session bookings from SessionBooking collection  
      ...sessionBookings.map(booking => {
        console.log('🔍 Raw booking data:', {
          id: booking.id,
          scheduledTime: booking.scheduledTime,
          scheduledTimeType: typeof booking.scheduledTime,
          status: booking.status,
          rawScheduledTime: booking.scheduledTime,
          dateConversion: booking.scheduledTime ? new Date(booking.scheduledTime).toISOString() : 'null'
        });
        return {
          ...booking,
          source: 'booking', // Mark as session booking
          scheduledTime: booking.scheduledTime ? new Date(booking.scheduledTime) : null,
          id: booking.id ? String(booking.id) : undefined
        };
      })
    ].sort((a, b) => {
      // Sort by scheduledTime descending (newest first)
      const timeA = a.scheduledTime ? new Date(a.scheduledTime) : new Date(0);
      const timeB = b.scheduledTime ? new Date(b.scheduledTime) : new Date(0);
      return timeB.getTime() - timeA.getTime();
    });

    console.log(`🔄 Combined total: ${allSessions.length} sessions (${legacySessions.length} legacy + ${sessionBookings.length} bookings)`);

    // Get all users with active subscriptions that might be eligible for this mentor's sessions
    // Filter by role "USER" to exclude mentors (who have role "MENTOR")
    const currentDate = new Date();
    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: "USER", // Only users with USER role (mentors have MENTOR role)
        OR: [
          // Active subscriptions
          {
            subscriptionStatus: "ACTIVE",
            OR: [
              { subscriptionEndDate: null },
              { subscriptionEndDate: { gte: currentDate } }
            ]
          },
          // Cancelled subscriptions that are still active until end date
          {
            subscriptionStatus: { in: ["CANCELLED", "ACTIVE_UNTIL_END"] },
            OR: [
              { nextBillingDate: { gte: currentDate } },
              { 
                AND: [
                  { nextBillingDate: null },
                  { subscriptionEndDate: { gte: currentDate } }
                ]
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      }
    });

    // Process sessions with eligible student information
    const formattedSessions: MentorSessionData[] = allSessions.map((session: any) => {
      // For session bookings, we already have student info
      if (session.source === 'booking') {
        return {
          id: session.id,
          title: session.title || `${session.sessionType || 'Session'} with ${session.studentName || 'Student'}`,
          scheduledTime: session.scheduledTime,
          duration: session.duration || 60,
          sessionType: session.sessionType,
          status: session.status,
          link: session.link,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          eligibleStudents: {
            total: 1, // Already booked by one student
            active: 1,
            byPlan: {
              SEED: 0,
              BLOOM: 0,
              FLOURISH: 0
            }
          },
          potentialStudents: [{
            id: session.studentId,
            name: session.studentName,
            email: session.studentEmail,
            subscriptionPlan: null, // We don't have this from the booking data
            subscriptionStatus: "ACTIVE" // Assume active since they booked
          }]
        };
      }
      
      // For legacy sessions, calculate eligible users
      let sessionEligibleUsers = eligibleUsers;

      if (session.sessionType === "MEDITATION") {
        // MEDITATION sessions are available to SEED and FLOURISH users
        sessionEligibleUsers = eligibleUsers.filter(user => 
          user.subscriptionPlan === "SEED" || user.subscriptionPlan === "FLOURISH"
        );
      } else if (session.sessionType === "YOGA") {
        // YOGA sessions are available to BLOOM and FLOURISH users
        sessionEligibleUsers = eligibleUsers.filter(user => 
          user.subscriptionPlan === "BLOOM" || user.subscriptionPlan === "FLOURISH"
        );
      } else if (session.sessionType === "DIET") {
        // DIET sessions are available to FLOURISH users (or all users if you prefer)
        sessionEligibleUsers = eligibleUsers.filter(user => 
          user.subscriptionPlan === "FLOURISH"
        );
      }

      // Count by plan
      const byPlan = {
        SEED: sessionEligibleUsers.filter(u => u.subscriptionPlan === "SEED").length,
        BLOOM: sessionEligibleUsers.filter(u => u.subscriptionPlan === "BLOOM").length,
        FLOURISH: sessionEligibleUsers.filter(u => u.subscriptionPlan === "FLOURISH").length,
      };

      const activeUsers = sessionEligibleUsers.filter(u => u.subscriptionStatus === "ACTIVE");

      return {
        id: session.id,
        title: session.title,
        scheduledTime: session.scheduledTime,
        duration: session.duration,
        sessionType: session.sessionType,
        status: session.status,
        link: session.link,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        eligibleStudents: {
          total: sessionEligibleUsers.length,
          active: activeUsers.length,
          byPlan,
        },
        potentialStudents: sessionEligibleUsers.slice(0, 10) // Show first 10 potential students
      };
    });

    return {
      success: true,
      data: {
        mentorInfo: {
          id: user.id,
          name: user.name,
          email: user.email,
          mentorType: user.mentorType,
        },
        sessions: formattedSessions,
        totalSessions: allSessions.length,
      }
    };

  } catch (error) {
    console.error("Error fetching mentor sessions:", error);
    return { success: false, error: "Failed to fetch mentor sessions" };
  }
}

