import { SharedSettingsSection } from "../../shared/settings-section";
import { type MentorSectionProps } from "../types";

export const SettingsSection = ({ userDetails }: MentorSectionProps) => {
  return (
    <SharedSettingsSection userDetails={userDetails} role="mentor" roleLabel="Yoga Instructor" />
  );
};
