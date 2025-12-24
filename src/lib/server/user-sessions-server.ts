"use server";

import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { getUserSubscription } from "@/lib/subscriptions";
import { type Prisma } from "@prisma/client";
import { headers } from "next/headers";
import type { ScheduleDocument } from "@/lib/types/sessions";
import type { MongoCommandResult, DateValue } from "@/lib/types/mongodb";
import { isMongoDate } from "@/lib/types/mongodb";
import { withCache, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

/**
 * Helper function to convert MongoDB extended JSON dates to JavaScript Date objects
 */
function convertMongoDate(dateValue: DateValue): Date | null {
  if (!dateValue) return null;

  try {
    // Handle MongoDB extended JSON format like { "$date": "2024-01-01T00:00:00.000Z" }
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

export interface UserSessionData {
  id: string;
  title: string;
  scheduledTime: Date;
  manualStartTime?: Date | null; // When session was actually started by mentor
  duration: number;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  link?: string; // Session link for joining
  mentor: {
    id: string;
    name: string | null;
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  };
}

export interface UserSessionsResponse {
  success: boolean;
  data?: {
    subscriptionStatus: string;
    subscriptionPlan: string | null;
    sessions: UserSessionData[];
    needsSubscription: boolean;
    nextBillingDate?: string | null;
    isTrialExpired?: boolean;
  };
  error?: string;
}

/**
 * Get user sessions based on their subscription plan and status
 */
export async function getUserSessions(): Promise<UserSessionsResponse> {
  try {
    // Get the session using headers
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Cache user sessions with 1 minute TTL
    return await withCache(
      `user:sessions:${session.user.id}`,
      async () => {
        // Helper function to fetch paid one-on-one session bookings
        const fetchPaidSessionBookings = async (userId: string): Promise<UserSessionData[]> => {
      try {
        const sessionBookingsResult = await prisma.$runCommandRaw({
          aggregate: "sessionBooking",
          pipeline: [
            {
              $match: {
                userId: userId,
                status: { $in: ["SCHEDULED", "ONGOING", "COMPLETED"] },
                paymentStatus: "COMPLETED",
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
              },
            },
            {
              $project: {
                id: "$_id",
                title: {
                  $concat: [
                    { $toUpper: { $substr: ["$sessionType", 0, 1] } },
                    { $toLower: { $substr: ["$sessionType", 1, -1] } },
                    " Session with ",
                    { $ifNull: ["$mentorData.name", "Mentor"] },
                  ],
                },
                scheduledTime: {
                  $cond: {
                    if: { $and: [{ $ne: ["$scheduledAt", null] }, { $ne: ["$scheduledAt", ""] }] },
                    then: "$scheduledAt", // Return the date as-is instead of converting to string
                    else: null,
                  },
                },
                duration: {
                  $cond: {
                    // Case 1: COMPLETED session - use stored actualDuration if available
                    if: { $eq: ["$status", "COMPLETED"] },
                    then: {
                      $ifNull: ["$actualDuration", 60], // Use stored duration or fallback to 60
                    },
                    // Case 2: ONGOING session with manualStartTime - show elapsed duration
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            { $eq: ["$status", "ONGOING"] },
                            { $ne: ["$manualStartTime", null] },
                          ],
                        },
                        then: {
                          $cond: {
                            if: { $ne: [{ $type: "$manualStartTime" }, "missing"] },
                            then: {
                              $divide: [
                                {
                                  $subtract: ["$$NOW", { $toDate: "$manualStartTime" }],
                                },
                                60000,
                              ],
                            },
                            else: 60,
                          },
                        },
                        // Case 3: SCHEDULED or fallback - use planned duration from time slot
                        else: {
                          $cond: {
                            if: {
                              $and: [
                                { $ne: ["$timeSlotData", null] },
                                { $ne: ["$timeSlotData.endTime", null] },
                                { $ne: ["$timeSlotData.startTime", null] },
                              ],
                            },
                            then: {
                              $divide: [
                                {
                                  $subtract: [
                                    { $toDate: "$timeSlotData.endTime" },
                                    { $toDate: "$timeSlotData.startTime" },
                                  ],
                                },
                                60000,
                              ],
                            },
                            else: 60,
                          },
                        },
                      },
                    },
                  },
                },
                manualStartTime: {
                  $cond: {
                    if: { $ne: ["$manualStartTime", null] },
                    then: {
                      $cond: {
                        if: { $eq: [{ $type: "$manualStartTime" }, "date"] },
                        then: {
                          $dateToString: {
                            format: "%Y-%m-%dT%H:%M:%S.%LZ",
                            date: "$manualStartTime",
                          },
                        },
                        else: "$manualStartTime",
                      },
                    },
                    else: null,
                  },
                }, // Include actual start time for client-side elapsed calculation
                sessionType: 1,
                status: 1,
                link: "$timeSlotData.sessionLink",
                mentor: {
                  id: "$mentorData._id",
                  name: "$mentorData.name",
                  mentorType: "$mentorData.mentorType",
                },
              },
            },
          ],
          cursor: {},
        });

        let sessionBookings: UserSessionData[] = [];
        if (
          sessionBookingsResult &&
          typeof sessionBookingsResult === "object" &&
          "cursor" in sessionBookingsResult &&
          sessionBookingsResult.cursor &&
          typeof sessionBookingsResult.cursor === "object" &&
          "firstBatch" in sessionBookingsResult.cursor &&
          Array.isArray(sessionBookingsResult.cursor.firstBatch)
        ) {
          sessionBookings = sessionBookingsResult.cursor.firstBatch as unknown as UserSessionData[];
        }

        return sessionBookings;
      } catch (error) {
        console.error("Error fetching paid session bookings:", error);
        return [];
      }
    };

    // Get user subscription details
    const subscriptionResult = await getUserSubscription(session.user.id);

    if (!subscriptionResult.success) {
      return { success: false, error: "Failed to get subscription details" };
    }

    const subscription = subscriptionResult.subscription;
    const now = new Date();

    // Helper function to detect if trial has expired
    const isTrialExpired = (): boolean => {
      // Check if user had a trial that ended and never had a paid subscription
      return !!(
        subscription?.trialEndDate &&
        subscription.trialEndDate <= now &&
        subscription.subscriptionStatus === "INACTIVE" &&
        (!subscription.subscriptionPlan || subscription.paymentAmount === 0)
      );
    };

    if (!subscription) {
      // User has no subscription record, check for paid one-on-one bookings
      const paidBookings = await fetchPaidSessionBookings(session.user.id);

      if (paidBookings.length > 0) {
        return {
          success: true,
          data: {
            subscriptionStatus: "INACTIVE",
            subscriptionPlan: null,
            sessions: paidBookings,
            needsSubscription: false, // Don't require subscription if they have paid bookings
            nextBillingDate: null,
            isTrialExpired: false,
          },
        };
      }

      // No subscription and no paid bookings
      return {
        success: true,
        data: {
          subscriptionStatus: "INACTIVE",
          subscriptionPlan: null,
          sessions: [],
          needsSubscription: true,
          nextBillingDate: null,
          isTrialExpired: false, // No trial data available
        },
      };
    }

    // Check if user needs subscription
    // For cancelled subscriptions, check nextBillingDate instead of subscriptionEndDate
    let needsSubscription = false;

    if (
      subscription.subscriptionStatus === "INACTIVE" ||
      subscription.subscriptionStatus === "EXPIRED"
    ) {
      needsSubscription = true;
    } else if (
      subscription.subscriptionStatus === "CANCELLED" ||
      subscription.subscriptionStatus === "ACTIVE_UNTIL_END"
    ) {
      // For cancelled subscriptions, allow access until nextBillingDate
      const accessEndDate = subscription.nextBillingDate || subscription.subscriptionEndDate;
      needsSubscription = accessEndDate ? new Date(accessEndDate) <= now : true;
    } else if (subscription.subscriptionStatus === "ACTIVE") {
      // For active subscriptions (including trials), check subscriptionEndDate if it exists
      needsSubscription = subscription.subscriptionEndDate
        ? new Date(subscription.subscriptionEndDate) <= now
        : false;
    }

    if (needsSubscription) {
      // User needs subscription, but check for paid one-on-one bookings first
      const paidBookings = await fetchPaidSessionBookings(session.user.id);

      if (paidBookings.length > 0) {
        return {
          success: true,
          data: {
            subscriptionStatus: subscription.subscriptionStatus,
            subscriptionPlan: subscription.subscriptionPlan,
            sessions: paidBookings,
            needsSubscription: false, // Override since they have paid sessions
            nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
            isTrialExpired: isTrialExpired(),
          },
        };
      }

      // No paid bookings, show subscription needed
      return {
        success: true,
        data: {
          subscriptionStatus: subscription.subscriptionStatus,
          subscriptionPlan: subscription.subscriptionPlan,
          sessions: [],
          needsSubscription: true,
          nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
          isTrialExpired: isTrialExpired(),
        },
      };
    }

    // Get sessions based on subscription plan
    const sessionFilters: Prisma.ScheduleWhereInput = {
      // Get all sessions (past and future) for the user's subscription period
      scheduledTime: {
        gte: subscription.subscriptionStartDate || new Date(0), // From subscription start or beginning of time
      },
    };

    // Filter by mentor type based on subscription plan
    if (subscription.subscriptionPlan === "SEED") {
      // SEED plan gets MEDITATION sessions only
      sessionFilters.sessionType = "MEDITATION";
    } else if (subscription.subscriptionPlan === "BLOOM") {
      // BLOOM plan gets YOGA sessions only
      sessionFilters.sessionType = "YOGA";
    }
    // FLOURISH plan gets both YOGA and MEDITATION sessions (no additional filter needed)

    // Get sessions from both Schedule and SessionBooking collections

    // 1. Get sessions from SessionBooking collection (new time slot bookings)
    const sessionBookingsResult = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: session.user.id,
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
          },
        },
        {
          $project: {
            id: "$_id",
            title: {
              $concat: [
                { $toUpper: { $substr: ["$sessionType", 0, 1] } },
                { $toLower: { $substr: ["$sessionType", 1, -1] } },
                " Session with ",
                { $ifNull: ["$mentorData.name", "Mentor"] },
              ],
            },
            scheduledTime: {
              $cond: {
                if: { $and: [{ $ne: ["$scheduledAt", null] }, { $ne: ["$scheduledAt", ""] }] },
                then: "$scheduledAt", // Return the date as-is instead of converting to string
                else: null,
              },
            },
            duration: {
              $cond: {
                // Case 1: COMPLETED session - use stored actualDuration if available
                if: { $eq: ["$status", "COMPLETED"] },
                then: {
                  $ifNull: ["$actualDuration", 60], // Use stored duration or fallback to 60
                },
                // Case 2: ONGOING session with manualStartTime - show elapsed duration
                else: {
                  $cond: {
                    if: {
                      $and: [{ $eq: ["$status", "ONGOING"] }, { $ne: ["$manualStartTime", null] }],
                    },
                    then: {
                      $cond: {
                        if: { $ne: [{ $type: "$manualStartTime" }, "missing"] },
                        then: {
                          $divide: [
                            {
                              $subtract: ["$$NOW", { $toDate: "$manualStartTime" }],
                            },
                            60000,
                          ],
                        },
                        else: 60,
                      },
                    },
                    // Case 3: SCHEDULED or fallback - use planned duration from time slot
                    else: {
                      $cond: {
                        if: {
                          $and: [
                            { $ne: ["$timeSlotData", null] },
                            { $ne: ["$timeSlotData.endTime", null] },
                            { $ne: ["$timeSlotData.startTime", null] },
                          ],
                        },
                        then: {
                          $divide: [
                            {
                              $subtract: [
                                { $toDate: "$timeSlotData.endTime" },
                                { $toDate: "$timeSlotData.startTime" },
                              ],
                            },
                            60000,
                          ],
                        },
                        else: 60,
                      },
                    },
                  },
                },
              },
            }, // Calculate actual/elapsed/planned duration based on session status
            manualStartTime: {
              $cond: {
                if: { $ne: ["$manualStartTime", null] },
                then: {
                  $cond: {
                    if: { $eq: [{ $type: "$manualStartTime" }, "date"] },
                    then: {
                      $dateToString: {
                        format: "%Y-%m-%dT%H:%M:%S.%LZ",
                        date: "$manualStartTime",
                      },
                    },
                    else: "$manualStartTime",
                  },
                },
                else: null,
              },
            }, // Include actual start time for client-side elapsed calculation
            sessionType: 1,
            status: 1,
            link: "$timeSlotData.sessionLink", // Add session link from time slot
            mentor: {
              id: "$mentorData._id",
              name: "$mentorData.name",
              mentorType: "$mentorData.mentorType",
            },
          },
        },
      ],
      cursor: {},
    });

    let sessionBookings: UserSessionData[] = [];
    if (
      sessionBookingsResult &&
      typeof sessionBookingsResult === "object" &&
      "cursor" in sessionBookingsResult &&
      sessionBookingsResult.cursor &&
      typeof sessionBookingsResult.cursor === "object" &&
      "firstBatch" in sessionBookingsResult.cursor &&
      Array.isArray(sessionBookingsResult.cursor.firstBatch)
    ) {
      sessionBookings = sessionBookingsResult.cursor.firstBatch as unknown as UserSessionData[];
    }

    // 2. Get sessions from Schedule collection (legacy sessions) - filtered by subscription plan
    // Use $runCommandRaw to handle corrupted date strings in the database

    // Build MongoDB match filter from Prisma where clause
    const buildMongoMatch = (filters: Record<string, unknown>): Record<string, unknown> => {
      const match: Record<string, unknown> = {};

      if (filters.mentorId) match.mentorId = filters.mentorId;

      // Handle status filter
      if (filters.status) {
        if (typeof filters.status === "string") {
          match.status = filters.status;
        } else if (
          typeof filters.status === "object" &&
          filters.status !== null &&
          "in" in filters.status &&
          Array.isArray(filters.status.in)
        ) {
          match.status = { $in: filters.status.in };
        }
      }

      return match;
    };

    const scheduleResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: buildMongoMatch(sessionFilters) as Prisma.InputJsonValue,
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
          },
        },
        {
          $project: {
            _id: 1,
            id: "$_id",
            title: 1,
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
                    else: "$scheduledTime",
                  },
                },
                else: null,
              },
            },
            duration: { $ifNull: ["$duration", 60] }, // Default to 60 if not present
            sessionType: 1,
            status: 1,
            link: 1,
            createdAt: 1,
            updatedAt: 1,
            mentorId: 1,
            mentorName: "$mentorData.name",
            mentorType: "$mentorData.mentorType",
          },
        },
        {
          $sort: { scheduledTime: -1 },
        },
        {
          $limit: 50,
        },
      ],
      cursor: {},
    });

    let sessions: ScheduleDocument[] = [];
    if (
      scheduleResult &&
      typeof scheduleResult === "object" &&
      "cursor" in scheduleResult &&
      scheduleResult.cursor &&
      typeof scheduleResult.cursor === "object" &&
      "firstBatch" in scheduleResult.cursor &&
      Array.isArray(scheduleResult.cursor.firstBatch)
    ) {
      sessions = (scheduleResult as unknown as MongoCommandResult<ScheduleDocument>).cursor!
        .firstBatch;
    }

    const formattedSessions: UserSessionData[] = sessions.map((session) => {
      const scheduledTime = convertMongoDate(session.scheduledTime);

      return {
        id: session._id.toString(),
        title: session.title,
        scheduledTime: scheduledTime || new Date(), // Fallback to current date if conversion fails
        duration: session.duration || 60, // Default to 60 minutes if not available
        sessionType: session.sessionType,
        status: session.status,
        link: session.link, // Add session link for legacy sessions
        mentor: {
          id: session.mentorId,
          name: (session as unknown as { mentorName?: string }).mentorName || "Unknown",
          mentorType:
            ((session as unknown as { mentorType?: string }).mentorType as
              | "YOGAMENTOR"
              | "MEDITATIONMENTOR"
              | "DIETPLANNER") || null,
        },
      };
    });

    // 3. Combine sessions from both sources
    const allSessions = [...sessionBookings, ...formattedSessions];

    // 4. Sort by scheduled time (most recent first for display purposes)
    allSessions.sort(
      (a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime()
    );

    return {
      success: true,
      data: {
        subscriptionStatus: subscription.subscriptionStatus,
        subscriptionPlan: subscription.subscriptionPlan,
        sessions: allSessions,
        needsSubscription: false,
        nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
        isTrialExpired: false, // Active users don't have expired trials
      },
    };
      },
      CACHE_TTL.SHORT // 1 minute
    );
  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return { success: false, error: "Failed to fetch sessions" };
  }
}

/**
 * Invalidate user sessions cache
 */
export async function invalidateUserSessionsCache(userId: string): Promise<void> {
  await invalidateCache(`user:sessions:${userId}`);
}
