import {
  BarChart3,
  FileText,
  Users,
  TrendingUp,
  Settings,
  HelpCircle,
  CreditCard,
  UserCheck,
  Ticket,
} from "lucide-react";
import { ModeratorSidebarMenuItem } from "./types";

export const MODERATOR_SIDEBAR_MENU_ITEMS: ModeratorSidebarMenuItem[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BarChart3,
    description: "Dashboard overview & stats",
  },
  {
    id: "applications",
    title: "Mentor Applications",
    icon: FileText,
    description: "Review mentor applications",
  },
  {
    id: "users",
    title: "User Management",
    icon: Users,
    description: "Manage platform users",
  },
  {
    id: "mentor-management",
    title: "Mentor Management",
    icon: UserCheck,
    description: "Manage mentor data & profiles",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: TrendingUp,
    description: "Platform insights",
  },
  {
    id: "subscriptions",
    title: "Subscriptions",
    icon: CreditCard,
    description: "View subscription details",
  },
  {
    id: "tickets",
    title: "Support Tickets",
    icon: Ticket,
    description: "Manage customer support",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "Moderator preferences",
  },
  {
    id: "support",
    title: "Help & Support",
    icon: HelpCircle,
    description: "Get help when needed",
  },
];

