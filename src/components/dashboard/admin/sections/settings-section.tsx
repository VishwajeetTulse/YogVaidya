import { AdminSectionProps } from "../types";
import { SharedSettingsSection } from "../../shared/settings-section";

export const SettingsSection = ({ userDetails }: AdminSectionProps) => {
  return (
    <SharedSettingsSection 
      userDetails={userDetails} 
      role="admin"
      roleLabel="Administrator"
    />
  );
};
