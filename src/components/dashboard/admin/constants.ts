import {
  BarChart3,
  Users,
  Shield,
  FileText,
  TrendingUp,
  Database,
  Settings,
  UserCheck,
  CreditCard,
  Ticket,
  Activity,
} from "lucide-react";
import { AdminSidebarMenuItem } from "./types";

export const ADMIN_SIDEBAR_MENU_ITEMS: AdminSidebarMenuItem[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BarChart3,
    description: "System overview & stats",
  },
  {
    id: "users",
    title: "User Management",
    icon: Users,
    description: "Manage all users",
  },
  {
    id: "applications",
    title: "Mentor Applications",
    icon: FileText,
    description: "Review mentor applications",
  },
  {
    id: "mentor-management",
    title: "Mentor Management",
    icon: UserCheck,
    description: "Manage mentor data & sync",
  },
  {
    id: "moderators",
    title: "Moderators",
    icon: Shield,
    description: "Manage moderators",
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    icon: CreditCard,
    description: "Manage user subscriptions",
  },
  {
    id: "tickets",
    title: "Support Tickets",
    icon: Ticket,
    description: "Manage customer support & assign tickets",
  },
  {
    id: "logs",
    title: "System Logs",
    icon: Database,
    description: "View system & user logs (including ticket activities)",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: TrendingUp,
    description: "Platform analytics",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "System configuration",
  },
];

