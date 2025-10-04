"use client";

import React from "react";
import { BaseDashboard } from "./base-dashboard";
import { GenericSidebar } from "./sidebar-base";
import { GenericSectionRenderer } from "./generic-section-renderer";
import { useDashboard } from "./use-dashboard";
import { type SectionConfig } from "./types";
import { type BaseHookResult } from "./types";
import { type SectionProps } from "../user/types";
import { type SidebarMenuItem } from "../user/types";
import { CircleAlert } from "lucide-react";
import { type MentorSectionProps } from "../mentor/types";
import { type ModeratorSectionProps } from "../moderator/types";
import { type AdminSectionProps } from "../admin/types";

// Create a generic type for section components based on role
type RoleSectionProps<T extends string> = T extends "mentor"
  ? MentorSectionProps
  : T extends "admin"
    ? AdminSectionProps
    : T extends "moderator"
      ? ModeratorSectionProps
      : SectionProps;

export interface UnifiedDashboardProps<T extends string = string> {
  role: T;
  dashboardTitle: string;
  sectionComponentMap: Record<string, React.ComponentType<RoleSectionProps<T>>>;
  menuItems: SidebarMenuItem[];
  roleLabel?: string;
  initialActiveSection?: string;
  getIcon?: (id: string) => React.ElementType;
  extendedHook?: (baseHookResult: BaseHookResult) => BaseHookResult;
}

export const UnifiedDashboard = <T extends string>({
  dashboardTitle,
  menuItems,
  sectionComponentMap,
  roleLabel,
  initialActiveSection = "overview",
  getIcon,
  extendedHook,
}: UnifiedDashboardProps<T>) => {
  // Use the base dashboard hook
  const baseHookResult = useDashboard(initialActiveSection);

  // Use extended hook if provided
  const hookResult = extendedHook ? extendedHook(baseHookResult) : baseHookResult;

  const { userDetails, loading, activeSection, setActiveSection, handleSignOut, ...otherProps } =
    hookResult;

  // Helper function to get an icon for a section ID if not provided
  const getIconForSection = (id: string): React.ElementType => {
    if (getIcon) {
      const icon = getIcon(id);
      if (icon) return icon;
    }

    // Find the menu item with this ID
    const menuItem = menuItems.find((item) => item.id === id);
    if (menuItem?.icon) return menuItem.icon;

    // Fallback to a default  icon
    return CircleAlert;
  };

  const sidebar = (
    <GenericSidebar
      activeSection={activeSection}
      setActiveSection={setActiveSection}
      handleSignOut={handleSignOut}
      userDetails={userDetails}
      dashboardTitle={dashboardTitle}
      menuItems={menuItems}
      roleLabel={roleLabel}
      getIcon={getIconForSection}
    />
  );
  // Convert menuItems to SectionConfig format for the renderer
  const sections: SectionConfig[] = menuItems.map((item) => ({
    id: item.id,
    label: item.title,
  }));

  const sectionRenderer = (
    <GenericSectionRenderer<RoleSectionProps<T>>
      activeSection={activeSection}
      userDetails={userDetails}
      setActiveSection={setActiveSection}
      sections={sections}
      sectionComponentMap={sectionComponentMap}
      {...otherProps}
    />
  );

  return (
    <BaseDashboard
      loading={loading}
      activeSection={activeSection}
      sidebar={sidebar}
      sectionRenderer={sectionRenderer}
    />
  );
};
