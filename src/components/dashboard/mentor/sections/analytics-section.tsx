import { MentorSectionProps } from "../types";

interface AnalyticsSectionProps extends MentorSectionProps {}

export const AnalyticsSection = ({ userDetails }: AnalyticsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">
          Performance insights and growth metrics.
        </p>
      </div>
      <div className="text-center py-20">
        <p className="text-gray-500">Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
};
