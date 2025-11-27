import MentorsPage from "@/components/mentor/mentor-section";
import { Suspense } from "react";

// Loading component for better UX during data fetch
function MentorsLoading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
        <p className="text-gray-500">Loading mentors...</p>
      </div>
    </div>
  );
}

// Enable dynamic rendering with reasonable revalidation
export const dynamic = "force-dynamic";
export const revalidate = 60; // Revalidate every 60 seconds

const Mentorsection = () => {
  return (
    <Suspense fallback={<MentorsLoading />}>
      <MentorsPage />
    </Suspense>
  );
};

export default Mentorsection;
