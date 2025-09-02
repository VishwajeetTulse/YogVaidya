"use client";

import React from 'react';
import { UnifiedDashboard } from '../shared/unified-dashboard';
import { MENTOR_SIDEBAR_MENU_ITEMS } from '../mentor/constants';

// Import all mentor section components
import { OverviewSection } from '../mentor/sections/overview-section';
import { SessionsSection } from '../mentor/sections/sessions-section';
import { StudentsSection } from '../mentor/sections/students-section';
import { ScheduleSection } from '../mentor/sections/schedule-section';
import { ReviewsSection } from '../mentor/sections/reviews-section';
import { SettingsSection } from '../mentor/sections/settings-section';
import { TicketsSection } from '../mentor/sections/tickets-section';
import { MentorAvailabilityToggle } from '../mentor/sections/availability-section';
import { formatDate } from '../shared/utils';
import { BaseHookResult } from '../shared/types';
// Create a mapping of section IDs to components
const MENTOR_SECTION_COMPONENTS = {
  "overview": OverviewSection,
  "sessions": SessionsSection,
  "students": StudentsSection,
  "schedule": ScheduleSection,
  "availability": MentorAvailabilityToggle,
  "reviews": ReviewsSection,
  "settings": SettingsSection,
  "tickets": TicketsSection,
};

// Create extended hook function to add formatDate
const extendMentorHook = (baseHookResult: BaseHookResult) => {
  return {
    ...baseHookResult,
    formatDate
  };
};

export default function MentorDashboard() {
  return (
    <UnifiedDashboard<'mentor'>
      role="mentor"
      dashboardTitle="Mentor Dashboard"
      menuItems={MENTOR_SIDEBAR_MENU_ITEMS}
      sectionComponentMap={MENTOR_SECTION_COMPONENTS}
      roleLabel="Yoga Instructor"
      extendedHook={extendMentorHook}
    />
  );
}

