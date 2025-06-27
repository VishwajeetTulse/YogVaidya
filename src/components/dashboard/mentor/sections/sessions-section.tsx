"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, Calendar, Clock, Users, ExternalLink, RefreshCw } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";

interface ScheduledSession {
  id: string;
  title: string;
  scheduledTime: string;
  link: string;
  duration: number;
  sessionType: "YOGA" | "MEDITATION";
  createdAt: string;
}

export const SessionsSection = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"upcoming" | "completed" | "cancelled">("upcoming");
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Load scheduled sessions from API
  const loadScheduledSessions = async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/mentor/schedule');
      const data = await response.json();
      
      if (data.success) {
        setScheduledSessions(data.sessions);
      } else {
        console.error('Failed to load sessions:', data.error);
        toast.error('Failed to load scheduled sessions');
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
      toast.error('Failed to load scheduled sessions');
    } finally {
      setLoading(false);
    }
  };

  // Refresh function for manual updates
  const refreshSessions = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/mentor/schedule');
      const data = await response.json();
      
      if (data.success) {
        setScheduledSessions(data.sessions);
        toast.success('Sessions refreshed successfully');
      } else {
        toast.error('Failed to refresh sessions');
      }
    } catch (error) {
      console.error('Error refreshing sessions:', error);
      toast.error('Failed to refresh sessions');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadScheduledSessions();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadScheduledSessions, 30000);
    
    return () => clearInterval(interval);
  }, [session]);

  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSessionTypeIcon = (type: "YOGA" | "MEDITATION") => {
    return type === "YOGA" ? <Video className="w-8 h-8 text-white" /> : <Calendar className="w-8 h-8 text-white" />;
  };

  const getSessionTypeBadgeColor = (type: "YOGA" | "MEDITATION") => {
    return type === "YOGA" ? "from-[#76d2fa] to-[#5a9be9]" : "from-[#876aff] to-[#9966cc]";
  };

  // Filter sessions for upcoming (scheduled for future)
  const upcomingSessions = scheduledSessions.filter(session => 
    new Date(session.scheduledTime) > new Date()
  ).sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime());

  // Filter sessions for completed (past sessions)
  const completedSessions = scheduledSessions.filter(session => 
    new Date(session.scheduledTime) <= new Date()
  ).sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());

  const getCurrentSessions = () => {
    switch (activeTab) {
      case "upcoming":
        return upcomingSessions;
      case "completed":
        return completedSessions;
      case "cancelled":
        return []; // For now, no cancelled sessions tracking
      default:
        return upcomingSessions;
    }
  };

  const currentSessions = getCurrentSessions();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600 mt-2">
            Manage your upcoming and completed sessions.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshSessions}
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
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
          Cancelled (0)
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Loading sessions...</p>
        </div>
      ) : currentSessions.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">
            No {activeTab} sessions
          </p>
          <p className="text-gray-400">
            {activeTab === "upcoming" 
              ? "Schedule your first session from the Schedule tab!"
              : `No ${activeTab} sessions found.`
            }
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {currentSessions.map((sessionItem) => (
            <Card key={sessionItem.id} className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 bg-gradient-to-br ${getSessionTypeBadgeColor(sessionItem.sessionType)} rounded-lg flex items-center justify-center`}>
                    {getSessionTypeIcon(sessionItem.sessionType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">
                      {sessionItem.title}
                    </h3>
                    <p className="text-gray-500 capitalize">
                      {sessionItem.sessionType.toLowerCase()} Session
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDateTime(sessionItem.scheduledTime)}
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
                  {activeTab === "upcoming" && (
                    <>
                      <Button 
                        variant="outline" 
                        className="border-[#FFCCEA] text-[#ff7dac] hover:bg-[#FFCCEA]"
                        onClick={() => window.open(sessionItem.link, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Join Link
                      </Button>
                      <Button className="bg-[#76d2fa] hover:bg-[#5a9be9]">
                        Start Session
                      </Button>
                    </>
                  )}
                  {activeTab === "completed" && (
                    <Button 
                      variant="outline"
                      onClick={() => window.open(sessionItem.link, '_blank')}
                    >
                      View Recording
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
