"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Calendar, Clock, Video, Plus, Trash2, Edit, Users, User, RefreshCw } from "lucide-react";
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

// Form validation schema for time slots
const timeSlotSchema = z.object({
  startDate: z.string().min(1, "Please select a start date"),
  startTime: z.string().min(1, "Please select a start time"),
  endTime: z.string().min(1, "Please select an end time"),
  sessionType: z.nativeEnum(SessionType, {
    required_error: "Session type is required",
    invalid_type_error: "Please select a valid session type",
  }),
  maxStudents: z.enum(["one", "all"], {
    required_error: "Please select session type - one student or all students",
  }),
  isRecurring: z.boolean(),
  recurringDays: z.array(z.string()),
  sessionLink: z.string().url("Please enter a valid session link").min(1, "Session link is required"),
  notes: z.string(),
});

type TimeSlotFormData = z.infer<typeof timeSlotSchema>;

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
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimeSlot | null>(null);
  const [mentorSessionType, setMentorSessionType] = useState<SessionType>("YOGA");
  const [showAllSlots, setShowAllSlots] = useState(false);
  
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

  // Set the session type based on mentor type when component mounts
  useEffect(() => {
    const initializeSessionType = async () => {
      const mentorType = await getMentorType(session?.user || { email: "" });
      const sessionType = mentorType === "YOGAMENTOR" ? "YOGA" : mentorType === "DIETPLANNER" ? "DIET" : "MEDITATION";
      form.setValue("sessionType", sessionType as SessionType);
      setMentorSessionType(sessionType as SessionType);
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
      form.setValue("maxStudents", editingSlot.maxStudents === 1 ? "one" : "all");
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

  // Manual refresh function
  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTimeSlots();
      toast.success('Time slots refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh time slots');
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
  }, [loadTimeSlots, session]);

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
        maxStudents: data.maxStudents === "one" ? 1 : 50, // Convert "one" to 1, "all" to high number
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
        <h1 className="text-3xl font-bold text-gray-900">Schedule & Time Slots</h1>
        <p className="text-gray-600 mt-2">
          Create available time slots for students to book one-on-one sessions.
        </p>
      </div>

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
                      <FormLabel>Session Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="one">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              One Student (Individual Session)
                            </div>
                          </SelectItem>
                          <SelectItem value="all">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              All Students (Group Session)
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
                .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
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
    </div>
  );
};

