// Subscription types
export type SubscriptionPlan = "SEED" | "BLOOM" | "FLOURISH";
export type SubscriptionStatus = "ACTIVE" | "INACTIVE" | "CANCELLED" | "EXPIRED" | "PENDING";
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
