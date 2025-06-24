'use server';

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
export async function getUserDetails(userId: string): Promise<{ success: boolean; user?: UserDetails; error?: string }> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: {
          select: { id: true }
        },
        accounts: {
          select: { id: true }
        }
      }
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
    
    return { success: true, user: userDetails };
  } catch (error) {
    console.error("Error fetching user details:", error);
    return { success: false, error: "Failed to fetch user details" };
  }
}

/**
 * Get all users with complete details (admin/moderator use)
 */
export async function getAllUsersDetails(): Promise<{ success: boolean; users?: UserDetails[]; error?: string }> {
  try {
    const users = await prisma.user.findMany({
      include: {
        sessions: {
          select: { id: true }
        },
        accounts: {
          select: { id: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const usersDetails: UserDetails[] = users.map(user => ({
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
      accountsCount: user.accounts.length
    }));

    return { success: true, users: usersDetails };
  } catch (error) {
    console.error("Error fetching all users details:", error);
    return { success: false, error: "Failed to fetch users details" };
  }
}

/**
 * Print user details to console (development helper)
 */
export async function printUserDetails(userId: string): Promise<void> {
  const result = await getUserDetails(userId);
  
  if (result.success && result.user) {
    console.log("=== USER DETAILS ===");
    console.log("Basic Information:");
    console.log(`- ID: ${result.user.id}`);
    console.log(`- Name: ${result.user.name || 'Not set'}`);
    console.log(`- Email: ${result.user.email}`);
    console.log(`- Phone: ${result.user.phone || 'Not set'}`);
    console.log(`- Role: ${result.user.role}`);
    console.log(`- Mentor Type: ${result.user.mentorType || 'N/A'}`);
    console.log(`- Email Verified: ${result.user.emailVerified ? 'Yes' : 'No'}`);
    console.log(`- Profile Image: ${result.user.image || 'Not set'}`);
    console.log(`- Created At: ${result.user.createdAt.toISOString()}`);
    console.log(`- Updated At: ${result.user.updatedAt.toISOString()}`);
    
    console.log("\nSubscription Information:");
    console.log(`- Plan: ${result.user.subscriptionPlan}`);
    console.log(`- Status: ${result.user.subscriptionStatus}`);
    console.log(`- Start Date: ${result.user.subscriptionStartDate?.toISOString() || 'Not set'}`);
    console.log(`- End Date: ${result.user.subscriptionEndDate?.toISOString() || 'Not set'}`);
    console.log(`- Billing Period: ${result.user.billingPeriod || 'Not set'}`);
    console.log(`- Payment Amount: ₹${result.user.paymentAmount || 0}`);
    console.log(`- Is Trial Active: ${result.user.isTrialActive ? 'Yes' : 'No'}`);
    console.log(`- Trial End Date: ${result.user.trialEndDate?.toISOString() || 'Not set'}`);
    console.log(`- Auto Renewal: ${result.user.autoRenewal ? 'Yes' : 'No'}`);
    console.log(`- Last Payment: ${result.user.lastPaymentDate?.toISOString() || 'Not set'}`);
    console.log(`- Next Billing: ${result.user.nextBillingDate?.toISOString() || 'Not set'}`);
    
    console.log("\nRazorpay Information:");
    console.log(`- Subscription ID: ${result.user.razorpaySubscriptionId || 'Not set'}`);
    console.log(`- Customer ID: ${result.user.razorpayCustomerId || 'Not set'}`);
    
    console.log("\nRelated Data:");
    console.log(`- Active Sessions: ${result.user.sessionsCount}`);
    console.log(`- Linked Accounts: ${result.user.accountsCount}`);
    
    console.log("=== END USER DETAILS ===");
  } else {
    console.error("Failed to fetch user details:", result.error);
  }
}
