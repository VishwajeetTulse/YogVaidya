"use client";

import React from 'react';
import { UnifiedDashboard } from '../shared/unified-dashboard';
import { SIDEBAR_MENU_ITEMS } from '../user/constants';
import { formatDate, getStatusColor } from '../shared/utils';
import { useState } from 'react';
import { 
  cancelUserSubscription, 
  upgradeUserSubscription,
  getUserSubscription
} from '@/lib/subscriptions';

// Import all user section components
import { OverviewSection } from '../user/sections/overview-section';
import { ClassesSection } from '../user/sections/classes-section';
import { MentorsSection } from '../user/sections/mentors-section';
import { LibrarySection } from '../user/sections/library-section';
import { SubscriptionSection } from '../user/sections/subscription-section';
import { PlansSection } from '../user/sections/plans-section';
import { ExploreMentorsSection } from '../user/sections/explore-mentors-section';
import { ProfileSection } from '../user/sections/profile-section';
import { SettingsSection } from '../user/sections/settings-section';
import { UserTicketsSection } from '../user/sections/tickets-section';
import { SupportSection } from '../user/sections/support-section';
import { BaseHookResult } from '../shared/types';

// Create a mapping of section IDs to components
const USER_SECTION_COMPONENTS = {
  "overview": OverviewSection,
  "classes": ClassesSection,
  "mentors": MentorsSection,
  "library": LibrarySection,
  "subscription": SubscriptionSection,
  "plans": PlansSection,
  "explore-mentors": ExploreMentorsSection,
  "profile": ProfileSection,
  "settings": SettingsSection,
  "tickets": UserTicketsSection,
  "support": SupportSection,
};

// Create extended hook function to add user-specific states
const useExtendUserHook = (baseHookResult: BaseHookResult) => {
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [viewMode, setViewMode] = useState<"cards" | "comparison">("cards");

  // Function to refresh subscription data
  const refreshSubscriptionData = async () => {
    if (!baseHookResult.userDetails?.id) return;
    
    try {
      const result = await getUserSubscription(baseHookResult.userDetails.id);
      if (result.success) {
        await baseHookResult.fetchUserDetails();
      }
    } catch (error) {
      console.error("Error refreshing subscription data:", error);
    }
  };

  const handleCancelSubscription = async () => {
    if (!baseHookResult.userDetails?.id) {
      return { success: false, message: "User not found" };
    }

    try {
      setCancellingSubscription(true);
      const result = await cancelUserSubscription(baseHookResult.userDetails.id);
      
      // Refresh subscription data
      await refreshSubscriptionData();
      
      return result;
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      return {
        success: false,
        message: "An unexpected error occurred while cancelling your subscription"
      };
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleUpgradeSubscription = async (planId: string, selectedBillingPeriod: "monthly" | "annual") => {
    if (!baseHookResult.userDetails?.id) {
      return { success: false, error: "User not found", code: "USER_NOT_FOUND" };
    }

    try {
      const result = await upgradeUserSubscription({
        userId: baseHookResult.userDetails.id,
        newPlan: planId.toUpperCase(),
        billingPeriod: selectedBillingPeriod
      });

      if (result.success) {
        await refreshSubscriptionData();
      }

      return result;
    } catch (error) {
      console.error("Error during subscription upgrade:", error);
      return {
        success: false,
        error: "An unexpected error occurred during the upgrade",
        code: "UPGRADE_FAILED"
      };
    }
  };

  return {
    ...baseHookResult,
    cancellingSubscription,
    billingPeriod,
    setBillingPeriod,
    viewMode,
    setViewMode,
    handleCancelSubscription,
    handleUpgradeSubscription,
    refreshSubscriptionData,
    formatDate,
    getStatusColor,
  };
};

export default function UserDashboard() {
  return (
    <UnifiedDashboard<'user'>
      role="user"
      dashboardTitle="My Dashboard"
      roleLabel='User'
      menuItems={SIDEBAR_MENU_ITEMS}
      sectionComponentMap={USER_SECTION_COMPONENTS}
      extendedHook={useExtendUserHook}
    />
  );
}

