import { LucideIcon } from "lucide-react";
import { UserDetails } from "@/lib/userDetails";
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
  handleCancelSubscription: () => void;
  formatDate: (date: Date | null | undefined) => string;
  getStatusColor: (status: string) => string;
}

export interface SectionProps {
  userDetails : UserDetails;
  setActiveSection: (section: string) => void;
  billingPeriod?: "monthly" | "annual";
  setBillingPeriod?: (period: "monthly" | "annual") => void;
  viewMode?: "cards" | "comparison";
  setViewMode?: (mode: "cards" | "comparison") => void;
  cancellingSubscription?: boolean;
  handleCancelSubscription?: () => void;
  formatDate?: (date: Date | null | undefined) => string;
  getStatusColor?: (status: string) => string;
}
