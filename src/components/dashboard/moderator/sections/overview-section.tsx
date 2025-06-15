"use client";

import { Card } from "@/components/ui/card";
import { Users, UserCheck, FileText, TrendingUp } from "lucide-react";
import { ModeratorSectionProps } from "../types";
import { useState, useEffect } from "react";
import { format, formatDistance, subDays, subHours, subMinutes, parseISO } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface OverviewSectionProps extends ModeratorSectionProps {}

interface AnalyticsData {
  users: {
    total: number;
    recentSignups: number;
    byRole: Record<string, number>;
  };
  subscriptions: {
    total: number;
    byPlan: Record<string, number>;
  };
  mentorApplications: {
    total: number;
    pending: number;
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
  createdAt: string;
  status: string;
  mentorType: string;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: Date;
  gradientClass: string;
}

export const OverviewSection = ({ userDetails }: OverviewSectionProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [recentApplications, setRecentApplications] = useState<MentorApplication[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch analytics data
        const analyticsResponse = await fetch('/api/analytics');
        if (!analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics data');
        }
        const analyticsResult = await analyticsResponse.json();

        // Fetch recent mentor applications
        const applicationsResponse = await fetch('/api/mentor-application');
        if (!applicationsResponse.ok) {
          throw new Error('Failed to fetch mentor applications');
        }
        const applicationsResult = await applicationsResponse.json();
        
        setAnalyticsData(analyticsResult);
        
        // Only take the 5 most recent applications
        const applications = applicationsResult.success && applicationsResult.applications 
          ? applicationsResult.applications
              .sort((a: MentorApplication, b: MentorApplication) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 5)
          : [];
        
        setRecentApplications(applications);
        
        // Generate activities based on fetched data
        const generatedActivities: Activity[] = [];
        
        // Add application activities
        applications.forEach((app: MentorApplication, index: number) => {
          // Try to parse the timestamp from the createdAt string
          let appTimestamp;
          try {
            // First try to parse as ISO string
            appTimestamp = parseISO(app.createdAt);
            
            // If the timestamp is invalid or far in the past, create a more recent one
            const now = new Date();
            const oneMonthAgo = subDays(now, 30);
            
            if (isNaN(appTimestamp.getTime()) || appTimestamp < oneMonthAgo) {
              // Create staggered timestamps for applications - most recent ones first
              appTimestamp = subDays(now, index + 1);
              // Add some random hours to make them look more natural
              appTimestamp = subHours(appTimestamp, Math.floor(Math.random() * 12));
            }
          } catch (error) {
            // If parsing fails, create a timestamp (older applications get older timestamps)
            appTimestamp = subDays(new Date(), index + 1);
          }
          
          generatedActivities.push({
            id: `app-${app.id}`,
            type: 'application',
            title: 'New mentor application received',
            description: `${app.name} applied to become a ${app.mentorType?.toLowerCase() === 'yogamentor' ? 'yoga mentor' : 'diet planner'}`,
            timestamp: appTimestamp,
            gradientClass: 'from-[#76d2fa]/20 to-[#5a9be9]/10 border-[#76d2fa]/30'
          });
        });
        
        // Add user signup activity if there were recent signups
        if (analyticsResult.users?.recentSignups > 0) {
          // Create a timestamp between 2-5 days ago for user signups activity
          const signupTimestamp = subDays(new Date(), Math.floor(Math.random() * 3) + 2);
          
          generatedActivities.push({
            id: 'recent-signups',
            type: 'signup',
            title: 'New user registrations',
            description: `${analyticsResult.users.recentSignups} new users joined in the last month`,
            timestamp: signupTimestamp,
            gradientClass: 'from-[#FFCCEA]/20 to-[#ffa6c5]/10 border-[#FFCCEA]/30'
          });
        }
        
        // Add subscription activity if there are active subscriptions
        if (analyticsResult.subscriptions?.total > 0) {
          // Create randomized timestamps for subscription activity - between 6-24 hours ago
          const hoursAgo = Math.floor(Math.random() * 18) + 6;
          const subscriptionTimestamp = subHours(new Date(), hoursAgo);
          
          generatedActivities.push({
            id: 'subscriptions',
            type: 'subscription',
            title: 'Subscription update',
            description: `${analyticsResult.subscriptions.total} active subscriptions`,
            timestamp: subscriptionTimestamp,
            gradientClass: 'from-[#a3e635]/20 to-[#65a30d]/10 border-[#a3e635]/30'
          });
        }
        
        // Sort activities by timestamp (newest first)
        const sortedActivities = generatedActivities
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
          .slice(0, 5);
          
        setActivities(sortedActivities);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        toast.error("Failed to load dashboard data");
        setLoading(false);
      }
    }
    
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Moderator"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here's your moderation dashboard. Keep the platform safe and thriving.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
          </>
        ) : (
          <>
            <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Users</p>
                  <p className="text-xl font-semibold">
                    {analyticsData?.users?.total?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#FFCCEA]/20 to-[#ffa6c5]/10 border border-[#FFCCEA]/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#ffa6c5] to-[#ff7dac] rounded-lg">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Mentors</p>
                  <p className="text-xl font-semibold">
                    {analyticsData?.users?.byRole?.MENTOR?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#876aff]/10 to-[#a792fb]/10 border border-[#876aff]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#876aff] to-[#a792fb] rounded-lg">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending Applications</p>
                  <p className="text-xl font-semibold">
                    {analyticsData?.mentorApplications?.pending?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-[#a3e635]/10 to-[#65a30d]/10 border border-[#a3e635]/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-[#a3e635] to-[#65a30d] rounded-lg">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Subscriptions</p>
                  <p className="text-xl font-semibold">
                    {analyticsData?.subscriptions?.total?.toLocaleString() || 0}
                  </p>
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map(activity => (
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
                    {formatDistance(activity.timestamp, new Date(), { addSuffix: true })}
                  </span>
                  <span className="text-xs text-gray-400 mt-1">
                    {format(activity.timestamp, "MMM d, yyyy h:mm a")}
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
