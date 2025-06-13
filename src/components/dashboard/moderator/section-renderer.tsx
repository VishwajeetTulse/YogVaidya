import { OverviewSection } from "./sections/overview-section";
import { ApplicationsSection } from "./sections/applications-section";
import { UsersSection, AnalyticsSection, SettingsSection, SupportSection } from "./sections/users-section";
import { ModeratorSectionProps } from "./types";

interface ModeratorSectionRendererProps extends ModeratorSectionProps {
  activeSection: string;
}

export const ModeratorSectionRenderer = ({
  activeSection,
  userDetails,
  setActiveSection,
}: ModeratorSectionRendererProps) => {
  const sectionProps: ModeratorSectionProps = {
    userDetails,
    setActiveSection,
  };

  switch (activeSection) {
    case "overview":
      return <OverviewSection {...sectionProps} />;
    case "applications":
      return <ApplicationsSection {...sectionProps} />;
    case "users":
      return <UsersSection {...sectionProps} />;
    case "analytics":
      return <AnalyticsSection {...sectionProps} />;
    case "settings":
      return <SettingsSection {...sectionProps} />;
    case "support":
      return <SupportSection {...sectionProps} />;
    default:
      return <OverviewSection {...sectionProps} />;
  }
};
