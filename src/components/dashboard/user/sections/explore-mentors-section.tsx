import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Search, Filter } from "lucide-react";
import { SectionProps } from "../types";

interface ExploreMentorsSectionProps extends SectionProps {}

export const ExploreMentorsSection = ({ userDetails }: ExploreMentorsSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
        <p className="text-gray-600 mt-2">
          Discover experienced yoga and meditation mentors to guide your journey.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentors by name or specialization..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#76d2fa] focus:border-transparent"
          />
        </div>
        <Button variant="outline" className="border-[#876aff] text-[#876aff]">
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Filter Tags */}
      <div className="flex gap-2 flex-wrap">
        {["All", "Hatha Yoga", "Vinyasa", "Meditation", "Prenatal", "Power Yoga", "Yin Yoga"].map((tag) => (
          <button
            key={tag}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              tag === "All"
                ? "bg-[#76d2fa] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Mentors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((mentor) => (
          <Card key={mentor} className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-center">
              <div className={`w-20 h-20 rounded-full mx-auto mb-4 ${
                mentor % 3 === 0 
                  ? "bg-gradient-to-br from-[#876aff] to-[#a792fb]"
                  : mentor % 2 === 0
                  ? "bg-gradient-to-br from-[#ff7dac] to-[#ffa6c5]"
                  : "bg-gradient-to-br from-[#76d2fa] to-[#5a9be9]"
              }`}></div>
              
              <h3 className="font-semibold text-lg mb-1">
                {mentor % 3 === 0 ? "Priya Sharma" : mentor % 2 === 0 ? "Arjun Patel" : "Maya Singh"}
              </h3>
              
              <p className="text-gray-500 text-sm mb-2">
                {mentor % 3 === 0 
                  ? "Meditation & Mindfulness Expert"
                  : mentor % 2 === 0
                  ? "Power Yoga Specialist"
                  : "Hatha & Vinyasa Expert"
                }
              </p>
              
              <div className="flex items-center justify-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      mentor % 3 === 0
                        ? "fill-[#876aff] text-[#876aff]"
                        : mentor % 2 === 0
                        ? "fill-[#ff7dac] text-[#ff7dac]"
                        : "fill-[#76d2fa] text-[#76d2fa]"
                    }`}
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">
                  ({(4.5 + (mentor * 0.1)).toFixed(1)})
                </span>
              </div>
              
              <p className="text-xs text-gray-500 mb-4">
                {5 + mentor} years experience • {20 + mentor * 5} students
              </p>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`flex-1 ${
                    mentor % 3 === 0
                      ? "border-[#876aff] text-[#876aff] hover:bg-[#876aff] hover:text-white"
                      : mentor % 2 === 0
                      ? "border-[#ff7dac] text-[#ff7dac] hover:bg-[#ff7dac] hover:text-white"
                      : "border-[#76d2fa] text-[#76d2fa] hover:bg-[#76d2fa] hover:text-white"
                  }`}
                >
                  View Profile
                </Button>
                <Button 
                  size="sm" 
                  className={`flex-1 ${
                    mentor % 3 === 0
                      ? "bg-[#876aff] hover:bg-[#a792fb]"
                      : mentor % 2 === 0
                      ? "bg-[#ff7dac] hover:bg-[#ffa6c5]"
                      : "bg-[#76d2fa] hover:bg-[#5a9be9]"
                  }`}
                >
                  Book Session
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="border-[#876aff] text-[#876aff]">
          Load More Mentors
        </Button>
      </div>
    </div>
  );
};
