"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { UpdateSessionStatus } from "@/lib/session";
import { Schedule } from "@prisma/client";

export const SessionsSection = () => {
  const { data: session } = useSession();
  const [scheduledSessions, setScheduledSessions] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("upcoming");

  // Load scheduled sessions from API
  const loadScheduledSessions = async () => {
    if (!session?.user) return;

    setLoading(true);
    try {
      const response = await fetch("/api/mentor/schedule");
      const data = await response.json();

      if (data.success) {
        setScheduledSessions(data.sessions);
      } else {
        console.error("Failed to load sessions:", data.error);
        toast.error("Failed to load scheduled sessions");
      }
    } catch (error) {
      console.error("Error loading sessions:", error);
      toast.error("Failed to load scheduled sessions");
    } finally {
      setLoading(false);
    }
  };

  // Refresh function for manual updates
  const refreshSessions = async () => {
    setRefreshing(true);
    try {
      const response = await fetch("/api/mentor/schedule");
      const data = await response.json();

      if (data.success) {
        setScheduledSessions(data.sessions);
        toast.success("Sessions refreshed successfully");
      } else {
        toast.error("Failed to refresh sessions");
      }
    } catch (error) {
      console.error("Error refreshing sessions:", error);
      toast.error("Failed to refresh sessions");
    } finally {
      setRefreshing(false);
    }
  };

  // Function to handle start session
  const handleStartSession = (sessionItem: Schedule) => {
    UpdateSessionStatus("ONGOING", sessionItem.id);
    //load the session after 1 second to ensure the status is updated
    setTimeout(() => {
      loadScheduledSessions();
    }, 1000);
    toast.success("Session started successfully");
  };

  useEffect(() => {
    loadScheduledSessions();
  }, [session]);

  const getSessionTypeIcon = (type: "YOGA" | "MEDITATION") => {
    return type === "YOGA" ? (
      <Video className="w-8 h-8 text-white" />
    ) : (
      <Calendar className="w-8 h-8 text-white" />
    );
  };

  const getSessionTypeBadgeColor = (type: "YOGA" | "MEDITATION") => {
    return type === "YOGA"
      ? "from-[#76d2fa] to-[#5a9be9]"
      : "from-[#876aff] to-[#9966cc]";
  };

  // Filter sessions for upcoming (scheduled for future and not completed/cancelled)
  const upcomingSessions = scheduledSessions
    .filter(
      (session) =>
        new Date(session.scheduledTime) > new Date() &&
        (!session.status || session.status === "SCHEDULED")
    )
    .sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() -
        new Date(b.scheduledTime).getTime()
    );

  // Filter sessions for ongoing
  const ongoingSessions = scheduledSessions
    .filter((session) => session.status === "ONGOING")
    .sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() -
        new Date(b.scheduledTime).getTime()
    );

  // Filter sessions for completed
  const completedSessions = scheduledSessions
    .filter(
      (session) => {
        if (session.status === "COMPLETED") return true;
        if (session.status === "CANCELLED" || session.status === "ONGOING") return false;
        // If no status or SCHEDULED and time has passed, consider completed
        return new Date(session.scheduledTime) <= new Date() && 
               (!session.status || session.status === "SCHEDULED");
      }
    )
    .sort(
      (a, b) =>
        new Date(b.scheduledTime).getTime() -
        new Date(a.scheduledTime).getTime()
    );

  // Filter sessions for cancelled
  const cancelledSessions = scheduledSessions
    .filter((session) => session.status === "CANCELLED")
    .sort(
      (a, b) =>
        new Date(b.scheduledTime).getTime() -
        new Date(a.scheduledTime).getTime()
    );

  const renderSessionCard = (sessionItem: Schedule) => {
    const isUpcoming = new Date(sessionItem.scheduledTime) > new Date() && 
                      (!sessionItem.status || sessionItem.status === "SCHEDULED");
    const isOngoing = sessionItem.status === "ONGOING";
    const isCompleted = (() => {
      if (sessionItem.status === "COMPLETED") return true;
      if (sessionItem.status === "CANCELLED" || sessionItem.status === "ONGOING") return false;
      // If no status or SCHEDULED and time has passed, consider completed
      return new Date(sessionItem.scheduledTime) <= new Date() && 
             (!sessionItem.status || sessionItem.status === "SCHEDULED");
    })();
    const isCancelled = sessionItem.status === "CANCELLED";

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
                <h3 className="font-semibold text-lg">
                  {sessionItem.title}
                </h3>
                {/* Status Badge */}
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  isOngoing ? 'bg-orange-100 text-orange-800' :
                  isUpcoming ? 'bg-blue-100 text-blue-800' :
                  isCompleted ? 'bg-green-100 text-green-800' :
                  isCancelled ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {isOngoing ? 'ONGOING' :
                   isUpcoming ? 'UPCOMING' :
                   isCompleted ? 'COMPLETED' :
                   isCancelled ? 'CANCELLED' :
                   'SCHEDULED'}
                </span>
              </div>
              <p className="text-gray-500 capitalize">
                {sessionItem.sessionType.toLowerCase()} Session
              </p>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {sessionItem.scheduledTime.toLocaleString("en-US", {
                    weekday: "short",
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {sessionItem.duration} minutes
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Students will join
                </span>
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
                  onClick={() => {
                    UpdateSessionStatus("COMPLETED", sessionItem.id);
                    setTimeout(() => {
                      loadScheduledSessions();
                    }, 1000);
                    toast.success("Session marked as completed");
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  End Session
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    UpdateSessionStatus("CANCELLED", sessionItem.id);
                    setTimeout(() => {
                      loadScheduledSessions();
                    }, 1000);
                    toast.success("Session cancelled");
                  }}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Cancel Session
                </Button>
              </>
            )}
            
            {/* Buttons for completed sessions */}
            {isCompleted && !isOngoing && (
              <Button
                variant="outline"
                onClick={() => window.open(sessionItem.link, "_blank")}
              >
                View Recording
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderTabContent = (sessions: Schedule[], emptyMessage: string) => {
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
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Sessions</h1>
          <p className="text-gray-600 mt-2">
            View and manage your sessions by status.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshSessions}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} >
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
