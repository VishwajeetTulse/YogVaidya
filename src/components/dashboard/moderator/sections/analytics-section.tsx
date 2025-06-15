"use client";

import { useEffect, useState } from "react";
import { ModeratorSectionProps } from "../types";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, Users, Award, TrendingUp } from "lucide-react";
import { Separator } from "@/components/ui/separator";

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

export const AnalyticsSection = ({ userDetails }: ModeratorSectionProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;
  
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        console.log(`Analytics: Fetching data (attempt ${retryCount + 1})`);
        const response = await fetch('/api/analytics');
        const data = await response.json();
        
        if (!response.ok) {
          const errorMessage = data?.details || data?.error || 'Failed to fetch analytics data';
          throw new Error(errorMessage);
        }
          // Ensure all expected properties exist, providing fallbacks as needed
        const sanitizedData = {          users: {
            total: data.users?.total || 0,
            recentSignups: data.users?.recentSignups || 0,
            byRole: {
              USER: data.users?.byRole?.USER || 0,
              MENTOR: data.users?.byRole?.MENTOR || 0,
              // Only include USER and MENTOR roles
            }
          },
          subscriptions: {
            total: data.subscriptions?.total || 0,
            byPlan: {
              SEED: data.subscriptions?.byPlan?.SEED || 0,
              BLOOM: data.subscriptions?.byPlan?.BLOOM || 0,
              FLOURISH: data.subscriptions?.byPlan?.FLOURISH || 0,
              ...data.subscriptions?.byPlan
            }
          },
          mentorApplications: {
            total: data.mentorApplications?.total || 0,
            pending: data.mentorApplications?.pending || 0
          },
          userGrowth: Array.isArray(data.userGrowth) && data.userGrowth.length === 3 
            ? data.userGrowth 
            : [
                { month: "Jun", count: 0 },
                { month: "May", count: 0 },
                { month: "Apr", count: 0 }
              ]
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
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false); // Stop loading even on error if max retries reached
      }
    };

    fetchAnalytics();
    
    // If we're retrying, set up a timer to fetch again
    let retryTimer: NodeJS.Timeout | null = null;
    
    if (retryCount > 0 && retryCount <= MAX_RETRIES) {
      // Exponential backoff: 2^retryCount * 1000ms (1s, 2s, 4s)
      const delay = Math.pow(2, retryCount) * 1000;
      console.log(`Analytics: Retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES + 1})`);
      
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
          <div className="mt-3 space-x-2">            <button 
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
        <p className="text-gray-600 mt-2">Platform insights and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={analyticsData.users.total}
          icon={<Users className="h-6 w-6 text-blue-500" />}
          description={`${analyticsData.users.recentSignups} new in the last month`}
          className="bg-blue-50"
        />
        <StatCard
          title="Active Subscriptions"
          value={analyticsData.subscriptions.total}
          icon={<TrendingUp className="h-6 w-6 text-green-500" />}
          description="Paying users"
          className="bg-green-50"
        />
        <StatCard
          title="Total Mentors"
          value={analyticsData.users.byRole.MENTOR || 0}
          icon={<Award className="h-6 w-6 text-purple-500" />}
          description="Expert yoga guides"
          className="bg-purple-50"
        />
        <StatCard
          title="Mentor Applications"
          value={analyticsData.mentorApplications.total}
          icon={<BarChart3 className="h-6 w-6 text-amber-500" />}
          description={`${analyticsData.mentorApplications.pending} pending review`}
          className="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-4">User Growth (Last 3 Months)</h2>
          <div className="h-64">
            <UserGrowthChart data={analyticsData.userGrowth} />
          </div>
        </Card>

        <Card className="p-6 shadow-sm">
          <h2 className="font-semibold text-xl mb-4">User Distribution</h2>
          <div className="flex flex-wrap gap-4">
            <RoleDistribution 
              usersByRole={analyticsData.users.byRole}
              total={analyticsData.users.total}
            />
          </div>
          <Separator className="my-4" />
          <h2 className="font-semibold text-xl mb-4">Subscription Plans</h2>
          <div className="flex flex-wrap gap-4">
            <SubscriptionDistribution 
              subscriptionsByPlan={analyticsData.subscriptions.byPlan}
              total={analyticsData.users.total}
            />
          </div>
        </Card>
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon, description, className }: { 
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
      <div className="p-2 rounded-full bg-white bg-opacity-70">
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-600 mt-2">{description}</p>
  </Card>
);

const UserGrowthChart = ({ data }: { data: Array<{ month: string; count: number }> }) => {
  // Find the maximum value to normalize bar heights
  const maxCount = Math.max(...data.map(item => item.count));

  return (
    <div className="flex h-full items-end space-x-8 justify-around">
      {data.map((item, index) => {
        const heightPercentage = (item.count / maxCount) * 100;
        
        return (
          <div key={index} className="flex flex-col items-center">
            <div 
              className="w-16 bg-blue-500 rounded-t-md transition-all duration-700 ease-out"
              style={{ 
                height: `${heightPercentage}%`,
                minHeight: '20px'
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

const RoleDistribution = ({ usersByRole, total }: { usersByRole: Record<string, number>, total: number }) => {
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
              <span className="text-xs text-gray-500">{count} ({percentage}%)</span>
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
  total 
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
              <span className="text-xs text-gray-500">{count} ({percentage}%)</span>
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
