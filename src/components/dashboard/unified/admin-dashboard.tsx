"use client";

import React from "react";
import { UnifiedDashboard } from "../shared/unified-dashboard";
import { ADMIN_SIDEBAR_MENU_ITEMS } from "../admin/constants";

// Import all admin section components
import { OverviewSection } from "../admin/sections/overview-section";
import { UsersSection } from "../shared/users-management-section";
import { ModeratorManagementSection } from "../admin/sections/mod-management-section";
import { LogsSection } from "../admin/sections/logs-section";
import { AnalyticsSection } from "../admin/sections/analytics-section";
import { SettingsSection } from "../admin/sections/settings-section";
import { ApplicationsSection } from "../shared/applications-section";
// Create a mapping of section IDs to components
const ADMIN_SECTION_COMPONENTS = {
  overview: OverviewSection,
  users: UsersSection,
  applications: ApplicationsSection,
  moderators: ModeratorManagementSection,
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

