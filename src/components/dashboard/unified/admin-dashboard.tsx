"use client";

import React from "react";
import { UnifiedDashboard } from "../shared/unified-dashboard";
import { ADMIN_SIDEBAR_MENU_ITEMS } from "../admin/constants";

// Import all admin section components
import { OverviewSection } from "../admin/sections/overview-section";
import {
  SystemSection,
  AnalyticsSection,
  DatabaseSection,
  SettingsSection,
  SupportSection,
} from "../admin/sections/placeholder-sections";
import { UserManagementSection } from "../admin/sections/users-management-section";
import { ModeratorManagementSection } from "../admin/sections/mod-management-section";

// Create a mapping of section IDs to components
const ADMIN_SECTION_COMPONENTS = {
  overview: OverviewSection,
  users: UserManagementSection, // Assuming UserManagementSection is imported correctly
  moderators: ModeratorManagementSection,
  system: SystemSection,
  analytics: AnalyticsSection,
  database: DatabaseSection,
  settings: SettingsSection,
  support: SupportSection,
};

export default function AdminDashboard() {
  return (
    <UnifiedDashboard
      role="admin"
      dashboardTitle="Admin Dashboard"
      menuItems={ADMIN_SIDEBAR_MENU_ITEMS}
      sectionComponentMap={ADMIN_SECTION_COMPONENTS}
      roleLabel="System Administrator"
    />
  );
}
