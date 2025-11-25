/**
 * Subscription-related types
 * Types for subscription management, billing, and renewal operations
 */

import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";

// Re-export Prisma subscription types for convenience
export type { SubscriptionPlan, SubscriptionStatus };

// Billing period options
export type BillingPeriod = "monthly" | "annual";

// Types for subscription update operations
export interface UpdateSubscriptionData {
  userId: string;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  billingPeriod?: BillingPeriod;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  lastPaymentDate?: Date;
  nextBillingDate?: Date;
  paymentAmount?: number;
  isTrialActive?: boolean;
  trialEndDate?: Date;
  autoRenewal?: boolean;
}

// Types for subscription creation
export interface CreateSubscriptionData {
  userId: string;
  subscriptionPlan: SubscriptionPlan;
  billingPeriod: BillingPeriod;
  razorpaySubscriptionId?: string;
  razorpayCustomerId?: string;
  paymentAmount?: number;
  autoRenewal?: boolean;
}

// Renewal system types
export interface RenewalResult {
  success: boolean;
  message?: string;
  renewed?: number;
  error?: string;
  errors?: string[];
}

export interface RenewalStats {
  usersDueToday: number;
  totalActiveSubscriptions: number;
  usersWithRazorpaySubscriptions: number;
  testDate: string;
}
