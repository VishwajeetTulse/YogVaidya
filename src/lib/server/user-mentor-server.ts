"use server";

import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import { getUserSubscription } from "@/lib/subscriptions";
import { headers } from "next/headers";
import { Prisma } from "@prisma/client";

export interface UserMentorData {
  id: string;
  name: string | null;
  email: string;
  mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | null;
  image: string | null;
  phone: string | null;
  createdAt: Date;
  // Additional mentor info from MentorApplication
  experience?: string;
  expertise?: string;
  certifications?: string;
  profile?: string;
  totalSessions: number;
  upcomingSessions: number;
}

export interface UserMentorResponse {
  success: boolean;
  data?: {
    subscriptionInfo: {
      plan: string | null;
      status: string;
      needsSubscription: boolean;
      nextBillingDate?: string | null;
      isTrialExpired?: boolean;
    };
    assignedMentor: UserMentorData | null;
    availableMentors: UserMentorData[];
    sessionStats: {
      totalScheduled: number;
      upcomingWithMentor: number;
      completedWithMentor: number;
    };
  };
  error?: string;
}

/**
 * Get user's assigned mentor based on their subscription plan
 */
export async function getUserMentor(): Promise<UserMentorResponse> {
  try {
    // Get the session using headers
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user) {
      return { success: false, error: "Authentication required" };
    }

    // Get user subscription details
    const subscriptionResult = await getUserSubscription(session.user.id);
    console.log("Subscription Result:", subscriptionResult);
    if (!subscriptionResult.success) {
      return { success: false, error: "Failed to get subscription details" };
    }

    const subscription = subscriptionResult.subscription;
    const now = new Date();

    // Helper function to detect if trial has expired
    const isTrialExpired = (): boolean => {
      // Check if user had a trial that ended and never had a paid subscription
      return !!(subscription?.trialEndDate && 
               subscription.trialEndDate <= now && 
               subscription.subscriptionStatus === "INACTIVE" &&
               (!subscription.subscriptionPlan || subscription.paymentAmount === 0));
    };

    // Check if user needs subscription
    let needsSubscription = false;
    
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
            return getUserMentor(); // Recursive call with new subscription
          }
        }
      } catch (error) {
        console.error("Failed to start trial for user:", error);
      }
      
      needsSubscription = true;
    } else if (subscription.subscriptionStatus === "INACTIVE" || 
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
    console.log("Needs Subscription:", needsSubscription);
    // If user needs subscription, return early with subscription prompt data
    if (needsSubscription) {
      return {
        success: true,
        data: {
          subscriptionInfo: {
            plan: subscription?.subscriptionPlan || null,
            status: subscription?.subscriptionStatus || "INACTIVE",
            needsSubscription: true,
            nextBillingDate: subscription?.nextBillingDate?.toString() || null,
            isTrialExpired: isTrialExpired()
          },
          assignedMentor: null,
          availableMentors: [],
          sessionStats: {
            totalScheduled: 0,
            upcomingWithMentor: 0,
            completedWithMentor: 0
          }
        }
      };
    }

    // Determine which mentor type to assign based on subscription plan
    let requiredMentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | null = null;
    
    if (subscription!.subscriptionPlan === "SEED") {
      // SEED plan gets MEDITATION mentor
      requiredMentorType = "MEDITATIONMENTOR";
    } else if (subscription!.subscriptionPlan === "BLOOM") {
      // BLOOM plan gets YOGA mentor
      requiredMentorType = "YOGAMENTOR";
    }
    // FLOURISH plan users can access both types, we'll show both options

    // Get mentors based on the subscription plan
    const mentorQuery: Prisma.UserWhereInput = {
      role: "MENTOR"
    };

    if (requiredMentorType) {
      mentorQuery.mentorType = requiredMentorType;
    }

    const mentors = await prisma.user.findMany({
      where: mentorQuery,
      select: {
        id: true,
        name: true,
        email: true,
        mentorType: true,
        image: true,
        phone: true,
        createdAt: true,
      }
    });

    // Get mentor applications for additional data
    const mentorApplications = await prisma.mentorApplication.findMany({
      where: {
        email: { in: mentors.map(m => m.email) },
        status: "APPROVED" // Only get approved applications
      },
      select: {
        email: true,
        experience: true,
        expertise: true,
        certifications: true,
        profile: true,
        mentorType: true
      }
    });

    // Create a map of mentor applications by email for quick lookup
    const mentorApplicationMap = new Map(
      mentorApplications.map(app => [app.email, app])
    );

    // For simplicity, assign the first available mentor as the "assigned" mentor
    // In a real system, you might have a more sophisticated assignment algorithm
    const assignedMentor = mentors.length > 0 ? mentors[0] : null;

    // Get session statistics for the assigned mentor
    let sessionStats = {
      totalScheduled: 0,
      upcomingWithMentor: 0,
      completedWithMentor: 0
    };

    if (assignedMentor) {
      // Get all sessions from this mentor that the user can access
      const sessionTypeFilter: Prisma.ScheduleWhereInput = {};
      
      if (subscription!.subscriptionPlan === "SEED") {
        sessionTypeFilter.sessionType = "MEDITATION";
      } else if (subscription!.subscriptionPlan === "BLOOM") {
        sessionTypeFilter.sessionType = "YOGA";
      }
      // FLOURISH gets both types (no filter)

      const sessionsWithMentor = await prisma.schedule.findMany({
        where: {
          mentorId: assignedMentor.id,
          ...sessionTypeFilter,
          scheduledTime: {
            gte: subscription!.subscriptionStartDate || new Date(0)
          }
        }
      });

      const currentTime = new Date();
      sessionStats = {
        totalScheduled: sessionsWithMentor.length,
        upcomingWithMentor: sessionsWithMentor.filter(s => 
          new Date(s.scheduledTime) > currentTime && 
          (s.status === "SCHEDULED" || !s.status)
        ).length,
        completedWithMentor: sessionsWithMentor.filter(s => 
          s.status === "COMPLETED" || 
          (new Date(s.scheduledTime) <= currentTime && (!s.status || s.status === "SCHEDULED"))
        ).length
      };
    }

    // Format mentor data with session counts
    const formatMentorData = async (mentor: { id: string; name: string | null; email: string; mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | null; image: string | null; phone: string | null; createdAt: Date; }): Promise<UserMentorData> => {
      const sessionTypeFilter: Prisma.ScheduleWhereInput = {};
      
      if (subscription!.subscriptionPlan === "SEED") {
        sessionTypeFilter.sessionType = "MEDITATION";
      } else if (subscription!.subscriptionPlan === "BLOOM") {
        sessionTypeFilter.sessionType = "YOGA";
      }

      const mentorSessions = await prisma.schedule.findMany({
        where: {
          mentorId: mentor.id,
          ...sessionTypeFilter
        }
      });

      const currentTime = new Date();
      const totalSessions = mentorSessions.length;
      const upcomingSessions = mentorSessions.filter(s => 
        new Date(s.scheduledTime) > currentTime && 
        (s.status === "SCHEDULED" || !s.status)
      ).length;

      // Get additional data from mentor application
      const mentorApplication = mentorApplicationMap.get(mentor.email);

      return {
        id: mentor.id,
        name: mentor.name,
        email: mentor.email,
        mentorType: mentor.mentorType || mentorApplication?.mentorType || null,
        image: mentor.image,
        phone: mentor.phone,
        createdAt: mentor.createdAt,
        experience: mentorApplication?.experience || undefined,
        expertise: mentorApplication?.expertise || undefined,
        certifications: mentorApplication?.certifications || undefined,
        profile: mentorApplication?.profile || undefined,
        totalSessions,
        upcomingSessions
      };
    };

    const formattedAssignedMentor = assignedMentor ? await formatMentorData(assignedMentor) : null;
    const formattedAvailableMentors = await Promise.all(
      mentors.slice(0, 6).map(formatMentorData) // Show up to 6 mentors
    );

    return {
      success: true,
      data: {
        subscriptionInfo: {
          plan: subscription!.subscriptionPlan,
          status: subscription!.subscriptionStatus,
          needsSubscription: false,
          nextBillingDate: subscription!.nextBillingDate?.toISOString() || null,
          isTrialExpired: false // Active users don't have expired trials
        },
        assignedMentor: formattedAssignedMentor,
        availableMentors: formattedAvailableMentors,
        sessionStats
      }
    };

  } catch (error) {
    console.error("Error fetching user mentor:", error);
    return { success: false, error: "Failed to fetch mentor information" };
  }
}

