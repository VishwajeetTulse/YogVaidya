"use client";

import React from 'react';
import { UnifiedDashboard } from '../shared/unified-dashboard';
import { SIDEBAR_MENU_ITEMS } from '../user/constants';
import { formatDate, getStatusColor } from '../shared/utils';

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
import { SupportSection } from '../user/sections/support-section';
import { cancelUserSubscription } from '@/lib/subscriptions';
import { useState } from 'react';
import { toast } from 'sonner';
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
  "support": SupportSection,
};

// Create extended hook function to add user-specific states
const useExtendUserHook = (baseHookResult : BaseHookResult) => {
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [viewMode, setViewMode] = useState<"cards" | "comparison">("cards");

  const handleCancelSubscription = async () => {
    if (!baseHookResult.userDetails?.id) return;

    try {
      setCancellingSubscription(true);
      const result = await cancelUserSubscription(baseHookResult.userDetails?.id);
      if (result.success) {
        toast.success("Subscription cancelled", {
          description: "Your subscription has been cancelled successfully.",
        });
        // Refetch user details to update subscription status
        await baseHookResult.fetchUserDetails();
      } else {
        toast.error("Error", {
          description: result.error || "Failed to cancel subscription",
        });
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Error", {
        description: "Failed to cancel subscription",
      });
    } finally {
      setCancellingSubscription(false);
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
