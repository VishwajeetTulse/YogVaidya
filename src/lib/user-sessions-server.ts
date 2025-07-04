"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getUserSubscription } from "@/lib/subscriptions";
import { headers } from "next/headers";

export interface UserSessionData {
  id: string;
  title: string;
  scheduledTime: Date;
  duration: number;
  sessionType: "YOGA" | "MEDITATION";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  mentor: {
    id: string;
    name: string | null;
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | null;
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

    // Get user subscription details
    const subscriptionResult = await getUserSubscription(session.user.id);
    
    if (!subscriptionResult.success) {
      return { success: false, error: "Failed to get subscription details" };
    }

    const subscription = subscriptionResult.subscription;
    const now = new Date();

    if (!subscription) {
      return {
        success: true,
        data: {
          subscriptionStatus: "INACTIVE",
          subscriptionPlan: null,
          sessions: [],
          needsSubscription: true,
          nextBillingDate: null
        }
      };
    }

    // Check if user needs subscription
    // For cancelled subscriptions, check nextBillingDate instead of subscriptionEndDate
    let needsSubscription = false;
    
    if (subscription.subscriptionStatus === "INACTIVE" || 
        subscription.subscriptionStatus === "EXPIRED") {
      needsSubscription = true;
    } else if (subscription.subscriptionStatus === "CANCELLED" || 
               subscription.subscriptionStatus === "ACTIVE_UNTIL_END") {
      // For cancelled subscriptions, allow access until nextBillingDate
      const accessEndDate = subscription.nextBillingDate || subscription.subscriptionEndDate;
      needsSubscription = accessEndDate ? new Date(accessEndDate) <= now : true;
    } else if (subscription.subscriptionStatus === "ACTIVE") {
      // For active subscriptions, check subscriptionEndDate if it exists
      needsSubscription = subscription.subscriptionEndDate ? new Date(subscription.subscriptionEndDate) <= now : false;
    }

    if (needsSubscription) {
      return {
        success: true,
        data: {
          subscriptionStatus: subscription.subscriptionStatus,
          subscriptionPlan: subscription.subscriptionPlan,
          sessions: [],
          needsSubscription: true,
          nextBillingDate: subscription.nextBillingDate?.toISOString() || null
        }
      };
    }

    // Get sessions based on subscription plan
    let sessionFilters: any = {
      // Get all sessions (past and future) for the user's subscription period
      scheduledTime: {
        gte: subscription.subscriptionStartDate || new Date(0) // From subscription start or beginning of time
      }
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

    const sessions = await prisma.schedule.findMany({
      where: sessionFilters,
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            mentorType: true
          }
        }
      },
      orderBy: { scheduledTime: 'desc' }, // Most recent first
      take: 50 // Limit to 50 sessions
    });

    const formattedSessions: UserSessionData[] = sessions.map(session => ({
      id: session.id,
      title: session.title,
      scheduledTime: session.scheduledTime,
      duration: session.duration,
      sessionType: session.sessionType,
      status: session.status,
      mentor: {
        id: session.mentor.id,
        name: session.mentor.name,
        mentorType: session.mentor.mentorType
      }
    }));

    return {
      success: true,
      data: {
        subscriptionStatus: subscription.subscriptionStatus,
        subscriptionPlan: subscription.subscriptionPlan,
        sessions: formattedSessions,
        needsSubscription: false,
        nextBillingDate: subscription.nextBillingDate?.toISOString() || null
      }
    };

  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return { success: false, error: "Failed to fetch sessions" };
  }
}
