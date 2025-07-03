'use server';

import { Prisma } from "@prisma/client";
import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import Razorpay from 'razorpay';
import type { UpdateSubscriptionData, CreateSubscriptionData } from './types';
import { prisma } from './prisma';

// Type helpers for Prisma enums
const PlanTypes = {
  SEED: 'SEED',
  BLOOM: 'BLOOM',
  FLOURISH: 'FLOURISH'
} as const;

const StatusTypes = {
  ACTIVE: 'ACTIVE',
  ACTIVE_UNTIL_END: 'ACTIVE_UNTIL_END',
  INACTIVE: 'INACTIVE',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  PENDING: 'PENDING'
} as const;

const BillingPeriods = {
  monthly: 'monthly',
  annual: 'annual'
} as const;

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
    // First, get the current user data to check existing subscription
    const user = await prisma.user.findUnique({
      where: { id: data.userId }
    });

    if (!user) {
      return { success: false, error: "User not found", code: "USER_NOT_FOUND" };
    }

    const updateData: Prisma.UserUpdateInput = {
      updatedAt: new Date()
    };

    // Validate subscription plan if provided
    if (data.subscriptionPlan !== undefined) {
      // Validate against our constant object
      if (!Object.values(PlanTypes).includes(data.subscriptionPlan)) {
        return { success: false, error: "Invalid subscription plan", code: "INVALID_PLAN" };
      }
      updateData.subscriptionPlan = data.subscriptionPlan;
    }

    // Validate subscription status if provided
    if (data.subscriptionStatus !== undefined) {
      // Validate against our constant object
      if (!Object.values(StatusTypes).includes(data.subscriptionStatus)) {
        return { success: false, error: "Invalid subscription status", code: "INVALID_STATUS" };
      }
      // Update using Prisma enum directly
      updateData.subscriptionStatus = data.subscriptionStatus;
    }

    // Validate billing period if provided
    if (data.billingPeriod !== undefined) {
      // billingPeriod is a String in the schema, not an enum
      if (!Object.values(BillingPeriods).includes(data.billingPeriod)) {
        return { success: false, error: "Invalid billing period", code: "INVALID_BILLING_PERIOD" };
      }
      updateData.billingPeriod = data.billingPeriod;
    }

    // Validate dates
    if (data.subscriptionStartDate !== undefined) {
      if (!(data.subscriptionStartDate instanceof Date)) {
        data.subscriptionStartDate = new Date(data.subscriptionStartDate);
      }
      if (isNaN(data.subscriptionStartDate.getTime())) {
        return { success: false, error: "Invalid start date", code: "INVALID_START_DATE" };
      }
      updateData.subscriptionStartDate = data.subscriptionStartDate;
    }

    if (data.subscriptionEndDate !== undefined) {
      if (!(data.subscriptionEndDate instanceof Date)) {
        data.subscriptionEndDate = new Date(data.subscriptionEndDate);
      }
      if (isNaN(data.subscriptionEndDate.getTime())) {
        return { success: false, error: "Invalid end date", code: "INVALID_END_DATE" };
      }
      updateData.subscriptionEndDate = data.subscriptionEndDate;
    }

    // Add other validated fields
    if (data.razorpaySubscriptionId !== undefined) updateData.razorpaySubscriptionId = data.razorpaySubscriptionId;
    if (data.razorpayCustomerId !== undefined) updateData.razorpayCustomerId = data.razorpayCustomerId;
    if (data.lastPaymentDate !== undefined) updateData.lastPaymentDate = data.lastPaymentDate;
    if (data.nextBillingDate !== undefined) updateData.nextBillingDate = data.nextBillingDate;
    if (data.paymentAmount !== undefined) updateData.paymentAmount = data.paymentAmount;
    if (data.isTrialActive !== undefined) updateData.isTrialActive = data.isTrialActive;
    if (data.trialEndDate !== undefined) updateData.trialEndDate = data.trialEndDate;
    if (data.autoRenewal !== undefined) updateData.autoRenewal = data.autoRenewal;

    // Update the user record
    const updatedUser = await prisma.user.update({
      where: { id: data.userId },
      data: updateData
    });

    return { 
      success: true, 
      user: updatedUser,
      code: "UPDATE_SUCCESS"
    };
  } catch (error) {
    console.error("Error updating user subscription:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update subscription";
    return { 
      success: false, 
      error: errorMessage,
      code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : "UPDATE_FAILED"
    };
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
 * @param userId The ID of the user whose subscription to cancel
 * @param silent If true, no SMS notification will be sent (used for upgrades)
 */
async function cancelUserSubscription(userId: string, silent: boolean = false) {
  try {
    // First, get the user to check their current subscription status
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Check if subscription is already scheduled for cancellation
    if (!user.autoRenewal) {
      return {
        success: true,
        alreadyCancelled: true,
        user,
        details: {
          message: "Subscription is already scheduled for cancellation",
          isScheduledForCancellation: true,
          willRemainActiveUntil: user.subscriptionEndDate,
          autoRenewalDisabled: true
        }
      };
    }

    const razorpaySubscriptionId = user.razorpaySubscriptionId;
    let scheduledCancellation = false;
    let razorpayError = null;
    
    // Cancel the Razorpay subscription if it exists
    if (razorpaySubscriptionId) {
      try {
        // Cancel at end of billing cycle
        const response = await razorpay.subscriptions.cancel(razorpaySubscriptionId, true);
        scheduledCancellation = true;
        console.log(`Razorpay subscription ${razorpaySubscriptionId} will be cancelled at the end of billing period`);
      } catch (error) {
        razorpayError = error;
        console.error("Error cancelling Razorpay subscription:", error);
        // Continue with local cancellation even if Razorpay fails
      }
    }

    // Update the local database - keep subscription active until end date
    const updateData: Prisma.UserUpdateInput = {
      subscriptionStatus: "ACTIVE", // Keep active until end date
      autoRenewal: false, // This indicates it will be cancelled at end date
      updatedAt: new Date()
    };

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    // Only send SMS notification if not silent
    if (!silent) {
      // Add your SMS notification logic here
      // For example:
      // await sendSubscriptionCancellationSMS(user.phoneNumber);
    }

    return { 
      success: true, 
      user: updatedUser,
      details: {
        isScheduledForCancellation: true,
        willRemainActiveUntil: user.subscriptionEndDate,
        autoRenewalDisabled: true,
        message: scheduledCancellation 
          ? "Your subscription will be cancelled at the end of the billing cycle"
          : "Your subscription has been scheduled for cancellation",
        razorpayError: razorpayError ? (razorpayError instanceof Error ? razorpayError.message : "Unknown error") : null
      }
    };
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

    // Check subscription status based on end date and auto-renewal
    const now = new Date();
    if (user.subscriptionEndDate && !user.autoRenewal) {
      if (now > user.subscriptionEndDate) {
        // Subscription has ended
        await updateUserSubscription({
          userId: user.id,
          subscriptionStatus: 'INACTIVE'
        });
        user.subscriptionStatus = 'INACTIVE';
      }
    }

    // Check Razorpay subscription status if available
    let razorpayStatus: string | undefined;
    if (user.razorpaySubscriptionId) {
      try {
        const razorpaySub = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
        razorpayStatus = razorpaySub.status;
        
        // Update local status based on Razorpay status
        if (razorpayStatus === 'cancelled') {
          if (now > user.subscriptionEndDate!) {
            await updateUserSubscription({
              userId: user.id,
              subscriptionStatus: 'INACTIVE'
            });
            user.subscriptionStatus = 'INACTIVE';
          } else if (user.autoRenewal) {
            // Only update if autoRenewal is still true (not already cancelled locally)
            await updateUserSubscription({
              userId: user.id,
              autoRenewal: false
            });
            user.autoRenewal = false;
          }
        } else if (razorpayStatus === 'expired') {
          await updateUserSubscription({
            userId: user.id,
            subscriptionStatus: 'INACTIVE'
          });
          user.subscriptionStatus = 'INACTIVE';
        }
      } catch (razorpayError) {
        console.error('Error fetching Razorpay subscription:', razorpayError);
      }
    }

    const subscriptionData = {
      ...user,
      subscriptionStatus: user.subscriptionStatus || "INACTIVE",
      isTrialActive: user.isTrialActive || false,
      autoRenewal: user.autoRenewal ?? true,
      razorpayStatus,
      isScheduledForCancellation: user.subscriptionStatus === 'ACTIVE' && !user.autoRenewal,
      willBeInactiveOn: (user.subscriptionStatus === 'ACTIVE' && !user.autoRenewal) ? user.subscriptionEndDate : undefined
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
 * Convert remaining time from current plan to equivalent time in new plan
 * Calculates unused time value and converts it to equivalent days in the new plan based on daily rates
 */
async function convertRemainingTimeToNewPlan(userId: string, newPlan: SubscriptionPlan) {
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
    
    // For same tier plans (SEED<->BLOOM), no time conversion needed
    if (currentPlan === newPlan || (planHierarchy[currentPlan as keyof typeof planHierarchy] === planHierarchy[newPlan])) {
      return {
        success: true,
        upgradePrice: 0,
        isPlanSwitch: true,
        equivalentDaysInNewPlan: 0,
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
    const totalDays = currentBillingPeriod === "annual" ? 365 : 30;
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));

    // Get current pricing
    const planPricing = await getPlanPricing();
    const currentAmount = planPricing[currentPlan as SubscriptionPlan][currentBillingPeriod as "monthly" | "annual"];
    const newAmount = planPricing[newPlan][currentBillingPeriod as "monthly" | "annual"];

    // Calculate daily rates for both plans
    const currentPlanDailyRate = currentAmount / totalDays;
    const newPlanDailyRate = newAmount / totalDays;

    // Convert unused time from current plan to equivalent time in new plan
    // This maintains the value proportion between plans
    const unusedCurrentValue = currentPlanDailyRate * daysRemaining;
    const equivalentDaysInNewPlan = unusedCurrentValue / newPlanDailyRate;
    
    // Calculate the credit amount based on the equivalent days in new plan
    const unusedCredit = newPlanDailyRate * equivalentDaysInNewPlan;

    // Final upgrade amount is new plan's full price minus the equivalent unused credit
    const upgradeAmount = Math.max(0, Math.round(newAmount - unusedCredit));

    return {
      success: true,
      upgradePrice: upgradeAmount,
      unusedCredit: Math.round(unusedCredit),
      equivalentDaysInNewPlan: Math.round(equivalentDaysInNewPlan),
      remainingDays: daysRemaining,
      currentPlanDailyRate: Math.round(currentPlanDailyRate),
      newPlanDailyRate: Math.round(newPlanDailyRate),
      currentPlan,
      newPlan,
      billingPeriod: currentBillingPeriod,
      fullNewPlanPrice: newAmount
    };
  } catch (error) {
    console.error("Error converting plan time:", error);
    return { success: false, error: "Failed to convert plan time" };
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
      },
      createdAt : users.map(user => user.subscriptionStartDate?.toISOString()),
    };
    
  } catch (error) {
    console.error('Error getting subscription analytics:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

// Types for upgrade subscription function
type UpgradeSubscriptionParams = {
  userId: string;
  newPlan: string;
  billingPeriod?: string;
};

type UpgradeSubscriptionResult = {
  success: boolean;
  error?: string;
  code?: string;
  details?: {
    isPlanSwitch: boolean;
    previousPlan: SubscriptionPlan;
    newPlan: SubscriptionPlan;
    subscriptionEndDate: string;
    equivalentDays: number | null;
    autoRenewal: boolean;
    note: string;
  };
};

// Server function for upgrading or switching subscription plans
export async function upgradeUserSubscription({
  userId,
  newPlan,
  billingPeriod = 'monthly' // Default to monthly if not provided
}: UpgradeSubscriptionParams): Promise<UpgradeSubscriptionResult> {
  try {
    // Validate billing period
    if (billingPeriod !== 'monthly' && billingPeriod !== 'annual') {
      return {
        success: false,
        error: 'Invalid billing period',
        code: 'INVALID_BILLING_PERIOD'
      };
    }

    // Validate plan name against our PlanTypes constant
    if (!newPlan || typeof newPlan !== 'string' || !(newPlan in PlanTypes)) {
      return {
        success: false,
        error: `Invalid plan type. Must be one of: ${Object.keys(PlanTypes).join(', ')}`,
        code: 'INVALID_PLAN'
      };
    }

    // Get current subscription details
    const subscriptionResult = await getUserSubscription(userId);
    if (!subscriptionResult.success || !subscriptionResult.subscription) {
      return {
        success: false,
        error: subscriptionResult.error || 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      };
    }

    const currentSubscription = subscriptionResult.subscription;

    // Prevent any plan changes for annual subscriptions
    if (currentSubscription.billingPeriod === 'annual') {
      return {
        success: false,
        error: 'Plan changes are not available for annual subscriptions. Please wait until your current subscription ends or cancel your current subscription.',
        code: 'ANNUAL_CHANGES_NOT_ALLOWED'
      };
    }

    // Plan hierarchy to determine if it's a plan switch or upgrade
    const planHierarchy = {
      "SEED": 0,
      "BLOOM": 0,
      "FLOURISH": 1
    } as const;

    type PlanKey = keyof typeof planHierarchy;
    const isPlanKey = (plan: string | null): plan is PlanKey =>
      typeof plan === 'string' && plan in planHierarchy;

    // Validate plan keys
    if (!currentSubscription.subscriptionPlan) {
      return {
        success: false,
        error: 'Current subscription has no plan type',
        code: 'INVALID_CURRENT_PLAN'
      };
    }
    
    if (!isPlanKey(currentSubscription.subscriptionPlan)) {
      return {
        success: false,
        error: `Current plan type "${currentSubscription.subscriptionPlan}" is not valid. Must be one of: ${Object.keys(planHierarchy).join(', ')}`,
        code: 'INVALID_CURRENT_PLAN'
      };
    }

    if (!isPlanKey(newPlan)) {
      return {
        success: false,
        error: `New plan type "${newPlan}" is not valid. Must be one of: ${Object.keys(planHierarchy).join(', ')}`,
        code: 'INVALID_NEW_PLAN'
      };
    }

    // Determine if it's a switch or upgrade
    const isSameTier = planHierarchy[currentSubscription.subscriptionPlan] === planHierarchy[newPlan];
    const isUpgradeToHigherTier = planHierarchy[newPlan] > planHierarchy[currentSubscription.subscriptionPlan];
    
    if (!isSameTier && !isUpgradeToHigherTier) {
      return {
        success: false,
        error: 'Cannot downgrade to a lower tier plan',
        code: 'INVALID_UPGRADE_PATH'
      };
    }

    // Initialize Razorpay
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    // Get plan IDs
    const planIds = await getPlanIds();
    const planId = planIds[newPlan]?.[billingPeriod];

    if (!planId) {
      return {
        success: false,
        error: 'Plan configuration not found',
        code: 'PLAN_CONFIG_NOT_FOUND'
      };
    }

    // Calculate remaining days and conversion
    const timeConversionResult = await convertRemainingTimeToNewPlan(userId, newPlan);
    if (!timeConversionResult.success) {
      return {
        success: false,
        error: 'Failed to calculate upgrade details',
        code: 'CALCULATION_FAILED'
      };
    }

    // Set switch flag for same tier plans
    if (isSameTier) {
      timeConversionResult.isPlanSwitch = true;
    }

    // Handle Razorpay subscription and end date calculation
    let currentRazorpaySubscription = null;
    let nextBillingDate = null;
    const now = new Date();
    const nowInSeconds = Math.floor(now.getTime() / 1000);

    if (currentSubscription.razorpaySubscriptionId) {
      try {
        currentRazorpaySubscription = await razorpay.subscriptions.fetch(currentSubscription.razorpaySubscriptionId);

        if (currentRazorpaySubscription.current_start && currentRazorpaySubscription.current_end) {
          nextBillingDate = currentRazorpaySubscription.current_end;

          // Validate upgrade timing for non-switches
          if (!isSameTier) {
            const cycleLength = currentRazorpaySubscription.current_end - currentRazorpaySubscription.current_start;
            const timeUsed = nowInSeconds - currentRazorpaySubscription.current_start;
            const percentageUsed = (timeUsed / cycleLength) * 100;

            if (percentageUsed > 66.67) {
              const daysUsed = Math.floor(timeUsed / (24 * 60 * 60));
              const totalDays = Math.floor(cycleLength / (24 * 60 * 60));
              return {
                success: false,
                error: `Cannot upgrade after using 2/3 of billing cycle. Currently used ${daysUsed} days out of ${totalDays} days.`,
                code: 'UPGRADE_TIME_EXCEEDED'
              };
            }
          }

          // Handle billing cycle edge case
          if (nextBillingDate - nowInSeconds < 3600) {
            nextBillingDate += (currentRazorpaySubscription.current_end - currentRazorpaySubscription.current_start);
          }
        }

        // Cancel or schedule cancellation of current subscription
        if (currentSubscription.razorpaySubscriptionId) {
          if (!isSameTier) {
            // For upgrades, cancel immediately and silently
            await razorpay.subscriptions.cancel(currentSubscription.razorpaySubscriptionId, false);
            await cancelUserSubscription(userId, true); // Silent cancellation for upgrade
          } else {
            // For switches, schedule cancellation at end of period and silently
            await razorpay.subscriptions.cancel(currentSubscription.razorpaySubscriptionId, true);
            await cancelUserSubscription(userId, true); // Silent cancellation for switch
          }
        }
      } catch (error) {
        console.warn('Error managing Razorpay subscription:', error);
      }
    }

    // Calculate new subscription end date
    let newSubscriptionEndDate;
    if (isSameTier) {
      newSubscriptionEndDate = nextBillingDate || currentRazorpaySubscription?.current_end || 
        (nowInSeconds + (billingPeriod === 'monthly' ? 30 : 365) * 24 * 60 * 60);
    } else {
      const equivalentDaysInNewPlan = timeConversionResult.equivalentDaysInNewPlan || 0;
      const equivalentSecondsInNewPlan = equivalentDaysInNewPlan * 24 * 60 * 60;
      newSubscriptionEndDate = nowInSeconds + equivalentSecondsInNewPlan;
    }

    // Get the new plan's pricing
    const planPricing = await getPlanPricing();
    const newPlanAmount = planPricing[newPlan as SubscriptionPlan][billingPeriod as "monthly" | "annual"];
    
    // Calculate the new billing dates using the existing now variable
    const newStartDate = now; // Use the Date object directly
    const newEndDate = new Date(newSubscriptionEndDate * 1000);
    const newBillingDate = new Date(newEndDate); // Next billing date is same as end date since autoRenewal is false

    // Update subscription in database with complete billing information
    await updateUserSubscription({
      userId,
      subscriptionPlan: newPlan,
      billingPeriod,
      razorpaySubscriptionId: isSameTier ? currentSubscription.razorpaySubscriptionId || undefined : undefined,
      autoRenewal: false, // Set to false for both switches and upgrades
      subscriptionStatus: 'ACTIVE',
      subscriptionStartDate: newStartDate,
      subscriptionEndDate: newEndDate,
      nextBillingDate: newBillingDate,
      lastPaymentDate: now,
      paymentAmount: newPlanAmount
    });

    return {
      success: true,
      details: {
        isPlanSwitch: isSameTier,
        previousPlan: currentSubscription.subscriptionPlan,
        newPlan: newPlan,
        subscriptionEndDate: new Date(newSubscriptionEndDate * 1000).toISOString(),
        equivalentDays: isSameTier ? null : timeConversionResult.equivalentDaysInNewPlan || 0,
        autoRenewal: false, // Always false for both switches and upgrades
        note: isSameTier 
          ? 'Switched plans while maintaining current billing cycle' 
          : `Upgraded plan with ${timeConversionResult.equivalentDaysInNewPlan} days based on unused time conversion`
      }
    };
  } catch (error) {
    console.error('Error in upgradeUserSubscription:', error);
    return {
      success: false,
      error: 'Failed to process subscription upgrade',
      code: 'UPGRADE_FAILED'
    };
  }
}

/**
 * Updates subscription statuses in batch
 * This function should be called by a cron job daily
 * It will:
 * 1. Find all subscriptions that have expired
 * 2. Update their status to INACTIVE
 * 3. Process Razorpay subscription status changes
 */
export async function batchUpdateSubscriptionStatuses() {
  try {
    const now = new Date();
    
    // Find all active subscriptions that have expired
    const expiredSubscriptions = await prisma.user.findMany({
      where: {
        AND: [
          { subscriptionStatus: "ACTIVE" },
          { subscriptionEndDate: { lt: now } },
          { autoRenewal: false }
        ]
      },
      select: {
        id: true,
        razorpaySubscriptionId: true
      }
    });

    const updatePromises = expiredSubscriptions.map(async (user) => {
      // Check Razorpay status if available
      if (user.razorpaySubscriptionId) {
        try {
          const razorpaySub = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
          if (razorpaySub.status === 'cancelled' || razorpaySub.status === 'expired') {
            await updateUserSubscription({
              userId: user.id,
              subscriptionStatus: 'INACTIVE',
              razorpaySubscriptionId: undefined // Clear the Razorpay ID as it's no longer active
            });
          }
        } catch (error) {
          console.error(`Error checking Razorpay status for user ${user.id}:`, error);
          // Continue with local status update even if Razorpay check fails
        }
      }

      // Update local status
      return updateUserSubscription({
        userId: user.id,
        subscriptionStatus: 'INACTIVE'
      });
    });

    // Process all updates
    const results = await Promise.allSettled(updatePromises);
    
    // Count successes and failures
    const summary = results.reduce((acc, result) => {
      if (result.status === 'fulfilled' && result.value.success) {
        acc.succeeded++;
      } else {
        acc.failed++;
      }
      return acc;
    }, { succeeded: 0, failed: 0 });

    return {
      success: true,
      summary,
      processedAt: now.toISOString(),
      totalProcessed: expiredSubscriptions.length
    };
  } catch (error) {
    console.error('Error in batch subscription update:', error);
    return {
      success: false,
      error: 'Failed to process batch subscription updates',
      errorDetail: error instanceof Error ? error.message : 'Unknown error'
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
  convertRemainingTimeToNewPlan,
  createPlan,
  getPlanIds,
  getPlanPricing
};
