"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, PlayCircle, ExternalLink, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { SubscriptionPrompt } from "../SubscriptionPrompt";
import { getUserSessions, UserSessionData, UserSessionsResponse } from "@/lib/server/user-sessions-server";
// import { Prisma } from "@prisma/client";

interface SessionData {
  id: string;
  title: string;
  scheduledTime: string;
  duration: number;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELLED";
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

export const ClassesSection = () => {
  const { data: session } = useSession();
  const [sessionsData, setSessionsData] = useState<UserSessionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState("upcoming");

  // Helper function to convert server data to component format
  const formatSessionsData = (serverData: UserSessionsResponse["data"]): UserSessionsData => {
    if (!serverData) {
      throw new Error("Server data is undefined");
    }

    return {
      ...serverData,
      sessions: serverData.sessions.map((session: UserSessionData) => ({
        ...session,
        scheduledTime: (session.scheduledTime as Date).toISOString()
      }))
    };
  };

// Load user sessions using server action
useEffect(() => {
  const loadUserSessions = async () => {
    if (!session?.user) return;
    
    try {
      const result = await getUserSessions();
      
      if (result.success && result.data) {
        setSessionsData(formatSessionsData(result.data));
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
  };
  
  loadUserSessions();
}, [session]);
  
  // Refresh function for manual updates
  const refreshSessions = async () => {
    startTransition(async () => {
      try {
        const result = await getUserSessions();
        
        if (result.success && result.data) {
          setSessionsData(formatSessionsData(result.data));
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


  // Show loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-2">
            Manage your scheduled and completed yoga sessions.
          </p>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-500">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  // Show subscription prompt if user needs subscription
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

  // Filter sessions based on the subscription plan
  const availableSessions = sessionsData?.sessions || [];
  const upcomingSessions = availableSessions.filter(session => 
    session.status === "SCHEDULED" || session.status === "ONGOING"
  );
  const completedSessions = availableSessions.filter(session => 
    session.status === "COMPLETED"
  );
  const cancelledSessions = availableSessions.filter(session => 
    session.status === "CANCELLED"
  );

  const getSessionTypeColor = (type: "YOGA" | "MEDITATION" | "DIET") => {
    if (type === "YOGA") return "from-[#76d2fa] to-[#5a9be9]";
    if (type === "MEDITATION") return "from-[#876aff] to-[#9966cc]";
    return "from-[#4ade80] to-[#22c55e]"; // Green gradient for DIET
  };

  const getMentorTypeDisplay = (mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null) => {
    if (mentorType === "YOGAMENTOR") return "Yoga Mentor";
    if (mentorType === "MEDITATIONMENTOR") return "Meditation Mentor";
    if (mentorType === "DIETPLANNER") return "Diet Planner";
    return "Mentor";
  };

  const renderSessionCard = (sessionItem: SessionData) => {
    const sessionTime = new Date(sessionItem.scheduledTime);
    const isUpcoming = sessionItem.status === "SCHEDULED" || sessionItem.status === "ONGOING";
    const isOngoing = sessionItem.status === "ONGOING";

    return (
      <Card key={sessionItem.id} className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-16 h-16 bg-gradient-to-br ${getSessionTypeColor(sessionItem.sessionType)} rounded-lg flex items-center justify-center`}>
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{sessionItem.title}</h3>
              <p className="text-gray-500">
                with {getMentorTypeDisplay(sessionItem.mentor.mentorType)} {sessionItem.mentor.name || "TBD"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {sessionTime.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short", 
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {sessionItem.duration} minutes
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  sessionItem.sessionType === "YOGA" 
                    ? "bg-blue-100 text-blue-800" 
                    : "bg-purple-100 text-purple-800"
                }`}>
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
                  className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]"
                  onClick={() => {
                    // TODO: Implement reschedule functionality
                    toast.info("Reschedule functionality coming soon!");
                  }}
                >
                  Reschedule
                </Button>
                <Button 
                  className={`${isOngoing ? "bg-[#76d2fa] hover:bg-[#5a9be9]" : "bg-[#876aff] hover:bg-[#7c5cff]"}`}
                  onClick={() => {
                    // TODO: Open session link
                    window.open("#", "_blank");
                    toast.success(`${isOngoing ? "Joining" : "Session will start soon"}`);
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  {isOngoing ? "Join Now" : "Join Class"}
                </Button>
              </>
            )}
            {sessionItem.status === "COMPLETED" && (
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: View recording functionality
                  toast.info("Recording playback coming soon!");
                }}
              >
                <PlayCircle className="w-4 h-4 mr-1" />
                View Recording
              </Button>
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
            {activeTab === "upcoming" 
              ? "New sessions will appear here when available."
              : ""
            }
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-gray-600 mt-2">
            Manage your scheduled and completed {sessionsData?.subscriptionPlan?.toLowerCase()} sessions.
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

      <div className="flex gap-4 border-b">
        <button 
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === "upcoming" 
              ? "border-[#76d2fa] text-[#76d2fa]" 
              : "border-transparent text-gray-500 hover:text-[#876aff]"
          }`}
          onClick={() => setActiveTab("upcoming")}
        >
          Upcoming ({upcomingSessions.length})
        </button>
        <button 
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === "completed" 
              ? "border-[#76d2fa] text-[#76d2fa]" 
              : "border-transparent text-gray-500 hover:text-[#876aff]"
          }`}
          onClick={() => setActiveTab("completed")}
        >
          Completed ({completedSessions.length})
        </button>
        <button 
          className={`pb-2 px-1 border-b-2 font-medium ${
            activeTab === "cancelled" 
              ? "border-[#76d2fa] text-[#76d2fa]" 
              : "border-transparent text-gray-500 hover:text-[#876aff]"
          }`}
          onClick={() => setActiveTab("cancelled")}
        >
          Cancelled ({cancelledSessions.length})
        </button>
      </div>

      <div>
        {activeTab === "upcoming" && renderTabContent(
          upcomingSessions, 
          "No upcoming sessions scheduled"
        )}
        {activeTab === "completed" && renderTabContent(
          completedSessions, 
          "No completed sessions yet"
        )}
        {activeTab === "cancelled" && renderTabContent(
          cancelledSessions, 
          "No cancelled sessions"
        )}
      </div>
    </div>
  );
};

