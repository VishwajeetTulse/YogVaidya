import { OverviewSection } from "./sections/overview-section";
import { ClassesSection } from "./sections/classes-section";
import { MentorsSection } from "./sections/mentors-section";
import { LibrarySection } from "./sections/library-section";
import { SubscriptionSection } from "./sections/subscription-section";
import { PlansSection } from "./sections/plans-section";
import { ExploreMentorsSection } from "./sections/explore-mentors-section";
import { ProfileSection } from "./sections/profile-section";
import { SettingsSection } from "./sections/settings-section";
import { SupportSection } from "./sections/support-section";
import { SectionProps } from "./types";
import { formatDate, getStatusColor } from "./utils";

interface SectionRendererProps extends SectionProps {
  activeSection: string;
}

export const SectionRenderer = ({
  activeSection,
  userDetails,
  setActiveSection,
  billingPeriod,
  setBillingPeriod,
  viewMode,
  setViewMode,
  cancellingSubscription,
  handleCancelSubscription,
}: SectionRendererProps) => {
  const sectionProps: SectionProps = {
    userDetails,
    setActiveSection,
    billingPeriod,
    setBillingPeriod,
    viewMode,
    setViewMode,
    cancellingSubscription,
    handleCancelSubscription,
    formatDate,
    getStatusColor,
  };

  switch (activeSection) {
    case "overview":
      return <OverviewSection {...sectionProps} />;
    case "classes":
      return <ClassesSection {...sectionProps} />;
    case "mentors":
      return <MentorsSection {...sectionProps} />;
    case "library":
      return <LibrarySection {...sectionProps} />;
    case "subscription":
      return <SubscriptionSection {...sectionProps} />;
    case "plans":
      return <PlansSection {...sectionProps} />;
    case "explore-mentors":
      return <ExploreMentorsSection {...sectionProps} />;
    case "profile":
      return <ProfileSection {...sectionProps} />;
    case "settings":
      return <SettingsSection {...sectionProps} />;
    case "support":
      return <SupportSection {...sectionProps} />;
    default:
      return <OverviewSection {...sectionProps} />;
  }
};
