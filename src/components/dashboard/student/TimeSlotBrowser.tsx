"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Calendar, Clock, Users, IndianRupee, Search, Filter, BookOpen, Star } from "lucide-react";

interface TimeSlot {
  _id: string;
  startTime: string;
  endTime: string;
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

export default function StudentTimeSlotBrowser() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [filteredSlots, setFilteredSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    date: "",
    sessionType: "",
    mentorId: "",
    available: true,
  });

  // Fetch available time slots
  const fetchTimeSlots = useCallback(async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.sessionType) params.append("sessionType", filters.sessionType);
      if (filters.mentorId) params.append("mentorId", filters.mentorId);
      if (filters.available) params.append("available", "true");

      const response = await fetch(`/api/mentor/timeslots?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTimeSlots(result.data);
        setFilteredSlots(result.data);
      } else {
        toast.error("Failed to fetch time slots");
      }
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Failed to fetch time slots");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Book a time slot
  const bookTimeSlot = async (timeSlotId: string) => {
    try {
      setBookingLoading(timeSlotId);

      const response = await fetch(`/api/mentor/timeslots/${timeSlotId}/book`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: "", // Could add a notes input if needed
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success("Time slot booked successfully!");
        fetchTimeSlots(); // Refresh the list
      } else {
        if (response.status === 409) {
          toast.error("You already have an active session with this mentor.");
        } else {
          toast.error(result.error || "Failed to book time slot");
        }
      }
    } catch (error) {
      console.error("Error booking time slot:", error);
      toast.error("Failed to book time slot");
    } finally {
      setBookingLoading(null);
    }
  };

  // Filter time slots based on search and filters
  const applyFilters = useCallback(() => {
    let filtered = [...timeSlots];

    // Filter by availability
    if (filters.available) {
      filtered = filtered.filter((slot) => !slot.isBooked);
    }

    // Filter by session type
    if (filters.sessionType) {
      filtered = filtered.filter((slot) => slot.sessionType === filters.sessionType);
    }

    // Filter by mentor
    if (filters.mentorId) {
      filtered = filtered.filter((slot) => slot.mentor.id === filters.mentorId);
    }

    // Filter by date
    if (filters.date) {
      const filterDate = new Date(filters.date);
      filtered = filtered.filter((slot) => {
        const slotDate = new Date(slot.startTime);
        return slotDate.toDateString() === filterDate.toDateString();
      });
    }

    setFilteredSlots(filtered);
  }, [timeSlots, filters]);

  // Format date and time
  const formatDateTime = (dateTime: string) => {
    const date = new Date(dateTime);
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
        return "bg-blue-100 text-blue-800";
      case "MEDITATION":
        return "bg-purple-100 text-purple-800";
      case "DIET":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get unique mentors for filter
  const uniqueMentors = timeSlots.reduce(
    (acc, slot) => {
      if (!acc.find((m) => m.id === slot.mentor.id)) {
        acc.push(slot.mentor);
      }
      return acc;
    },
    [] as (typeof timeSlots)[0]["mentor"][]
  );

  useEffect(() => {
    fetchTimeSlots();
  }, [fetchTimeSlots]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Time Slots</h1>
        <p className="text-gray-600 mt-1">Browse and book sessions with your preferred mentors</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Time Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={filters.date}
                onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div>
              <Label htmlFor="sessionType">Session Type</Label>
              <Select
                value={filters.sessionType}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, sessionType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="YOGA">Yoga</SelectItem>
                  <SelectItem value="MEDITATION">Meditation</SelectItem>
                  <SelectItem value="DIET">Diet Planning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="mentor">Mentor</Label>
              <Select
                value={filters.mentorId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, mentorId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All mentors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Mentors</SelectItem>
                  {uniqueMentors.map((mentor) => (
                    <SelectItem key={mentor.id} value={mentor.id}>
                      {mentor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={fetchTimeSlots} disabled={loading} className="w-full">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Slots Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Available Sessions ({filteredSlots.length})
          </h2>
          <Button variant="outline" onClick={fetchTimeSlots} disabled={loading}>
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600 mt-4">Loading available time slots...</p>
          </div>
        ) : filteredSlots.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Time Slots Available</h3>
              <p className="text-gray-600 mb-4">
                No mentors have created time slots matching your criteria. Try adjusting your
                filters or check back later.
              </p>
              <Button
                onClick={() =>
                  setFilters({ date: "", sessionType: "", mentorId: "", available: true })
                }
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSlots.map((slot) => {
              const startDateTime = formatDateTime(slot.startTime);
              const endDateTime = formatDateTime(slot.endTime);

              return (
                <Card key={slot._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getSessionTypeColor(slot.sessionType)}>
                        {slot.sessionType}
                      </Badge>
                      <div className="flex items-center gap-1 text-green-600">
                        <IndianRupee className="h-4 w-4" />
                        <span className="font-semibold">₹{slot.price}</span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Mentor Info */}
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={slot.mentor.image} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {slot.mentor.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{slot.mentor.name}</h3>
                        <p className="text-sm text-gray-600">{slot.mentor.mentorType}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">4.8</span>
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{startDateTime.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span>
                          {startDateTime.time} - {endDateTime.time}
                        </span>
                      </div>
                    </div>

                    {/* Students Info */}
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>
                        {slot.maxStudents - slot.currentStudents} spot
                        {slot.maxStudents - slot.currentStudents !== 1 ? "s" : ""} available
                      </span>
                    </div>

                    {/* Notes */}
                    {slot.notes && (
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{slot.notes}</p>
                    )}

                    {/* Book Button */}
                    <Button
                      onClick={() => bookTimeSlot(slot._id)}
                      disabled={bookingLoading === slot._id || slot.isBooked}
                      className="w-full"
                    >
                      {bookingLoading === slot._id ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                          <span>Booking...</span>
                        </div>
                      ) : slot.isBooked ? (
                        "Already Booked"
                      ) : (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          <span>Book Session</span>
                        </div>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
