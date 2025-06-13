import { BookOpen, Clock } from "lucide-react";
import { SectionProps } from "../types";

interface LibrarySectionProps extends SectionProps {}

export const LibrarySection = ({ userDetails }: LibrarySectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Content Library</h1>
        <p className="text-gray-600 mt-2">
          Access videos, articles, and resources for your practice.
        </p>
      </div>

      {/* Coming Soon Section */}
      <div className="flex flex-col items-center justify-center py-20 px-8">
        <div className="w-24 h-24 bg-gradient-to-br from-[#76d2fa] to-[#876aff] rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-12 h-12 text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">Coming Soon...</h2>

        <p className="text-gray-500 text-center max-w-md mb-6">
          We're working hard to bring you an amazing collection of yoga videos, meditation guides, and wellness articles. Stay tuned!
        </p>

        <div className="mt-8 w-full max-w-md">
          <div className="bg-gray-200 rounded-full h-2">
            <div className="bg-gradient-to-r from-[#76d2fa] to-[#876aff] h-2 rounded-full w-1/2 transition-all duration-300"></div>
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">50% Complete</p>
        </div>
      </div>
    </div>
  );
};
