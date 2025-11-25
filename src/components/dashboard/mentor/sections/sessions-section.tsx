"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { DateValue } from "@/lib/types/utils";
import { isMongoDate } from "@/lib/types/mongodb";
import {
  Video,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  RefreshCw,
  CheckCircle,
  XCircle,
  UserCheck,
  Crown,
} from "lucide-react";
import { DashboardSkeleton } from "@/components/dashboard/shared/dashboard-skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { UpdateSessionStatus } from "@/lib/session";
import { getMentorSessions, type MentorSessionData } from "@/lib/server/mentor-sessions-server";

interface MentorSessionsData {
  mentorInfo: {
    id: string;
    name: string | null;
    email: string;
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  };
  sessions: MentorSessionData[];
  totalSessions: number;
}

export const SessionsSection = () => {
  const { data: session } = useSession();
  const [mentorSessionsData, setMentorSessionsData] = useState<MentorSessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [, setUpdateTrigger] = useState(0); // Force re-render for duration updates

  // Format sessions data to handle Date/string conversion issues
  const formatMentorSessionsData = (serverData: MentorSessionsData): MentorSessionsData => {
    // Helper function to safely convert to valid Date object
    const safeToDate = (dateValue: DateValue): Date => {
      if (!dateValue) {
        console.warn("⚠️ Null/undefined date value found for scheduledTime:", dateValue);
        // Return a date far in the past to indicate an error, not current time
        return new Date("2000-01-01T00:00:00Z");
      }

      // If it's already a Date object, return it
      if (dateValue instanceof Date && !isNaN(dateValue.getTime())) {
        return dateValue;
      }

      // Try to parse as Date from string
      if (typeof dateValue === "string") {
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }

      // If it's a MongoDB date object with $date property
      if (isMongoDate(dateValue)) {
        const mongoDate = new Date(dateValue.$date);
        if (!isNaN(mongoDate.getTime())) {
          return mongoDate;
        }
      }

      // Last resort: log the issue and return a past date to indicate error
      console.error("❌ Unable to parse date value:", {
        value: dateValue,
        type: typeof dateValue,
        stringified: JSON.stringify(dateValue),
      });
      return new Date("2000-01-01T00:00:00Z");
    };

    return {
      ...serverData,
      sessions: serverData.sessions.map((session: MentorSessionData) => {
        return {
          ...session,
          scheduledTime: safeToDate(session.scheduledTime),
          createdAt: safeToDate(session.createdAt),
          updatedAt: safeToDate(session.updatedAt),
        };
      }),
    };
  };

  // Load mentor sessions using server action
  const loadMentorSessions = useCallback(async () => {
    if (!session?.user) return;

    try {
      const result = await getMentorSessions();

      if (result.success && result.data) {
        setMentorSessionsData(formatMentorSessionsData(result.data));
      } else {
        console.error("Failed to load sessions:", result.error);
        toast.error("Failed to load your sessions");
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load your sessions");
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadMentorSessions();
  }, [loadMentorSessions, session]);

  // Update duration display every minute for ongoing sessions
  useEffect(() => {
    const interval = setInterval(() => {
      // Force re-render to update elapsed time for ongoing sessions
      setUpdateTrigger((prev) => prev + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Refresh function for manual updates
  const refreshSessions = async () => {
    startTransition(async () => {
      try {
        const result = await getMentorSessions();

        if (result.success && result.data) {
          setMentorSessionsData(formatMentorSessionsData(result.data));
          toast.success("Sessions refreshed successfully");
        } else {
          toast.error("Failed to refresh sessions");
        }
      } catch (error) {
        console.error("Error refreshing sessions:", error);
        toast.error("Failed to refresh sessions");
      }
    });
  };

  // Function to handle start session
  const handleStartSession = (sessionItem: MentorSessionData) => {
    // Check if sessionItem exists
    if (!sessionItem) {
      console.error("❌ sessionItem is undefined/null");
      toast.error("Session data is missing");
      return;
    }

    // Check if id exists and is valid
    if (!sessionItem.id || typeof sessionItem.id !== "string" || sessionItem.id.trim() === "") {
      console.error("❌ Invalid session ID:", {
        id: sessionItem.id,
        idType: typeof sessionItem.id,
        fullSessionItem: sessionItem,
      });
      toast.error(`Cannot start session: Invalid session ID (${sessionItem.id})`);
      return;
    }

    try {
      UpdateSessionStatus("ONGOING", sessionItem.id);
      // Reload sessions after 1 second to ensure the status is updated
      setTimeout(() => {
        loadMentorSessions();
      }, 1000);
      toast.success("Session started successfully");
    } catch (error) {
      console.error("❌ Error calling UpdateSessionStatus:", error);
      toast.error("Failed to start session");
    }
  };

  // Function to handle end session (works for both regular and delayed sessions)
  const handleEndSession = async (sessionItem: MentorSessionData) => {
    try {
      // Use the proper completion API which handles delayed sessions
      const response = await fetch(`/api/sessions/${sessionItem.id}/complete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Session completed successfully");
        // Reload sessions to reflect the change
        setTimeout(() => {
          loadMentorSessions();
        }, 1000);
      } else {
        throw new Error(result.error || "Failed to complete session");
      }
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Failed to complete session");
    }
  };

  // Show loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // No data yet
  if (!mentorSessionsData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">Manage your scheduled sessions.</p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">No session data available.</p>
        </div>
      </div>
    );
  }

  const scheduledSessions = mentorSessionsData.sessions || [];

  const getSessionTypeIcon = (type: "YOGA" | "MEDITATION" | "DIET") => {
    return type === "YOGA" ? (
      <Video className="w-8 h-8 text-white" />
    ) : type === "MEDITATION" ? (
      <Calendar className="w-8 h-8 text-white" />
    ) : (
      <Users className="w-8 h-8 text-white" />
    );
  };

  const getSessionTypeBadgeColor = (type: "YOGA" | "MEDITATION" | "DIET") => {
    return type === "YOGA"
      ? "bg-blue-100 text-blue-600"
      : type === "MEDITATION"
        ? "bg-purple-100 text-purple-600"
        : "bg-green-100 text-green-600";
  };

  const getMentorTypeDisplay = (
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null
  ) => {
    if (mentorType === "YOGAMENTOR") return "Yoga Mentor";
    if (mentorType === "MEDITATIONMENTOR") return "Meditation Mentor";
    if (mentorType === "DIETPLANNER") return "Diet Planner";
    return "Mentor";
  };

  // Helper function to calculate real-time duration for ONGOING sessions
  const calculateDisplayDuration = (sessionItem: MentorSessionData): number => {
    // For ONGOING sessions, calculate elapsed time from actual start time
    if (sessionItem.status === "ONGOING") {
      // Use manualStartTime (when mentor started) if available, otherwise scheduledTime
      const startTimeValue = sessionItem.manualStartTime || sessionItem.scheduledTime;
      if (startTimeValue && startTimeValue instanceof Date && !isNaN(startTimeValue.getTime())) {
        const currentTime = new Date();
        const elapsedMs = currentTime.getTime() - startTimeValue.getTime();
        const elapsedMinutes = Math.round(elapsedMs / (1000 * 60));
        return Math.max(elapsedMinutes, 1); // Minimum 1 minute
      }
    }

    // For COMPLETED sessions: uses stored duration
    // For SCHEDULED sessions: uses planned duration
    // For all cases: duration is provided by server
    return sessionItem.duration || 60;
  };

  // Helper function for safe date comparison - now all dates should be valid Date objects
  const getValidDate = (dateValue: DateValue): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    if (isMongoDate(dateValue)) {
      const date = new Date(dateValue.$date);
      return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  };

  // Safe sorting function
  const sortByScheduledTime = (
    a: MentorSessionData,
    b: MentorSessionData,
    ascending = true
  ): number => {
    const dateA = getValidDate(a.scheduledTime);
    const dateB = getValidDate(b.scheduledTime);

    // Handle null dates: put them at the end
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;

    const diff = dateA.getTime() - dateB.getTime();
    return ascending ? diff : -diff;
  };

  // Filter sessions for upcoming (all scheduled sessions, including delayed ones)
  const upcomingSessions = scheduledSessions
    .filter((session: MentorSessionData) => {
      // Include all sessions with SCHEDULED status, even if delayed/past due
      return session.status === "SCHEDULED";
    })
    .sort((a, b) => sortByScheduledTime(a, b, false)); // Changed to false for newest first

  // Separate upcoming sessions by category (handle missing sessionCategory gracefully)
  const upcomingSubscriptionSessions = upcomingSessions.filter(
    (session) => session.sessionCategory === "subscription"
  );
  const upcomingIndividualSessions = upcomingSessions.filter(
    (session) => session.sessionCategory === "individual"
  );

  // Filter sessions for ongoing
  const ongoingSessions = scheduledSessions
    .filter((session: MentorSessionData) => session.status === "ONGOING")
    .sort((a, b) => sortByScheduledTime(a, b, false)); // Changed to false for newest first

  // Separate ongoing sessions by category
  const ongoingSubscriptionSessions = ongoingSessions.filter(
    (session) => session.sessionCategory === "subscription"
  );
  const ongoingIndividualSessions = ongoingSessions.filter(
    (session) => session.sessionCategory === "individual"
  );

  // Filter sessions for completed
  const completedSessions = scheduledSessions
    .filter((session: MentorSessionData) => session.status === "COMPLETED")
    .sort((a, b) => sortByScheduledTime(a, b, false));

  // Separate completed sessions by category
  const completedSubscriptionSessions = completedSessions.filter(
    (session) => session.sessionCategory === "subscription"
  );
  const completedIndividualSessions = completedSessions.filter(
    (session) => session.sessionCategory === "individual"
  );

  // Filter sessions for cancelled
  const cancelledSessions = scheduledSessions
    .filter((session: MentorSessionData) => session.status === "CANCELLED")
    .sort((a, b) => sortByScheduledTime(a, b, false));

  // Separate cancelled sessions by category
  const cancelledSubscriptionSessions = cancelledSessions.filter(
    (session) => session.sessionCategory === "subscription"
  );
  const cancelledIndividualSessions = cancelledSessions.filter(
    (session) => session.sessionCategory === "individual"
  );

  const renderSessionCard = (
    sessionItem: MentorSessionData,
    isUpcoming: boolean = false,
    isOngoing: boolean = false
  ) => {
    // Defensive programming: Handle null/undefined scheduledTime first
    const scheduledTime = sessionItem.scheduledTime ? new Date(sessionItem.scheduledTime) : null;
    const isValidDate = scheduledTime && !isNaN(scheduledTime.getTime());
    const _currentTime = new Date();

    const isCompleted = sessionItem.status === "COMPLETED";
    const isCancelled = sessionItem.status === "CANCELLED";

    return (
      <Card key={sessionItem.id} className="p-6 shadow-sm border-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 ${getSessionTypeBadgeColor(
                sessionItem.sessionType
              )} rounded-lg flex items-center justify-center`}
            >
              {getSessionTypeIcon(sessionItem.sessionType)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">{sessionItem.title}</h3>
                {/* Status Badge */}
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isOngoing
                      ? "bg-orange-100 text-orange-800"
                      : isUpcoming
                        ? "bg-blue-100 text-blue-800"
                        : isCompleted
                          ? "bg-green-100 text-green-800"
                          : isCancelled
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {isOngoing
                    ? "ONGOING"
                    : isUpcoming
                      ? "UPCOMING"
                      : isCompleted
                        ? "COMPLETED"
                        : isCancelled
                          ? "CANCELLED"
                          : "SCHEDULED"}
                </span>
              </div>
              <p className="text-gray-500 capitalize">
                {sessionItem.sessionType.toLowerCase()} Session
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {isValidDate ? (
                    // Check if this is our error date (2000-01-01)
                    scheduledTime.getFullYear() === 2000 ? (
                      <span className="text-red-500">Date unavailable</span>
                    ) : (
                      scheduledTime
                        .toLocaleString("en-US", {
                          timeZone: "Asia/Kolkata",
                          day: "2-digit",
                          month: "2-digit",
                          year: "2-digit",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                        .replace(/(\d{2})\/(\d{2})\/(\d{2}), (.+)/, "$1/$2/$3 $4")
                    )
                  ) : (
                    <span className="text-red-500">Date not available</span>
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {Math.round(calculateDisplayDuration(sessionItem))} minutes
                  {sessionItem.status === "ONGOING" && " (ongoing)"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {sessionItem.eligibleStudents.total} eligible
                </span>
                <span className="flex items-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  {sessionItem.eligibleStudents.active} active
                </span>
              </div>

              {/* Student eligibility breakdown */}
              <div className="mt-3 flex flex-wrap gap-2">
                {sessionItem.eligibleStudents.byPlan.SEED > 0 && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                    SEED: {sessionItem.eligibleStudents.byPlan.SEED}
                  </span>
                )}
                {sessionItem.eligibleStudents.byPlan.BLOOM > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    BLOOM: {sessionItem.eligibleStudents.byPlan.BLOOM}
                  </span>
                )}
                {sessionItem.eligibleStudents.byPlan.FLOURISH > 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    FLOURISH: {sessionItem.eligibleStudents.byPlan.FLOURISH}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {/* Buttons for upcoming sessions */}
            {isUpcoming && (
              <>
                <Button
                  variant="outline"
                  className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]"
                  onClick={() => sessionItem.link && window.open(sessionItem.link, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Join Link
                </Button>
                {sessionItem.status === "SCHEDULED" && (
                  <Button
                    className="bg-[#76d2fa] hover:bg-[#5a9be9]"
                    onClick={() => handleStartSession(sessionItem)}
                  >
                    Start Session
                  </Button>
                )}
              </>
            )}

            {/* Buttons for ongoing sessions */}
            {isOngoing && (
              <>
                <Button
                  variant="outline"
                  className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]"
                  onClick={() => sessionItem.link && window.open(sessionItem.link, "_blank")}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Join Link
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleEndSession(sessionItem)}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  End Session
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (
                      !sessionItem?.id ||
                      typeof sessionItem.id !== "string" ||
                      sessionItem.id.trim() === ""
                    ) {
                      console.error("❌ Invalid session ID for cancel:", sessionItem?.id);
                      toast.error(`Cannot cancel session: Invalid session ID (${sessionItem?.id})`);
                      return;
                    }

                    try {
                      UpdateSessionStatus("CANCELLED", sessionItem.id);
                      setTimeout(() => {
                        loadMentorSessions();
                      }, 1000);
                      toast.success("Session cancelled");
                    } catch (error) {
                      console.error("❌ Error cancelling session:", error);
                      toast.error("Failed to cancel session");
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel Session
                </Button>
              </>
            )}

            {/* No buttons for completed sessions - recordings functionality removed */}
          </div>
        </div>
      </Card>
    );
  };

  const _renderTabContent = (sessions: MentorSessionData[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading sessions...</p>
        </div>
      );
    }

    if (sessions.length === 0) {
      return (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">{emptyMessage}</p>
          <p className="text-gray-400">
            {activeTab === "upcoming" ? "Schedule your first session from the Schedule tab!" : ""}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {sessions.map((sessionItem) => {
          return renderSessionCard(sessionItem);
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">
            View and manage your{" "}
            {getMentorTypeDisplay(mentorSessionsData.mentorInfo.mentorType).toLowerCase()} sessions
            and eligible students.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshSessions}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Mentor Info Card */}
      <Card className="p-4 bg-blue-50 border-none shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {mentorSessionsData.mentorInfo.name || "Mentor"}
            </h3>
            <p className="text-gray-600">
              {getMentorTypeDisplay(mentorSessionsData.mentorInfo.mentorType)} •{" "}
              {scheduledSessions.length} total sessions
            </p>
          </div>
        </div>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            Upcoming ({upcomingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="ongoing" className="flex items-center gap-2">
            Ongoing ({ongoingSessions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            Completed ({completedSessions.length})
          </TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            Cancelled ({cancelledSessions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <div className="space-y-6">
            {/* Subscription Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Subscription Group Sessions ({upcomingSubscriptionSessions.length})
              </h3>
              {upcomingSubscriptionSessions.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingSubscriptionSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, true, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No upcoming subscription sessions</p>
                </div>
              )}
            </div>

            {/* Individual Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Individual One-to-One Sessions ({upcomingIndividualSessions.length})
              </h3>
              {upcomingIndividualSessions.length > 0 ? (
                <div className="grid gap-4">
                  {upcomingIndividualSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, true, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No upcoming individual sessions</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="ongoing">
          <div className="space-y-6">
            {/* Subscription Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Ongoing Subscription Sessions ({ongoingSubscriptionSessions.length})
              </h3>
              {ongoingSubscriptionSessions.length > 0 ? (
                <div className="grid gap-4">
                  {ongoingSubscriptionSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, false, true)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No ongoing subscription sessions</p>
                </div>
              )}
            </div>

            {/* Individual Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Ongoing Individual Sessions ({ongoingIndividualSessions.length})
              </h3>
              {ongoingIndividualSessions.length > 0 ? (
                <div className="grid gap-4">
                  {ongoingIndividualSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, false, true)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No ongoing individual sessions</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-6">
            {/* Subscription Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Completed Subscription Sessions ({completedSubscriptionSessions.length})
              </h3>
              {completedSubscriptionSessions.length > 0 ? (
                <div className="grid gap-4">
                  {completedSubscriptionSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, false, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No completed subscription sessions</p>
                </div>
              )}
            </div>

            {/* Individual Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Completed Individual Sessions ({completedIndividualSessions.length})
              </h3>
              {completedIndividualSessions.length > 0 ? (
                <div className="grid gap-4">
                  {completedIndividualSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, false, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No completed individual sessions</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="cancelled">
          <div className="space-y-6">
            {/* Subscription Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Cancelled Subscription Sessions ({cancelledSubscriptionSessions.length})
              </h3>
              {cancelledSubscriptionSessions.length > 0 ? (
                <div className="grid gap-4">
                  {cancelledSubscriptionSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, false, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No cancelled subscription sessions</p>
                </div>
              )}
            </div>

            {/* Individual Sessions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-600" />
                Cancelled Individual Sessions ({cancelledIndividualSessions.length})
              </h3>
              {cancelledIndividualSessions.length > 0 ? (
                <div className="grid gap-4">
                  {cancelledIndividualSessions.map((sessionItem) =>
                    renderSessionCard(sessionItem, false, false)
                  )}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <UserCheck className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">No cancelled individual sessions</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
