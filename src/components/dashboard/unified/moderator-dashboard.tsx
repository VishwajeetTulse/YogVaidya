"use client";

import React from 'react';
import { UnifiedDashboard } from '../shared/unified-dashboard';
import { MODERATOR_SIDEBAR_MENU_ITEMS } from '../moderator/constants';

// Import all moderator section components
import { OverviewSection } from '../moderator/sections/overview-section';
import { ApplicationsSection } from '../shared/applications-section';
import { UsersSection } from '../shared/users-management-section';
import { AnalyticsSection } from '../moderator/sections/analytics-section';
import { SettingsSection } from '../moderator/sections/settings-section';
import { SupportSection } from '../moderator/sections/support-section';

// Create a mapping of section IDs to components
const MODERATOR_SECTION_COMPONENTS = {
  "overview": OverviewSection,
  "applications": ApplicationsSection,
  "users": UsersSection,
  "analytics": AnalyticsSection,
  "settings": SettingsSection,
  "support": SupportSection,
};

export default function ModeratorDashboard() {
  return (
    <UnifiedDashboard
      role="moderator"
      dashboardTitle="Moderator Dashboard"
      menuItems={MODERATOR_SIDEBAR_MENU_ITEMS}
      sectionComponentMap={MODERATOR_SECTION_COMPONENTS}
      roleLabel="Content Moderator"
    />
  );
}
