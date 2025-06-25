import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";
import { SectionProps } from "../types";


export const MentorsSection = ({ setActiveSection }: SectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Mentors</h1>
        <p className="text-gray-600 mt-2">
          Connect with your personal yoga guides and book sessions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((mentor) => (
          <Card key={mentor} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-full mx-auto mb-4"></div>
              <h3 className="font-semibold text-lg">Sarah Johnson</h3>
              <p className="text-gray-500 text-sm">
                Hatha & Vinyasa Specialist
              </p>
              <div className="flex items-center justify-center gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="w-4 h-4 fill-[#876aff] text-[#876aff]"
                  />
                ))}
                <span className="text-sm text-gray-500 ml-1">(4.9)</span>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1 border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]">
                  Message
                </Button>
                <Button size="sm" className="flex-1 bg-[#76d2fa] hover:bg-[#5a9be9]">
                  Book Session
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Recommended Mentors</h2>
          <Button
            variant="outline"
            className="text-[#876aff] border-[#876aff]"
            onClick={() => setActiveSection("explore-mentors")}
          >
            View All Mentors
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((mentor) => (
            <Card key={mentor} className="p-6 border border-purple-100 hover:border-purple-200 transition-colors bg-gradient-to-br from-purple-50/50">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-[#ff7dac] to-[#ffa6c5] rounded-full mx-auto mb-4"></div>
                <h3 className="font-semibold text-lg">Recommended Mentor {mentor}</h3>
                <p className="text-gray-500 text-sm">
                  {mentor === 1 ? "Meditation Expert" : mentor === 2 ? "Power Yoga Specialist" : "Prenatal Yoga Expert"}
                </p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="w-4 h-4 fill-[#ff7dac] text-[#ff7dac]"
                    />
                  ))}
                  <span className="text-sm text-gray-500 ml-1">(5.0)</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-[#ff7dac] to-[#ffa6c5]">
                    Book Trial
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
