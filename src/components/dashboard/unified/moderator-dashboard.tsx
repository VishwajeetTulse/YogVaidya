"use client";

import React from "react";
import { UnifiedDashboard } from "../shared/unified-dashboard";
import { MODERATOR_SIDEBAR_MENU_ITEMS } from "../moderator/constants";
import type { ModeratorSectionProps } from "../moderator/types";

// Import all moderator section components
import { OverviewSection } from "../moderator/sections/overview-section";
import { ApplicationsSection } from "../shared/applications-section";
import { UsersSection } from "../shared/users-management-section";
import { MentorManagementSection } from "../admin/sections/mentor-management-section";
import { AnalyticsSection } from "../moderator/sections/analytics-section";
import SubscriptionSection from "../moderator/sections/subscription-section";
import { TicketsSection } from "../moderator/sections/tickets-section";
import { SettingsSection } from "../moderator/sections/settings-section";
import { SupportSection } from "../moderator/sections/support-section";

// Create a mapping of section IDs to components
const MODERATOR_SECTION_COMPONENTS = {
  overview: OverviewSection,
  applications: ApplicationsSection,
  users: UsersSection,
  "mentor-management": MentorManagementSection,
  analytics: AnalyticsSection,
  subscriptions: SubscriptionSection,
  tickets: (props: ModeratorSectionProps) => (
    <TicketsSection userRole="MODERATOR" currentUserId={props.userDetails?.id} />
  ),
  settings: SettingsSection,
  support: SupportSection,
};

export default function ModeratorDashboard() {
  return (
    <UnifiedDashboard<"moderator">
      role="moderator"
      dashboardTitle="Moderator Dashboard"
      menuItems={MODERATOR_SIDEBAR_MENU_ITEMS}
      sectionComponentMap={MODERATOR_SECTION_COMPONENTS}
      roleLabel="Content Moderator"
    />
  );
}
