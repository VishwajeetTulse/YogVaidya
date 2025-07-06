import { Users } from "lucide-react";

export const ExploreMentorsSection = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
        <p className="text-gray-600 mt-2">
          Discover experienced yoga and meditation mentors to guide your journey.
        </p>
      </div>

      {/* Coming Soon Section */}
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="w-24 h-24 bg-gradient-to-br from-[#ff7dac] to-[#876aff] rounded-full flex items-center justify-center mb-6">
          <Users className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon...</h2>

        <p className="text-gray-500 text-center max-w-md mb-6">
          We&apos;re building an amazing platform to connect you with certified yoga and meditation mentors. Get ready for personalized guidance!
        </p>

        <div className="mt-8 w-full max-w-md">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-[#ff7dac] to-[#876aff] h-2 rounded-full w-3/4 transition-all duration-300"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">75% Complete</p>
        </div>
      </div>
    </div>
  );
};

