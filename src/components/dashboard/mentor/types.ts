import { LucideIcon } from "lucide-react";

export interface MentorSidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface MentorSectionProps {
  userDetails: any;
  setActiveSection: (section: string) => void;
  formatDate: (date: Date | null | undefined) => string;
}

export interface MentorDashboardState {
  userDetails: any;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
  formatDate: (date: Date | null | undefined) => string;
}
