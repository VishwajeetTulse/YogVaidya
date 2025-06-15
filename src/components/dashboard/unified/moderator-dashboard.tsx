"use client";

import React from 'react';
import { UnifiedDashboard } from '../shared/unified-dashboard';
import { MODERATOR_SIDEBAR_MENU_ITEMS } from '../moderator/constants';

// Import all moderator section components
import { OverviewSection } from '../moderator/sections/overview-section';
import { ApplicationsSection } from '../moderator/sections/applications-section';
import { 
  UsersSection, 
  AnalyticsSection, 
  SettingsSection, 
  SupportSection 
} from '../moderator/sections/users-section';

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
