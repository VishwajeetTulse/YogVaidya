import { LucideIcon } from "lucide-react";

export interface AdminSidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface AdminSectionProps {
  userDetails: any;
  setActiveSection: (section: string) => void;
}

export interface AdminDashboardState {
  userDetails: any;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
}
