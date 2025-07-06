import { ModeratorSectionProps } from "../types";
import { SharedSettingsSection } from "../../shared/settings-section";

export const SettingsSection = ({ userDetails }: ModeratorSectionProps) => {
  return (
    <SharedSettingsSection 
      userDetails={userDetails} 
      role="moderator"
      roleLabel="Moderator"
    />
  );
};

