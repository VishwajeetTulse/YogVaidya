"use server";

import { prisma } from "./config/prisma";

export interface UserDetails {
  id: string;
  role: string;
  mentorType?: string | null;
  email: string;
  name?: string | null;
  phone?: string | null;
  emailVerified?: boolean | null;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;

  // Subscription Details
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate?: Date | null;
  subscriptionEndDate?: Date | null;
  billingPeriod?: string | null;
  razorpaySubscriptionId?: string | null;
  razorpayCustomerId?: string | null;
  lastPaymentDate?: Date | null;
  nextBillingDate?: Date | null;
  paymentAmount?: number | null;
  isTrialActive: boolean | null;
  trialEndDate?: Date | null;
  autoRenewal: boolean | null;

  // Related data counts
  sessionsCount: number;
  accountsCount: number;

  authtype?: string;
}

/**
 * Get complete user details by user ID
 */
export async function getUserDetails(
  userId: string
): Promise<{ success: boolean; user?: UserDetails; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          select: { id: true },
        },
        accounts: {
          select: { id: true },
        },
      },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const accounts = await prisma.account.findFirst({
      where: { userId: user.id },
    });

    const userDetails: UserDetails = {
      id: user.id,
      role: user.role,
      mentorType: user.mentorType,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Subscription Details
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      billingPeriod: user.billingPeriod,
      razorpaySubscriptionId: user.razorpaySubscriptionId,
      razorpayCustomerId: user.razorpayCustomerId,
      lastPaymentDate: user.lastPaymentDate,
      nextBillingDate: user.nextBillingDate,
      paymentAmount: user.paymentAmount,
      isTrialActive: user.isTrialActive,
      trialEndDate: user.trialEndDate,
      autoRenewal: user.autoRenewal,

      // Related data counts
      sessionsCount: user.sessions.length,
      accountsCount: user.accounts.length,

      // Auth type (if available)
      authtype: accounts?.providerId,
    };

    // Check if subscription has expired and update status if needed
    const now = new Date();
    let _statusUpdated = false;

    // Check if ACTIVE subscription has expired based on nextBillingDate or subscriptionEndDate
    if (userDetails.subscriptionStatus === "ACTIVE") {
      const expiryDate = userDetails.nextBillingDate || userDetails.subscriptionEndDate;
      if (expiryDate && now > new Date(expiryDate)) {
        // Subscription has expired, update to EXPIRED
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "EXPIRED",
            updatedAt: now,
          },
        });
        userDetails.subscriptionStatus = "EXPIRED";
        _statusUpdated = true;
      }
    }

    // Check if ACTIVE_UNTIL_END subscription has reached its end
    if (userDetails.subscriptionStatus === "ACTIVE_UNTIL_END") {
      const expiryDate = userDetails.subscriptionEndDate || userDetails.nextBillingDate;
      if (expiryDate && now > new Date(expiryDate)) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionStatus: "INACTIVE",
            updatedAt: now,
          },
        });
        userDetails.subscriptionStatus = "INACTIVE";
        _statusUpdated = true;
      }
    }

    // Check if trial has expired
    if (userDetails.isTrialActive && userDetails.trialEndDate) {
      if (now > new Date(userDetails.trialEndDate)) {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isTrialActive: false,
            updatedAt: now,
          },
        });
        userDetails.isTrialActive = false;
        _statusUpdated = true;
      }
    }

    return { success: true, user: userDetails };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { success: false, error: "Failed to fetch user details" };
  }
}

/**
 * Get all users with complete details (admin/moderator use)
 */
export async function getAllUsersDetails(): Promise<{
  success: boolean;
  users?: UserDetails[];
  error?: string;
}> {
  try {
    const users = await prisma.user.findMany({
      include: {
        sessions: {
          select: { id: true },
        },
        accounts: {
          select: { id: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const usersDetails: UserDetails[] = users.map((user) => ({
      id: user.id,
      role: user.role,
      mentorType: user.mentorType,
      email: user.email,
      name: user.name,
      phone: user.phone,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,

      // Subscription Details
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      subscriptionStartDate: user.subscriptionStartDate,
      subscriptionEndDate: user.subscriptionEndDate,
      billingPeriod: user.billingPeriod,
      razorpaySubscriptionId: user.razorpaySubscriptionId,
      razorpayCustomerId: user.razorpayCustomerId,
      lastPaymentDate: user.lastPaymentDate,
      nextBillingDate: user.nextBillingDate,
      paymentAmount: user.paymentAmount,
      isTrialActive: user.isTrialActive,
      trialEndDate: user.trialEndDate,
      autoRenewal: user.autoRenewal,

      // Related data counts
      sessionsCount: user.sessions.length,
      accountsCount: user.accounts.length,
    }));

    return { success: true, users: usersDetails };
  } catch (error) {
    console.error("Error fetching all users details:", error);
    return { success: false, error: "Failed to fetch users details" };
  }
}

/**
 * Print user details to console (development helper)
 * NOTE: Disabled to reduce console noise in production builds
 */
export async function printUserDetails(_userId: string): Promise<void> {
  // Debug function - disabled in production
  // Uncomment if needed for development debugging
  return;

  /* const result = await getUserDetails(userId);
  if (result.success && result.user) {































  } else {
    console.error("Failed to fetch user details:", result.error);
  } */
}
