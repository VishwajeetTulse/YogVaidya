import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Users, 
  Video, 
  DollarSign, 
  Star, 
  Calendar, 
  ChevronRight, 
  TrendingUp 
} from "lucide-react";
import { MentorSectionProps } from "../types";

export const OverviewSection = ({ userDetails, setActiveSection }: MentorSectionProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Mentor"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s your teaching dashboard. Ready to inspire and guide your students.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-xl font-semibold">24</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
              <Video className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessions This Week</p>
              <p className="text-xl font-semibold">12</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-xl font-semibold">₹15,420</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-xl font-semibold">4.8</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today&apos;s Sessions
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#76d2fa]/20 to-[#5a9be9]/10 rounded-lg border border-[#76d2fa]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#76d2fa] rounded-full"></div>
              <div>
                <p className="font-medium">Hatha Yoga for Beginners</p>
                <p className="text-sm text-gray-500">
                  with Alice Johnson • 9:00 AM - 10:00 AM
                </p>
              </div>
            </div>
            <Button size="sm" className="bg-[#76d2fa] hover:bg-[#5a9be9]">Start</Button>
          </div>
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#FFCCEA]/20 to-[#ffa6c5]/10 rounded-lg border border-[#FFCCEA]/30">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-[#ff7dac] rounded-full"></div>
              <div>
                <p className="font-medium">Advanced Vinyasa Flow</p>
                <p className="text-sm text-gray-500">
                  with Mark Smith • 6:00 PM - 7:30 PM
                </p>
              </div>
            </div>
            <Button size="sm" variant="outline" className="border-[#ff7dac] text-[#ff7dac] hover:bg-[#ff7dac] hover:text-white">
              View Details
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/30"
          onClick={() => setActiveSection("sessions")}
        >
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-[#76d2fa]" />
            <div>
              <p className="font-medium">Create Session</p>
              <p className="text-sm text-gray-500">Schedule new class</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#FFCCEA]/10 to-[#ffa6c5]/5 border border-[#FFCCEA]/30"
          onClick={() => setActiveSection("students")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-[#ff7dac]" />
            <div>
              <p className="font-medium">View Students</p>
              <p className="text-sm text-gray-500">Manage your students</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-gradient-to-br from-[#876aff]/5 to-[#a792fb]/5 border border-[#876aff]/30"
          onClick={() => setActiveSection("earnings")}
        >
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#876aff]" />
            <div>
              <p className="font-medium">View Analytics</p>
              <p className="text-sm text-gray-500">Track performance</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );
};
