import { LucideIcon } from "lucide-react";

export interface ModeratorSidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface ModeratorSectionProps {
  userDetails: any;
  setActiveSection: (section: string) => void;
}

export interface ModeratorDashboardState {
  userDetails: any;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
}
