import { ModeratorSectionProps } from "../types";

interface ApplicationsSectionProps extends ModeratorSectionProps {}

export const ApplicationsSection = ({ userDetails }: ApplicationsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Mentor Applications</h1>
        <p className="text-gray-600 mt-2">
          Review and approve mentor applications.
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500">Applications management coming soon...</p>
      </div>
    </div>
  );
};
