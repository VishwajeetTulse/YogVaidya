import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Award, PlayCircle, Users, ChevronRight } from "lucide-react";
import { type SectionProps } from "../types";
import { useEffect, useState } from "react";
import { getUserDashboardData, type DashboardData } from "@/lib/actions/dashboard-data";

import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";

export const OverviewSection = ({ userDetails, setActiveSection }: SectionProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Check user subscription status
  const isOnActiveTrial = userDetails?.isTrialActive === true;
  const hasActiveSubscription =
    userDetails?.subscriptionPlan && userDetails?.subscriptionStatus === "ACTIVE";
  const hasCancelledSubscription =
    userDetails?.subscriptionPlan && userDetails?.subscriptionStatus === "ACTIVE_UNTIL_END";
  const hasNoAccess = !isOnActiveTrial && !hasActiveSubscription && !hasCancelledSubscription;

  // Calculate days remaining in trial
  const trialDaysRemaining = userDetails?.trialEndDate
    ? Math.max(
        0,
        Math.ceil(
          (new Date(userDetails.trialEndDate).getTime() - new Date().getTime()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      const result = await getUserDashboardData();
      if (result.success && result.data) {
        setDashboardData(result.data);
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Yogi"}!
        </h1>
        <p className="text-gray-600 mt-2">
          {isOnActiveTrial
            ? "Enjoy full access during your trial period!"
            : hasNoAccess
              ? "Subscribe to unlock personalized yoga sessions."
              : "Continue your wellness journey with personalized yoga sessions."}
        </p>
      </div>

      {/* Active Trial Banner - No upgrade option during trial */}
      {isOnActiveTrial && (
        <Card className="p-6 bg-blue-50 border-blue-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Award className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Trial Active - {trialDaysRemaining} days remaining
                </h3>
                <p className="text-blue-700 text-sm">
                  You have full access to all features during your trial period. Enjoy exploring!
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-600 font-medium">Full Access</p>
              <p className="text-xs text-blue-500">No upgrade needed now</p>
            </div>
          </div>
        </Card>
      )}

      {/* No Access Banner */}
      {hasNoAccess && (
        <Card className="p-6 bg-red-50 border-red-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Award className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Subscribe to Access Premium Features
                </h3>
                <p className="text-red-700 text-sm">
                  Your trial has ended. Choose a subscription plan to continue your yoga journey.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setActiveSection("subscription")}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
            >
              Subscribe Now
            </Button>
          </div>
        </Card>
      )}

      {/* Today's Schedule - Using real data */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {hasNoAccess
            ? "Sample Schedule (Locked)"
            : isOnActiveTrial
              ? "Today's Schedule (Trial)"
              : "Today's Schedule"}
        </h2>

        {loading ? (
          <div className="space-y-3">
            <div className="animate-pulse bg-gray-200 h-16 rounded-lg" />
            <div className="animate-pulse bg-gray-200 h-16 rounded-lg" />
          </div>
        ) : hasNoAccess ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <Calendar className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-700 mb-2">Schedule Locked</h3>
            <p className="text-gray-500 mb-4 max-w-sm mx-auto">
              Subscribe to access your personalized daily schedule with yoga sessions, meditation,
              and mentor meetings.
            </p>
            <Button
              onClick={() => setActiveSection("subscription")}
              className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white"
            >
              Unlock Schedule
            </Button>
          </div>
        ) : dashboardData?.todaySchedule && dashboardData.todaySchedule.length > 0 ? (
          <div className="space-y-3">
            {dashboardData.todaySchedule.slice(0, 3).map((session, index) => {
              const sessionTime = new Date(session.scheduledTime);
              const currentTime = new Date();
              const sessionEndTime = new Date(sessionTime.getTime() + 45 * 60000); // Assume 45 minutes duration
              const joinAllowedTime = new Date(sessionTime.getTime() - 15 * 60000); // 15 minutes before start

              const canJoin = currentTime >= joinAllowedTime && currentTime <= sessionEndTime;
              const isWithinTimeWindow = currentTime <= sessionEndTime;
              const isUpcoming =
                (session.status === "SCHEDULED" || session.status === "ONGOING") &&
                isWithinTimeWindow;

              return (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    session.type === "yoga"
                      ? "bg-blue-50 border-blue-100"
                      : "bg-purple-50 border-purple-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        session.type === "yoga" ? "bg-blue-400" : "bg-purple-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-gray-500">
                        with Mentor {session.mentor} • {session.time}{" "}
                        {isOnActiveTrial && "(Trial Access)"}
                      </p>
                    </div>
                  </div>
                  {index === 0 && isUpcoming ? (
                    canJoin ? (
                      <Button
                        size="sm"
                        className={session.type === "yoga" ? "bg-[#76d2fa] hover:bg-[#5a9be9]" : ""}
                        variant={session.type === "meditation" ? "outline" : "default"}
                      >
                        Join
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" disabled className="text-gray-400">
                        {currentTime < joinAllowedTime ? "Soon" : "Ended"}
                      </Button>
                    )
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]"
                    >
                      {index === 0 ? "View" : "Reschedule"}
                    </Button>
                  )}
                </div>
              );
            })}
            {dashboardData.todaySchedule.length > 3 && (
              <div className="text-center pt-2">
                <p className="text-sm text-gray-500">
                  +{dashboardData.todaySchedule.length - 3} more sessions today
                </p>
              </div>
            )}
            {isOnActiveTrial && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 text-center">
                  <Award className="w-4 h-4 inline mr-1" />
                  Enjoying your trial? Full access continues until your trial period ends!
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No sessions scheduled for today</p>
            <p className="text-sm">Check back later or book a session with a mentor</p>
          </div>
        )}
      </Card>

      {/* Upcoming Sessions - Show if user has access and upcoming sessions exist */}
      {!hasNoAccess &&
        dashboardData?.upcomingSessions &&
        dashboardData.upcomingSessions.length > 0 && (
          <Card className="p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Upcoming Sessions
            </h2>
            <div className="space-y-3">
              {dashboardData.upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    session.type === "yoga"
                      ? "bg-blue-50 border-blue-100"
                      : "bg-purple-50 border-purple-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        session.type === "yoga" ? "bg-blue-400" : "bg-purple-400"
                      }`}
                    />
                    <div>
                      <p className="font-medium">{session.title}</p>
                      <p className="text-sm text-gray-500">
                        with Mentor {session.mentor} • {session.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        session.status === "SCHEDULED"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className={`p-4 cursor-pointer hover:shadow-md transition-shadow shadow-sm ${
            hasNoAccess
              ? "bg-red-50 border-red-200"
              : isOnActiveTrial
                ? "bg-blue-50 border-blue-200"
                : "bg-blue-50 border-none"
          }`}
          onClick={() =>
            hasNoAccess ? setActiveSection("subscription") : setActiveSection("classes")
          }
        >
          <div className="flex items-center gap-3">
            <PlayCircle
              className={`w-8 h-8 ${
                hasNoAccess ? "text-red-600" : isOnActiveTrial ? "text-blue-600" : "text-blue-600"
              }`}
            />
            <div>
              <p className="font-medium">
                {hasNoAccess ? "Unlock Practice Sessions" : "Start Practice"}
              </p>
              <p className="text-sm text-gray-500">
                {hasNoAccess
                  ? "Subscribe to begin sessions"
                  : isOnActiveTrial
                    ? "Continue trial sessions"
                    : "Begin your session"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
        <Card
          className={`p-4 cursor-pointer hover:shadow-md transition-shadow shadow-sm ${
            hasNoAccess
              ? "bg-red-50 border-red-200"
              : isOnActiveTrial
                ? "bg-blue-50 border-blue-200"
                : "bg-purple-50 border-none"
          }`}
          onClick={() =>
            hasNoAccess ? setActiveSection("subscription") : setActiveSection("mentors")
          }
        >
          <div className="flex items-center gap-3">
            <Users
              className={`w-8 h-8 ${
                hasNoAccess ? "text-red-600" : isOnActiveTrial ? "text-blue-600" : "text-purple-600"
              }`}
            />
            <div>
              <p className="font-medium">{hasNoAccess ? "Get Personal Mentor" : "Book Session"}</p>
              <p className="text-sm text-gray-500">
                {hasNoAccess
                  ? "Subscribe for mentor access"
                  : isOnActiveTrial
                    ? "Book trial mentor session"
                    : "Schedule with mentor"}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );
};
