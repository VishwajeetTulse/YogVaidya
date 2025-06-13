import { OverviewSection } from "./sections/overview-section";
import { 
  UsersSection, 
  ModeratorsSection, 
  SystemSection, 
  AnalyticsSection, 
  DatabaseSection, 
  SettingsSection, 
  SupportSection 
} from "./sections/placeholder-sections";
import { AdminSectionProps } from "./types";

interface AdminSectionRendererProps extends AdminSectionProps {
  activeSection: string;
}

export const AdminSectionRenderer = ({
  activeSection,
  userDetails,
  setActiveSection,
}: AdminSectionRendererProps) => {
  const sectionProps: AdminSectionProps = {
    userDetails,
    setActiveSection,
  };

  switch (activeSection) {
    case "overview":
      return <OverviewSection {...sectionProps} />;
    case "users":
      return <UsersSection {...sectionProps} />;
    case "moderators":
      return <ModeratorsSection {...sectionProps} />;
    case "system":
      return <SystemSection {...sectionProps} />;
    case "analytics":
      return <AnalyticsSection {...sectionProps} />;
    case "database":
      return <DatabaseSection {...sectionProps} />;
    case "settings":
      return <SettingsSection {...sectionProps} />;
    case "support":
      return <SupportSection {...sectionProps} />;
    default:
      return <OverviewSection {...sectionProps} />;
  }
};
