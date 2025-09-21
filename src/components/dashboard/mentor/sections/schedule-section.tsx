"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Video, Plus, Trash2, Edit, Users, User, RefreshCw, Crown, Star, Sparkles } from "lucide-react";
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
import { SessionType } from "@prisma/client";
import { getMentorType } from "@/lib/mentor-type";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Form validation schema for time slots
const timeSlotSchema = z.object({
  startDate: z.string().min(1, "Please select a start date"),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  sessionType: z.nativeEnum(SessionType, {
    required_error: "Session type is required",
    invalid_type_error: "Please select a valid session type",
  }),
  maxStudents: z.enum(["one"], {
    required_error: "Please select session type - individual session only",
  }),
  isRecurring: z.boolean(),
  recurringDays: z.array(z.string()),
  sessionLink: z.string().url("Please enter a valid session link").min(1, "Session link is required"),
  notes: z.string(),
});

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

// Form validation schema for subscription sessions
const subscriptionSessionSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  scheduledDate: z.string().min(1, "Please select a date"),
  scheduledTime: z.string().min(1, "Please select a time"),
  duration: z.number().min(15, "Duration must be at least 15 minutes").max(180, "Duration cannot exceed 3 hours"),
  sessionType: z.nativeEnum(SessionType, {
    required_error: "Session type is required",
    invalid_type_error: "Please select a valid session type",
  }),
  sessionLink: z.string().url("Please enter a valid session link").min(1, "Session link is required"),
  notes: z.string().optional(),
});

type SubscriptionSessionFormData = z.infer<typeof subscriptionSessionSchema>;

interface TimeSlot {
  _id: string;
  mentorId: string;
  startTime: string;
  endTime: string;
  sessionType: string;
  maxStudents: number;
  currentStudents: number;
  isBooked: boolean;
  bookedBy: string | null;
  sessionLink?: string;
  notes: string;
  isActive: boolean;
  isRecurring: boolean;
  recurringDays: string[];
  createdAt: string;
  updatedAt: string;
}

interface SubscriptionSession {
  id: string;
  title: string;
  scheduledTime: string;
  sessionType: string;
  duration: number;
  link: string;
  status: string;
  totalBookings: number;
  planCounts: {
    SEED: number;
    BLOOM: number;
    FLOURISH: number;
  };
  bookings: Array<{
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    subscriptionPlan: string;
    status: string;
    paymentStatus: string;
  }>;
}

const WEEKDAYS = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

export const ScheduleSection = () => {
  const { data: session } = useSession();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [subscriptionSessions, setSubscriptionSessions] = useState<SubscriptionSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [subscriptionSubmitting, setSubscriptionSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [mentorSessionType, setMentorSessionType] = useState<SessionType>("YOGA");
  const [mentorType, setMentorType] = useState<string | null>(null);
  const [showAllSlots, setShowAllSlots] = useState(false);
  const [activeTab, setActiveTab] = useState("individual");
  
  const form = useForm<TimeSlotFormData>({
    resolver: zodResolver(timeSlotSchema),
    defaultValues: {
      startDate: "",
      startTime: "",
      endTime: "",
      sessionType: "YOGA" as SessionType,
      maxStudents: "one",
      isRecurring: false,
      recurringDays: [],
      sessionLink: "",
      notes: "",
    },
  });

  const subscriptionForm = useForm<SubscriptionSessionFormData>({
    resolver: zodResolver(subscriptionSessionSchema),
    defaultValues: {
      title: "",
      scheduledDate: "",
      scheduledTime: "",
      duration: 60,
      sessionType: "YOGA" as SessionType,
      sessionLink: "",
      notes: "",
    },
  });

  // Set the session type based on mentor type when component mounts
  useEffect(() => {
    const initializeSessionType = async () => {
      const fetchedMentorType = await getMentorType(session?.user || { email: "" });
      const sessionType = fetchedMentorType === "YOGAMENTOR" ? "YOGA" : fetchedMentorType === "DIETPLANNER" ? "DIET" : "MEDITATION";
      setMentorType(fetchedMentorType);
      form.setValue("sessionType", sessionType as SessionType);
      subscriptionForm.setValue("sessionType", sessionType as SessionType);
      setMentorSessionType(sessionType as SessionType);
      
      // Ensure DIET mentors can only access individual tab
      if (fetchedMentorType === "DIETPLANNER" && activeTab === "subscription") {
        setActiveTab("individual");
      }
    };
    
    initializeSessionType();
    
    // If editing a slot, populate the form with existing data
    if (editingSlot) {
      const startTime = new Date(editingSlot.startTime);
      const endTime = new Date(editingSlot.endTime);
      
      form.setValue("startDate", startTime.toISOString().split('T')[0]);
      form.setValue("startTime", startTime.toTimeString().slice(0, 5));
      form.setValue("endTime", endTime.toTimeString().slice(0, 5));
      form.setValue("sessionType", editingSlot.sessionType as SessionType);
      form.setValue("maxStudents", "one");
      form.setValue("isRecurring", editingSlot.isRecurring);
      form.setValue("recurringDays", editingSlot.recurringDays);
      form.setValue("sessionLink", editingSlot.sessionLink || "");
      form.setValue("notes", editingSlot.notes);
    }
  }, [session, form, editingSlot]);

  // Load time slots from API
  const loadTimeSlots = useCallback(async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/mentor/timeslots?mentorId=${session.user.id}`);
      const data = await response.json();
      
      if (data.success) {
        setTimeSlots(data.data);
      } else {
        console.error('Failed to load time slots:', data.error);
        toast.error('Failed to load time slots');
      }
    } catch (error) {
      console.error('Error loading time slots:', error);
      toast.error('Failed to load time slots');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Load subscription sessions from API
  const loadSubscriptionSessions = useCallback(async () => {
    if (!session?.user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/mentor/subscription-sessions');
      const data = await response.json();
      
      if (data.success) {
        setSubscriptionSessions(data.data);
      } else {
        console.error('Failed to load subscription sessions:', data.error);
        toast.error('Failed to load subscription sessions');
      }
    } catch (error) {
      console.error('Error loading subscription sessions:', error);
      toast.error('Failed to load subscription sessions');
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTimeSlots();
      await loadSubscriptionSessions();
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    console.log('🎯 Mentor dashboard: Loading data...', {
      hasSession: !!session?.user,
      userId: session?.user?.id
    });
    loadTimeSlots();
    loadSubscriptionSessions();
  }, [loadTimeSlots, loadSubscriptionSessions, session]);

  const onSubmit = async (data: TimeSlotFormData) => {
    setSubmitting(true);
    try {
      // Combine date and time to create full datetime strings
      const startDateTime = new Date(`${data.startDate}T${data.startTime}`);
      const endDateTime = new Date(`${data.startDate}T${data.endTime}`);
      
      // Validate end time is after start time
      if (endDateTime <= startDateTime) {
        toast.error("End time must be after start time");
        return;
      }

      // Prepare the payload with combined datetime
      const payload = {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        sessionType: data.sessionType,
        maxStudents: 1, // Individual sessions only
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays,
        sessionLink: data.sessionLink,
        notes: data.notes,
      };

      const url = editingSlot 
        ? `/api/mentor/timeslots/${editingSlot._id}`
        : '/api/mentor/timeslots';
      
      const method = editingSlot ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        if (editingSlot) {
          toast.success("Time slot updated successfully!");
          setEditingSlot(null);
        } else {
          toast.success("Time slot created successfully!");
        }
        
        form.reset({
          startDate: "",
          startTime: "",
          endTime: "",
          sessionType: mentorSessionType,
          maxStudents: "one",
          isRecurring: false,
          recurringDays: [],
          sessionLink: "",
          notes: "",
        });
        
        // Refresh the time slots list
        loadTimeSlots();
      } else {
        toast.error(result.error || `Failed to ${editingSlot ? 'update' : 'create'} time slot`);
      }
    } catch (error) {
      console.error(`Error ${editingSlot ? 'updating' : 'creating'} time slot:`, error);
      toast.error(`Failed to ${editingSlot ? 'update' : 'create'} time slot. Please try again.`);
    } finally {
      setSubmitting(false);
    }
  };

  const onSubscriptionSubmit = async (data: SubscriptionSessionFormData) => {
    setSubscriptionSubmitting(true);
    try {
      // Combine date and time to create full datetime string
      const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
      
      // Validate the scheduled time is in the future
      if (scheduledDateTime <= new Date()) {
        toast.error("Scheduled time must be in the future");
        return;
      }

      // Prepare the payload
      const payload = {
        title: data.title,
        scheduledTime: scheduledDateTime.toISOString(),
        link: data.sessionLink,
        duration: data.duration,
        sessionType: data.sessionType,
        notes: data.notes || "",
      };

      const response = await fetch('/api/mentor/subscription-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(`Subscription session created! Scheduled for ${result.data.eligibleUsers} users`);
        
        // Reset form
        subscriptionForm.reset({
          title: "",
          scheduledDate: "",
          scheduledTime: "",
          duration: 60,
          sessionType: mentorSessionType,
          sessionLink: "",
          notes: "",
        });
        
        // Refresh the subscription sessions list
        loadSubscriptionSessions();

        // Show success details
        const { summary } = result.data;
        let message = `Session created for ${summary.totalBookings} users`;
        if (summary.byPlan.SEED > 0) message += ` • ${summary.byPlan.SEED} SEED`;
        if (summary.byPlan.BLOOM > 0) message += ` • ${summary.byPlan.BLOOM} BLOOM`;
        if (summary.byPlan.FLOURISH > 0) message += ` • ${summary.byPlan.FLOURISH} FLOURISH`;
        
        toast.success(message);
      } else {
        toast.error(result.error || 'Failed to create subscription session');
      }
    } catch (error) {
      console.error('Error creating subscription session:', error);
      toast.error('Failed to create subscription session. Please try again.');
    } finally {
      setSubscriptionSubmitting(false);
    }
  };

  const cancelEdit = () => {
    setEditingSlot(null);
    form.reset({
      startDate: "",
      startTime: "",
      endTime: "",
      sessionType: mentorSessionType,
      maxStudents: "one",
      isRecurring: false,
      recurringDays: [],
      sessionLink: "",
      notes: "",
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Schedule & Sessions</h1>
        <p className="text-gray-600 mt-2">
          Create individual time slots or schedule sessions for all subscription users.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className={`grid w-full ${mentorType === "DIETPLANNER" ? "grid-cols-1" : "grid-cols-2"}`}>
          <TabsTrigger value="individual" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Individual Time Slots
          </TabsTrigger>
          {mentorType !== "DIETPLANNER" && (
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Subscription Sessions
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          {/* Create Time Slot Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {editingSlot ? "Edit Time Slot" : "Create Available Time Slot"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input
                          type="time"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="sessionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Type *</FormLabel>
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
                          <SelectItem value="DIET">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Diet Planning
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
                  name="maxStudents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Format</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Individual session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              One Student (Individual Session)
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sessionLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Link *</FormLabel>
                    <FormControl>
                      <Input
                        type="url"
                        placeholder="e.g., Zoom meeting link, Google Meet, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Beginner-friendly, Bring your own mat, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isRecurring"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Recurring Time Slot
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Create this time slot for multiple days of the week
                      </p>
                    </div>
                  </FormItem>
                )}
              />

              {form.watch("isRecurring") && (
                <FormField
                  control={form.control}
                  name="recurringDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurring Days</FormLabel>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {WEEKDAYS.map((day) => (
                          <div key={day.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={day.value}
                              checked={field.value?.includes(day.value)}
                              onCheckedChange={(checked) => {
                                const updatedDays = checked
                                  ? [...(field.value || []), day.value]
                                  : (field.value || []).filter((d) => d !== day.value);
                                field.onChange(updatedDays);
                              }}
                            />
                            <label
                              htmlFor={day.value}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {day.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                  {submitting ? (editingSlot ? "Updating..." : "Creating...") : (editingSlot ? "Update Time Slot" : "Create Time Slot")}
                </Button>
                {editingSlot && (
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

      {/* Available Time Slots List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Your Available Time Slots ({timeSlots.filter(slot => slot.isActive).length})
              {timeSlots.filter(slot => slot.isActive).length > 3 && !showAllSlots && (
                <span className="text-sm font-normal text-gray-500">- Showing Recent 3</span>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="h-8 px-2 sm:px-3"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline ml-1">
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </span>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading time slots...</p>
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">No time slots created</p>
              <p className="text-gray-400">
                Create your first available time slot using the form above!
              </p>
            </div>
          ) : ( 
            <div className="space-y-4">
              {timeSlots
                .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                .filter((slot) => slot.isActive)
                .slice(0, showAllSlots ? undefined : 3) // Show only 3 recent available slots unless showAllSlots is true
                .map((slot) => {
                  const startTime = new Date(slot.startTime);
                  const endTime = new Date(slot.endTime);
                  const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)); // minutes
                  const isUpcoming = startTime > new Date();
                  const isPast = endTime < new Date();
                  
                  return (
                    <div
                      key={slot._id}
                      className={`flex items-center justify-between p-4 border rounded-lg ${
                        isPast ? 'bg-gray-50 opacity-75' : 
                        slot.isBooked ? 'bg-green-50 border-green-200' : 
                        'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          slot.sessionType === "YOGA" 
                            ? "bg-gradient-to-br from-[#76d2fa] to-[#5a9be9]"
                            : slot.sessionType === "MEDITATION"
                            ? "bg-gradient-to-br from-[#876aff] to-[#9966cc]"
                            : "bg-gradient-to-br from-[#22c55e] to-[#16a34a]"
                        }`}>
                          {slot.sessionType === "YOGA" ? (
                            <Video className="w-6 h-6 text-white" />
                          ) : slot.sessionType === "MEDITATION" ? (
                            <Calendar className="w-6 h-6 text-white" />
                          ) : (
                            <Clock className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold capitalize">
                              {slot.sessionType.toLowerCase()} Session
                            </h4>
                            {slot.isBooked ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <User className="w-3 h-3 mr-1" />
                                Booked
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-blue-600 border-blue-200">
                                Available
                              </Badge>
                            )}
                            {slot.isRecurring && (
                              <Badge variant="outline" className="text-purple-600 border-purple-200">
                                Recurring
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {startTime.toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {startTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })} - {endTime.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {slot.maxStudents === 1 ? 'Individual' : 'Group'} ({slot.currentStudents}/{slot.maxStudents === 1 ? '1' : slot.maxStudents} students)
                            </span>
                            {slot.sessionLink && (
                              <span className="flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                                <a 
                                  href={slot.sessionLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 text-xs underline"
                                >
                                  Session Link
                                </a>
                              </span>
                            )}
                          </div>
                          
                          {slot.notes && (
                            <p className="text-xs text-gray-600 mt-1 italic">
                              {slot.notes}
                            </p>
                          )}
                          
                          {slot.isRecurring && (
                            <p className="text-xs text-purple-600 mt-1">
                              Repeats on: {slot.recurringDays.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!isPast && !slot.isBooked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingSlot(slot)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {!slot.isBooked && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this time slot?')) {
                                try {
                                  const response = await fetch(`/api/mentor/timeslots/${slot._id}`, {
                                    method: 'DELETE',
                                  });
                                  
                                  const result = await response.json();
                                  if (result.success) {
                                    setTimeSlots(prev => 
                                      prev.filter(s => s._id !== slot._id)
                                    );
                                    toast.success('Time slot deleted successfully');
                                    loadTimeSlots();
                                  } else {
                                    toast.error('Failed to delete time slot');
                                  }
                                } catch (error) {
                                  console.error('Error deleting time slot:', error);
                                  toast.error('Failed to delete time slot');
                                }
                              }
                            }}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              
              {/* Show "View All" / "Show Less" button if there are more than 3 active slots */}
              {timeSlots.filter(slot => slot.isActive).length > 3 && (
                <div className="mt-4 pt-4 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-2">
                    {showAllSlots 
                      ? `Showing all ${timeSlots.filter(slot => slot.isActive).length} available time slots`
                      : `Showing 3 of ${timeSlots.filter(slot => slot.isActive).length} available time slots`
                    }
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAllSlots(!showAllSlots)}
                    className="text-[#876aff] border-[#876aff] hover:bg-[#876aff] hover:text-white"
                  >
                    {showAllSlots ? 'Show Less' : 'View All Time Slots'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>

        {mentorType !== "DIETPLANNER" && (
          <TabsContent value="subscription" className="space-y-6">
          {/* Create Subscription Session Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Schedule Session for Subscription Users
              </CardTitle>
              <p className="text-sm text-gray-600 mt-2">
                Create a session that will be automatically scheduled for all active users with matching subscription plans:
              </p>
              <div className="flex gap-4 mt-3">
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">SEED</span>
                  <span className="text-xs text-blue-600">→ Meditation</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg border border-green-200">
                  <Star className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-700">BLOOM</span>
                  <span className="text-xs text-green-600">→ Yoga</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-purple-50 rounded-lg border border-purple-200">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-700">FLOURISH</span>
                  <span className="text-xs text-purple-600">→ Both</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...subscriptionForm}>
                <form onSubmit={subscriptionForm.handleSubmit(onSubscriptionSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={subscriptionForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Title *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., Morning Yoga Flow"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subscriptionForm.control}
                      name="sessionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Type *</FormLabel>
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={subscriptionForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Date *</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subscriptionForm.control}
                      name="scheduledTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Time *</FormLabel>
                          <FormControl>
                            <Input
                              type="time"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={subscriptionForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (minutes) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="15"
                              max="180"
                              {...field}
                              value={field.value?.toString() || ''}
                              onChange={(e) => {
                                const value = parseInt(e.target.value);
                                field.onChange(isNaN(value) ? undefined : value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={subscriptionForm.control}
                    name="sessionLink"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Session Link *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://zoom.us/j/your-meeting-link"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={subscriptionForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes about the session..."
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button type="submit" disabled={subscriptionSubmitting} className="w-full md:w-auto">
                      {subscriptionSubmitting ? "Creating Session..." : "Schedule for All Subscribers"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Subscription Sessions List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Subscription Sessions ({subscriptionSessions.length})
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManualRefresh}
                  disabled={refreshing}
                  className="h-8 px-2 sm:px-3"
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline ml-1">
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                  </span>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">Loading subscription sessions...</p>
                </div>
              ) : subscriptionSessions.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg mb-2">No subscription sessions created</p>
                  <p className="text-gray-400">
                    Create your first subscription session using the form above!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {subscriptionSessions
                    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime())
                    .map((session) => (
                      <div key={session.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-900">{session.title}</h3>
                              <Badge className={`${
                                session.sessionType === 'YOGA' 
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-purple-100 text-purple-800'
                              }`}>
                                {session.sessionType}
                              </Badge>
                              <Badge className={`${
                                session.status === 'SCHEDULED' 
                                  ? 'bg-green-100 text-green-800'
                                  : session.status === 'COMPLETED'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {session.status}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(session.scheduledTime).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })} at {new Date(session.scheduledTime).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Video className="w-3 h-3" />
                                  Duration: {session.duration} minutes
                                </div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  Total Users: {session.totalBookings}
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                  {session.planCounts.SEED > 0 && (
                                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                      {session.planCounts.SEED} SEED
                                    </span>
                                  )}
                                  {session.planCounts.BLOOM > 0 && (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                                      {session.planCounts.BLOOM} BLOOM
                                    </span>
                                  )}
                                  {session.planCounts.FLOURISH > 0 && (
                                    <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                      {session.planCounts.FLOURISH} FLOURISH
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

