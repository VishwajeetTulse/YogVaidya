"use client";

import { Card } from "@/components/ui/card";
import { Users, UserCheck, FileText, TrendingUp } from "lucide-react";
import { type ModeratorSectionProps } from "../types";
import { useState, useEffect } from "react";
import { format, formatDistance } from "date-fns";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";
import { toast } from "sonner";
import { getMentorApplicationsAction } from "@/lib/actions/mentor-application-actions";

interface AnalyticsData {
  users: {
    total: number;
    recentSignups: number;
    byRole: Record<string, number>;
    createdAt: Date[];
  };
  subscriptions: {
    total: number;
    byPlan: Record<string, number>;
    createdAt: Date[];
  };
  mentorApplications: {
    total: number;
    pending: number;
    created: Date[];
  };
  userGrowth: Array<{
    month: string;
    count: number;
  }>;
}

interface MentorApplication {
  id: string;
  name: string;
  email: string;
  phone: string;
  profile: string | null;
  experience: number;
  expertise: string;
  certifications: string;
  powUrl?: string | null;
  status: string | null;
  mentorType?: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string | null;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  gradientClass: string;
}

export const OverviewSection = ({ userDetails }: ModeratorSectionProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch analytics data
        const analyticsResponse = await fetch("/api/analytics");
        if (!analyticsResponse.ok) {
          throw new Error("Failed to fetch analytics data");
        }
        const analyticsResult = await analyticsResponse.json();

        // Fetch recent mentor applications
        const applicationsResult = await getMentorApplicationsAction();
        if (!applicationsResult.success) {
          throw new Error("Failed to fetch mentor applications");
        }

        // Make sure we set analyticsData before using it
        setAnalyticsData(analyticsResult);

        // Only take the 5 most recent applications
        const applications =
          applicationsResult.success && applicationsResult.applications
            ? applicationsResult.applications
                .sort(
                  (a: MentorApplication, b: MentorApplication) =>
                    b.createdAt.getTime() - a.createdAt.getTime()
                )
                .slice(0, 5)
            : [];

        // Generate activities based on fetched data
        const generatedActivities: Activity[] = [];

        // Add application activities
        applications.forEach((app: MentorApplication) => {
          // Use the actual application createdAt timestamp
          generatedActivities.push({
            id: `app-${app.id}`,
            type: "application",
            title: "New mentor application received",
            description: `${app.name} applied to become a ${app.mentorType?.toLowerCase() === "yogamentor" ? "yoga mentor" : "diet planner"}`,
            timestamp: app.createdAt, // Use the actual timestamp from the application
            gradientClass: "from-[#76d2fa]/20 to-[#5a9be9]/10 border-[#76d2fa]/30",
          });
        });

        // Add user signup activity if there were recent signups
        if (analyticsResult.users?.recentSignups > 0) {
          // Get the most recent user creation date from analytics
          const recentUserCreatedAt = analyticsResult.users?.createdAt;

          // Find the most recent date
          let mostRecentDate = new Date();
          if (recentUserCreatedAt && recentUserCreatedAt.length > 0) {
            // Sort dates in descending order to get the most recent one
            const sortedDates = [...recentUserCreatedAt].sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime()
            );
            mostRecentDate = new Date(sortedDates[0]);
          }

          generatedActivities.push({
            id: "recent-signups",
            type: "signup",
            title: "New user registrations",
            description: `${analyticsResult.users.recentSignups} new users joined in the last month`,
            timestamp: mostRecentDate,
            gradientClass: "from-[#FFCCEA]/20 to-[#ffa6c5]/10 border-[#FFCCEA]/30",
          });
        }

        // Add subscription activity if there are active subscriptions
        if (analyticsResult.subscriptions?.total > 0) {
          // Get subscription creation dates
          const subscriptionCreatedAt = analyticsResult.subscriptions?.createdAt;

          // Find the most recent subscription date
          let mostRecentSubDate = new Date();
          if (subscriptionCreatedAt && subscriptionCreatedAt.length > 0) {
            const sortedDates = [...subscriptionCreatedAt].sort(
              (a, b) => new Date(b).getTime() - new Date(a).getTime()
            );
            mostRecentSubDate = new Date(sortedDates[0]);
          }
          generatedActivities.push({
            id: "subscriptions",
            type: "subscription",
            title: "Subscription update",
            description: `${analyticsResult.subscriptions.total} active subscriptions`,
            timestamp: mostRecentSubDate,
            gradientClass: "from-[#a3e635]/20 to-[#65a30d]/10 border-[#a3e635]/30",
          });
        }

        // Validate timestamps and sort activities by timestamp (newest first)
        const validatedActivities = generatedActivities.map((activity) => {
          // Ensure timestamp is a valid date
          if (!(activity.timestamp instanceof Date) || isNaN(activity.timestamp.getTime())) {
            console.warn(`Invalid timestamp for activity: ${activity.id}. Using current date.`);
            activity.timestamp = new Date();
          }
          return activity;
        });

        const sortedActivities = validatedActivities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5);

        setActivities(sortedActivities);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        toast.error("Failed to load dashboard data");
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Moderator"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s your moderation dashboard. Keep the platform safe and thriving.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <>
          <Card className="p-6 shadow-sm bg-blue-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Users</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">
                  {analyticsData?.users?.total?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white bg-opacity-70">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm bg-green-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Mentors</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">
                  {analyticsData?.users?.byRole?.MENTOR?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white bg-opacity-70">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm bg-amber-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Applications</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">
                  {analyticsData?.mentorApplications?.pending?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white bg-opacity-70">
                <FileText className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-sm bg-purple-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                <p className="text-3xl font-bold mt-1 text-gray-900">
                  {analyticsData?.subscriptions?.total?.toLocaleString() || 0}
                </p>
              </div>
              <div className="p-2 rounded-full bg-white bg-opacity-70">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </>
      </div>

      {/* Recent Activity */}
      <Card className="p-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {activities.length > 0 ? (
          <div className="space-y-3">
            {activities.slice(0, 3).map((activity) => (
              <div
                key={activity.id}
                className={`flex items-center justify-between p-3 bg-gradient-to-r ${activity.gradientClass} rounded-lg border`}
              >
                <div>
                  <p className="font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-500 font-medium">
                    {(() => {
                      try {
                        return formatDistance(activity.timestamp, new Date(), { addSuffix: true });
                      } catch (e) {
                        console.error("Error formatting distance:", e);
                        return "recently";
                      }
                    })()}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    {(() => {
                      try {
                        return format(activity.timestamp, "MMM d, yyyy h:mm a");
                      } catch (e) {
                        console.error("Error formatting date:", e);
                        return format(new Date(), "MMM d, yyyy h:mm a");
                      }
                    })()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity to display</p>
          </div>
        )}
      </Card>
    </div>
  );
};
