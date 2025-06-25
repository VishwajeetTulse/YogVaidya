import { UserDetails } from "@/lib/userDetails";
import { LucideIcon } from "lucide-react";

export interface ModeratorSidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface ModeratorSectionProps {
  userDetails: UserDetails;
  setActiveSection: (section: string) => void;
}

export interface ModeratorDashboardState {
  userDetails: UserDetails;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
}
