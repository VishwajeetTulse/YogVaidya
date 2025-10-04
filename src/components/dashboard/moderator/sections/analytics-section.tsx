"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  Shield,
  Activity,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ModeratorAnalyticsData {
  // User & Platform Metrics
  platformUsers: {
    total: number;
    recent: number;
    byRole: Record<string, number>;
    trialUsers: number;
    activeSubscribers: number;
  };

  // Mentor Application Workflow
  mentorApplications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    recentApplications: number;
    averageProcessingTime?: number;
  };

  // Session Management
  sessionAnalytics: {
    totalSessions: number;
    completedSessions: number;
    cancelledSessions: number;
    completionRate: number;
    sessionsByType: Record<string, number>;
  };

  // Moderator Activity Tracking
  moderatorActivity: {
    totalActions: number;
    recentActions: number;
    actionsByCategory: Record<string, number>;
    errorCount: number;
  };

  // Subscription Support Metrics
  subscriptionMetrics: {
    activeSubscriptions: number;
    trialExtensions: number;
    subscriptionIssues: number;
    planDistribution: Record<string, number>;
  };

  // Growth trends
  trends: {
    userGrowth: Array<{ month: string; count: number }>;
    applicationTrends: Array<{ month: string; count: number }>;
  };
}

export const AnalyticsSection = () => {
  const [analyticsData, setAnalyticsData] = useState<ModeratorAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        console.log(`Analytics: Fetching data (attempt ${retryCount + 1})`);
        const response = await fetch("/api/analytics");
        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data?.details || data?.error || "Failed to fetch analytics data";
          throw new Error(errorMessage);
        }
        // Transform admin analytics data for moderator-specific view
        const moderatorData: ModeratorAnalyticsData = {
          platformUsers: {
            total: data.users?.platformUsers || 0,
            recent: data.users?.recentSignups || 0,
            byRole: data.users?.byRole || {},
            trialUsers: data.conversionAnalytics?.trialUsers || 0,
            activeSubscribers: data.conversionAnalytics?.activeSubscribers || 0,
          },
          mentorApplications: {
            total: data.mentorApplications?.total || 0,
            pending: data.mentorApplications?.pending || 0,
            approved: data.mentorApplications?.approved || 0,
            rejected: data.mentorApplications?.rejected || 0,
            recentApplications: data.mentorApplications?.pending || 0,
          },
          sessionAnalytics: {
            totalSessions: data.sessionAnalytics?.totalSessions || 0,
            completedSessions: data.sessionAnalytics?.completedSessions || 0,
            cancelledSessions: data.sessionAnalytics?.sessionsByStatus?.CANCELLED || 0,
            completionRate: data.sessionAnalytics?.completionRate || 0,
            sessionsByType: data.sessionAnalytics?.sessionsByType || {},
          },
          moderatorActivity: {
            totalActions: data.systemLogAnalytics?.totalLogs || 0,
            recentActions: Math.floor((data.systemLogAnalytics?.totalLogs || 0) / 7),
            actionsByCategory: data.systemLogAnalytics?.logsByCategory || {},
            errorCount: data.systemLogAnalytics?.logsByLevel?.ERROR || 0,
          },
          subscriptionMetrics: {
            activeSubscriptions: data.subscriptions?.total || 0,
            trialExtensions: 0,
            subscriptionIssues: 0,
            planDistribution: data.subscriptions?.byPlan || {},
          },
          trends: {
            userGrowth: data.userGrowth || [],
            applicationTrends: [],
          },
        };

        setAnalyticsData(moderatorData);
        setLoading(false); // Success! Stop loading
      } catch (err) {
        console.error("Analytics error:", err);

        // If we haven't reached max retries, try again
        if (retryCount < MAX_RETRIES) {
          setRetryCount(retryCount + 1);
          // Don't set error or finish loading yet, as we'll retry
          return;
        }

        // If we've reached max retries, show error
        setError(err instanceof Error ? err.message : "An unknown error occurred");
        setLoading(false); // Stop loading even on error if max retries reached
      }
    };

    fetchAnalytics();

    // If we're retrying, set up a timer to fetch again
    let retryTimer: NodeJS.Timeout | null = null;

    if (retryCount > 0 && retryCount <= MAX_RETRIES) {
      // Exponential backoff: 2^retryCount * 1000ms (1s, 2s, 4s)
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(
        `Analytics: Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`
      );

      retryTimer = setTimeout(() => {
        fetchAnalytics();
      }, delay);
    }

    // Cleanup timer on unmount
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [retryCount]);

  if (loading) {
    return <AnalyticsLoading />;
  }
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-2">Platform insights and performance metrics.</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="text-lg font-medium">Failed to load analytics data</h3>
          <p className="mt-2">Error details: {error}</p>
          <div className="mt-3 space-x-2">
            {" "}
            <button
              onClick={() => {
                setError(null);
                setRetryCount(0); // Reset retry count to trigger a fresh fetch
              }}
              className="px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md text-red-700 transition-colors"
            >
              Retry
            </button>
            <button
              onClick={() => setError(null)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-800">
          <h4 className="font-medium">Troubleshooting Tips:</h4>
          <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
            <li>Verify you have moderator or admin permissions</li>
            <li>Check if your user session is valid (try logging out and back in)</li>
            <li>Contact the administrator if the problem persists</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <AnalyticsLoading />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Moderator Analytics</h1>
        <p className="text-gray-600 mt-2">Platform insights and moderator performance metrics.</p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Platform Users"
          value={analyticsData.platformUsers.total}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          description={`${analyticsData.platformUsers.recent} new this month`}
          className="bg-blue-50"
        />
        <StatCard
          title="Active Subscriptions"
          value={analyticsData.subscriptionMetrics.activeSubscriptions}
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
          description="Paying customers"
          className="bg-green-50"
        />
        <StatCard
          title="Pending Applications"
          value={analyticsData.mentorApplications.pending}
          icon={<FileText className="h-6 w-6 text-amber-500" />}
          description="Awaiting review"
          className="bg-amber-50"
        />
        <StatCard
          title="Session Completion"
          value={analyticsData.sessionAnalytics.completionRate}
          icon={<CheckCircle className="h-6 w-6 text-purple-500" />}
          description="Success rate (%)"
          className="bg-purple-50"
        />
      </div>

      {/* Moderator Activity Dashboard */}
      <Card className="p-6 shadow-sm">
        <h2 className="font-semibold text-xl mb-6">Moderator Activity Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
            <Shield className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Actions</p>
              <p className="text-2xl font-bold">{analyticsData.moderatorActivity.totalActions}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
            <Activity className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Recent Actions</p>
              <p className="text-2xl font-bold">{analyticsData.moderatorActivity.recentActions}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Error Count</p>
              <p className="text-2xl font-bold">{analyticsData.moderatorActivity.errorCount}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
            <UserCheck className="h-8 w-8 text-purple-500" />
            <div>
              <p className="text-sm font-medium text-gray-600">Applications Processed</p>
              <p className="text-2xl font-bold">
                {analyticsData.mentorApplications.approved +
                  analyticsData.mentorApplications.rejected}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Application Workflow Status */}
      <Card className="p-6 shadow-sm">
        <h2 className="font-semibold text-xl mb-6">Mentor Application Workflow</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {analyticsData.mentorApplications.pending}
            </h3>
            <p className="text-sm text-gray-600">Pending Review</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {analyticsData.mentorApplications.approved}
            </h3>
            <p className="text-sm text-gray-600">Approved</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-3">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {analyticsData.mentorApplications.rejected}
            </h3>
            <p className="text-sm text-gray-600">Rejected</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Application Processing Progress</span>
            <span>{analyticsData.mentorApplications.total} total</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div className="flex h-3 rounded-full overflow-hidden">
              <div
                className="bg-green-500"
                style={{
                  width: `${(analyticsData.mentorApplications.approved / analyticsData.mentorApplications.total) * 100}%`,
                }}
              />
              <div
                className="bg-amber-500"
                style={{
                  width: `${(analyticsData.mentorApplications.pending / analyticsData.mentorApplications.total) * 100}%`,
                }}
              />
              <div
                className="bg-red-500"
                style={{
                  width: `${(analyticsData.mentorApplications.rejected / analyticsData.mentorApplications.total) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Session Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-6">Session Management</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Total Sessions</span>
              <span className="text-lg font-bold">
                {analyticsData.sessionAnalytics.totalSessions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Completed</span>
              <span className="text-lg font-bold text-green-600">
                {analyticsData.sessionAnalytics.completedSessions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Cancelled</span>
              <span className="text-lg font-bold text-red-600">
                {analyticsData.sessionAnalytics.cancelledSessions}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">Completion Rate</span>
              <span className="text-lg font-bold text-purple-600">
                {analyticsData.sessionAnalytics.completionRate}%
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Sessions by Type</h3>
            {Object.entries(analyticsData.sessionAnalytics.sessionsByType).map(([type, count]) => (
              <div key={type} className="flex justify-between items-center">
                <span className="text-sm text-gray-600 capitalize">{type.toLowerCase()}</span>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-6">User Growth Trend</h2>
          <div className="h-64">
            <UserGrowthChart data={analyticsData.trends.userGrowth} />
          </div>
        </Card>
      </div>

      {/* User Distribution */}
      <Card className="p-6 shadow-sm">
        <h2 className="font-semibold text-xl mb-6">Platform User Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-4">User Roles</h3>
            <RoleDistribution
              usersByRole={analyticsData.platformUsers.byRole}
              total={analyticsData.platformUsers.total}
            />
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Subscription Plans</h3>
            <SubscriptionDistribution
              subscriptionsByPlan={analyticsData.subscriptionMetrics.planDistribution}
              total={analyticsData.platformUsers.total}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper Components
const StatCard = ({
  title,
  value,
  icon,
  description,
  className,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  className?: string;
}) => (
  <Card className={`p-6 shadow-sm ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
      </div>
      <div className="p-2 rounded-full bg-white bg-opacity-70">{icon}</div>
    </div>
    <p className="text-xs text-gray-600 mt-2">{description}</p>
  </Card>
);

const UserGrowthChart = ({ data }: { data: Array<{ month: string; count: number }> }) => {
  // Find the maximum value to normalize bar heights
  const maxCount = Math.max(...data.map((item) => item.count));

  return (
    <div className="flex h-full items-end space-x-8 justify-around">
      {data.map((item, index) => {
        const heightPercentage = (item.count / maxCount) * 100;

        return (
          <div key={index} className="h-full flex flex-col items-center justify-end">
            <div
              className="w-16 bg-blue-500 rounded-t-md transition-all duration-700 ease-out"
              style={{
                height: `${heightPercentage}%`,
                minHeight: "20px",
              }}
            />
            <div className="mt-2 text-center">
              <p className="font-medium text-sm">{item.month}</p>
              <p className="text-xs text-gray-500">{item.count}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const RoleDistribution = ({
  usersByRole,
}: {
  usersByRole: Record<string, number>;
  total: number;
}) => {
  const roleColors: Record<string, string> = {
    USER: "bg-blue-500",
    MENTOR: "bg-purple-500",
  };

  // Calculate total of only displayed roles (USER and MENTOR)
  const displayTotal = (usersByRole.USER || 0) + (usersByRole.MENTOR || 0);

  return (
    <div className="w-full flex flex-col space-y-2">
      {Object.entries(usersByRole).map(([role, count]) => {
        // Skip roles other than USER and MENTOR
        if (role !== "USER" && role !== "MENTOR") return null;

        // Calculate percentage based on the sum of displayed roles
        const percentage = Math.round((count / displayTotal) * 100) || 0;

        return (
          <div key={role} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{role}</span>
              <span className="text-xs text-gray-500">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${roleColors[role] || "bg-gray-500"}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SubscriptionDistribution = ({
  subscriptionsByPlan,
  total,
}: {
  subscriptionsByPlan: Record<string, number>;
  total: number;
}) => {
  const planColors: Record<string, string> = {
    SEED: "bg-green-300",
    BLOOM: "bg-green-500",
    FLOURISH: "bg-green-700",
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      {Object.entries(subscriptionsByPlan).map(([plan, count]) => {
        const percentage = Math.round((count / total) * 100) || 0;

        return (
          <div key={plan} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{plan}</span>
              <span className="text-xs text-gray-500">
                {count} ({percentage}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${planColors[plan] || "bg-gray-500"}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AnalyticsLoading = () => (
  <div className="space-y-6">
    <div>
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
      <p className="text-gray-600 mt-2">Platform insights and performance metrics.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
          <Skeleton className="h-3 w-32 mt-2" />
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6 shadow-sm">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-sm">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2 w-full" />
            </div>
          ))}
        </div>
      </Card>
    </div>
  </div>
);
