import { UserDetails } from "@/lib/userDetails";
import { LucideIcon } from "lucide-react";

export interface AdminSidebarMenuItem {
  id: string;
  title: string;
  icon: LucideIcon;
  description: string;
}

export interface AdminSectionProps {
  userDetails: UserDetails;
  setActiveSection: (section: string) => void;
}

export interface AdminDashboardState {
  userDetails: UserDetails;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => void;
}

