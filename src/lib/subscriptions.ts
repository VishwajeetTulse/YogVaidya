'use server';

import { PrismaClient } from "@prisma/client";
import Razorpay from 'razorpay';
import type { 
  SubscriptionPlan, 
  SubscriptionStatus,
  UpdateSubscriptionData,
  CreateSubscriptionData
} from './types';

// Re-export types for backwards compatibility
export type { SubscriptionPlan, SubscriptionStatus, UpdateSubscriptionData, CreateSubscriptionData };

const prisma = new PrismaClient();

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Get Razorpay plan IDs
async function getPlanIds() {
  const allPlans = ["SEED", "BLOOM", "FLOURISH"] as const;
  const allBillingPeriods = ["monthly", "annual"] as const;
  
  // Initialize plan IDs object
  const planIds = {
    SEED: {
      monthly: process.env.SEED_MONTHLY_PLAN_ID,
      annual: process.env.SEED_ANNUAL_PLAN_ID
    },
    BLOOM: {
      monthly: process.env.BLOOM_MONTHLY_PLAN_ID,
      annual: process.env.BLOOM_ANNUAL_PLAN_ID
    },
    FLOURISH: {
      monthly: process.env.FLOURISH_MONTHLY_PLAN_ID,
      annual: process.env.FLOURISH_ANNUAL_PLAN_ID
    }
  } as const;

  // Validate that all plan IDs are set
  for (const plan of allPlans) {
    for (const period of allBillingPeriods) {
      if (!planIds[plan][period]) {
        console.error(`Missing Razorpay plan ID for ${plan} ${period} in environment variables`);
      }
    }
  }

  return planIds;
}

// Plan pricing configuration
async function getPlanPricing() {
  const monthlyPrices = {
    SEED: 1999,
    BLOOM: 1999,
    FLOURISH: 4999
  };

  // Calculate annual prices with 20% discount
  const annualPrices = Object.fromEntries(
    Object.entries(monthlyPrices).map(([plan, price]) => [
      plan,
      Math.round(price * 12 * 0.8) // 20% discount on annual plans
    ])
  );

  return {
    SEED: { 
      monthly: monthlyPrices.SEED,
      annual: annualPrices.SEED 
    },
    BLOOM: { 
      monthly: monthlyPrices.BLOOM,
      annual: annualPrices.BLOOM 
    },
    FLOURISH: { 
      monthly: monthlyPrices.FLOURISH,
      annual: annualPrices.FLOURISH 
    }
  } as const;
}


// Trial period configuration (in days)
const TRIAL_PERIOD_DAYS = 7;

/**
 * Update user subscription details
 */
async function updateUserSubscription(data: UpdateSubscriptionData) {
  try {
    // First, get the current user data to check Razorpay subscription
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

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

    
    // Update Razorpay subscription if it exists and plan or amount has changed
    const razorpaySubId = (user as any).razorpaySubscriptionId;
    if (razorpaySubId && (data.subscriptionPlan !== undefined || data.paymentAmount !== undefined)) {
      try {
        const currentSub = await razorpay.subscriptions.fetch(razorpaySubId);
        
        // Only update if the subscription is active
        if (currentSub.status === 'active') {          // Calculate the new plan amount in paisa
          const newAmount = data.paymentAmount ? Math.round(data.paymentAmount * 100) : undefined;
          
          // Create a new plan if amount is changing
          let planId = currentSub.plan_id;
          if (newAmount) {
            const newPlan = await razorpay.plans.create({
              period: data.billingPeriod === 'annual' ? 'yearly' : 'monthly',
              interval: 1,
              item: {
                name: `${data.subscriptionPlan || currentSub.plan_id} Plan`,
                amount: newAmount,
                currency: 'INR'
              }
            });
            planId = newPlan.id;
          }
          
          // Update the subscription
          await razorpay.subscriptions.update(razorpaySubId, {
            plan_id: planId,
            quantity: 1,
            total_count: data.billingPeriod === 'annual' ? 12 : 1,
            customer_notify: 1
          });
        }
      } catch (razorpayError) {
        console.error("Error updating Razorpay subscription:", razorpayError);
        // Continue with local update even if Razorpay update fails
      }
    }
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

    // Get pricing and calculate payment amount
    const planPricing = await getPlanPricing();
    const paymentAmount = data.paymentAmount || 
      planPricing[data.subscriptionPlan][data.billingPeriod];

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
 * Get user subscription details
 */
async function getUserSubscription(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        billingPeriod: true,
        razorpaySubscriptionId: true,
        razorpayCustomerId: true,
        lastPaymentDate: true,
        nextBillingDate: true,
        paymentAmount: true,
        isTrialActive: true,
        trialEndDate: true,
        autoRenewal: true
      }
    });

    if (!user) {
      return { success: false, error: "User not found", code: "USER_NOT_FOUND" };
    }

    // Check Razorpay subscription status if available
    let razorpayStatus: string | undefined;
    if (user.razorpaySubscriptionId) {
      try {
        const razorpaySub = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
        razorpayStatus = razorpaySub.status;
        
        // Update local status if Razorpay status indicates subscription is no longer active
        if (razorpayStatus === 'cancelled' || razorpayStatus === 'expired') {
          await updateUserSubscription({
            userId: user.id,
            subscriptionStatus: 'INACTIVE'
          });
          user.subscriptionStatus = 'INACTIVE';
        }
      } catch (razorpayError) {
        console.error('Error fetching Razorpay subscription:', razorpayError);
        // Don't fail the request, just log the error
      }
    }

    const subscriptionData = {
      ...user,
      subscriptionStatus: user.subscriptionStatus || "INACTIVE",
      isTrialActive: user.isTrialActive || false,
      autoRenewal: user.autoRenewal ?? true,
      razorpayStatus
    };

    return { success: true, subscription: subscriptionData };
  } catch (error) {
    console.error("Error getting user subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get subscription details";
    return { 
      success: false, 
      error: errorMessage,
      code: "SUBSCRIPTION_FETCH_ERROR"
    };
  }
}

/**
 * Calculate upgrade pricing for BLOOM to FLOURISH upgrade
 */
async function calculateUpgradePrice(userId: string, newPlan: SubscriptionPlan) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        subscriptionPlan: true,
        billingPeriod: true,
        subscriptionEndDate: true,
        subscriptionStatus: true,
        razorpaySubscriptionId: true
      }
    });

    if (!user) {
      return { success: false, error: "User not found", code: "USER_NOT_FOUND" };
    }

    const currentPlan = user.subscriptionPlan;
    if (!currentPlan) {
      return { success: false, error: "No subscription plan found", code: "NO_PLAN_FOUND" };
    }

    // Validate subscription status
    if (user.subscriptionStatus !== "ACTIVE") {
      return { success: false, error: "Subscription is not active", code: "INACTIVE_SUBSCRIPTION" };
    }

    const currentBillingPeriod = user.billingPeriod || "monthly";
    const subscriptionEndDate = user.subscriptionEndDate;

    // Validate upgrade path with SEED and BLOOM at same level
    const planHierarchy = { "SEED": 0, "BLOOM": 0, "FLOURISH": 1 };
    
    // For same tier plans (SEED<->BLOOM), no price difference
    if (currentPlan === newPlan || (planHierarchy[currentPlan as keyof typeof planHierarchy] === planHierarchy[newPlan])) {
      return {
        success: true,
        upgradePrice: 0,
        isPlanSwitch: true,
        currentPlan,
        newPlan,
        billingPeriod: currentBillingPeriod
      };
    }

    // Only allow upgrades to higher tier
    if (planHierarchy[newPlan] <= planHierarchy[currentPlan as keyof typeof planHierarchy]) {
      return { success: false, error: "Can only upgrade to a higher plan" };
    }

    if (!subscriptionEndDate) {
      return { success: false, error: "No active subscription found" };
    }

    const now = new Date();
    const endDate = new Date(subscriptionEndDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Get current pricing
    const planPricing = await getPlanPricing();
    const currentAmount = planPricing[currentPlan as SubscriptionPlan][currentBillingPeriod as "monthly" | "annual"];
    const newAmount = planPricing[newPlan][currentBillingPeriod as "monthly" | "annual"];
    const totalDays = currentBillingPeriod === "annual" ? 365 : 30;

    // Calculate daily rates
    const currentPlanDailyRate = currentAmount / totalDays;
    const newPlanDailyRate = newAmount / totalDays;

    // Calculate unused amount from current plan that will be credited
    const unusedAmount = currentPlanDailyRate * daysRemaining;

    // Calculate prorated amount for the new plan
    const proratedNewAmount = newPlanDailyRate * daysRemaining;

    // Final upgrade amount is the difference, with credit for unused current plan
    const upgradeAmount = Math.max(0, Math.round(proratedNewAmount - unusedAmount));

    return {
      success: true,
      upgradePrice: upgradeAmount,
      unusedCredit: Math.round(unusedAmount),
      proratedNewAmount: Math.round(proratedNewAmount),
      remainingDays: daysRemaining,
      currentPlan,
      newPlan,
      billingPeriod: currentBillingPeriod,
      fullNewPlanPrice: newAmount
    };
  } catch (error) {
    console.error("Error calculating upgrade price:", error);
    return { success: false, error: "Failed to calculate upgrade price" };
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
async function calculateProratedAmount(
  currentPlan: SubscriptionPlan,
  newPlan: SubscriptionPlan,
  billingPeriod: "monthly" | "annual",
  daysRemaining: number
) {
  const planPricing = await getPlanPricing();
  const currentAmount = planPricing[currentPlan][billingPeriod];
  const newAmount = planPricing[newPlan][billingPeriod];
  const totalDays = billingPeriod === "annual" ? 365 : 30;
  
  const unusedAmount = (currentAmount / totalDays) * daysRemaining;
  const proratedNewAmount = (newAmount / totalDays) * daysRemaining;
  
  return Math.max(0, proratedNewAmount - unusedAmount);
}

// Define User type with subscription fields
interface User {
  id: string;
  email: string;
  name: string;
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
  updatedAt: Date;
}

// Razorpay error handling
interface RazorpayError extends Error {
  statusCode?: number;
  error?: {
    description?: string;
    code?: string;
  };
}

function handleRazorpayError(error: RazorpayError): { message: string; code: string } {
  if (error.statusCode === 400) {
    return { 
      message: "Invalid request to payment gateway",
      code: "RAZORPAY_INVALID_REQUEST"
    };
  } else if (error.statusCode === 401) {
    return {
      message: "Payment gateway authentication failed",
      code: "RAZORPAY_AUTH_ERROR"
    };
  } else if (error.error?.description) {
    return {
      message: error.error.description,
      code: error.error.code || "RAZORPAY_ERROR"
    };
  }
  return {
    message: error.message || "Payment gateway error",
    code: "RAZORPAY_UNKNOWN_ERROR"
  };
}

// Create a Razorpay plan
async function createPlan(planType: SubscriptionPlan, billingPeriod: "monthly" | "annual") {
  try {
    const planPricing = await getPlanPricing();
    const planAmount = planPricing[planType][billingPeriod];
    
    const plan = await razorpay.plans.create({
      period: billingPeriod === "annual" ? "yearly" : "monthly",
      interval: 1,
      item: {
        name: `${planType} Plan (${billingPeriod})`,
        amount: planAmount * 100, // Convert to paisa
        currency: "INR",
        description: `${planType} subscription plan - ${billingPeriod} billing`
      }
    });
    return { success: true, plan };
  } catch (error) {
    console.error("Error creating Razorpay plan:", error);
    return { success: false, error: "Failed to create plan" };
  }
}

/**
 * Get analytics data related to subscriptions
 * Returns information about total active subscriptions and breakdown by plan
 */
export async function getSubscriptionAnalytics() {
  try {
    // Get all users with subscription data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        billingPeriod: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true
      }
    });

    // Count active subscriptions
    const activeSubscriptions = users.filter(user => 
      user.subscriptionStatus === 'ACTIVE'
    );
    
    // Calculate total active subscriptions
    const totalActiveSubscriptions = activeSubscriptions.length;
    
    // Initialize plan breakdown with all possible status combinations
    const planBreakdown: Record<string, Record<string, number>> = {
      'SEED': {
        'ACTIVE': 0,
        'INACTIVE': 0,
        'CANCELLED': 0,
        'EXPIRED': 0,
        'PENDING': 0
      },
      'BLOOM': {
        'ACTIVE': 0,
        'INACTIVE': 0,
        'CANCELLED': 0,
        'EXPIRED': 0,
        'PENDING': 0
      },
      'FLOURISH': {
        'ACTIVE': 0,
        'INACTIVE': 0,
        'CANCELLED': 0,
        'EXPIRED': 0,
        'PENDING': 0
      }
    };
    
    // Calculate breakdown by plan and status
    users.forEach(user => {
      if (user.subscriptionPlan && user.subscriptionStatus) {
        // Increment the counter for this plan and status
        planBreakdown[user.subscriptionPlan][user.subscriptionStatus] = 
          (planBreakdown[user.subscriptionPlan][user.subscriptionStatus] || 0) + 1;
      }
    });
    
    // Calculate billing period breakdown (monthly vs annual)
    const billingPeriodBreakdown = {
      monthly: 0,
      annual: 0
    };
    
    activeSubscriptions.forEach(user => {
      if (user.billingPeriod === 'monthly') {
        billingPeriodBreakdown.monthly++;
      } else if (user.billingPeriod === 'annual') {
        billingPeriodBreakdown.annual++;
      }
    });
    
    // Calculate retention metrics
    const currentDate = new Date();
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    // Count users whose subscription has been active for more than a month
    const retainedUsers = activeSubscriptions.filter(user => 
      user.subscriptionStartDate && user.subscriptionStartDate < lastMonth
    ).length;
    
    // Retention rate (percentage of active users who have subscribed for more than a month)
    const retentionRate = totalActiveSubscriptions > 0 
      ? (retainedUsers / totalActiveSubscriptions) * 100 
      : 0;
    
    return {
      success: true,
      analytics: {
        totalActiveSubscriptions,
        planBreakdown,
        billingPeriodBreakdown,
        retentionRate: Math.round(retentionRate * 100) / 100, // Round to 2 decimal places
      }
    };
    
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Export only async functions and helper functions
export {
  createUserSubscription,
  updateUserSubscription,
  startTrialSubscription,
  cancelUserSubscription,
  getUserSubscription,
  hasFeatureAccess,
  calculateUpgradePrice,
  createPlan,
  getPlanIds,
  getPlanPricing
};
