"use server";

import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { getMentorType } from "../mentor-type";
import { prisma } from "@/lib/config/prisma";
import type { ScheduleDocument, SessionBookingDocument } from "@/lib/types/sessions";
import type { DateValue } from "@/lib/types/mongodb";
import { isMongoDate } from "@/lib/types/mongodb";

/**
 * Helper function to convert MongoDB extended JSON dates to JavaScript Date objects
 */
function _convertMongoDate(dateValue: DateValue): Date | null {
  if (!dateValue) return null;

  try {
    if (isMongoDate(dateValue)) {
      return new Date(dateValue.$date);
    }
    if (dateValue instanceof Date) {
      return dateValue;
    }
    return new Date(dateValue);
  } catch (error) {
    console.error("Error converting date:", error);
    return null;
  }
}

// Helper function to get students for a specific mentor
// Uses similar logic to getStudents from students.ts but adds mentor-specific filtering
// This function:
// 1. Gets all active students with BLOOM/FLOURISH subscriptions (same as getStudents())
// 2. Analyzes mentor's session history to estimate their active student count
// 3. Returns both total active students and mentor-specific estimates
export async function getMentorStudents(mentorId: string) {
  try {
    // Get all active students (using the same logic as getStudents)
    const mentoremail = await prisma.user.findUnique({
      where: { id: mentorId },
      select: { email: true },
    });
    const mentortype = await getMentorType(mentoremail || { email: "" });

    // Get all active students with role "USER" (excluding mentors who have role "MENTOR")
    const allActiveStudents = await prisma.user.findMany({
      where: {
        role: "USER", // Only users with USER role (mentors have MENTOR role)
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: {
          in: [
            mentortype == "YOGAMENTOR"
              ? "BLOOM"
              : mentortype == "DIETPLANNER"
                ? "FLOURISH"
                : "SEED",
            "FLOURISH",
          ],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        createdAt: true,
      },
    });

    // Get students who have had sessions with this mentor in the last 90 days
    const mentorSessions = await prisma.schedule.findMany({
      where: {
        mentorId: mentorId,
        scheduledTime: {
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
        },
      },
      select: {
        id: true,
        scheduledTime: true,
      },
    });

    // For now, since we don't have a direct student-mentor relationship,
    // we'll return all active students as potential students for the mentor
    // In a real implementation, you'd filter this based on actual bookings/enrollments
    return {
      totalActiveStudents: allActiveStudents.length,
      mentorSessions: mentorSessions.length,

      students: allActiveStudents, // Return all active students for now
    };
  } catch (error) {
    console.error("Error getting mentor students:", error);
    return {
      totalActiveStudents: 0,
      mentorSessions: 0,
      students: [],
    };
  }
}

export interface MentorOverviewData {
  activeStudents: number;
  sessionsThisWeek: number;
  averageRating: number;
  todaysSessions: Array<{
    id: string;
    title: string;
    scheduledTime: Date;
    duration: number;
    sessionType: "YOGA" | "MEDITATION" | "DIET";
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }>;
  upcomingSessions: Array<{
    id: string;
    title: string;
    scheduledTime: Date;
    duration: number;
    sessionType: "YOGA" | "MEDITATION" | "DIET";
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: Date;
    details?: string;
  }>;
  monthlyStats: {
    currentMonth: {
      sessions: number;
      earnings: number;
      students: number;
    };
    previousMonth: {
      sessions: number;
      earnings: number;
      students: number;
    };
  };
}

export async function getMentorOverviewData(): Promise<{
  success: boolean;
  data?: MentorOverviewData;
  error?: string;
}> {
  try {
    // Get the session using headers
    const session = await auth.api.getSession({ headers: await headers() });

    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Verify the user is a mentor
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user || user.role !== "MENTOR") {
      return { success: false, error: "Only mentors can access this data" };
    }

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    // Get start of week (Monday) in IST timezone
    const startOfWeek = (() => {
      const date = new Date(now);
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
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
    // Get active students for this mentor using the improved logic
    // This uses the same subscription filtering as getStudents() from students.ts
    // but adds mentor-specific session analysis for more accurate counts
    const mentorStudentsData = await getMentorStudents(user.id);
    const totalMentorStudents = mentorStudentsData.totalActiveStudents;

    // Get sessions this week using raw query to handle datetime conversion
    const sessionsThisWeekResult = await prisma.$runCommandRaw({
      aggregate: "schedule",
      pipeline: [
        {
          $match: {
            mentorId: user.id,
            status: "SCHEDULED",
            scheduledTime: {
              $gte: startOfWeek,
              $lte: endOfWeek,
            },
          },
        },
        {
          $count: "totalSessions",
        },
      ],
      cursor: {},
    });

    let sessionsThisWeek = 0;
    if (
      sessionsThisWeekResult &&
      typeof sessionsThisWeekResult === "object" &&
      "cursor" in sessionsThisWeekResult &&
      sessionsThisWeekResult.cursor &&
      typeof sessionsThisWeekResult.cursor === "object" &&
      "firstBatch" in sessionsThisWeekResult.cursor &&
      Array.isArray(sessionsThisWeekResult.cursor.firstBatch) &&
      sessionsThisWeekResult.cursor.firstBatch.length > 0 &&
      sessionsThisWeekResult.cursor.firstBatch[0] &&
      typeof sessionsThisWeekResult.cursor.firstBatch[0] === "object" &&
      "totalSessions" in sessionsThisWeekResult.cursor.firstBatch[0]
    ) {
      sessionsThisWeek =
        (sessionsThisWeekResult.cursor.firstBatch[0] as { totalSessions?: number }).totalSessions ||
        0;
    }

    // Get today's sessions from both schedule and sessionBooking collections
    const todaysScheduleSessionsResult = await prisma.schedule.findRaw({
      filter: {
        mentorId: user.id,
        scheduledTime: {
          $gte: { $date: startOfDay.toISOString() },
          $lte: { $date: endOfDay.toISOString() },
        },
      },
      options: {
        sort: { scheduledTime: 1 },
      },
    });

    const todaysBookingSessionsResult = await prisma.sessionBooking.findRaw({
      filter: {
        mentorId: user.id,
        scheduledAt: {
          $gte: { $date: startOfDay.toISOString() },
          $lte: { $date: endOfDay.toISOString() },
        },
      },
      options: {
        sort: { scheduledAt: 1 },
      },
    });

    interface ProcessedSession {
      id: string;
      title: string;
      scheduledTime: Date | null;
      duration: number;
      sessionType: string;
      status: string;
      sessionCategory: "subscription" | "individual";
      [key: string]: unknown;
    }

    let todaysSessions: ProcessedSession[] = [];

    // Process schedule sessions
    if (Array.isArray(todaysScheduleSessionsResult)) {
      const scheduleSessions = (todaysScheduleSessionsResult as ScheduleDocument[]).map(
        (session): ProcessedSession => ({
          ...session,
          id: String(session._id || session.id),
          title: String(session.title || "Session"),
          scheduledTime: session.scheduledTime ? _convertMongoDate(session.scheduledTime) : null,
          duration: session.duration || 60,
          sessionType: String(session.sessionType),
          status: String(session.status),
          sessionCategory: "subscription",
        })
      );
      todaysSessions.push(...scheduleSessions);
    }

    // Process booking sessions (individual slots)
    if (Array.isArray(todaysBookingSessionsResult)) {
      const bookingSessions = (todaysBookingSessionsResult as SessionBookingDocument[]).map(
        (session): ProcessedSession => ({
          ...session,
          id: String(session._id || session.id),
          title: `${session.sessionType} Session`, // Generate title since bookings might not have titles
          scheduledTime: session.scheduledAt ? _convertMongoDate(session.scheduledAt) : null,
          duration:
            session.duration ||
            (session.sessionType === "MEDITATION" ? 30 : session.sessionType === "DIET" ? 45 : 60),
          sessionType: String(session.sessionType),
          status: String(session.status),
          sessionCategory: "individual",
        })
      );
      todaysSessions.push(...bookingSessions);
    }

    // Sort all sessions by scheduled time and limit to 5
    todaysSessions.sort((a, b) => {
      const timeA = a.scheduledTime ? a.scheduledTime.getTime() : 0;
      const timeB = b.scheduledTime ? b.scheduledTime.getTime() : 0;
      return timeA - timeB;
    });
    todaysSessions = todaysSessions.slice(0, 5);
    // Get upcoming sessions (next 7 days) from both schedule and sessionBooking collections
    const upcomingScheduleSessionsResult = await prisma.schedule.findRaw({
      filter: {
        mentorId: user.id,
        scheduledTime: {
          $gt: { $date: now.toISOString() },
          $lte: { $date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        },
      },
      options: {
        sort: { scheduledTime: 1 },
      },
    });

    const upcomingBookingSessionsResult = await prisma.sessionBooking.findRaw({
      filter: {
        mentorId: user.id,
        scheduledAt: {
          $gt: { $date: now.toISOString() },
          $lte: { $date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString() },
        },
      },
      options: {
        sort: { scheduledAt: 1 },
      },
    });

    let upcomingSessions: ProcessedSession[] = [];

    // Process schedule sessions
    if (Array.isArray(upcomingScheduleSessionsResult)) {
      const scheduleSessions = (upcomingScheduleSessionsResult as ScheduleDocument[]).map(
        (session): ProcessedSession => ({
          ...session,
          id: String(session._id || session.id),
          title: String(session.title || "Session"),
          scheduledTime: session.scheduledTime ? _convertMongoDate(session.scheduledTime) : null,
          duration: session.duration || 60,
          sessionType: String(session.sessionType),
          status: String(session.status),
          sessionCategory: "subscription",
        })
      );
      upcomingSessions.push(...scheduleSessions);
    }

    // Process booking sessions (individual slots)
    if (Array.isArray(upcomingBookingSessionsResult)) {
      const bookingSessions = (upcomingBookingSessionsResult as SessionBookingDocument[]).map(
        (session): ProcessedSession => ({
          ...session,
          id: String(session._id || session.id),
          title: `${session.sessionType} Session`,
          scheduledTime: session.scheduledAt ? _convertMongoDate(session.scheduledAt) : null,
          duration:
            session.duration ||
            (session.sessionType === "MEDITATION" ? 30 : session.sessionType === "DIET" ? 45 : 60),
          sessionType: String(session.sessionType),
          status: String(session.status),
          sessionCategory: "individual",
        })
      );
      upcomingSessions.push(...bookingSessions);
    }

    // Sort all sessions by scheduled time and limit to 5
    upcomingSessions.sort((a, b) => {
      const timeA = a.scheduledTime ? a.scheduledTime.getTime() : 0;
      const timeB = b.scheduledTime ? b.scheduledTime.getTime() : 0;
      return timeA - timeB;
    });
    upcomingSessions = upcomingSessions.slice(0, 5);

    // Get recent activity from system logs
    const recentActivity = await prisma.systemLog.findMany({
      where: {
        userId: user.id,
        category: { in: ["MENTOR", "SYSTEM"] },
      },
      orderBy: { timestamp: "desc" },
      take: 5,
      select: {
        id: true,
        action: true,
        timestamp: true,
        details: true,
      },
    });

    // Get monthly stats using Prisma count with better error handling
    const currentMonthSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gte: startOfMonth,
          lte: now,
        },
      },
    });

    const previousMonthSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth,
        },
      },
    });

    const currentMonthCompletedSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        status: "COMPLETED",
        scheduledTime: {
          gte: startOfMonth,
          lte: now,
        },
      },
    });

    const previousMonthCompletedSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        status: "COMPLETED",
        scheduledTime: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth,
        },
      },
    });

    const overviewData: MentorOverviewData = {
      activeStudents: totalMentorStudents,
      sessionsThisWeek,
      averageRating: 4.8, // Placeholder - you might want to add a reviews/ratings table
      todaysSessions: todaysSessions.map((session) => ({
        id: session.id,
        title: session.title,
        scheduledTime: session.scheduledTime!, // Already filtered to non-null in processing
        duration: session.duration,
        sessionType: session.sessionType as "YOGA" | "MEDITATION" | "DIET",
        status: session.status as "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
      })),
      upcomingSessions: upcomingSessions.map((session) => ({
        id: session.id,
        title: session.title,
        scheduledTime: session.scheduledTime!, // Already filtered to non-null in processing
        duration: session.duration,
        sessionType: session.sessionType as "YOGA" | "MEDITATION" | "DIET",
        status: session.status as "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED",
      })),
      recentActivity: recentActivity.map((activity) => ({
        id: activity.id,
        action: activity.action,
        timestamp: activity.timestamp,
        details: activity.details || undefined,
      })),
      monthlyStats: {
        currentMonth: {
          sessions: currentMonthSessions,
          earnings: currentMonthCompletedSessions * 500,
          students: totalMentorStudents,
        },
        previousMonth: {
          sessions: previousMonthSessions,
          earnings: previousMonthCompletedSessions * 500,
          students: Math.ceil(previousMonthSessions / 4), // Estimated based on sessions
        },
      },
    };

    return { success: true, data: overviewData };
  } catch (error) {
    console.error("Error fetching mentor overview data:", error);
    return { success: false, error: "Failed to fetch overview data" };
  }
}
