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

// Enable ISR (Incremental Static Regeneration) instead of force-dynamic
// This pre-renders the page and revalidates in the background
export const revalidate = 300; // Revalidate every 5 minutes

const Mentorsection = () => {
  return (
    <Suspense fallback={<MentorsLoading />}>
      <MentorsPage />
    </Suspense>
  );
};

export default Mentorsection;
