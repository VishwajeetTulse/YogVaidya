import { Card } from "@/components/ui/card";
import {
  Users,
  UserCheck,
  BarChart3,
  ArrowUpRight,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
import { AdminSectionProps } from "../types";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/utils";
import { Skeleton } from "@/components/ui/skeleton";
// Define analytics data structure
interface AnalyticsData {
  users: {
    total: number;
    recentSignups: number;
    byRole: {
      USER: number;
      MENTOR: number;
    };
  };
  mentorApplications: {
    total: number;
    pending: number;
  };
  userGrowth?: Array<{
    month: string;
    count: number;
  }>;
  subscriptions?: {
    total: number;
    byPlan: {
      SEED: number;
      BLOOM: number;
      FLOURISH: number;
    };
  };
}

// Define system logs data structure
interface SystemLogsData {
  total: number;
  recent: Array<{
    id: string;
    timestamp: string;
    level: string;
    details: string;
    category: string;
  }>;
  byLevel: {
    INFO?: number;
    WARNING?: number;
    ERROR?: number;
  };
}

const OverviewLoading = () => (
  <div className="space-y-6 p-6">
    <div className="animate-pulse">
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Skeleton className="h-6 w-1/2 mb-2" />
      <Skeleton className="h-6 w-full" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index} className="p-4 bg-gray-100">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div>
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        </Card>
      ))}
    </div>
    <div className="animate-pulse">
      <Skeleton className="h-8 w-1/3 mb-4" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-6 w-full" />
    </div>
  </div>
);

export const OverviewSection = ({
  userDetails,
  setActiveSection,
}: AdminSectionProps) => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [systemLogsData, setSystemLogsData] = useState<SystemLogsData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch analytics data
        const analyticsResponse = await fetch("/api/analytics");
        if (!analyticsResponse.ok) {
          throw new Error(
            `Failed to fetch analytics: ${analyticsResponse.statusText}`
          );
        }
        const analyticsData = await analyticsResponse.json();
        setAnalyticsData(analyticsData);

        // Fetch system logs data
        try {
          const logsResponse = await fetch("/api/admin/system-logs");
          if (logsResponse.ok) {
            const logsData = await logsResponse.json();
            setSystemLogsData(logsData);
          }
        } catch (logsError) {
          console.error("Error fetching system logs:", logsError);
          // Don't fail the whole component if just logs fail
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return <OverviewLoading />;
  }
  if (error) {
    return (
      <div className="p-6 text-red-500">Error loading analytics: {error}</div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {userDetails?.name || "Admin"}!
        </h1>
        <p className="text-gray-600 mt-2">
          Complete system administration and platform oversight.
        </p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-[#76d2fa]/10 to-[#5a9be9]/10 border border-[#76d2fa]/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-semibold">
                {analyticsData?.users.total || 0}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span
              className="cursor-pointer hover:text-[#76d2fa] transition-colors"
              onClick={() => setActiveSection("users")}
            >
              Manage users and roles
              <ArrowUpRight className="inline w-3 h-3 ml-1" />
            </span>
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
                {analyticsData?.users.byRole.MENTOR || 0}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span
              className={cn(
                analyticsData?.mentorApplications.pending
                  ? "text-red-500"
                  : "text-gray-500",
                "cursor-pointer hover:text-[#76d2fa]"
              )}
              onClick={() => setActiveSection("applications")}
            >
              {analyticsData?.mentorApplications.pending || 0} pending
              applications
              <ArrowUpRight className="inline w-3 h-3 ml-1" />
            </span>
          </div>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-[#98fb98]/20 to-[#90ee90]/10 border border-[#98fb98]/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-[#90ee90] to-[#7fd67f] rounded-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Activity Logs</p>
              <p className="text-xl font-semibold">
                {systemLogsData?.total || 0}
              </p>
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <span
              className={cn(
                (systemLogsData?.byLevel?.ERROR ?? 0) > 0
                  ? "text-red-500"
                  : "text-gray-500",
                "cursor-pointer hover:text-[#76d2fa] transition-colors"
              )}
              onClick={() => setActiveSection("logs")}
            >
              {"View activity logs"}
              <ArrowUpRight className="inline w-3 h-3 ml-1" />
            </span>
          </div>
        </Card>
      </div>

      {/* Recent Activity / Alerts */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {analyticsData?.mentorApplications.pending ? (
            <div className="flex items-start p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="p-1 bg-yellow-200 rounded mr-3 mt-0.5">
                <Users className="w-4 h-4 text-yellow-700" />
              </div>
              <div>
                <p className="font-medium text-yellow-800">
                  Mentor Applications
                </p>
                <p className="text-sm text-yellow-700">
                  {analyticsData.mentorApplications.pending} new applications
                  pending review
                </p>
              </div>
            </div>
          ) : null}

          {/* Always show up to 4 recent logs regardless of their type */}
          {systemLogsData?.recent?.map((log) => {
            // Determine the icon and styling based on log level
            let IconComponent = Info;
            let bgColorClass = "bg-blue-50";
            let borderColorClass = "border-blue-200";
            let iconBgClass = "bg-blue-200";
            let textColorClass = "text-blue-700";
            let headingColorClass = "text-blue-800";

            if (log.level === "WARNING") {
              IconComponent = AlertTriangle;
              bgColorClass = "bg-yellow-50";
              borderColorClass = "border-yellow-200";
              iconBgClass = "bg-yellow-200";
              textColorClass = "text-yellow-700";
              headingColorClass = "text-yellow-800";
            } else if (log.level === "ERROR") {
              IconComponent = AlertTriangle;
              bgColorClass = "bg-red-50";
              borderColorClass = "border-red-200";
              iconBgClass = "bg-red-200";
              textColorClass = "text-red-700";
              headingColorClass = "text-red-800";
            }
            console.log("log:", log);
            return (
              <div
                key={log.id}
                className={`flex items-start p-3 ${bgColorClass} rounded-lg border ${borderColorClass}`}
              >
                <div className={`p-1 ${iconBgClass} rounded mr-3 mt-0.5`}>
                  <IconComponent className={`w-4 h-4 ${textColorClass}`} />
                </div>
                <div className="w-full">
                  <div className="flex justify-between w-full">
                    <p className={`font-medium ${headingColorClass}`}>
                      {log.category}
                    </p>
                    <p className="text-xs text-gray-500">{log.timestamp}</p>
                  </div>
                  <p className={`text-sm ${textColorClass}`}>{log.details}</p>
                </div>
              </div>
            );
          })}

          {/* Only show this if there are no logs */}
          {(!systemLogsData?.recent || systemLogsData.recent.length === 0) && (
            <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="p-1 bg-green-200 rounded mr-3 mt-0.5">
                <CheckCircle className="w-4 h-4 text-green-700" />
              </div>
              <div>
                <p className="font-medium text-green-800">All Systems Normal</p>
                <p className="text-sm text-green-700">
                  No recent system alerts or issues detected
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-center mt-4">
            <button
              className="text-sm text-[#76d2fa] hover:text-[#5a9be9] transition-colors"
              onClick={() => setActiveSection("logs")}
            >
              View all activity
              <ArrowUpRight className="inline w-3 h-3 ml-1" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};

