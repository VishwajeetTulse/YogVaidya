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
  sessionCategory: "subscription" | "individual"; // Add category to distinguish session types
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
    
    // 1. Get sessions from Schedule collection using raw query to handle datetime conversion
    const scheduleResult = await prisma.$runCommandRaw({
      aggregate: 'schedule',
      pipeline: [
        {
          $match: {
            mentorId: user.id
          }
        },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $and: [{ $ne: ['$scheduledTime', null] }, { $ne: ['$scheduledTime', ''] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$scheduledTime' }, 'date'] },
                    then: {
                      $dateToString: {
                        format: '%Y-%m-%dT%H:%M:%S.%LZ',
                        date: '$scheduledTime'
                      }
                    },
                    else: '$scheduledTime' // If it's already a string, keep it as is
                  }
                },
                else: null
              }
            },
            createdAt: {
              $cond: {
                if: { $and: [{ $ne: ['$createdAt', null] }, { $ne: ['$createdAt', ''] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$createdAt' }, 'date'] },
                    then: {
                      $dateToString: {
                        format: '%Y-%m-%dT%H:%M:%S.%LZ',
                        date: '$createdAt'
                      }
                    },
                    else: '$createdAt' // If it's already a string, keep it as is
                  }
                },
                else: null
              }
            },
            updatedAt: {
              $cond: {
                if: { $and: [{ $ne: ['$updatedAt', null] }, { $ne: ['$updatedAt', ''] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: '$updatedAt' }, 'date'] },
                    then: {
                      $dateToString: {
                        format: '%Y-%m-%dT%H:%M:%S.%LZ',
                        date: '$updatedAt'
                      }
                    },
                    else: '$updatedAt' // If it's already a string, keep it as is
                  }
                },
                else: null
              }
            }
          }
        },
        {
          $sort: { scheduledTime: -1 }
        },
        {
          $limit: 100
        }
      ],
      cursor: {}
    });

    let legacySessions: any[] = [];
    if (scheduleResult && 
        typeof scheduleResult === 'object' && 
        'cursor' in scheduleResult &&
        scheduleResult.cursor &&
        typeof scheduleResult.cursor === 'object' &&
        'firstBatch' in scheduleResult.cursor &&
        Array.isArray(scheduleResult.cursor.firstBatch)) {
      legacySessions = scheduleResult.cursor.firstBatch;
    }

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
            _id: 1, // Ensure _id is included
            id: '$_id', // Also project as id for consistency
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

      // Debug: Check the structure of the first booking
      if (sessionBookings.length > 0) {
        console.log('🔍 First booking structure:', {
          keys: Object.keys(sessionBookings[0]),
          id: sessionBookings[0].id,
          _id: sessionBookings[0]._id,
          hasId: 'id' in sessionBookings[0],
          hasUnderscoreId: '_id' in sessionBookings[0],
          fullBooking: sessionBookings[0]
        });
      }
    }

    console.log(`📅 Found ${sessionBookings.length} session bookings from SessionBooking collection`);

    console.log(`🔄 Processing: ${legacySessions.length} subscription sessions + ${sessionBookings.length} individual sessions`);

    // Process subscription sessions (from Schedule collection) separately
    const subscriptionSessions = legacySessions.map(session => {
      // Ensure we have a valid ID for legacy sessions
      const sessionId = session.id || session._id;
      console.log('🔍 Processing legacy session:', {
        originalId: session.id,
        underscoreId: session._id,
        finalId: sessionId,
        sessionKeys: Object.keys(session),
        hasId: 'id' in session,
        hasUnderscoreId: '_id' in session
      });

      return {
        ...session,
        id: sessionId ? String(sessionId) : `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: 'schedule',
        sessionCategory: 'subscription' as const,
        scheduledTime: session.scheduledTime ? new Date(session.scheduledTime) : null,
        createdAt: session.createdAt ? new Date(session.createdAt) : null,
        updatedAt: session.updatedAt ? new Date(session.updatedAt) : null,
        studentId: null, // Legacy sessions don't have pre-assigned students
        studentName: null,
        studentEmail: null,
        paymentStatus: null
      };
    });

    // Process individual sessions (from SessionBooking collection) separately
    const individualSessions = sessionBookings.map(booking => {
      // Ensure we have a valid ID - use _id as fallback if id is missing
      const sessionId = booking.id || booking._id;
      console.log('🔍 Processing individual session:', {
        originalId: booking.id,
        underscoreId: booking._id,
        finalId: sessionId,
        idType: typeof sessionId,
        hasValidId: !!sessionId,
        bookingKeys: Object.keys(booking)
      });

      return {
        ...booking,
        source: 'booking',
        sessionCategory: 'individual' as const,
        scheduledTime: booking.scheduledTime ? new Date(booking.scheduledTime) : null,
        id: sessionId ? String(sessionId) : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    });

    // Sort each category separately by scheduledTime descending (newest first)
    const sortByScheduledTime = (a: any, b: any) => {
      const timeA = a.scheduledTime ? new Date(a.scheduledTime) : new Date(0);
      const timeB = b.scheduledTime ? new Date(b.scheduledTime) : new Date(0);
      return timeB.getTime() - timeA.getTime();
    };

    const sortedSubscriptionSessions = subscriptionSessions.sort(sortByScheduledTime);
    const sortedIndividualSessions = individualSessions.sort(sortByScheduledTime);

    // Combine all sessions but keep them categorized
    const allSessions = [...sortedSubscriptionSessions, ...sortedIndividualSessions];

    console.log(`📊 Session breakdown: ${subscriptionSessions.length} subscription + ${individualSessions.length} individual = ${allSessions.length} total`);

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
    const formattedSessions: MentorSessionData[] = allSessions
      .filter(session => {
        // Filter out sessions with invalid IDs
        const hasValidId = session.id && typeof session.id === 'string' && session.id.trim().length > 0;
        if (!hasValidId) {
          console.error('❌ Filtering out session with invalid ID:', {
            session,
            id: session.id,
            idType: typeof session.id
          });
        }
        return hasValidId;
      })
      .map((session: any) => {
      // For individual session bookings, we already have student info
      if (session.sessionCategory === 'individual') {
        const result = {
          id: session.id,
          title: session.title || `${session.sessionType || 'Session'} with ${session.studentName || 'Student'}`,
          scheduledTime: session.scheduledTime,
          duration: session.duration || 60,
          sessionType: session.sessionType,
          status: session.status,
          link: session.link,
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          sessionCategory: session.sessionCategory,
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

        console.log('📤 Returning individual session:', {
          id: result.id,
          idType: typeof result.id,
          title: result.title,
          sessionCategory: result.sessionCategory
        });

        return result;
      }

      // For subscription sessions, calculate eligible users
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
        sessionCategory: session.sessionCategory,
        eligibleStudents: {
          total: sessionEligibleUsers.length,
          active: activeUsers.length,
          byPlan,
        },
        potentialStudents: sessionEligibleUsers.slice(0, 10) // Show first 10 potential students
      };
    });

    console.log(`📊 Final session data: ${formattedSessions.length} sessions`);
    formattedSessions.forEach((session, index) => {
      console.log(`   Session ${index}: id=${session.id}, category=${session.sessionCategory}, title=${session.title?.substring(0, 50)}...`);
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

