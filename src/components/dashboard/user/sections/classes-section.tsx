"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, PlayCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { SubscriptionPrompt } from "../SubscriptionPrompt";
import {
  type UserSessionData,
  type UserSessionsResponse,
} from "@/lib/server/user-sessions-server";
import { useSessionStatusUpdates } from "@/hooks/use-session-status-updates";
import { useUserSessions } from "@/hooks/use-dashboard-data";
import type { DateValue } from "@/lib/types/utils";
import { isMongoDate } from "@/lib/types/mongodb";
import { DashboardSkeleton } from "../../unified/dashboard-skeleton";
// import { Prisma } from "@prisma/client";

interface SessionData {
  id: string;
  title: string;
  scheduledTime: string;
  manualStartTime: string | null; // When session was actually started by mentor
  duration: number;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  link?: string; // Session link for joining
  mentor: {
    id: string;
    name: string | null;
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  };
}

interface UserSessionsData {
  subscriptionStatus: string;
  subscriptionPlan: string | null;
  sessions: SessionData[];
  needsSubscription: boolean;
  nextBillingDate?: string | null;
  isTrialExpired?: boolean;
}

// Helper function to convert server data to component format - moved before usage
const formatSessionsData = (serverData: UserSessionsResponse["data"]): UserSessionsData => {
  if (!serverData) {
    throw new Error("Server data is undefined");
  }

  // Helper function to safely convert to valid ISO string
  const safeToISOString = (dateValue: DateValue): string | null => {
    // Handle null/undefined
    if (!dateValue) {
      console.warn("Null/undefined date value found, skipping session");
      return null;
    }

    // Handle MongoDB extended JSON date format: {$date: 'ISO_STRING'}
    if (isMongoDate(dateValue)) {
      const isoString = dateValue.$date;
      if (typeof isoString === "string") {
        const date = new Date(isoString);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
      console.warn("Invalid MongoDB date format found, skipping session:", dateValue);
      return null;
    }

    // If it's already a string, check if it's a valid ISO date
    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
      // If invalid string, return null to filter out this session
      console.warn("Invalid date string found, skipping session:", dateValue);
      return null;
    }

    // If it's a Date object
    if (dateValue instanceof Date) {
      if (!isNaN(dateValue.getTime())) {
        return dateValue.toISOString();
      }
      console.warn("Invalid Date object found, skipping session:", dateValue);
      return null;
    }

    // If it's a number (timestamp)
    if (typeof dateValue === "number") {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    }

    // If completely invalid, return null to filter out this session
    console.warn("Invalid date value found, skipping session:", dateValue);
    return null;
  };

  return {
    ...serverData,
    sessions: serverData.sessions
      .map((session: UserSessionData) => {
        const scheduledTime = safeToISOString(session.scheduledTime);
        if (scheduledTime === null) {
          return null; // Mark for filtering
        }

        const manualStartTime = session.manualStartTime
          ? safeToISOString(session.manualStartTime)
          : null;

        return {
          id: session.id,
          title: session.title,
          scheduledTime: scheduledTime,
          manualStartTime: manualStartTime,
          duration: session.duration || 45,
          sessionType: session.sessionType,
          status: session.status,
          link: session.link || undefined,
          mentor: {
            id: session.mentor.id,
            name: session.mentor.name,
            mentorType: session.mentor.mentorType,
          },
        } as SessionData;
      })
      .filter((session) => session !== null) as SessionData[],
  };
};

export const ClassesSection = () => {
  const { data: session } = useSession();
  
  // Use SWR hook for automatic caching and revalidation
  const { sessions: rawSessionsData, isLoading: swrLoading, refresh } = useUserSessions(session?.user?.id);
  
  const [activeTab, setActiveTab] = useState("upcoming");
  const [, setUpdateTrigger] = useState(0); // Force re-render for duration updates

  // Enable automatic session status updates
  useSessionStatusUpdates(true, 30000); // Check every 30 seconds for more responsive updates
  
  // Format SWR data into component format
  const sessionsData = rawSessionsData ? formatSessionsData(rawSessionsData) : null;
  const loading = swrLoading;

  // Update duration display every minute for ongoing sessions
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update elapsed time for ongoing sessions
      setUpdateTrigger((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Refresh function using SWR's mutate
  const refreshSessionsData = async () => {
    try {
      await refresh();
      toast.success("Sessions refreshed successfully");
    } catch (error) {
      console.error("Error refreshing sessions:", error);
      toast.error("Failed to refresh sessions");
    }
  };

  // Listen for session status updates and refresh automatically
  useEffect(() => {
    const handleSessionStatusUpdate = (event: CustomEvent) => {
      const { started, completed } = event.detail;

      if (started > 0 || completed > 0) {
        // Refresh sessions data without showing toast to avoid spam
        refresh();
      }
    };

    // Add event listener for session status updates
    window.addEventListener("session-status-updated", handleSessionStatusUpdate as EventListener);

    // Cleanup event listener
    return () => {
      window.removeEventListener(
        "session-status-updated",
        handleSessionStatusUpdate as EventListener
      );
    };
  }, [refresh]);

  // Show loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Filter sessions based on the subscription plan
  const availableSessions = sessionsData?.sessions || [];

  // If there are sessions available (including paid one-on-one sessions), show them
  // This handles the case where users without subscription have booked paid sessions
  if (availableSessions.length > 0) {
    // User has sessions, show them regardless of subscription status
  } else {
    // No sessions available - check if user needs subscription
    if (sessionsData?.needsSubscription) {
      return (
        <SubscriptionPrompt
          subscriptionStatus={sessionsData.subscriptionStatus}
          subscriptionPlan={sessionsData.subscriptionPlan}
          nextBillingDate={sessionsData.nextBillingDate}
          isTrialExpired={sessionsData.isTrialExpired}
        />
      );
    }
  }

  // Upcoming sessions: SCHEDULED or ONGOING sessions
  const upcomingSessions = availableSessions.filter((session) => {
    if (session.status === "COMPLETED" || session.status === "CANCELLED") {
      return false;
    }

    // For ONGOING sessions, always show them in upcoming (they're active and joinable)
    if (session.status === "ONGOING") {
      return true;
    }

    // For SCHEDULED sessions, check if they haven't ended yet
    const sessionTime = new Date(session.scheduledTime);
    const sessionEndTime = new Date(sessionTime.getTime() + session.duration * 60000);
    const currentTime = new Date();

    return currentTime <= sessionEndTime;
  });

  const completedSessions = availableSessions.filter((session) => session.status === "COMPLETED");
  const cancelledSessions = availableSessions.filter((session) => session.status === "CANCELLED");

  const getSessionTypeColor = (type: "YOGA" | "MEDITATION" | "DIET") => {
    if (type === "YOGA") return "bg-blue-100 text-blue-600";
    if (type === "MEDITATION") return "bg-purple-100 text-purple-600";
    return "bg-green-100 text-green-600"; // Green for DIET
  };

  const _getMentorTypeDisplay = (
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null
  ) => {
    if (mentorType === "YOGAMENTOR") return "Yoga Mentor";
    if (mentorType === "MEDITATIONMENTOR") return "Meditation Mentor";
    if (mentorType === "DIETPLANNER") return "Diet Planner";
    return "Mentor";
  };

  // Helper function to calculate real-time duration for ONGOING sessions
  const calculateDisplayDuration = (sessionItem: SessionData): number => {
    // For ONGOING sessions, calculate elapsed time from actual start time
    if (sessionItem.status === "ONGOING") {
      // Use manualStartTime (when mentor started) if available, otherwise scheduledTime
      const startTimeStr = sessionItem.manualStartTime || sessionItem.scheduledTime;
      const startTime = new Date(startTimeStr);
      const currentTime = new Date();

      if (!isNaN(startTime.getTime())) {
        const elapsedMs = currentTime.getTime() - startTime.getTime();
        const elapsedMinutes = Math.round(elapsedMs / (1000 * 60));
        return Math.max(elapsedMinutes, 1); // Minimum 1 minute
      }
    }

    // For COMPLETED: uses actualDuration stored in DB when session ended
    // For SCHEDULED: uses planned duration from time slot
    // For all cases: duration is provided by server
    return sessionItem.duration || 60;
  };

  const renderSessionCard = (sessionItem: SessionData) => {
    // Defensive programming: Ensure valid date
    const sessionTime = new Date(sessionItem.scheduledTime);
    if (isNaN(sessionTime.getTime())) {
      console.error("Invalid session time for session:", sessionItem.id, sessionItem.scheduledTime);
      return null; // Skip rendering this session
    }

    const currentTime = new Date();
    const sessionEndTime = new Date(sessionTime.getTime() + sessionItem.duration * 60000); // Add duration in milliseconds

    // Session is "upcoming" if it's not explicitly completed
    // For ONGOING sessions, always consider them within time window (they're active)
    const isWithinTimeWindow = sessionItem.status === "ONGOING" || currentTime <= sessionEndTime;
    const isUpcoming =
      (sessionItem.status === "SCHEDULED" || sessionItem.status === "ONGOING") &&
      isWithinTimeWindow;
    const isOngoing = sessionItem.status === "ONGOING" && isWithinTimeWindow;

    // Only show join button if session is ONGOING (started by mentor)
    const canJoin = sessionItem.status === "ONGOING" && isWithinTimeWindow;

    return (
      <Card key={sessionItem.id} className="p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 ${getSessionTypeColor(sessionItem.sessionType)} rounded-lg flex items-center justify-center`}
            >
              <PlayCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{sessionItem.title}</h3>
              <p className="text-gray-500" />
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {sessionTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.round(calculateDisplayDuration(sessionItem))} minutes
                  {sessionItem.status === "ONGOING" && " (ongoing)"}
                </span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    sessionItem.sessionType === "YOGA"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {sessionItem.sessionType}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {isUpcoming && (
              <>
                <Button
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={() => {
                    // TODO: Implement reschedule functionality
                    toast.info("Reschedule functionality coming soon!");
                  }}
                >
                  Reschedule
                </Button>
                {canJoin ? (
                  <Button
                    className={`${isOngoing ? "bg-blue-600 hover:bg-blue-700" : "bg-purple-600 hover:bg-purple-700"}`}
                    onClick={() => {
                      if (sessionItem.link) {
                        window.open(sessionItem.link, "_blank");
                        toast.success(
                          `${isOngoing ? "Joining ongoing session..." : "Opening session link..."}`
                        );
                      } else {
                        toast.error("Session link not available. Please contact support.");
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {isOngoing ? "Join Now" : "Join Class"}
                  </Button>
                ) : (
                  <Button variant="outline" disabled className="text-gray-400">
                    <Clock className="w-4 h-4 mr-1" />
                    {sessionItem.status === "SCHEDULED"
                      ? currentTime < sessionTime
                        ? "Waiting for Mentor to Start"
                        : "Session Not Started Yet"
                      : "Session Ended"}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderTabContent = (sessions: SessionData[], emptyMessage: string) => {
    if (sessions.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">{emptyMessage}</p>
          <p className="text-gray-400">
            {activeTab === "upcoming" ? "New sessions will appear here when available." : ""}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {sessions.map((sessionItem) => renderSessionCard(sessionItem))}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          </div>
          <p className="text-gray-600 mt-2">
            Manage your scheduled and completed {sessionsData?.subscriptionPlan?.toLowerCase()}{" "}
            sessions. Sessions automatically complete when their duration ends.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshSessionsData}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      <div className="flex gap-4 border-b">
        <button
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === "upcoming"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-purple-600"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming ({upcomingSessions.length})
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === "completed"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-purple-600"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedSessions.length})
        </button>
        <button
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === "cancelled"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-purple-600"
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled ({cancelledSessions.length})
        </button>
      </div>

      <div>
        {activeTab === "upcoming" &&
          renderTabContent(upcomingSessions, "No upcoming sessions scheduled")}
        {activeTab === "completed" &&
          renderTabContent(completedSessions, "No completed sessions yet")}
        {activeTab === "cancelled" && renderTabContent(cancelledSessions, "No cancelled sessions")}
      </div>
    </div>
  );
};
