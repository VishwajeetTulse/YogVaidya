import { MentorSectionProps } from "../types";

interface SettingsSectionProps extends MentorSectionProps {}

export const SettingsSection = ({ userDetails }: SettingsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">
          Configure your preferences and account settings.
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500">Settings panel coming soon...</p>
      </div>
    </div>
  );
};
