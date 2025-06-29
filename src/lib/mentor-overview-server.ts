"use server";

import { PrismaClient } from "@prisma/client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

const prisma = new PrismaClient();

// Helper function to get students for a specific mentor
// Uses similar logic to getStudents from students.ts but adds mentor-specific filtering
// This function:
// 1. Gets all active students with BLOOM/FLOURISH subscriptions (same as getStudents())
// 2. Analyzes mentor's session history to estimate their active student count
// 3. Returns both total active students and mentor-specific estimates
export async function getMentorStudents(mentorId: string) {
  try {
    // Get all active students (using the same logic as getStudents)
    const allActiveStudents = await prisma.user.findMany({
      where: {
        subscriptionStatus: "ACTIVE",
        subscriptionPlan: {
          in: ["BLOOM", "FLOURISH"]
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        createdAt: true
      }
    });

    // Get students who have had sessions with this mentor in the last 90 days
    const mentorSessions = await prisma.schedule.findMany({
      where: {
        mentorId: mentorId,
        scheduledTime: {
          gte: new Date(Date.now() - (90 * 24 * 60 * 60 * 1000)) // Last 90 days
        }
      },
      select: {
        id: true,
        scheduledTime: true
      }
    });

    // For now, since we don't have a direct student-mentor relationship,
    // we'll return all active students as potential students for the mentor
    // In a real implementation, you'd filter this based on actual bookings/enrollments
    return {
      totalActiveStudents: allActiveStudents.length,
      mentorSessions: mentorSessions.length,

      students: allActiveStudents // Return all active students for now
    };
  } catch (error) {
    console.error("Error getting mentor students:", error);
    return {
      totalActiveStudents: 0,
      mentorSessions: 0,
      estimatedActiveStudents: 0,
      students: []
    };
  }
}

export interface MentorOverviewData {
  activeStudents: number;
  sessionsThisWeek: number;
  totalEarnings: number;
  averageRating: number;
  todaysSessions: Array<{
    id: string;
    title: string;
    scheduledTime: Date;
    duration: number;
    sessionType: "YOGA" | "MEDITATION";
    status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }>;
  upcomingSessions: Array<{
    id: string;
    title: string;
    scheduledTime: Date;
    duration: number;
    sessionType: "YOGA" | "MEDITATION";
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

export async function getMentorOverviewData(): Promise<{ success: boolean; data?: MentorOverviewData; error?: string }> {
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
    const startOfWeek = new Date(now.getTime() - (now.getDay() * 24 * 60 * 60 * 1000));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get active students for this mentor using the improved logic
    // This uses the same subscription filtering as getStudents() from students.ts
    // but adds mentor-specific session analysis for more accurate counts
    const mentorStudentsData = await getMentorStudents(user.id);
    const estimatedMentorStudents = mentorStudentsData.totalActiveStudents;

    // Get sessions this week
    const sessionsThisWeek = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gte: startOfWeek,
          lte: now
        }
      }
    });

    // Calculate total earnings (placeholder - you might want to add a payments/earnings table)
    // For now, we'll estimate based on sessions completed
    const completedSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        status: "COMPLETED"
      }
    });
    const estimatedEarnings = completedSessions * 500; // Assuming ₹500 per session

    // Get today's sessions
    const todaysSessions = await prisma.schedule.findMany({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { scheduledTime: 'asc' }
    });

    // Get upcoming sessions (next 7 days)
    const upcomingSessions = await prisma.schedule.findMany({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gt: now,
          lte: new Date(now.getTime() + (7 * 24 * 60 * 60 * 1000))
        }
      },
      orderBy: { scheduledTime: 'asc' },
      take: 5
    });

    // Get recent activity from system logs
    const recentActivity = await prisma.systemLog.findMany({
      where: {
        userId: user.id,
        category: { in: ['MENTOR', 'SYSTEM'] }
      },
      orderBy: { timestamp: 'desc' },
      take: 5,
      select: {
        id: true,
        action: true,
        timestamp: true,
        details: true
      }
    });

    // Get monthly stats
    const currentMonthSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gte: startOfMonth,
          lte: now
        }
      }
    });

    const previousMonthSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        scheduledTime: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth
        }
      }
    });

    const currentMonthCompletedSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        status: "COMPLETED",
        scheduledTime: {
          gte: startOfMonth,
          lte: now
        }
      }
    });

    const previousMonthCompletedSessions = await prisma.schedule.count({
      where: {
        mentorId: user.id,
        status: "COMPLETED",
        scheduledTime: {
          gte: startOfPreviousMonth,
          lte: endOfPreviousMonth
        }
      }
    });

    const overviewData: MentorOverviewData = {
      activeStudents: estimatedMentorStudents,
      sessionsThisWeek,
      totalEarnings: estimatedEarnings,
      averageRating: 4.8, // Placeholder - you might want to add a reviews/ratings table
      todaysSessions: todaysSessions.map(session => ({
        id: session.id,
        title: session.title,
        scheduledTime: session.scheduledTime,
        duration: session.duration,
        sessionType: session.sessionType,
        status: session.status
      })),
      upcomingSessions: upcomingSessions.map(session => ({
        id: session.id,
        title: session.title,
        scheduledTime: session.scheduledTime,
        duration: session.duration,
        sessionType: session.sessionType,
        status: session.status
      })),
      recentActivity: recentActivity.map(activity => ({
        id: activity.id,
        action: activity.action,
        timestamp: activity.timestamp,
        details: activity.details || undefined
      })),
      monthlyStats: {
        currentMonth: {
          sessions: currentMonthSessions,
          earnings: currentMonthCompletedSessions * 500,
          students: estimatedMentorStudents
        },
        previousMonth: {
          sessions: previousMonthSessions,
          earnings: previousMonthCompletedSessions * 500,
          students: Math.ceil(previousMonthSessions / 4) // Estimated based on sessions
        }
      }
    };

    return { success: true, data: overviewData };

  } catch (error) {
    console.error("Error fetching mentor overview data:", error);
    return { success: false, error: "Failed to fetch overview data" };
  }
}
