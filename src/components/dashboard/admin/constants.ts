import {
  BarChart3,
  Users,
  Shield,
  Server,
  TrendingUp,
  Database,
  Settings,
  HelpCircle,
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
    id: "moderators",
    title: "Moderators",
    icon: Shield,
    description: "Manage moderators",
  },
  {
    id: "system",
    title: "System Health",
    icon: Server,
    description: "Monitor system status",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: TrendingUp,
    description: "Platform analytics",
  },
  {
    id: "database",
    title: "Database",
    icon: Database,
    description: "Database management",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "System configuration",
  },
  {
    id: "support",
    title: "Help & Support",
    icon: HelpCircle,
    description: "Admin documentation",
  },
];
