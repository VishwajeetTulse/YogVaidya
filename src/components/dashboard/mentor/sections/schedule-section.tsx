"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Video, Plus, Trash2, Edit } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Schedule } from "@prisma/client";
import { getMentorType } from "@/lib/mentor-type";

// Form validation schema
const scheduleSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledTime: z.string().min(1, "Please select a date and time"),
  link: z.string().url("Please enter a valid URL"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(180, "Duration cannot exceed 3 hours"),
  sessionType: z.enum(["YOGA", "MEDITATION"], {
    required_error: "Please select a session type",
  }),
});

type ScheduleFormData = z.infer<typeof scheduleSchema>;

export const ScheduleSection = () => {
  const { data: session } = useSession();
  const [scheduledSessions, setScheduledSessions] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSession, setEditingSession] = useState<Schedule | null>(null);
  const [getMentorSessionType, setGetMentorSessionType] = useState<"YOGA" | "MEDITATION">("YOGA");
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      title: "",
      scheduledTime: "",
      link: "",
      duration: 60,
      sessionType: "YOGA", // Will be set asynchronously in useEffect
    },
  });
  // Set the session type based on mentor type when component mounts or when editing
  useEffect(() => {
    const initializeSessionType = async () => {
      const mentorType = await getMentorType(session?.user || { email: "" });
      const sessionType = mentorType === "YOGAMENTOR" ? "YOGA" : "MEDITATION";
      form.setValue("sessionType", sessionType);
      setGetMentorSessionType(sessionType);
    };
    
    initializeSessionType();
    
    // If editing a session, populate the form with existing data
    if (editingSession) {
      form.setValue("title", editingSession.title);
      form.setValue("scheduledTime", new Date(editingSession.scheduledTime).toISOString().slice(0, 16));
      form.setValue("link", editingSession.link);
      form.setValue("duration", editingSession.duration);
      form.setValue("sessionType", editingSession.sessionType);
    }
  }, [session, form, editingSession]);

  // Load scheduled sessions from API
  const loadScheduledSessions = useCallback(async () => {
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
  }, [session?.user]);

  useEffect(() => {
    loadScheduledSessions();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadScheduledSessions, 30000);
    
    return () => clearInterval(interval);
  }, [loadScheduledSessions, session]);

  const onSubmit = async (data: ScheduleFormData) => {
    setSubmitting(true);
    try {
      const url = editingSession 
        ? `/api/mentor/schedule?sessionId=${editingSession.id}`
        : '/api/mentor/schedule';
      
      const method = editingSession ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        if (editingSession) {
          // Update existing session in local state
          setScheduledSessions(prev => 
            prev.map(session => 
              session.id === editingSession.id 
                ? { ...session, ...data, scheduledTime: new Date(data.scheduledTime) }
                : session
            )
          );
          toast.success("Session updated successfully!");
          setEditingSession(null);
        } else {
          // Add the new session to the local state
          setScheduledSessions(prev => [...prev, result.session]);
          toast.success("Session scheduled successfully!");
        }
        
        form.reset({
          title: "",
          scheduledTime: "",
          link: "",
          duration: 60,
          sessionType: getMentorSessionType,
        });
        
        // Refresh the sessions list to ensure data consistency
        loadScheduledSessions();
      } else {
        toast.error(result.error || `Failed to ${editingSession ? 'update' : 'schedule'} session`);
      }
    } catch (error) {
      console.error(`Error ${editingSession ? 'updating' : 'scheduling'} session:`, error);
      toast.error(`Failed to ${editingSession ? 'update' : 'schedule'} session. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingSession(null);
    form.reset({
      title: "",
      scheduledTime: "",
      link: "",
      duration: 60,
      sessionType: getMentorSessionType,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule</h1>
        <p className="text-gray-600 mt-2">
          Manage your availability and upcoming sessions.
        </p>
      </div>

      {/* Schedule New Session Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingSession ? "Edit Session" : "Schedule New Session"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Morning Yoga Flow" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sessionType"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Type</FormLabel>
                      <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={true} // Auto-filled based on mentor type
                      >
                      <FormControl>
                        <SelectTrigger className="bg-gray-100 cursor-not-allowed">
                        <SelectValue placeholder="Auto-filled based on mentor type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="YOGA">
                        <div className="flex items-center gap-2">
                          <Video className="h-4 w-4" />
                          Yoga
                        </div>
                        </SelectItem>
                        <SelectItem value="MEDITATION">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Meditation
                        </div>
                        </SelectItem>
                      </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scheduledTime"
                    render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          min={new Date().toLocaleString().slice(0, 16)}
                          className="w-fit"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        value={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select duration" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="45">45 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                          <SelectItem value="180">3 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Link</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://zoom.us/j/1234567890 or https://meet.google.com/abc-def-ghi"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                  {submitting ? (editingSession ? "Updating..." : "Scheduling...") : (editingSession ? "Update Session" : "Schedule Session")}
                </Button>
                {editingSession && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={cancelEdit}
                    className="w-full md:w-auto"
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Scheduled Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Sessions ({scheduledSessions.filter(s => s.status === "SCHEDULED").length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : scheduledSessions.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No scheduled sessions</p>
              <p className="text-gray-400">
                Schedule your first session using the form above!
              </p>
            </div>
          ) : ( 
            <div className="space-y-4">
              {scheduledSessions
                .sort((a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime())
                .filter((session) => {
                  // Filter out sessions that are in the past
                  return session.status === "SCHEDULED"
                })
                .map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                      session.sessionType === "YOGA" 
                        ? "bg-gradient-to-br from-[#76d2fa] to-[#5a9be9]"
                        : "bg-gradient-to-br from-[#876aff] to-[#9966cc]"
                    }`}>
                      {session.sessionType === "YOGA" ? (
                        <Video className="w-6 h-6 text-white" />
                      ) : (
                        <Calendar className="w-6 h-6 text-white" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold">{session.title}</h4>
                      <p className="text-sm text-gray-500 capitalize">
                        {session.sessionType.toLowerCase()} Session
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(session.scheduledTime).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(session.scheduledTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        <span>{session.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingSession(session)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (confirm('Are you sure you want to delete this session?')) {
                          try {
                            const response = await fetch('/api/mentor/schedule', {
                              method: 'DELETE',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({ sessionId: session.id }),
                            });
                            
                            const result = await response.json();
                            if (result.success) {
                              setScheduledSessions(prev => 
                                prev.filter(s => s.id !== session.id)
                              );
                              toast.success('Session deleted successfully');
                              // Refresh the sessions list to ensure data consistency
                              loadScheduledSessions();
                            } else {
                              toast.error('Failed to delete session');
                            }
                          } catch (error) {
                            console.error('Error deleting session:', error);
                            toast.error('Failed to delete session');
                          }
                        }
                      }}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

