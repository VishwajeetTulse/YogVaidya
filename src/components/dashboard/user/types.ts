import { LucideIcon } from "lucide-react";
import { UserDetails } from "@/lib/userDetails";
import { SubscriptionPlan } from "@prisma/client";

export interface CancellationResponse {
  success: boolean;
  alreadyCancelled?: boolean;
  user?: any;
  details?: {
    isScheduledForCancellation: boolean;
    willRemainActiveUntil: Date;
    autoRenewalDisabled: boolean;
    message: string;
    razorpayError: string | null;
  };
  message?: string;
}

export interface UpgradeResponse {
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
}

export interface SidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface DashboardProps {
  userDetails: UserDetails;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  billingPeriod: "monthly" | "annual";
  setBillingPeriod: (period: "monthly" | "annual") => void;
  viewMode: "cards" | "comparison";
  setViewMode: (mode: "cards" | "comparison") => void;
  cancellingSubscription: boolean;
  handleCancelSubscription: () => Promise<CancellationResponse>;
  handleUpgradeSubscription: (planId: string, billingPeriod: "monthly" | "annual") => Promise<UpgradeResponse>;
  formatDate: (date: Date | null | undefined) => string;
  getStatusColor: (status: string) => string;
  refreshSubscriptionData: () => Promise<void>;
}

export interface SectionProps extends Omit<Partial<DashboardProps>, 'loading' | 'userDetails' | 'activeSection' | 'setActiveSection'> {
  userDetails: UserDetails;
  setActiveSection: (section: string) => void;
}
