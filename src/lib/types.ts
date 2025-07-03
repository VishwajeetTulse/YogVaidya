import type { SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
export type { SubscriptionPlan, SubscriptionStatus };
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
