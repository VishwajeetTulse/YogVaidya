"use server";

import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { headers } from "next/headers";
import type { DateValue, MongoCommandResult } from "@/lib/types/mongodb";
import { isMongoDate } from "@/lib/types/mongodb";
import type { SessionBookingDocument, ScheduleDocument } from "@/lib/types/sessions";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

// Extended types for aggregated results with joined data
interface SessionBookingWithStudentData extends SessionBookingDocument {
  studentId?: string | null;
  studentName?: string | null;
  studentEmail?: string | null;
  title?: string | null;
  link?: string | null;
}

/**
 * Helper function to convert MongoDB extended JSON dates to JavaScript Date objects
 */
function _convertMongoDate(dateValue: DateValue): Date | null {
  if (!dateValue) return null;

  try {
    // Handle MongoDB extended JSON format
    if (isMongoDate(dateValue)) {
      return new Date(dateValue.$date);
    }

    // Handle Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }

    // Handle regular date strings
    return new Date(dateValue);
  } catch (error) {
    console.error("Error converting date:", error);
    return null;
  }
}

/**
 * Get session duration from stored field or default based on session type
 */
function getSessionDuration(session: Record<string, unknown>): number {
  // Use stored duration if available and valid
  if (session.duration && typeof session.duration === "number" && session.duration > 0) {
    return session.duration;
  }

  // For sessions booked through time slots, try to get duration from schedule
  const scheduleData = session.scheduleData as Record<string, unknown> | undefined;
  if (
    scheduleData &&
    scheduleData.duration &&
    typeof scheduleData.duration === "number" &&
    scheduleData.duration > 0
  ) {
    return scheduleData.duration;
  }

  // For sessions from time slots, check if timeSlotData has duration
  const timeSlotData = session.timeSlotData as Record<string, unknown> | undefined;
  if (
    timeSlotData &&
    timeSlotData.duration &&
    typeof timeSlotData.duration === "number" &&
    timeSlotData.duration > 0
  ) {
    return timeSlotData.duration;
  }

  // Fallback to defaults based on session type
  if (session.sessionType === "MEDITATION") return 30;
  if (session.sessionType === "DIET") return 45;
  return 60; // Default for YOGA
}

export interface MentorSessionData {
  id: string;
  title: string;
  scheduledTime: Date | null; // Allow null for sessions without scheduled time
  duration: number;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  link: string | null; // Allow null for sessions without link
  createdAt: Date | null; // Allow null for sessions without creation date
  updatedAt: Date | null; // Allow null for sessions without update date
  sessionCategory: "subscription" | "individual"; // Add category to distinguish session types
  manualStartTime?: Date | null; // When the session was actually started
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

    return await withCache(
      `mentor:sessions:${session.user.id}`,
      async () => {

    // Get user details and verify they are a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        mentorType: true,
      },
    });

    if (!user || user.role !== "MENTOR") {
      return { success: false, error: "Only mentors can access this data" };
    }

    // Get mentor's scheduled sessions from both sources

    // 1. Get sessions from Schedule collection using raw query to handle datetime conversion
    const scheduleResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            mentorId: user.id,
          },
        },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $and: [{ $ne: ["$scheduledTime", null] }, { $ne: ["$scheduledTime", ""] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$scheduledTime",
                      },
                    },
                    else: "$scheduledTime", // If it's already a string, keep it as is
                  },
                },
                else: null,
              },
            },
            createdAt: {
              $cond: {
                if: { $and: [{ $ne: ["$createdAt", null] }, { $ne: ["$createdAt", ""] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$createdAt" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$createdAt",
                      },
                    },
                    else: "$createdAt", // If it's already a string, keep it as is
                  },
                },
                else: null,
              },
            },
            updatedAt: {
              $cond: {
                if: { $and: [{ $ne: ["$updatedAt", null] }, { $ne: ["$updatedAt", ""] }] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$updatedAt",
                      },
                    },
                    else: "$updatedAt", // If it's already a string, keep it as is
                  },
                },
                else: null,
              },
            },
          },
        },
        {
          $project: {
            _id: 1,
            id: 1,
            title: 1,
            scheduledTime: 1,
            link: 1,
            duration: 1, // Explicitly include duration field
            sessionType: 1,
            status: 1,
            mentorId: 1,
            manualStartTime: 1, // Include manual start time for duration calculation
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $sort: { scheduledTime: -1 },
        },
        {
          $limit: 100,
        },
      ],
      cursor: {},
    });

    let legacySessions: ScheduleDocument[] = [];
    if (
      scheduleResult &&
      typeof scheduleResult === "object" &&
      "cursor" in scheduleResult &&
      scheduleResult.cursor &&
      typeof scheduleResult.cursor === "object" &&
      "firstBatch" in scheduleResult.cursor &&
      Array.isArray(scheduleResult.cursor.firstBatch)
    ) {
      legacySessions = (scheduleResult as unknown as MongoCommandResult<ScheduleDocument>).cursor!
        .firstBatch;
    }

    // 2. Get sessions from SessionBooking collection (new time slot bookings)
    const sessionBookingsResult = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            mentorId: user.id,
            status: { $in: ["SCHEDULED", "ONGOING", "COMPLETED"] },
            paymentStatus: "COMPLETED", // Only show paid sessions
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
            studentData: { $arrayElemAt: ["$student", 0] },
            timeSlotData: { $arrayElemAt: ["$timeSlot", 0] },
          },
        },
        {
          $project: {
            _id: 1, // Ensure _id is included
            id: "$_id", // Also project as id for consistency
            title: {
              $concat: [
                { $toUpper: { $substr: ["$sessionType", 0, 1] } },
                { $toLower: { $substr: ["$sessionType", 1, -1] } },
                " Session with ",
                { $ifNull: ["$studentData.name", "Student"] },
              ],
            },
            scheduledTime: {
              $cond: {
                if: { $and: [{ $ne: ["$scheduledAt", null] }, { $ne: ["$scheduledAt", ""] }] },
                then: {
                  $dateToString: {
                    format: "%Y-%m-%dT%H:%M:%S.%LZ",
                    date: "$scheduledAt",
                  },
                },
                else: null,
              },
            },

            sessionType: 1,
            status: 1,
            duration: 1, // Explicitly include duration field
            link: "$timeSlotData.sessionLink",
            manualStartTime: 1, // Include manual start time for duration calculation
            createdAt: 1,
            updatedAt: 1,
            studentId: "$userId",
            studentName: "$studentData.name",
            studentEmail: "$studentData.email",
            paymentStatus: 1,
            timeSlotData: 1, // Include time slot data for duration calculation
          },
        },
        {
          $sort: { scheduledTime: -1 },
        },
      ],
      cursor: {},
    });

    let sessionBookings: SessionBookingWithStudentData[] = [];
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
        sessionBookingsResult as unknown as MongoCommandResult<SessionBookingWithStudentData>
      ).cursor!.firstBatch;

      // Debug: Check the structure of the first booking
      if (sessionBookings.length > 0) {
      }
    }

    // Process subscription sessions (from Schedule collection) separately
    const subscriptionSessions = legacySessions.map((session) => {
      // Ensure we have a valid ID for legacy sessions
      const sessionId = session.id || session._id;

      const processedSession = {
        ...session,
        id: sessionId
          ? String(sessionId)
          : `legacy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        source: "schedule",
        sessionCategory: "subscription" as const,
        scheduledTime: session.scheduledTime ? _convertMongoDate(session.scheduledTime) : null,
        createdAt: session.createdAt ? _convertMongoDate(session.createdAt) : null,
        updatedAt: session.updatedAt ? _convertMongoDate(session.updatedAt) : null,
        studentId: null, // Legacy sessions don't have pre-assigned students
        studentName: null,
        studentEmail: null,
        paymentStatus: null,
      };

      // Get duration from stored field or defaults
      processedSession.duration = getSessionDuration(processedSession);

      return processedSession;
    });

    // Process individual sessions (from SessionBooking collection) separately
    const individualSessions = sessionBookings.map((booking) => {
      // Ensure we have a valid ID - use _id as fallback if id is missing
      const sessionId = booking.id || booking._id;

      const processedBooking = {
        ...booking,
        source: "booking",
        sessionCategory: "individual" as const,
        scheduledTime: booking.scheduledAt ? _convertMongoDate(booking.scheduledAt) : null,
        id: sessionId
          ? String(sessionId)
          : `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };

      // Get duration from stored field or defaults
      processedBooking.duration = getSessionDuration(processedBooking);

      return processedBooking;
    });

    // Sort each category separately by scheduledTime descending (newest first)
    const sortByScheduledTime = (a: Record<string, unknown>, b: Record<string, unknown>) => {
      const timeA = a.scheduledTime
        ? new Date(a.scheduledTime as string | number | Date)
        : new Date(0);
      const timeB = b.scheduledTime
        ? new Date(b.scheduledTime as string | number | Date)
        : new Date(0);
      return timeB.getTime() - timeA.getTime();
    };

    const sortedSubscriptionSessions = subscriptionSessions.sort(sortByScheduledTime);
    const sortedIndividualSessions = individualSessions.sort(sortByScheduledTime);

    // Combine all sessions but keep them categorized
    const allSessions = [...sortedSubscriptionSessions, ...sortedIndividualSessions];

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
            OR: [{ subscriptionEndDate: null }, { subscriptionEndDate: { gte: currentDate } }],
          },
          // Cancelled subscriptions that are still active until end date
          {
            subscriptionStatus: { in: ["CANCELLED", "ACTIVE_UNTIL_END"] },
            OR: [
              { nextBillingDate: { gte: currentDate } },
              {
                AND: [{ nextBillingDate: null }, { subscriptionEndDate: { gte: currentDate } }],
              },
            ],
          },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
      },
    });

    // Process sessions with eligible student information
    const formattedSessions: MentorSessionData[] = allSessions
      .filter((session) => {
        // Filter out sessions with invalid IDs
        const hasValidId =
          session.id && typeof session.id === "string" && session.id.trim().length > 0;
        if (!hasValidId) {
          console.error("❌ Filtering out session with invalid ID:", {
            session,
            id: session.id,
            idType: typeof session.id,
          });
        }
        return hasValidId;
      })
      .map((session) => {
        // For individual session bookings, we already have student info
        if (session.sessionCategory === "individual") {
          const result = {
            id: session.id,
            title:
              session.title ||
              `${session.sessionType || "Session"} with ${session.studentName || "Student"}`,
            scheduledTime: session.scheduledTime,
            duration: getSessionDuration(session),
            sessionType: session.sessionType,
            status: session.status,
            link: session.link ?? null,
            createdAt: session.createdAt
              ? (_convertMongoDate(session.createdAt) ?? new Date())
              : new Date(),
            updatedAt: session.updatedAt
              ? (_convertMongoDate(session.updatedAt) ?? new Date())
              : new Date(),
            sessionCategory: session.sessionCategory,
            eligibleStudents: {
              total: 1, // Already booked by one student
              active: 1,
              byPlan: {
                SEED: 0,
                BLOOM: 0,
                FLOURISH: 0,
              },
            },
            potentialStudents: [
              {
                id: session.studentId ?? "unknown",
                name: session.studentName ?? null,
                email: session.studentEmail ?? "unknown@example.com",
                subscriptionPlan: null, // We don't have this from the booking data
                subscriptionStatus: "ACTIVE", // Assume active since they booked
              },
            ],
          };

          return result;
        }

        // For subscription sessions, calculate eligible users
        let sessionEligibleUsers = eligibleUsers;

        if (session.sessionType === "MEDITATION") {
          // MEDITATION sessions are available to SEED and FLOURISH users
          sessionEligibleUsers = eligibleUsers.filter(
            (user) => user.subscriptionPlan === "SEED" || user.subscriptionPlan === "FLOURISH"
          );
        } else if (session.sessionType === "YOGA") {
          // YOGA sessions are available to BLOOM and FLOURISH users
          sessionEligibleUsers = eligibleUsers.filter(
            (user) => user.subscriptionPlan === "BLOOM" || user.subscriptionPlan === "FLOURISH"
          );
        } else if (session.sessionType === "DIET") {
          // DIET sessions are available to FLOURISH users (or all users if you prefer)
          sessionEligibleUsers = eligibleUsers.filter(
            (user) => user.subscriptionPlan === "FLOURISH"
          );
        }

        // Count by plan
        const byPlan = {
          SEED: sessionEligibleUsers.filter((u) => u.subscriptionPlan === "SEED").length,
          BLOOM: sessionEligibleUsers.filter((u) => u.subscriptionPlan === "BLOOM").length,
          FLOURISH: sessionEligibleUsers.filter((u) => u.subscriptionPlan === "FLOURISH").length,
        };

        const activeUsers = sessionEligibleUsers.filter((u) => u.subscriptionStatus === "ACTIVE");

        return {
          id: session.id,
          title: session.title,
          scheduledTime: session.scheduledTime,
          duration: getSessionDuration(session),
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
          potentialStudents: sessionEligibleUsers.slice(0, 10), // Show first 10 potential students
        };
      });

    // Validation complete - all sessions formatted

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
      },
    };
      },
      CACHE_TTL.SHORT
    );
  } catch (error) {
    console.error("Error fetching mentor sessions:", error);
    return { success: false, error: "Failed to fetch mentor sessions" };
  }
}

// Invalidate mentor sessions cache
export async function invalidateMentorSessionsCache(mentorId: string): Promise<void> {
  await invalidateCache(`mentor:sessions:${mentorId}`);
}
