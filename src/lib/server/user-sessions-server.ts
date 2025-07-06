"use server";

import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { getUserSubscription } from "@/lib/subscriptions";
import { Prisma } from "@prisma/client";
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

    // Get user subscription details
    const subscriptionResult = await getUserSubscription(session.user.id);
    
    if (!subscriptionResult.success) {
      return { success: false, error: "Failed to get subscription details" };
    }

    const subscription = subscriptionResult.subscription;
    const now = new Date();

    // Helper function to detect if trial has expired
    const isTrialExpired = (): boolean => {
      return !!(subscription?.trialEndDate && 
               subscription.trialEndDate <= now && 
               subscription.subscriptionStatus === "INACTIVE");
    };

    if (!subscription) {
      // Try to start a trial for users without any subscription
      try {
        const { startAutoTrialForNewUser } = await import("@/lib/subscriptions");
        const trialResult = await startAutoTrialForNewUser(session.user.id);
        
        if (trialResult.success) {
          // Re-fetch subscription after starting trial
          const newSubscriptionResult = await getUserSubscription(session.user.id);
          if (newSubscriptionResult.success && newSubscriptionResult.subscription) {
            // Continue with the new trial subscription
            return getUserSessions(); // Recursive call with new subscription
          }
        }
      } catch (error) {
        console.error("Failed to start trial for user:", error);
      }

      // If trial creation failed or user already had a trial, return subscription needed
      return {
        success: true,
        data: {
          subscriptionStatus: "INACTIVE",
          subscriptionPlan: null,
          sessions: [],
          needsSubscription: true,
          nextBillingDate: null,
          isTrialExpired: false // No trial data available
        }
      };
    }

    // Check if user needs subscription
    // For cancelled subscriptions, check nextBillingDate instead of subscriptionEndDate
    let needsSubscription = false;
    
    if (subscription.subscriptionStatus === "INACTIVE" || 
        subscription.subscriptionStatus === "EXPIRED") {
      // For INACTIVE users, check if they should get a trial (new users with no previous subscription)
      if (!subscription.subscriptionPlan && !subscription.isTrialActive && !subscription.trialEndDate) {
        // This is a new user who has never had a subscription or trial
        try {
          const { startAutoTrialForNewUser } = await import("@/lib/subscriptions");
          const trialResult = await startAutoTrialForNewUser(session.user.id);
          
          if (trialResult.success) {
            // Re-fetch subscription after starting trial
            const newSubscriptionResult = await getUserSubscription(session.user.id);
            if (newSubscriptionResult.success && newSubscriptionResult.subscription) {
              // Continue with the new trial subscription
              return getUserSessions(); // Recursive call with new subscription
            }
          }
        } catch (error) {
          console.error("Failed to start trial for user:", error);
        }
      }
      needsSubscription = true;
    } else if (subscription.subscriptionStatus === "CANCELLED" || 
               subscription.subscriptionStatus === "ACTIVE_UNTIL_END") {
      // For cancelled subscriptions, allow access until nextBillingDate
      const accessEndDate = subscription.nextBillingDate || subscription.subscriptionEndDate;
      needsSubscription = accessEndDate ? new Date(accessEndDate) <= now : true;
    } else if (subscription.subscriptionStatus === "ACTIVE") {
      // For active subscriptions (including trials), check subscriptionEndDate if it exists
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
          nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
          isTrialExpired: isTrialExpired()
        }
      };
    }

    // Get sessions based on subscription plan
    const sessionFilters: Prisma.ScheduleWhereInput = {
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
        nextBillingDate: subscription.nextBillingDate?.toISOString() || null,
        isTrialExpired: false // Active users don't have expired trials
      }
    };

  } catch (error) {
    console.error("Error fetching user sessions:", error);
    return { success: false, error: "Failed to fetch sessions" };
  }
}

