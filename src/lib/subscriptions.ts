'use server';

import { PrismaClient } from "@prisma/client";
import Razorpay from 'razorpay';

const prisma = new PrismaClient();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Define subscription types manually to avoid dependency on generated types
export type SubscriptionPlan = "SEED" | "BLOOM" | "FLOURISH";
export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";

// Types for subscription update operations
export interface UpdateSubscriptionData {
  userId: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  billingPeriod?: "monthly" | "annual";
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  paymentAmount?: number;
  isTrialActive?: boolean;
  trialEndDate?: Date;
  autoRenewal?: boolean;
}

export interface CreateSubscriptionData {
  userId: string;
  subscriptionPlan: SubscriptionPlan;
  billingPeriod: "monthly" | "annual";
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  paymentAmount?: number;
  autoRenewal?: boolean;
}

// Plan pricing configuration
const PLAN_PRICING = {
  SEED: { monthly: 0, annual: 0 },
  BLOOM: { monthly: 1999, annual: 1599 }, // 20% discount on annual
  FLOURISH: { monthly: 4999, annual: 3999 } // 20% discount on annual
} as const;

// Trial period configuration (in days)
const TRIAL_PERIOD_DAYS = 7;

/**
 * Update user subscription details
 */
async function updateUserSubscription(data: UpdateSubscriptionData) {
  try {
    const updateData: any = {
      updatedAt: new Date()
    };

    // Only include fields that are defined
    if (data.subscriptionPlan !== undefined) updateData.subscriptionPlan = data.subscriptionPlan;
    if (data.subscriptionStatus !== undefined) updateData.subscriptionStatus = data.subscriptionStatus;
    if (data.subscriptionStartDate !== undefined) updateData.subscriptionStartDate = data.subscriptionStartDate;
    if (data.subscriptionEndDate !== undefined) updateData.subscriptionEndDate = data.subscriptionEndDate;
    if (data.billingPeriod !== undefined) updateData.billingPeriod = data.billingPeriod;
    if (data.razorpaySubscriptionId !== undefined) updateData.razorpaySubscriptionId = data.razorpaySubscriptionId;
    if (data.razorpayCustomerId !== undefined) updateData.razorpayCustomerId = data.razorpayCustomerId;
    if (data.lastPaymentDate !== undefined) updateData.lastPaymentDate = data.lastPaymentDate;
    if (data.nextBillingDate !== undefined) updateData.nextBillingDate = data.nextBillingDate;
    if (data.paymentAmount !== undefined) updateData.paymentAmount = data.paymentAmount;
    if (data.isTrialActive !== undefined) updateData.isTrialActive = data.isTrialActive;
    if (data.trialEndDate !== undefined) updateData.trialEndDate = data.trialEndDate;
    if (data.autoRenewal !== undefined) updateData.autoRenewal = data.autoRenewal;

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: updateData
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error updating user subscription:", error);
    return { success: false, error: "Failed to update subscription" };
  }
}

/**
 * Create a new subscription for a user
 */
async function createUserSubscription(data: CreateSubscriptionData) {
  try {
    const now = new Date();
    const billingCycleMonths = data.billingPeriod === "annual" ? 12 : 1;
    const subscriptionEndDate = new Date(now);
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + billingCycleMonths);

    const nextBillingDate = new Date(subscriptionEndDate);

    // Calculate payment amount based on plan and billing period
    const paymentAmount = data.paymentAmount || 
      PLAN_PRICING[data.subscriptionPlan][data.billingPeriod];

    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: {
        subscriptionPlan: data.subscriptionPlan,
        subscriptionStatus: "ACTIVE",
        subscriptionStartDate: now,
        subscriptionEndDate,
        billingPeriod: data.billingPeriod,
        razorpaySubscriptionId: data.razorpaySubscriptionId || null,
        razorpayCustomerId: (await razorpay.subscriptions.fetch(data.razorpaySubscriptionId!)).customer_id || null,
        lastPaymentDate: now,
        nextBillingDate,
        paymentAmount,
        isTrialActive: false,
        trialEndDate: null,
        autoRenewal: data.autoRenewal ?? true,
        updatedAt: new Date(),
      }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error creating user subscription:", error);
    return { success: false, error: "Failed to create subscription" };
  }
}

/**
 * Start a trial subscription for a user
 */
async function startTrialSubscription(userId: string, plan: SubscriptionPlan = "BLOOM") {
  try {
    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + TRIAL_PERIOD_DAYS);

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionPlan: plan,
        subscriptionStatus: "ACTIVE",
        subscriptionStartDate: now,
        subscriptionEndDate: trialEndDate,
        billingPeriod: "monthly",
        lastPaymentDate: null,
        nextBillingDate: trialEndDate,
        paymentAmount: 0,
        isTrialActive: true,
        trialEndDate,
        autoRenewal: true,
        updatedAt: new Date()
      }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error starting trial subscription:", error);
    return { success: false, error: "Failed to start trial" };
  }
}


/**
 * Cancel a user's subscription at the end of their billing period
 */
async function cancelUserSubscription(userId: string) {
  try {
    // First, get the user to check if they have a Razorpay subscription ID
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const razorpaySubscriptionId = (user as any).razorpaySubscriptionId;
    // Cancel the Razorpay subscription if it exists
    if (razorpaySubscriptionId) {
      try {
        // Cancel at end of billing cycle
        const response = await razorpay.subscriptions.cancel(razorpaySubscriptionId, true);
        console.log("cancelation response: ", response);
        console.log(`Razorpay subscription ${razorpaySubscriptionId} will be cancelled at the end of billing period`);
      } catch (razorpayError) {
        console.error("Error cancelling Razorpay subscription:", razorpayError);
        // Continue with local cancellation even if Razorpay fails
        // You might want to handle this differently based on your business logic
      }
    }

    // Update the local database - keep subscription active until end date
    const updateData: any = {
      subscriptionStatus: "ACTIVE",
      autoRenewal: false,
      updatedAt: new Date()
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error cancelling user subscription:", error);
    return { success: false, error: "Failed to cancel subscription" };
  }
}

/**
 * Reactivate a cancelled subscription
 */
async function reactivateUserSubscription(userId: string, billingPeriod: "monthly" | "annual" = "monthly") {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const now = new Date();
    const billingCycleMonths = billingPeriod === "annual" ? 12 : 1;
    const subscriptionEndDate = new Date(now);
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + billingCycleMonths);

    // Get user's current plan, default to BLOOM if not set
    const currentPlan = (user as any).subscriptionPlan || "BLOOM";
    const paymentAmount = PLAN_PRICING[currentPlan as SubscriptionPlan][billingPeriod];

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionStartDate: now,
        subscriptionEndDate,
        billingPeriod,
        nextBillingDate: subscriptionEndDate,
        paymentAmount,
        autoRenewal: true,
        updatedAt: new Date()
      }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error reactivating user subscription:", error);
    return { success: false, error: "Failed to reactivate subscription" };
  }
}

/**
 * Get user subscription details
 */
async function getUserSubscription(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Extract subscription-related fields
    const subscriptionData = {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionPlan: (user as any).subscriptionPlan || "SEED",
      subscriptionStatus: (user as any).subscriptionStatus || "INACTIVE",
      subscriptionStartDate: (user as any).subscriptionStartDate,
      subscriptionEndDate: (user as any).subscriptionEndDate,
      billingPeriod: (user as any).billingPeriod,
      razorpaySubscriptionId: (user as any).razorpaySubscriptionId,
      razorpayCustomerId: (user as any).razorpayCustomerId,
      lastPaymentDate: (user as any).lastPaymentDate,
      nextBillingDate: (user as any).nextBillingDate,
      paymentAmount: (user as any).paymentAmount,
      isTrialActive: (user as any).isTrialActive || false,
      trialEndDate: (user as any).trialEndDate,
      autoRenewal: (user as any).autoRenewal || true
    };

    return { success: true, subscription: subscriptionData };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    return { success: false, error: "Failed to get subscription details" };
  }
}

/**
 * Process subscription renewal
 */
async function renewUserSubscription(userId: string, paymentAmount?: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const now = new Date();
    const currentBillingPeriod = (user as any).billingPeriod || "monthly";
    const billingCycleMonths = currentBillingPeriod === "annual" ? 12 : 1;
    
    const currentEndDate = (user as any).subscriptionEndDate || now;
    const newEndDate = new Date(currentEndDate);
    newEndDate.setMonth(newEndDate.getMonth() + billingCycleMonths);

    const nextBillingDate = new Date(newEndDate);
    const currentPlan = (user as any).subscriptionPlan || "BLOOM";
    const amount = paymentAmount || (user as any).paymentAmount || 
      PLAN_PRICING[currentPlan as SubscriptionPlan][currentBillingPeriod as "monthly" | "annual"];

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: "ACTIVE",
        subscriptionEndDate: newEndDate,
        lastPaymentDate: now,
        nextBillingDate,
        paymentAmount: amount,
        isTrialActive: false,
        updatedAt: new Date()
      }
    });

    return { success: true, user: updatedUser };
  } catch (error) {
    console.error("Error renewing user subscription:", error);
    return { success: false, error: "Failed to renew subscription" };
  }
}

/**
 * Calculate upgrade pricing for BLOOM to FLOURISH upgrade
 */
async function calculateUpgradePrice(userId: string, newPlan: SubscriptionPlan) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const currentPlan = (user as any).subscriptionPlan || "SEED";
    const currentBillingPeriod = (user as any).billingPeriod || "monthly";
    const subscriptionEndDate = (user as any).subscriptionEndDate;

    // Validate upgrade path
    const planHierarchy = { "SEED": 0, "BLOOM": 1, "FLOURISH": 2 };
    if (planHierarchy[newPlan] <= planHierarchy[currentPlan as SubscriptionPlan]) {
      return { success: false, error: "Can only upgrade to a higher plan" };
    }

    if (!subscriptionEndDate) {
      return { success: false, error: "No active subscription found" };
    }

    const now = new Date();
    const endDate = new Date(subscriptionEndDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Calculate prorated amount
    const currentAmount = PLAN_PRICING[currentPlan as SubscriptionPlan][currentBillingPeriod as "monthly" | "annual"];
    const newAmount = PLAN_PRICING[newPlan][currentBillingPeriod as "monthly" | "annual"];
    const totalDays = currentBillingPeriod === "annual" ? 365 : 30;
    
    const unusedAmount = (currentAmount / totalDays) * daysRemaining;
    const proratedNewAmount = (newAmount / totalDays) * daysRemaining;
    const upgradeAmount = Math.max(0, Math.round(proratedNewAmount - unusedAmount));

    return {
      success: true,
      upgradePrice: upgradeAmount,
      currentPlan,
      newPlan,
      billingPeriod: currentBillingPeriod,
      daysRemaining,
      fullNewPlanPrice: newAmount
    };
  } catch (error) {
    console.error("Error calculating upgrade price:", error);
    return { success: false, error: "Failed to calculate upgrade price" };
  }
}

/**
 * Schedule a subscription upgrade for the next billing cycle
 */
async function scheduleUpgrade(userId: string, newPlan: SubscriptionPlan) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    const currentPlan = (user as any).subscriptionPlan || "SEED";
    
    // Validate upgrade path
    const planHierarchy = { "SEED": 0, "BLOOM": 1, "FLOURISH": 2 };
    if (planHierarchy[newPlan] <= planHierarchy[currentPlan as SubscriptionPlan]) {
      return { success: false, error: "Can only upgrade to a higher plan" };
    }

    // For now, we'll store the scheduled upgrade in a custom field
    // In a production system, you might want a separate table for this
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        // Store the scheduled upgrade plan (you might need to add this field to your schema)
        // scheduledUpgradePlan: newPlan,
        updatedAt: new Date()
      }
    });

    return { success: true, user: updatedUser, scheduledPlan: newPlan };
  } catch (error) {
    console.error("Error scheduling upgrade:", error);
    return { success: false, error: "Failed to schedule upgrade" };
  }
}
/**
 * Check if user's subscription is expired and update status
 */
async function checkAndUpdateExpiredSubscriptions() {
  try {
    const now = new Date();
    
    // Get all users first and filter manually (until Prisma client is regenerated)
    const allUsers = await prisma.user.findMany();
    
    const expiredUsers = allUsers.filter(user => {
      const subscriptionStatus = (user as any).subscriptionStatus;
      const subscriptionEndDate = (user as any).subscriptionEndDate;
      
      return subscriptionStatus === "ACTIVE" && 
             subscriptionEndDate && 
             new Date(subscriptionEndDate) < now;
    });

    // Update expired subscriptions one by one
    const updatePromises = expiredUsers.map(user => 
      prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionStatus: "EXPIRED",
          isTrialActive: false,
          updatedAt: now
        }
      })
    );

    await Promise.all(updatePromises);

    return { 
      success: true, 
      expiredCount: expiredUsers.length,
      expiredUsers: expiredUsers.map(user => ({ id: user.id, email: user.email }))
    };
  } catch (error) {
    console.error("Error checking expired subscriptions:", error);
    return { success: false, error: "Failed to check expired subscriptions" };
  }
}

/**
 * Get subscription analytics
 */
async function getSubscriptionAnalytics() {
  try {
    const allUsers = await prisma.user.findMany();
    
    // Manual aggregation until Prisma client is regenerated
    const analytics = {
      planBreakdown: {} as Record<string, Record<string, number>>,
      totalActiveSubscriptions: 0,
      totalTrialUsers: 0,
      monthlyRevenue: 0,
      annualRevenue: 0
    };

    allUsers.forEach(user => {
      const plan = (user as any).subscriptionPlan || "SEED";
      const status = (user as any).subscriptionStatus || "INACTIVE";
      const billingPeriod = (user as any).billingPeriod;
      const paymentAmount = (user as any).paymentAmount || 0;
      const isTrialActive = (user as any).isTrialActive;

      // Plan breakdown
      if (!analytics.planBreakdown[plan]) {
        analytics.planBreakdown[plan] = {};
      }
      if (!analytics.planBreakdown[plan][status]) {
        analytics.planBreakdown[plan][status] = 0;
      }
      analytics.planBreakdown[plan][status]++;

      // Active subscriptions
      if (status === "ACTIVE") {
        analytics.totalActiveSubscriptions++;
      }

      // Trial users
      if (isTrialActive) {
        analytics.totalTrialUsers++;
      }

      // Revenue calculation
      if (status === "ACTIVE" && paymentAmount > 0) {
        if (billingPeriod === "monthly") {
          analytics.monthlyRevenue += paymentAmount;
        } else if (billingPeriod === "annual") {
          analytics.annualRevenue += paymentAmount;
        }
      }
    });

    return {
      success: true,
      analytics
    };
  } catch (error) {
    console.error("Error getting subscription analytics:", error);
    return { success: false, error: "Failed to get analytics" };
  }
}

/**
 * Helper function to check if a user has access to a specific feature based on their plan
 */
function hasFeatureAccess(subscriptionPlan: SubscriptionPlan, feature: string): boolean {
  const planFeatures = {
    SEED: ["basic_yoga", "online_support"],
    BLOOM: ["basic_yoga", "online_support", "live_sessions", "general_diet", "ai_chat"],
    FLOURISH: ["basic_yoga", "online_support", "live_sessions", "general_diet", "ai_chat", "individual_sessions", "personalized_diet", "priority_support"]
  };

  return planFeatures[subscriptionPlan]?.includes(feature) || false;
}

/**
 * Get the next billing date for a user
 */
function calculateNextBillingDate(subscriptionEndDate: Date, billingPeriod: "monthly" | "annual"): Date {
  const nextBilling = new Date(subscriptionEndDate);
  const monthsToAdd = billingPeriod === "annual" ? 12 : 1;
  nextBilling.setMonth(nextBilling.getMonth() + monthsToAdd);
  return nextBilling;
}

/**
 * Calculate prorated amount for plan changes
 */
function calculateProratedAmount(
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
  billingPeriod: "monthly" | "annual",
  daysRemaining: number
): number {
  const currentAmount = PLAN_PRICING[currentPlan][billingPeriod];
  const newAmount = PLAN_PRICING[newPlan][billingPeriod];
  const totalDays = billingPeriod === "annual" ? 365 : 30;
  
  const unusedAmount = (currentAmount / totalDays) * daysRemaining;
  const proratedNewAmount = (newAmount / totalDays) * daysRemaining;
  
  return Math.max(0, proratedNewAmount - unusedAmount);
}

export {
  createUserSubscription,
  updateUserSubscription,
  startTrialSubscription,
  cancelUserSubscription,
  reactivateUserSubscription,
  getUserSubscription,
  renewUserSubscription,
  checkAndUpdateExpiredSubscriptions,
  getSubscriptionAnalytics,
  hasFeatureAccess,
  calculateUpgradePrice,
  scheduleUpgrade
};
