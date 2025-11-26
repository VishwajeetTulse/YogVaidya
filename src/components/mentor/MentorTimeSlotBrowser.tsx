"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Calendar, Clock, IndianRupee, ArrowLeft, BookOpen } from "lucide-react";
import type { DateValue } from "@/lib/types/utils";
import { isMongoDate } from "@/lib/types/mongodb";

interface TimeSlot {
  _id: string;
  startTime: string | { $date: string }; // Support both formats
  endTime: string | { $date: string }; // Support both formats
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  maxStudents: number;
  currentStudents: number;
  isBooked: boolean;
  price: number;
  notes: string;
  mentor: {
    id: string;
    name: string;
    email: string;
    mentorType: string;
    image?: string;
  };
}

interface MentorData {
  id: string;
  name: string;
  email: string;
  image?: string;
  sessionPrice: number;
  mentorType: string;
  experience?: number;
  certifications?: string;
  expertise?: string;
}

export default function MentorTimeSlotBrowser({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [mentorData, setMentorData] = useState<MentorData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingMentor, setLoadingMentor] = useState(true);

  // Fetch mentor data
  useEffect(() => {
    const fetchMentorData = async () => {
      try {
        const response = await fetch(`/api/mentor/${mentorId}`);
        const result = await response.json();

        if (result.success) {
          setMentorData(result.data);
        } else {
          toast.error("Failed to load mentor data");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Error fetching mentor:", error);
        toast.error("Error loading mentor data");
        router.push("/dashboard");
      } finally {
        setLoadingMentor(false);
      }
    };

    fetchMentorData();
  }, [mentorId, router]);

  // Fetch available time slots for this mentor
  const fetchTimeSlots = useCallback(async () => {
    try {
      setLoading(true);

      const response = await fetch(`/api/mentor/timeslots?mentorId=${mentorId}&available=true`);
      const result = await response.json();

      if (result.success) {
        setTimeSlots(result.data);
      } else {
        toast.error("Failed to fetch available sessions");
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Failed to fetch available sessions");
    } finally {
      setLoading(false);
    }
  }, [mentorId]);

  // Book a time slot
  const bookTimeSlot = (timeSlotId: string) => {
    router.push(`/timeslot-checkout?timeSlotId=${timeSlotId}&mentorId=${mentorId}`);
  };

  // Format date and time with robust date handling
  const formatDateTime = (dateTime: DateValue): { date: string; time: string } => {
    let date: Date;

    // Handle different date formats
    if (isMongoDate(dateTime)) {
      // MongoDB Extended JSON format
      date = new Date(dateTime.$date);
    } else if (typeof dateTime === "string") {
      // ISO string format
      date = new Date(dateTime);
    } else if (dateTime instanceof Date) {
      date = dateTime;
    } else if (typeof dateTime === "number") {
      date = new Date(dateTime);
    } else {
      // Fallback to current date if invalid
      console.warn("Invalid date format received:", dateTime);
      date = new Date();
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn("Invalid date created from:", dateTime);
      date = new Date(); // Fallback to current date
    }

    return {
      date: date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  };

  // Get session type color
  const getSessionTypeColor = (type: string) => {
    switch (type) {
      case "YOGA":
        return "bg-violet-50 text-violet-700 border-violet-200";
      case "MEDITATION":
        return "bg-sky-50 text-sky-700 border-sky-200";
      case "DIET":
        return "bg-pink-50 text-pink-700 border-pink-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  const getMentorColor = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes("yoga"))
      return {
        bg: "bg-violet-50",
        text: "text-violet-700",
        border: "border-violet-200",
        accent: "bg-violet-600",
        lightBg: "bg-violet-50/50",
        button: "hover:bg-violet-700",
      };
    if (lowerType.includes("meditation"))
      return {
        bg: "bg-sky-50",
        text: "text-sky-700",
        border: "border-sky-200",
        accent: "bg-sky-600",
        lightBg: "bg-sky-50/50",
        button: "hover:bg-sky-700",
      };
    if (lowerType.includes("diet") || lowerType.includes("nutrition"))
      return {
        bg: "bg-pink-50",
        text: "text-pink-700",
        border: "border-pink-200",
        accent: "bg-pink-600",
        lightBg: "bg-pink-50/50",
        button: "hover:bg-pink-700",
      };
    return {
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      accent: "bg-slate-600",
      lightBg: "bg-slate-50/50",
      button: "hover:bg-slate-700",
    };
  };

  const mentorColor = mentorData ? getMentorColor(mentorData.mentorType) : getMentorColor("");

  // Get duration with robust date handling
  const getDuration = (startTime: DateValue, endTime: DateValue): string => {
    let start: Date, end: Date;

    // Handle MongoDB Extended JSON format
    if (isMongoDate(startTime)) {
      start = new Date(startTime.$date);
    } else if (typeof startTime === "string") {
      start = new Date(startTime);
    } else if (startTime instanceof Date) {
      start = startTime;
    } else if (typeof startTime === "number") {
      start = new Date(startTime);
    } else {
      start = new Date();
    }

    if (isMongoDate(endTime)) {
      end = new Date(endTime.$date);
    } else if (typeof endTime === "string") {
      end = new Date(endTime);
    } else if (endTime instanceof Date) {
      end = endTime;
    } else if (typeof endTime === "number") {
      end = new Date(endTime);
    } else {
      end = new Date();
    }

    // Validate dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn("Invalid dates for duration calculation:", { startTime, endTime });
      return "60 min"; // Default duration
    }

    const diff = end.getTime() - start.getTime();
    const minutes = Math.round(diff / (1000 * 60));
    return `${minutes} min`;
  };

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  if (loadingMentor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mentor information...</p>
        </div>
      </div>
    );
  }

  if (!mentorData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Mentor not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="mb-4 hover:bg-primary/5 hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Mentor Info */}
        <Card className={`mb-8 border-2 ${mentorColor.border} shadow-lg shadow-primary/5`}>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-24 h-24 ring-4 ring-background shadow-md">
                <AvatarImage src={mentorData.image} />
                <AvatarFallback className={`text-2xl ${mentorColor.lightBg} ${mentorColor.text}`}>
                  {mentorData.name?.charAt(0) || "M"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">{mentorData.name}</h1>
                <p className={`font-medium ${mentorColor.text} capitalize mb-3`}>
                  {mentorData.mentorType?.toLowerCase().replace("mentor", " Mentor")}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />₹{mentorData.sessionPrice} per session
                  </span>
                  {mentorData.experience && <span>{mentorData.experience}+ years experience</span>}
                </div>
                {mentorData.expertise && (
                  <p className="text-sm text-muted-foreground mt-2">
                    <strong>Specialization:</strong> {mentorData.expertise}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Sessions */}
        <Card className="border-2">
          <CardHeader className="bg-muted/30">
            <CardTitle className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              Available Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading available sessions...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No sessions available
                </p>
                <p className="text-muted-foreground">
                  This mentor hasn&apos;t scheduled any sessions yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {timeSlots.map((slot) => {
                  const startDateTime = formatDateTime(slot.startTime);
                  const _endDateTime = formatDateTime(slot.endTime);

                  return (
                    <div
                      key={slot._id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:border-primary/50 transition-colors bg-card"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px] p-2 bg-muted/30 rounded-lg">
                          <p className="text-sm font-bold text-foreground">{startDateTime.date}</p>
                          <p className="text-xs text-muted-foreground">{startDateTime.time}</p>
                        </div>

                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="secondary"
                              className={getSessionTypeColor(slot.sessionType)}
                            >
                              {slot.sessionType}
                            </Badge>
                            <span className="text-sm text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getDuration(slot.startTime, slot.endTime)}
                            </span>
                          </div>

                          {slot.notes && (
                            <p className="text-sm text-muted-foreground max-w-md truncate">
                              {slot.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          <p className="text-lg font-bold text-primary">₹{slot.price}</p>
                        </div>
                        <Button
                          onClick={() => bookTimeSlot(slot._id)}
                          disabled={slot.isBooked}
                          className={`${mentorColor.accent} ${mentorColor.button} text-white min-w-[120px]`}
                        >
                          {slot.isBooked ? "Booked" : "Book Session"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
