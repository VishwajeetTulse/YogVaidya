import { UserDetails } from "@/lib/userDetails";
import { LucideIcon } from "lucide-react";

export interface MentorSidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface MentorSectionProps {
  userDetails: UserDetails;
  setActiveSection: (section: string) => void;
  formatDate: (date: Date | null | undefined) => string;
}

export interface MentorDashboardState {
  userDetails: UserDetails;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
  formatDate: (date: Date | null | undefined) => string;
}
