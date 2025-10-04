"use server";

import { prisma } from "@/lib/config/prisma";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { convertMongoDate } from "@/lib/utils/datetime-utils";
import type { MongoAggregateResult, SessionDocument } from "@/lib/types/common";

export interface DashboardData {
  classesThisWeek: number;
  totalPracticeTime: string;
  goalsAchieved: number;
  totalGoals: number;
  streakDays: number;
  todaySchedule: {
    id: string;
    title: string;
    mentor: string;
    time: string;
    scheduledTime: Date;
    type: "yoga" | "meditation";
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }[];
  upcomingSessions: {
    id: string;
    title: string;
    mentor: string;
    time: string;
    type: "yoga" | "meditation";
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }[];
  monthlyStats: {
    currentMonth: {
      sessions: number;
      practiceTime: number; // in minutes
    };
    previousMonth: {
      sessions: number;
      practiceTime: number; // in minutes
    };
  };
}

export async function getUserDashboardData(): Promise<{
  success: boolean;
  data?: DashboardData;
  error?: string;
}> {
  try {
    // Get the session using headers (similar to mentor-overview-server.ts)
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        // Get user's session data
        sessions: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          select: {
            id: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Date calculations (similar to mentor analytics)
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Get start of week (Monday)
    const startOfWeek = (() => {
      const date = new Date(now);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(date.setDate(diff));
      monday.setHours(0, 0, 0, 0);
      return monday;
    })();
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get user's scheduled sessions for this week (as a student)
    const userScheduledSessionsResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            scheduledTime: {
              $gte: startOfWeek,
              $lte: endOfWeek,
            },
            status: {
              $in: ["SCHEDULED", "COMPLETED"],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "mentorId",
            foreignField: "_id",
            as: "mentor",
          },
        },
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                then: {
                  $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$scheduledTime" },
                },
                else: "$scheduledTime",
              },
            },
            createdAt: {
              $cond: {
                if: { $eq: [{ $type: "$createdAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
                else: "$createdAt",
              },
            },
            updatedAt: {
              $cond: {
                if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
                else: "$updatedAt",
              },
            },
          },
        },
      ],
      cursor: {},
    });

    let userScheduledSessions =
      (userScheduledSessionsResult as unknown as MongoAggregateResult<SessionDocument>)?.cursor
        ?.firstBatch || [];
    userScheduledSessions = userScheduledSessions.map((session: SessionDocument) => ({
      ...session,
      id: session._id.toString(),
      scheduledTime: convertMongoDate(session.scheduledTime) || new Date(),
      createdAt: convertMongoDate(session.createdAt) || new Date(),
      updatedAt: convertMongoDate(session.updatedAt) || new Date(),
      mentor: (session as Record<string, unknown>).mentor
        ? { name: ((session as Record<string, unknown>).mentor as Record<string, unknown>).name }
        : null,
    }));

    // Calculate classes this week based on actual scheduled sessions
    const classesThisWeek = userScheduledSessions.filter(
      (session: SessionDocument) => session.status === "COMPLETED" || session.scheduledTime <= now
    ).length;

    // Calculate total practice time based on completed sessions
    const totalMinutes = classesThisWeek * 45; // 45 minutes per session
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const totalPracticeTime = `${hours}h ${minutes}m`;

    // Calculate goals based on user activity and subscription level
    const subscriptionGoals = {
      SEED: 4, // 4 sessions per week
      BLOOM: 6, // 6 sessions per week
      FLOURISH: 8, // 8 sessions per week
    };
    const totalGoals =
      subscriptionGoals[user.subscriptionPlan as keyof typeof subscriptionGoals] || 4;
    const goalsAchieved = Math.min(classesThisWeek, totalGoals);

    // Calculate streak days based on recent activity
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentSessionsResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            scheduledTime: { $gte: thirtyDaysAgo },
            status: "COMPLETED",
          },
        },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                then: {
                  $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$scheduledTime" },
                },
                else: "$scheduledTime",
              },
            },
          },
        },
        { $sort: { scheduledTime: -1 } },
      ],
      cursor: {},
    });

    let recentSessions = (recentSessionsResult as any)?.cursor?.firstBatch || [];
    recentSessions = recentSessions.map((session: any) => ({
      ...session,
      id: session._id.toString(),
      scheduledTime: convertMongoDate(session.scheduledTime) || new Date(),
    }));

    // Calculate streak (simplified - count consecutive days with sessions)
    let streakDays = 0;
    if (recentSessions.length > 0) {
      const today = new Date();
      const sessionDates = recentSessions.map((s: any) => new Date(s.scheduledTime).toDateString());

      // Count consecutive days from today backwards
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        const checkDateString = checkDate.toDateString();

        if (sessionDates.includes(checkDateString)) {
          streakDays++;
        } else if (i > 0) {
          break; // Break streak if no session found
        }
      }
    }

    // Get today's scheduled sessions from BOTH Schedule and SessionBooking collections
    // Schedule collection: Subscription-based recurring sessions
    const todayScheduleResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            userId: session.user.id,
            scheduledTime: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
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
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                then: {
                  $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$scheduledTime" },
                },
                else: "$scheduledTime",
              },
            },
            createdAt: {
              $cond: {
                if: { $eq: [{ $type: "$createdAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
                else: "$createdAt",
              },
            },
            updatedAt: {
              $cond: {
                if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
                else: "$updatedAt",
              },
            },
          },
        },
        { $sort: { scheduledTime: 1 } },
      ],
      cursor: {},
    });

    // SessionBooking collection: One-to-one individual sessions
    const todayBookingsResult = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: session.user.id,
            scheduledAt: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
            paymentStatus: "COMPLETED", // Only show paid bookings
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
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            scheduledAt: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$scheduledAt" } },
                else: "$scheduledAt",
              },
            },
            createdAt: {
              $cond: {
                if: { $eq: [{ $type: "$createdAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
                else: "$createdAt",
              },
            },
            updatedAt: {
              $cond: {
                if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
                else: "$updatedAt",
              },
            },
          },
        },
        { $sort: { scheduledAt: 1 } },
      ],
      cursor: {},
    });

    // Merge and process both session types
    const todaySchedule: any[] = [];

    // Process subscription sessions from Schedule
    const scheduleSessions = (todayScheduleResult as any)?.cursor?.firstBatch || [];
    scheduleSessions.forEach((session: any) => {
      todaySchedule.push({
        ...session,
        id: session._id.toString(),
        scheduledTime: convertMongoDate(session.scheduledTime) || new Date(),
        createdAt: convertMongoDate(session.createdAt) || new Date(),
        updatedAt: convertMongoDate(session.updatedAt) || new Date(),
        mentor: session.mentor ? { name: session.mentor.name } : null,
        sessionCategory: "subscription",
      });
    });

    // Process one-to-one sessions from SessionBooking
    const bookingSessions = (todayBookingsResult as any)?.cursor?.firstBatch || [];
    bookingSessions.forEach((session: any) => {
      todaySchedule.push({
        ...session,
        id: session._id.toString(),
        scheduledTime: convertMongoDate(session.scheduledAt) || new Date(), // Note: scheduledAt not scheduledTime
        sessionType: session.sessionType,
        status: session.status,
        title: session.title || `${session.sessionType} Session`,
        createdAt: convertMongoDate(session.createdAt) || new Date(),
        updatedAt: convertMongoDate(session.updatedAt) || new Date(),
        mentor: session.mentor ? { name: session.mentor.name } : null,
        sessionCategory: "individual",
      });
    });

    // Sort all sessions by scheduled time
    todaySchedule.sort((a, b) => {
      const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
      const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
      return timeA - timeB;
    });

    // Get upcoming sessions (next 7 days) from BOTH Schedule and SessionBooking
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Schedule collection: Subscription-based recurring sessions
    const upcomingScheduleResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            userId: session.user.id,
            scheduledTime: {
              $gt: now,
              $lte: sevenDaysFromNow,
            },
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
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            scheduledTime: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledTime" }, "date"] },
                then: {
                  $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$scheduledTime" },
                },
                else: "$scheduledTime",
              },
            },
            createdAt: {
              $cond: {
                if: { $eq: [{ $type: "$createdAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
                else: "$createdAt",
              },
            },
            updatedAt: {
              $cond: {
                if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
                else: "$updatedAt",
              },
            },
          },
        },
        { $sort: { scheduledTime: 1 } },
      ],
      cursor: {},
    });

    // SessionBooking collection: One-to-one individual sessions
    const upcomingBookingsResult = await prisma.$runCommandRaw({
      aggregate: "sessionBooking",
      pipeline: [
        {
          $match: {
            userId: session.user.id,
            scheduledAt: {
              $gt: now,
              $lte: sevenDaysFromNow,
            },
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
        { $unwind: { path: "$mentor", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            scheduledAt: {
              $cond: {
                if: { $eq: [{ $type: "$scheduledAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$scheduledAt" } },
                else: "$scheduledAt",
              },
            },
            createdAt: {
              $cond: {
                if: { $eq: [{ $type: "$createdAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$createdAt" } },
                else: "$createdAt",
              },
            },
            updatedAt: {
              $cond: {
                if: { $eq: [{ $type: "$updatedAt" }, "date"] },
                then: { $dateToString: { format: "%Y-%m-%dT%H:%M:%S.%LZ", date: "$updatedAt" } },
                else: "$updatedAt",
              },
            },
          },
        },
        { $sort: { scheduledAt: 1 } },
      ],
      cursor: {},
    });

    // Merge and process both session types for upcoming sessions
    let upcomingSessions: any[] = [];

    // Process subscription sessions from Schedule
    const upcomingScheduleSessions = (upcomingScheduleResult as any)?.cursor?.firstBatch || [];
    upcomingScheduleSessions.forEach((upcomingSession: any) => {
      upcomingSessions.push({
        ...upcomingSession,
        id: upcomingSession._id.toString(),
        scheduledTime: convertMongoDate(upcomingSession.scheduledTime) || new Date(),
        createdAt: convertMongoDate(upcomingSession.createdAt) || new Date(),
        updatedAt: convertMongoDate(upcomingSession.updatedAt) || new Date(),
        mentor: upcomingSession.mentor ? { name: upcomingSession.mentor.name } : null,
        sessionCategory: "subscription",
      });
    });

    // Process one-to-one sessions from SessionBooking
    const upcomingBookingSessions = (upcomingBookingsResult as any)?.cursor?.firstBatch || [];
    upcomingBookingSessions.forEach((upcomingSession: any) => {
      upcomingSessions.push({
        ...upcomingSession,
        id: upcomingSession._id.toString(),
        scheduledTime: convertMongoDate(upcomingSession.scheduledAt) || new Date(),
        sessionType: upcomingSession.sessionType,
        status: upcomingSession.status,
        title: upcomingSession.title || `${upcomingSession.sessionType} Session`,
        createdAt: convertMongoDate(upcomingSession.createdAt) || new Date(),
        updatedAt: convertMongoDate(upcomingSession.updatedAt) || new Date(),
        mentor: upcomingSession.mentor ? { name: upcomingSession.mentor.name } : null,
        sessionCategory: "individual",
      });
    });

    // Sort by scheduled time and limit to 5
    upcomingSessions.sort((a, b) => {
      const timeA = a.scheduledTime ? new Date(a.scheduledTime).getTime() : 0;
      const timeB = b.scheduledTime ? new Date(b.scheduledTime).getTime() : 0;
      return timeA - timeB;
    });
    upcomingSessions = upcomingSessions.slice(0, 5);

    // Get monthly stats
    const currentMonthSessionsResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            scheduledTime: {
              $gte: startOfMonth,
              $lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            },
            status: "COMPLETED",
          },
        },
        { $count: "total" },
      ],
      cursor: {},
    });
    const currentMonthSessions =
      (currentMonthSessionsResult as any)?.cursor?.firstBatch?.[0]?.total || 0;

    const previousMonthSessionsResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            scheduledTime: {
              $gte: startOfPreviousMonth,
              $lte: endOfPreviousMonth,
            },
            status: "COMPLETED",
          },
        },
        { $count: "total" },
      ],
      cursor: {},
    });
    const previousMonthSessions =
      (previousMonthSessionsResult as any)?.cursor?.firstBatch?.[0]?.total || 0;

    // Format the data
    const formatSessionTime = (date: Date) => {
      return new Date(date).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    };

    return {
      success: true,
      data: {
        classesThisWeek,
        totalPracticeTime,
        goalsAchieved,
        totalGoals,
        streakDays,
        todaySchedule: todaySchedule.map((session: any) => ({
          id: session.id,
          title: session.title || `${session.sessionType} Session`,
          mentor: session.mentor?.name || "Mentor",
          time: formatSessionTime(session.scheduledTime),
          scheduledTime: session.scheduledTime, // Add full datetime for time-based logic
          type: session.sessionType.toLowerCase() as "yoga" | "meditation",
          status: session.status as "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
        })),
        upcomingSessions: upcomingSessions.map((session: any) => ({
          id: session.id,
          title: session.title || `${session.sessionType} Session`,
          mentor: session.mentor?.name || "Mentor",
          time: formatSessionTime(session.scheduledTime),
          type: session.sessionType.toLowerCase() as "yoga" | "meditation",
          status: session.status as "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
        })),
        monthlyStats: {
          currentMonth: {
            sessions: currentMonthSessions,
            practiceTime: currentMonthSessions * 45, // 45 minutes per session
          },
          previousMonth: {
            sessions: previousMonthSessions,
            practiceTime: previousMonthSessions * 45,
          },
        },
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return { success: false, error: "Failed to fetch dashboard data" };
  }
}
