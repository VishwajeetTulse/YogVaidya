import { MentorSectionProps } from "../types";

interface ProfileSectionProps extends MentorSectionProps {}

export const ProfileSection = ({ userDetails }: ProfileSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-2">
          Manage your mentor profile and information.
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500">Profile management coming soon...</p>
      </div>
    </div>
  );
};
