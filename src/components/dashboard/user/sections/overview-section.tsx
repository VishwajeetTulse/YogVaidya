import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  Target,
  Award,
  PlayCircle,
  Users,
  ChevronRight,
} from "lucide-react";
import { SectionProps } from "../types";

export const OverviewSection = ({ userDetails, setActiveSection }: SectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Yogi"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Continue your wellness journey with personalized yoga sessions.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Classes This Week</p>
              <p className="text-xl font-semibold">5</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Practice</p>
              <p className="text-xl font-semibold">24h 30m</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Goals Achieved</p>
              <p className="text-xl font-semibold">12/15</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Streak</p>
              <p className="text-xl font-semibold">7 days</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today&apos;s Schedule
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#76d2fa]/20 to-[#5a9be9]/10 rounded-lg border border-[#76d2fa]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#76d2fa] rounded-full"></div>
              <div>
                <p className="font-medium">Morning Hatha Yoga</p>
                <p className="text-sm text-gray-500">
                  with Mentor Sarah • 7:00 AM
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-[#76d2fa] hover:bg-[#5a9be9]">Join</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFCCEA]/20 to-[#ffa6c5]/10 rounded-lg border border-[#FFCCEA]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#ff7dac] rounded-full"></div>
              <div>
                <p className="font-medium">Meditation Session</p>
                <p className="text-sm text-gray-500">
                  with Mentor Raj • 6:00 PM
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-[#ff7dac] text-[#ff7dac] hover:bg-[#ff7dac] hover:text-white">
              Reschedule
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("classes")}
        >
          <div className="flex items-center gap-3">
            <PlayCircle className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Start Practice</p>
              <p className="text-sm text-gray-500">Begin your session</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("mentors")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">Book Session</p>
              <p className="text-sm text-gray-500">Schedule with mentor</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );
};

