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
  mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  image: string | null;
  phone: string | null;
  createdAt: Date;
  // Additional mentor info from MentorApplication
  experience?: number;
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

    // Helper function to fetch mentors from paid session bookings
    // IMPORTANT: Only returns mentors with ongoing relationships, not just completed one-to-one sessions
    // A mentor is considered to have an "ongoing relationship" if:
    // 1. Has recurring sessions (indicates ongoing mentoring)
    // 2. Has group sessions (maxStudents > 1)
    // 3. Has future scheduled sessions
    // 4. Has multiple sessions with the user (indicates ongoing relationship)
    const fetchMentorsFromPaidBookings = async (userId: string): Promise<UserMentorData[]> => {
      try {
        console.log("🔍 Fetching mentors with ongoing relationships from paid session bookings for user:", userId);

        // First, let's check if there are any session bookings for this user at all
        const allUserBookings = await prisma.$runCommandRaw({
          aggregate: 'sessionBooking',
          pipeline: [
            {
              $match: {
                userId: userId
              }
            }
          ],
          cursor: {}
        });

        let allBookings: any[] = [];
        if (allUserBookings &&
            typeof allUserBookings === 'object' &&
            'cursor' in allUserBookings &&
            allUserBookings.cursor &&
            typeof allUserBookings.cursor === 'object' &&
            'firstBatch' in allUserBookings.cursor &&
            Array.isArray(allUserBookings.cursor.firstBatch)) {
          allBookings = allUserBookings.cursor.firstBatch;
        }

        console.log(`🔍 Total session bookings for user: ${allBookings.length}`);
        if (allBookings.length > 0) {
          console.log("📋 Sample booking:", JSON.stringify(allBookings[0], null, 2));
        }

        // Use raw MongoDB aggregation to fetch session bookings with mentor details
        // Only include mentors with ongoing relationships (not just completed one-to-one sessions)
        const sessionBookingsResult = await prisma.$runCommandRaw({
          aggregate: 'sessionBooking',
          pipeline: [
            {
              $match: {
                userId: userId,
                paymentStatus: "COMPLETED", // Only paid bookings
                scheduledAt: { $exists: true }
              }
            },
            {
              $lookup: {
                from: 'user',
                localField: 'mentorId',
                foreignField: '_id',
                as: 'mentor'
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
                mentorData: { $arrayElemAt: ['$mentor', 0] },
                timeSlotData: { $arrayElemAt: ['$timeSlot', 0] }
              }
            },
            {
              $match: {
                mentorData: { $ne: null },
                timeSlotData: { $ne: null }
              }
            },
            // Group by mentor and analyze session types
            {
              $group: {
                _id: "$mentorData._id",
                mentor: { $first: "$mentorData" },
                sessions: {
                  $push: {
                    sessionId: "$_id",
                    status: "$status",
                    scheduledAt: "$scheduledAt",
                    maxStudents: "$timeSlotData.maxStudents",
                    isRecurring: "$timeSlotData.isRecurring"
                  }
                }
              }
            },
            // Filter out mentors who only have completed one-to-one sessions
            {
              $addFields: {
                hasOngoingRelationship: {
                  $or: [
                    // Has recurring sessions (indicates ongoing relationship)
                    { $gt: [{ $size: { $filter: { input: "$sessions", cond: { $eq: ["$$this.isRecurring", true] } } } }, 0] },
                    // Has group sessions (maxStudents > 1)
                    { $gt: [{ $size: { $filter: { input: "$sessions", cond: { $gt: ["$$this.maxStudents", 1] } } } }, 0] },
                    // Has future sessions (scheduled for later)
                    { $gt: [{ $size: { $filter: { input: "$sessions", cond: { $gt: ["$$this.scheduledAt", new Date()] } } } }, 0] },
                    // Has multiple sessions with the same mentor (indicates ongoing relationship)
                    { $gt: [{ $size: "$sessions" }, 1] }
                  ]
                }
              }
            },
            // Only include mentors with ongoing relationships
            {
              $match: {
                hasOngoingRelationship: true
              }
            },
            {
              $project: {
                id: { $toString: "$_id" },
                name: "$mentor.name",
                email: "$mentor.email",
                mentorType: "$mentor.mentorType",
                image: "$mentor.image",
                phone: "$mentor.phone",
                createdAt: "$mentor.createdAt",
                sessionCount: { $size: "$sessions" },
                hasOngoingRelationship: 1
              }
            }
          ],
          cursor: {}
        });

        let mentorsFromBookings: any[] = [];
        if (sessionBookingsResult &&
            typeof sessionBookingsResult === 'object' &&
            'cursor' in sessionBookingsResult &&
            sessionBookingsResult.cursor &&
            typeof sessionBookingsResult.cursor === 'object' &&
            'firstBatch' in sessionBookingsResult.cursor &&
            Array.isArray(sessionBookingsResult.cursor.firstBatch)) {
          mentorsFromBookings = sessionBookingsResult.cursor.firstBatch;
        }

        console.log(`📅 Found ${mentorsFromBookings.length} mentors with ongoing relationships (excluding completed one-to-one sessions)`);
        
        // Debug: Log the raw result for troubleshooting
        if (mentorsFromBookings.length > 0) {
          console.log("🔍 Mentors with ongoing relationships:", JSON.stringify(mentorsFromBookings.map(m => ({
            id: m.id,
            name: m.name,
            email: m.email,
            sessionCount: m.sessionCount,
            hasOngoingRelationship: m.hasOngoingRelationship
          })), null, 2));
        } else {
          console.log("🔍 No mentors with ongoing relationships found - user may only have completed one-to-one sessions");
        }

        // Get mentor applications for additional data
        const mentorEmails = mentorsFromBookings.map(m => m.email);
        const mentorApplications = await prisma.mentorApplication.findMany({
          where: {
            email: { in: mentorEmails },
            status: "APPROVED"
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

        const mentorApplicationMap = new Map(
          mentorApplications.map(app => [app.email, app])
        );

        // Format the mentors data
        return mentorsFromBookings.map(mentor => {
          const mentorApplication = mentorApplicationMap.get(mentor.email);
          return {
            id: mentor.id,
            name: mentor.name,
            email: mentor.email,
            mentorType: mentor.mentorType || mentorApplication?.mentorType || null,
            image: mentor.image,
            phone: mentor.phone,
            createdAt: new Date(mentor.createdAt),
            experience: mentorApplication?.experience || undefined,
            expertise: mentorApplication?.expertise || undefined,
            certifications: mentorApplication?.certifications || undefined,
            profile: mentorApplication?.profile || undefined,
            totalSessions: mentor.sessionCount,
            upcomingSessions: 0 // Will be calculated separately if needed
          };
        });

      } catch (error) {
        console.error("Error fetching mentors from paid bookings:", error);
        return [];
      }
    };

    // Check if user needs subscription
    let needsSubscription = false;
    
    if (!subscription) {
      // User has no subscription record, check for paid mentor bookings
      console.log("👤 User has no subscription, checking for paid mentor bookings...");
      const paidMentors = await fetchMentorsFromPaidBookings(session.user.id);
      
      if (paidMentors.length > 0) {
        console.log(`✅ Found ${paidMentors.length} mentors from paid bookings, showing mentors`);
        return {
          success: true,
          data: {
            subscriptionInfo: {
              plan: null,
              status: "INACTIVE",
              needsSubscription: false, // Don't require subscription if they have paid mentor sessions
              nextBillingDate: null,
              isTrialExpired: false
            },
            assignedMentor: paidMentors[0] || null,
            availableMentors: paidMentors,
            sessionStats: {
              totalScheduled: paidMentors.reduce((sum, m) => sum + m.totalSessions, 0),
              upcomingWithMentor: 0,
              completedWithMentor: paidMentors.reduce((sum, m) => sum + m.totalSessions, 0)
            }
          }
        };
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
    
    // If user needs subscription, check for paid mentor bookings first
    if (needsSubscription) {
      console.log("👤 User needs subscription, checking for paid mentor bookings...");
      const paidMentors = await fetchMentorsFromPaidBookings(session.user.id);
      
      if (paidMentors.length > 0) {
        console.log(`✅ Found ${paidMentors.length} mentors from paid bookings, showing mentors despite expired subscription`);
        return {
          success: true,
          data: {
            subscriptionInfo: {
              plan: subscription?.subscriptionPlan || null,
              status: subscription?.subscriptionStatus || "INACTIVE",
              needsSubscription: false, // Override since they have paid mentor sessions
              nextBillingDate: subscription?.nextBillingDate?.toString() || null,
              isTrialExpired: isTrialExpired()
            },
            assignedMentor: paidMentors[0] || null, // Use first mentor as assigned
            availableMentors: paidMentors,
            sessionStats: {
              totalScheduled: paidMentors.reduce((sum, m) => sum + m.totalSessions, 0),
              upcomingWithMentor: 0, // Can be calculated if needed
              completedWithMentor: paidMentors.reduce((sum, m) => sum + m.totalSessions, 0)
            }
          }
        };
      }
      
      // No paid bookings, show subscription needed
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
    let requiredMentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null = null;
    
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
    const formatMentorData = async (mentor: { id: string; name: string | null; email: string; mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null; image: string | null; phone: string | null; createdAt: Date; }): Promise<UserMentorData> => {
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

