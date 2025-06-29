import {
  BarChart3,
  Video,
  Users,
  Calendar,
  Star,
  Settings,
  HelpCircle,
} from "lucide-react";
import { MentorSidebarMenuItem } from "./types";

export const MENTOR_SIDEBAR_MENU_ITEMS: MentorSidebarMenuItem[] = [
  {
    id: "overview",
    title: "Overview",
    icon: BarChart3,
    description: "Dashboard overview & stats",
  },
  {
    id: "sessions",
    title: "My Sessions",
    icon: Video,
    description: "Scheduled and past sessions",
  },
  {
    id: "students",
    title: "My Students",
    icon: Users,
    description: "Manage your students",
  },
  {
    id: "schedule",
    title: "Schedule",
    icon: Calendar,
    description: "Manage your availability",
  },
  {
    id: "reviews",
    title: "Reviews & Ratings",
    icon: Star,
    description: "Student feedback",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "App preferences",
  },
  {
    id: "support",
    title: "Help & Support",
    icon: HelpCircle,
    description: "Get help when needed",
  },
];
