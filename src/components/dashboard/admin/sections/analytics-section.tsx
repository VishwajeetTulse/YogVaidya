"use client";

import { useEffect, useState } from "react";
import { AdminSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  TrendingUp,
  DollarSign,
  ActivitySquare
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface AnalyticsData {
  users: {
    total: number;
    recentSignups: number;
    byRole: Record<string, number>;
    retentionRate: number;
  };
  subscriptions: {
    total: number;
    byPlan: Record<string, number>;
    totalRevenue: number;
    monthlyRevenue: number;
    yearlyRevenue: number;
  };
  mentorApplications: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  userGrowth: Array<{
    month: string;
    count: number;
  }>;
  revenueGrowth: Array<{
    month: string;
    amount: number;
  }>;
  systemHealth: {
    uptime: number;
    errorRate: number;
    responseTime: number;
  };
}

export const AnalyticsSection = ({ userDetails }: AdminSectionProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const MAX_RETRIES = 3;

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        console.log(`Analytics: Fetching data (attempt ${retryCount + 1})`);
        const response = await fetch(`/api/analytics?timeframe=${selectedTimeframe}`);
        const data = await response.json();

        if (!response.ok) {
          const errorMessage =
            data?.details || data?.error || "Failed to fetch analytics data";
          throw new Error(errorMessage);
        }
        
        // Ensure all expected properties exist, providing fallbacks as needed
        const sanitizedData = {
          users: {
            total: data.users?.total || 0,
            recentSignups: data.users?.recentSignups || 0,
            retentionRate: data.users?.retentionRate || 0,
            byRole: {
              USER: data.users?.byRole?.USER || 0,
              MENTOR: data.users?.byRole?.MENTOR || 0,
              MODERATOR: data.users?.byRole?.MODERATOR || 0,
              ADMIN: data.users?.byRole?.ADMIN || 0,
            },
          },
          subscriptions: {
            total: data.subscriptions?.total || 0,
            byPlan: {
              SEED: data.subscriptions?.byPlan?.SEED || 0,
              BLOOM: data.subscriptions?.byPlan?.BLOOM || 0,
              FLOURISH: data.subscriptions?.byPlan?.FLOURISH || 0,
              ...data.subscriptions?.byPlan,
            },
            totalRevenue: data.subscriptions?.totalRevenue || 0,
            monthlyRevenue: data.subscriptions?.monthlyRevenue || 0,
            yearlyRevenue: data.subscriptions?.yearlyRevenue || 0,
          },
          mentorApplications: {
            total: data.mentorApplications?.total || 0,
            pending: data.mentorApplications?.pending || 0,
            approved: data.mentorApplications?.approved || 0,
            rejected: data.mentorApplications?.rejected || 0,
          },
          userGrowth:
            Array.isArray(data.userGrowth) && data.userGrowth.length === 3
              ? data.userGrowth
              : [
                  { month: "Jun", count: 0 },
                  { month: "May", count: 0 },
                  { month: "Apr", count: 0 },
                ],
          revenueGrowth:
            Array.isArray(data.revenueGrowth) && data.revenueGrowth.length === 3
              ? data.revenueGrowth
              : [
                  { month: "Jun", amount: 0 },
                  { month: "May", amount: 0 },
                  { month: "Apr", amount: 0 },
                ],
          systemHealth: {
            uptime: data.systemHealth?.uptime || 99.9,
            errorRate: data.systemHealth?.errorRate || 0.1,
            responseTime: data.systemHealth?.responseTime || 250,
          },
        };
        
        setAnalyticsData(sanitizedData);
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
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
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
        `Analytics: Retrying in ${delay}ms (attempt ${retryCount + 1}/${
          MAX_RETRIES + 1
        })`
      );

      retryTimer = setTimeout(() => {
        fetchAnalytics();
      }, delay);
    }

    // Cleanup timer on unmount
    return () => {
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [retryCount, selectedTimeframe]);

  const handleTimeframeChange = (timeframe: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedTimeframe(timeframe);
    setRetryCount(0); // Reset retry count to trigger a fresh fetch with new timeframe
  };

  if (loading) {
    return <AnalyticsLoading />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive platform insights and performance metrics.
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <h3 className="text-lg font-medium">Failed to load analytics data</h3>
          <p className="mt-2">Error details: {error}</p>
          <div className="mt-3 space-x-2">
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
            <li>Verify you have admin permissions</li>
            <li>
              Check if your user session is valid (try logging out and back in)
            </li>
            <li>Check the server logs for any API errors</li>
            <li>Contact the system administrator if the problem persists</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return <AnalyticsLoading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
          <p className="text-gray-600 mt-2">
            Comprehensive platform insights and performance metrics.
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-white rounded-md border shadow-sm p-1">
          <button 
            onClick={() => handleTimeframeChange('week')} 
            className={`px-3 py-1 text-sm rounded-md ${selectedTimeframe === 'week' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
          >
            Week
          </button>
          <button 
            onClick={() => handleTimeframeChange('month')} 
            className={`px-3 py-1 text-sm rounded-md ${selectedTimeframe === 'month' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
          >
            Month
          </button>
          <button 
            onClick={() => handleTimeframeChange('quarter')} 
            className={`px-3 py-1 text-sm rounded-md ${selectedTimeframe === 'quarter' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
          >
            Quarter
          </button>
          <button 
            onClick={() => handleTimeframeChange('year')} 
            className={`px-3 py-1 text-sm rounded-md ${selectedTimeframe === 'year' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
          >
            Year
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={analyticsData.users.total}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          description={`${analyticsData.users.recentSignups} new in the last month`}
          className="bg-blue-50"
        />
        <StatCard
          title="Revenue"
          value={analyticsData.subscriptions.totalRevenue}
          icon={<DollarSign className="h-6 w-6 text-green-500" />}
          description={`₹${analyticsData.subscriptions.monthlyRevenue.toLocaleString()} this month`}
          className="bg-green-50"
          isCurrency={true}
        />
        <StatCard
          title="Active Subscriptions"
          value={analyticsData.subscriptions.total}
          icon={<TrendingUp className="h-6 w-6 text-indigo-500" />}
          description={`${Math.round((analyticsData.subscriptions.total / analyticsData.users.total) * 100)}% of users`}
          className="bg-indigo-50"
        />
        <StatCard
          title="User Retention"
          value={analyticsData.users.retentionRate}
          icon={<ActivitySquare className="h-6 w-6 text-purple-500" />}
          description="Monthly retention rate"
          className="bg-purple-50"
          isPercentage={true}
        />
      </div>

      {/* Role Distribution and System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 shadow-sm col-span-2">
          <h2 className="font-semibold text-xl mb-4">User Growth & Revenue</h2>
          <div className="h-64">
            <CombinedGrowthChart 
              userData={analyticsData.userGrowth} 
              revenueData={analyticsData.revenueGrowth} 
            />
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-4">System Health</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Uptime</span>
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {analyticsData.systemHealth.uptime.toFixed(2)}%
                </Badge>
              </div>
              <Progress value={analyticsData.systemHealth.uptime} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Error Rate</span>
                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                  {analyticsData.systemHealth.errorRate.toFixed(2)}%
                </Badge>
              </div>
              <Progress value={analyticsData.systemHealth.errorRate} max={10} className="h-2 bg-red-100" />
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Response Time</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  {analyticsData.systemHealth.responseTime} ms
                </Badge>
              </div>
              <Progress 
                value={100 - (analyticsData.systemHealth.responseTime / 10)} 
                className="h-2" 
              />
            </div>
          </div>
        </Card>
      </div>

      {/* User and Subscription Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-4">User Distribution</h2>
          <div className="flex flex-wrap gap-4">
            <RoleDistribution
              usersByRole={analyticsData.users.byRole}
              total={analyticsData.users.total}
            />
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-4">Subscription Plans</h2>
          <div className="flex flex-wrap gap-4">
            <SubscriptionDistribution
              subscriptionsByPlan={analyticsData.subscriptions.byPlan}
              total={analyticsData.users.total}
              revenue={analyticsData.subscriptions.totalRevenue}
            />
          </div>
        </Card>
      </div>

      {/* Mentor Applications */}
      <Card className="p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-xl">Mentor Applications</h2>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Total: {analyticsData.mentorApplications.total}
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              Pending: {analyticsData.mentorApplications.pending}
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Approved: {analyticsData.mentorApplications.approved}
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Rejected: {analyticsData.mentorApplications.rejected}
            </Badge>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="flex h-4 rounded-full overflow-hidden">
            <div 
              className="bg-green-500" 
              style={{ width: `${(analyticsData.mentorApplications.approved / analyticsData.mentorApplications.total) * 100}%` }}
            />
            <div 
              className="bg-amber-500" 
              style={{ width: `${(analyticsData.mentorApplications.pending / analyticsData.mentorApplications.total) * 100}%` }}
            />
            <div 
              className="bg-red-500" 
              style={{ width: `${(analyticsData.mentorApplications.rejected / analyticsData.mentorApplications.total) * 100}%` }}
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
  isCurrency = false,
  isPercentage = false,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  className?: string;
  isCurrency?: boolean;
  isPercentage?: boolean;
}) => (
  <Card className={`p-6 shadow-sm ${className}`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold mt-1">
          {isCurrency ? '₹' : ''}
          {value.toLocaleString()}
          {isPercentage ? '%' : ''}
        </p>
      </div>
      <div className="p-2 rounded-full bg-white bg-opacity-70">{icon}</div>
    </div>
    <p className="text-xs text-gray-600 mt-2">{description}</p>
  </Card>
);

const CombinedGrowthChart = ({
  userData,
  revenueData,
}: {
  userData: Array<{ month: string; count: number }>;
  revenueData: Array<{ month: string; amount: number }>;
}) => {
  // Find the maximum values to normalize bar heights
  const maxCount = Math.max(...userData.map((item) => item.count));
  const maxRevenue = Math.max(...revenueData.map((item) => item.amount));
  
  return (
    <div className="flex h-full items-end space-x-8 justify-around">
      {userData.map((item, index) => {
        const heightPercentage = (item.count / maxCount) * 100;
        const revenueItem = revenueData[index];
        const revenueHeightPercentage = (revenueItem.amount / maxRevenue) * 100;

        return (
          <div key={index} className="h-full flex flex-col items-center justify-end space-x-2" style={{ width: '100px' }}>
            <div className="flex items-end justify-center w-full space-x-2">
              <div className="flex flex-col items-center">
                <div
                  className="w-12 bg-blue-500 rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${heightPercentage}%`,
                    minHeight: "20px",
                  }}
                />
                <div className="text-xs text-blue-700 mt-1">{item.count} users</div>
              </div>
              <div className="flex flex-col items-center">
                <div
                  className="w-12 bg-green-500 rounded-t-md transition-all duration-700 ease-out"
                  style={{
                    height: `${revenueHeightPercentage}%`,
                    minHeight: "20px",
                  }}
                />
                <div className="text-xs text-green-700 mt-1">₹{revenueItem.amount.toLocaleString()}</div>
              </div>
            </div>
            <div className="mt-2 font-medium">{item.month}</div>
          </div>
        );
      })}
    </div>
  );
};

const RoleDistribution = ({
  usersByRole,
  total,
}: {
  usersByRole: Record<string, number>;
  total: number;
}) => {
  const roleColors: Record<string, string> = {
    USER: "bg-blue-500",
    MENTOR: "bg-purple-500",
    MODERATOR: "bg-amber-500",
    ADMIN: "bg-red-500",
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      {Object.entries(usersByRole).map(([role, count]) => {
        const percentage = Math.round((count / total) * 100) || 0;

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
                className={`h-2 rounded-full ${
                  roleColors[role] || "bg-gray-500"
                }`}
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
  revenue,
}: {
  subscriptionsByPlan: Record<string, number>;
  total: number;
  revenue: number;
}) => {
  const planColors: Record<string, string> = {
    SEED: "bg-green-300",
    BLOOM: "bg-green-500",
    FLOURISH: "bg-green-700",
  };
  
  // Sample plan pricing for revenue calculation
  const planPricing: Record<string, number> = {
    SEED: 999,
    BLOOM: 1999,
    FLOURISH: 2999,
  };

  return (
    <div className="w-full flex flex-col space-y-2">
      {Object.entries(subscriptionsByPlan).map(([plan, count]) => {
        const percentage = Math.round((count / total) * 100) || 0;
        // Calculate approximate revenue contribution
        const planRevenue = count * (planPricing[plan] || 0);
        const revenuePercentage = Math.round((planRevenue / revenue) * 100) || 0;

        return (
          <div key={plan} className="flex flex-col">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{plan}</span>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">
                  {count} users ({percentage}%)
                </span>
                <span className="text-xs text-green-600">
                  ₹{planRevenue.toLocaleString()} ({revenuePercentage}%)
                </span>
              </div>
            </div>
            <div className="h-2 rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${
                  planColors[plan] || "bg-gray-500"
                }`}
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
      <h1 className="text-3xl font-bold text-gray-900">Admin Analytics</h1>
      <p className="text-gray-600 mt-2">
        Comprehensive platform insights and performance metrics.
      </p>
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

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="p-6 shadow-sm col-span-2">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </Card>

      <Card className="p-6 shadow-sm">
        <Skeleton className="h-6 w-40 mb-6" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
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

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <Card key={i} className="p-6 shadow-sm">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="space-y-1">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  </div>
);