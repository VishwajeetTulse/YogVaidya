import { MentorSectionProps } from "../types";

interface SupportSectionProps extends MentorSectionProps {}

export const SupportSection = ({ userDetails }: SupportSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600 mt-2">
          Get help and access documentation.
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500">Support center coming soon...</p>
      </div>
    </div>
  );
};
