import { SharedSettingsSection } from "../../shared/settings-section";
import { SectionProps } from "../types";

export const SettingsSection = ({ userDetails }: SectionProps) => {
  return (
    <SharedSettingsSection 
      userDetails={userDetails} 
      role="user"
      roleLabel="Student"
    />
  );
};
