import { ReactNode } from "react";
import { UserDetails } from "@/lib/userDetails";
import { SectionProps } from "../user/types";

export interface BaseDashboardProps {
  loading: boolean;
  activeSection: string;
  children?: ReactNode;
  sidebar: ReactNode;
  sectionRenderer: ReactNode;
}

export interface BaseSectionRendererProps {
  activeSection: string;
  userDetails: UserDetails | null;
  setActiveSection: (section: string) => void;
}

export interface BaseSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => Promise<void>;
  userDetails: UserDetails | null;
}

export interface BaseHookResult {
  userDetails: UserDetails | null;
  loading: boolean;
  activeSection: string;
  setActiveSection: (section: string) => void;
  handleSignOut: () => Promise<void>;
  fetchUserDetails: () => Promise<void>;
}

export interface SectionConfig {
  id: string;
  label: string;
  component?: (props : SectionProps) => React.ReactNode;
  roles?: string[];
}

