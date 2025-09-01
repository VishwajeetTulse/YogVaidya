import {
  Home,
  PlayCircle,
  Users,
  BookOpen,
  CreditCard,
  Target,
  Settings,
  HelpCircle,
  Ticket,
} from "lucide-react";
import { SidebarMenuItem } from "./types";

export const SIDEBAR_MENU_ITEMS: SidebarMenuItem[] = [
  {
    id: "overview",
    title: "Overview",
    icon: Home,
    description: "Dashboard overview",
  },
  {
    id: "classes",
    title: "My Classes",
    icon: PlayCircle,
    description: "Scheduled and past classes",
  },
  {
    id: "mentors",
    title: "My Mentors",
    icon: Users,
    description: "Connect with your guides",
  },
  {
    id: "library",
    title: "Content Library",
    icon: BookOpen,
    description: "Videos, articles, and resources",
  },
  {
    id: "subscription",
    title: "Subscription",
    icon: CreditCard,
    description: "Manage your plan",
  },
  {
    id: "plans",
    title: "Upgrade Plans",
    icon: Target,
    description: "Explore premium plans",
  },
  {
    id: "explore-mentors",
    title: "Explore Mentors",
    icon: Users,
    description: "Find more mentors",
  },
  {
    id: "settings",
    title: "Settings",
    icon: Settings,
    description: "App preferences",
  },
  {
    id: "tickets",
    title: "Support Tickets",
    icon: Ticket,
    description: "Manage your support requests",
  },
  {
    id: "support",
    title: "Help & Support",
    icon: HelpCircle,
    description: "Get help when you need it",
  },
];

