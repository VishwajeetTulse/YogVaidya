import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";
import { Users, Video, Calendar, ChevronRight } from "lucide-react";
import { type MentorSectionProps } from "../types";
import { useState, useEffect } from "react";
import {
  getMentorOverviewData,
  type MentorOverviewData,
} from "@/lib/server/mentor-overview-server";

export const OverviewSection = ({ userDetails, setActiveSection }: MentorSectionProps) => {
  const [overviewData, setOverviewData] = useState<MentorOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOverviewData = async () => {
    try {
      const result = await getMentorOverviewData();
      if (result.success && result.data) {
        setOverviewData(result.data);
      }
    } catch (error) {
      console.error("Error fetching overview data:", error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchOverviewData();
      setLoading(false);
    };

    loadData();

    // Refresh data every 5 minutes
    const interval = setInterval(fetchOverviewData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString("en-US", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userDetails?.name || "Mentor"}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here&apos;s your teaching dashboard. Ready to inspire and guide your students.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 border-none shadow-sm transition-opacity">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active Students</p>
              <p className="text-xl font-semibold">{overviewData?.activeStudents || 0}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 bg-purple-50 border-none shadow-sm transition-opacity">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Video className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sessions This Week</p>
              <p className="text-xl font-semibold">{overviewData?.sessionsThisWeek || 0}</p>
            </div>
          </div>
        </Card>
        {/*
        <Card className={`p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20 transition-opacity`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Earnings</p>
              <p className="text-xl font-semibold">₹{overviewData?.totalEarnings?.toLocaleString() || 0}</p>
            </div>
          </div>
        </Card>
        <Card className={`p-4 bg-gradient-to-br from-orange-100 to-yellow-100 border border-orange-200 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-lg">
              <Star className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Average Rating</p>
              <p className="text-xl font-semibold">{overviewData?.averageRating || 0}</p>
            </div>
          </div>
        </Card> */}
      </div>

      {/* Today's Schedule */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Today&apos;s Sessions
        </h2>
        <div className="space-y-3">
          {overviewData?.todaysSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No sessions scheduled for today</p>
              <Button
                variant="outline"
                className="mt-2"
                onClick={() => setActiveSection("schedule")}
              >
                Schedule a Session
              </Button>
            </div>
          ) : (
            overviewData?.todaysSessions.slice(0, 3).map((session) => (
              <div
                key={session.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  session.sessionType === "YOGA"
                    ? "bg-blue-50 border-blue-100"
                    : "bg-purple-50 border-purple-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      session.sessionType === "YOGA" ? "bg-blue-400" : "bg-purple-400"
                    }`}
                  />
                  <div>
                    <p className="font-medium">{session.title}</p>
                    <p className="text-sm text-gray-500">
                      {formatTime(session.scheduledTime)} • {session.duration} min •{" "}
                      {session.sessionType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      session.status === "SCHEDULED"
                        ? "bg-blue-100 text-blue-800"
                        : session.status === "ONGOING"
                          ? "bg-green-100 text-green-800"
                          : session.status === "COMPLETED"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-red-100 text-red-800"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
        {overviewData?.todaysSessions && overviewData.todaysSessions.length > 3 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setActiveSection("sessions")}
              className="text-sm"
            >
              View More Sessions
            </Button>
          </div>
        )}
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-blue-50 border-none shadow-sm"
          onClick={() => setActiveSection("schedule")}
        >
          <div className="flex items-center gap-3">
            <Video className="w-8 h-8 text-blue-600" />
            <div>
              <p className="font-medium">Schedule Session</p>
              <p className="text-sm text-gray-500">Create new class</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className="p-4 cursor-pointer hover:shadow-md transition-shadow bg-purple-50 border-none shadow-sm"
          onClick={() => setActiveSection("students")}
        >
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-purple-600" />
            <div>
              <p className="font-medium">View Students</p>
              <p className="text-sm text-gray-500">Manage your students</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );
};
