"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Calendar, Clock, IndianRupee, ArrowLeft, BookOpen } from "lucide-react";

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
  const fetchTimeSlots = async () => {
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
  };

  // Book a time slot
  const bookTimeSlot = (timeSlotId: string) => {
    router.push(`/timeslot-checkout?timeSlotId=${timeSlotId}&mentorId=${mentorId}`);
  };

  // Format date and time with robust date handling
  const formatDateTime = (dateTime: string | any) => {
    let date: Date;

    // Handle different date formats
    if (typeof dateTime === "object" && dateTime.$date) {
      // MongoDB Extended JSON format
      date = new Date(dateTime.$date);
    } else if (typeof dateTime === "string") {
      // ISO string format
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
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "MEDITATION":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DIET":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get duration with robust date handling
  const getDuration = (startTime: string | any, endTime: string | any) => {
    let start: Date, end: Date;

    // Handle MongoDB Extended JSON format
    if (typeof startTime === "object" && startTime.$date) {
      start = new Date(startTime.$date);
    } else {
      start = new Date(startTime);
    }

    if (typeof endTime === "object" && endTime.$date) {
      end = new Date(endTime.$date);
    } else {
      end = new Date(endTime);
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
  }, [mentorId]);

  if (loadingMentor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Loading mentor information...</p>
        </div>
      </div>
    );
  }

  if (!mentorData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Mentor not found</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" onClick={() => router.push("/dashboard")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Mentor Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={mentorData.image} />
                <AvatarFallback>{mentorData.name?.charAt(0) || "M"}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{mentorData.name}</h1>
                <p className="text-gray-600 capitalize mb-3">
                  {mentorData.mentorType?.toLowerCase().replace("mentor", " Mentor")}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="w-4 h-4" />₹{mentorData.sessionPrice} per session
                  </span>
                  {mentorData.experience && <span>{mentorData.experience}+ years experience</span>}
                </div>
                {mentorData.expertise && (
                  <p className="text-sm text-gray-600 mt-2">
                    <strong>Specialization:</strong> {mentorData.expertise}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Available Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              Available Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading available sessions...</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No sessions available</p>
                <p className="text-gray-400">
                  This mentor hasn&apos;t scheduled any sessions yet. Check back later!
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {timeSlots.map((slot) => {
                  const startDateTime = formatDateTime(slot.startTime);
                  const endDateTime = formatDateTime(slot.endTime);

                  return (
                    <div
                      key={slot._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-center min-w-[80px]">
                          <p className="text-sm font-medium text-gray-900">{startDateTime.date}</p>
                          <p className="text-xs text-gray-500">
                            {startDateTime.time} - {endDateTime.time}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Badge className={getSessionTypeColor(slot.sessionType)}>
                            {slot.sessionType}
                          </Badge>

                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="w-4 h-4" />
                            {getDuration(slot.startTime, slot.endTime)}
                          </div>

                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <IndianRupee className="w-4 h-4" />₹{slot.price}
                          </div>
                        </div>

                        {slot.notes && (
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {slot.notes}
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={() => bookTimeSlot(slot._id)}
                        disabled={slot.isBooked}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {slot.isBooked ? "Booked" : "Book Session"}
                      </Button>
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
