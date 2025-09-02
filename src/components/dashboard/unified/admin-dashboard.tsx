"use client";

import React from "react";
import { UnifiedDashboard } from "../shared/unified-dashboard";
import { ADMIN_SIDEBAR_MENU_ITEMS } from "../admin/constants";

// Import all admin section components
import { OverviewSection } from "../admin/sections/overview-section";
import { UsersSection } from "../shared/users-management-section";
import { ModeratorManagementSection } from "../admin/sections/mod-management-section";
import { MentorManagementSection } from "../admin/sections/mentor-management-section";
import SubscriptionManagementSection from "../admin/sections/subscription-management-section";
import { LogsSection } from "../admin/sections/logs-section";
import { AnalyticsSection } from "../admin/sections/analytics-section";
import { SettingsSection } from "../admin/sections/settings-section";
import { ApplicationsSection } from "../shared/applications-section";
import { TicketsSection } from "../moderator/sections/tickets-section";
// Create a mapping of section IDs to components
const ADMIN_SECTION_COMPONENTS = {
  overview: OverviewSection,
  users: UsersSection,
  applications: ApplicationsSection,
  "mentor-management": MentorManagementSection,
  moderators: ModeratorManagementSection,
  subscriptions: SubscriptionManagementSection,
  tickets: (props: any) => <TicketsSection userRole="ADMIN" currentUserId={props.userDetails?.id} />,
  logs: LogsSection,
  analytics: AnalyticsSection,
  settings: SettingsSection,
};

export default function AdminDashboard() {
  return (
    <UnifiedDashboard<'admin'>
      role="admin"
      dashboardTitle="Admin Dashboard"
      menuItems={ADMIN_SIDEBAR_MENU_ITEMS}
      sectionComponentMap={ADMIN_SECTION_COMPONENTS}
      roleLabel="System Administrator"
    />
  );
}

