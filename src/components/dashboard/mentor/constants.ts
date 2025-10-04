import {
  BarChart3,
  Video,
  Users,
  Calendar,
  Star,
  Settings,
  Ticket,
  IndianRupee,
  FileText,
} from "lucide-react";
import { type MentorSidebarMenuItem } from "./types";

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
    description: "Manage your time slots and schedule",
  },
  {
    id: "pricing",
    title: "Session Pricing",
    icon: IndianRupee,
    description: "Set your session rates",
  },
  {
    id: "diet-plans",
    title: "Diet Plans",
    icon: FileText,
    description: "Create and manage diet plans",
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
    id: "tickets",
    title: "Help & Support",
    icon: Ticket,
    description: "Get help and manage support tickets",
  },
];
