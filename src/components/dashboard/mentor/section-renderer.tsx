import { OverviewSection } from "./sections/overview-section";
import { SessionsSection } from "./sections/sessions-section";
import { StudentsSection } from "./sections/students-section";
import { ScheduleSection } from "./sections/schedule-section";
import { EarningsSection } from "./sections/earnings-section";
import { ReviewsSection } from "./sections/reviews-section";
import { AnalyticsSection } from "./sections/analytics-section";
import { MessagesSection } from "./sections/messages-section";
import { ProfileSection } from "./sections/profile-section";
import { SettingsSection } from "./sections/settings-section";
import { SupportSection } from "./sections/support-section";
import { MentorSectionProps } from "./types";

interface MentorSectionRendererProps extends MentorSectionProps {
  activeSection: string;
}

export const MentorSectionRenderer = ({
  activeSection,
  userDetails,
  setActiveSection,
  formatDate,
}: MentorSectionRendererProps) => {
  const sectionProps: MentorSectionProps = {
    userDetails,
    setActiveSection,
    formatDate,
  };

  switch (activeSection) {
    case "overview":
      return <OverviewSection {...sectionProps} />;
    case "sessions":
      return <SessionsSection {...sectionProps} />;
    case "students":
      return <StudentsSection {...sectionProps} />;
    case "schedule":
      return <ScheduleSection {...sectionProps} />;
    case "earnings":
      return <EarningsSection {...sectionProps} />;
    case "reviews":
      return <ReviewsSection {...sectionProps} />;
    case "analytics":
      return <AnalyticsSection {...sectionProps} />;
    case "messages":
      return <MessagesSection {...sectionProps} />;
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
