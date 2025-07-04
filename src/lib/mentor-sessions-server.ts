"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export interface MentorSessionData {
  id: string;
  title: string;
  scheduledTime: Date;
  duration: number;
  sessionType: "YOGA" | "MEDITATION";
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
      mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | null;
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

    // Get mentor's scheduled sessions
    const sessions = await prisma.schedule.findMany({
      where: { mentorId: user.id },
      orderBy: { scheduledTime: 'desc' },
      take: 100 // Limit to 100 sessions
    });

    // Get all users with active subscriptions that might be eligible for this mentor's sessions
    const currentDate = new Date();
    const eligibleUsers = await prisma.user.findMany({
      where: {
        role: "USER",
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
    const formattedSessions: MentorSessionData[] = sessions.map(session => {
      // Filter eligible users based on session type and subscription plan
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
        potentialStudents: sessionEligibleUsers.slice(0, 10), // Show first 10 potential students
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
        totalSessions: sessions.length,
      }
    };

  } catch (error) {
    console.error("Error fetching mentor sessions:", error);
    return { success: false, error: "Failed to fetch mentor sessions" };
  }
}
