"use client";

import React, { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { UpdateSessionStatus } from "@/lib/session";
import { getMentorSessions, MentorSessionData } from "@/lib/server/mentor-sessions-server";

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

  // Format sessions data to handle Date/string conversion issues
  const formatMentorSessionsData = (serverData: MentorSessionsData): MentorSessionsData => {
    // Helper function to safely convert to valid Date object
    const safeToDate = (dateValue: any): Date => {
      if (!dateValue) {
        console.warn('Null/undefined date value found, using current date as fallback');
        return new Date();
      }
      
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // If invalid date, log warning and return current date as fallback
      console.warn('Invalid date value found in mentor session:', dateValue);
      return new Date();
    };

    return {
      ...serverData,
      sessions: serverData.sessions.map((session: MentorSessionData) => ({
        ...session,
        scheduledTime: safeToDate(session.scheduledTime),
        createdAt: safeToDate(session.createdAt),
        updatedAt: safeToDate(session.updatedAt)
      }))
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
    UpdateSessionStatus("ONGOING", sessionItem.id);
    // Reload sessions after 1 second to ensure the status is updated
    setTimeout(() => {
      loadMentorSessions();
    }, 1000);
    toast.success("Session started successfully");
  };

  // Function to handle end session (works for both regular and delayed sessions)
  const handleEndSession = async (sessionItem: MentorSessionData) => {
    try {
      // Use the proper completion API which handles delayed sessions
      const response = await fetch(`/api/sessions/${sessionItem.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Session completed successfully");
        // Reload sessions to reflect the change
        setTimeout(() => {
          loadMentorSessions();
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to complete session');
      }
    } catch (error) {
      console.error("Error completing session:", error);
      toast.error("Failed to complete session");
    }
  };



  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">
            Manage your scheduled sessions.
          </p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  // No data yet
  if (!mentorSessionsData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">
            Manage your scheduled sessions.
          </p>
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
      ? "from-[#76d2fa] to-[#5a9be9]"
      : type === "MEDITATION" 
      ? "from-[#876aff] to-[#9966cc]"
      : "from-[#22c55e] to-[#16a34a]";
  };

  const getMentorTypeDisplay = (mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null) => {
    if (mentorType === "YOGAMENTOR") return "Yoga Mentor";
    if (mentorType === "MEDITATIONMENTOR") return "Meditation Mentor";
    if (mentorType === "DIETPLANNER") return "Diet Planner";
    return "Mentor";
  };

  // Helper function for safe date comparison - now all dates should be valid Date objects
  const getValidDate = (dateValue: any): Date | null => {
    if (!dateValue) return null;
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  };

  // Safe sorting function
  const sortByScheduledTime = (a: MentorSessionData, b: MentorSessionData, ascending = true): number => {
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
    .filter(
      (session: MentorSessionData) => {
        // Include all sessions with SCHEDULED status, even if delayed/past due
        return session.status === "SCHEDULED";
      }
    )
    .sort((a, b) => sortByScheduledTime(a, b, true));

  // Filter sessions for ongoing
  const ongoingSessions = scheduledSessions
    .filter((session: MentorSessionData) => session.status === "ONGOING")
    .sort((a, b) => sortByScheduledTime(a, b, true));

  // Filter sessions for completed
  const completedSessions = scheduledSessions
    .filter((session: MentorSessionData) => session.status === "COMPLETED")
    .sort((a, b) => sortByScheduledTime(a, b, false));

  // Filter sessions for cancelled
  const cancelledSessions = scheduledSessions
    .filter((session: MentorSessionData) => session.status === "CANCELLED")
    .sort((a, b) => sortByScheduledTime(a, b, false));

  const renderSessionCard = (sessionItem: MentorSessionData) => {
    // Defensive programming: Handle null/undefined scheduledTime first
    const scheduledTime = sessionItem.scheduledTime ? new Date(sessionItem.scheduledTime) : null;
    const isValidDate = scheduledTime && !isNaN(scheduledTime.getTime());
    const currentTime = new Date();
    
    const isUpcoming = sessionItem.status === "SCHEDULED";
    const isOngoing = sessionItem.status === "ONGOING";
    const isCompleted = sessionItem.status === "COMPLETED";
    const isCancelled = sessionItem.status === "CANCELLED";
    
    if (isValidDate) {
      console.log(
        "Time Zone:", scheduledTime.toLocaleString("en-US", {
          timeZone: "Asia/Kolkata",
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        scheduledTime
      );
    } else {
      console.log("Invalid or null scheduledTime for session:", sessionItem.id);
    }
    return (
      <Card key={sessionItem.id} className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 bg-gradient-to-br ${getSessionTypeBadgeColor(
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
                    scheduledTime.toLocaleString("en-US", {
                      timeZone: "Asia/Kolkata",
                      day: "2-digit",
                      month: "2-digit",
                      year: "2-digit",
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    }).replace(/(\d{2})\/(\d{2})\/(\d{2}), (.+)/, "$1/$2/$3 $4")
                  ) : (
                    "Date not available"
                  )}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {sessionItem.duration} minutes
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
                  onClick={() => window.open(sessionItem.link, "_blank")}
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
                  onClick={() => window.open(sessionItem.link, "_blank")}
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
                    UpdateSessionStatus("CANCELLED", sessionItem.id);
                    setTimeout(() => {
                      loadMentorSessions();
                    }, 1000);
                    toast.success("Session cancelled");
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

  const renderTabContent = (sessions: MentorSessionData[], emptyMessage: string) => {
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
            {activeTab === "upcoming"
              ? "Schedule your first session from the Schedule tab!"
              : ""}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {sessions.map((sessionItem) => {
          console.log(sessionItem.status);
          return renderSessionCard(sessionItem);
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            My Sessions
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage your {getMentorTypeDisplay(mentorSessionsData.mentorInfo.mentorType).toLowerCase()} sessions and eligible students.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshSessions}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Mentor Info Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">
              {mentorSessionsData.mentorInfo.name || "Mentor"}
            </h3>
            <p className="text-gray-600">
              {getMentorTypeDisplay(mentorSessionsData.mentorInfo.mentorType)} • {scheduledSessions.length} total sessions
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
          {renderTabContent(upcomingSessions, "No upcoming sessions")}
        </TabsContent>

        <TabsContent value="ongoing">
          {renderTabContent(ongoingSessions, "No ongoing sessions")}
        </TabsContent>

        <TabsContent value="completed">
          {renderTabContent(completedSessions, "No completed sessions")}
        </TabsContent>

        <TabsContent value="cancelled">
          {renderTabContent(cancelledSessions, "No cancelled sessions")}
        </TabsContent>
      </Tabs>
    </div>
  );
};

