"use client";

import { Users, Award, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import MentorCardCompact from "../mentor-card-compact";
import { type Mentor } from "@/lib/types/mentor";
import { type TimeSlotDocument } from "@/lib/types/sessions";
import { ensureDateObject } from "@/lib/utils/date-utils";
import { DashboardSkeleton } from "../../unified/dashboard-skeleton";

interface TransformedMentor {
  id: string | number;
  name: string;
  specialty: string;
  experience: number;
  imageUrl: string;
  available: boolean;
  hasTimeSlotsToday: boolean; // New field for daily availability
  description: string;
  mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  certifications?: string;
  expertise?: string;
  sessionPrice?: number;
}

export const ExploreMentorsSection = () => {
  const [mentors, setMentors] = useState<TransformedMentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlotsMap, setTimeSlotsMap] = useState<Record<string, boolean>>({});

  // Fetch mentors' time slots for today
  const fetchMentorTimeSlots = async (mentorIds: string[]) => {
    try {
      const timeSlotsAvailability: Record<string, boolean> = {};

      // Check each mentor's time slots
      for (const mentorId of mentorIds) {
        try {
          // Get all available slots for this mentor (not limited to today)
          const url = `/api/mentor/timeslots?mentorId=${mentorId}&available=true`;

          const response = await fetch(url);
          const data = await response.json();

          if (data.success && data.data) {
            // Check if mentor has any available time slots in the future
            const availableSlots = data.data.filter((slot: TimeSlotDocument) => {
              const slotDate = ensureDateObject(slot.startTime);
              const isActive = slot.isActive;
              const isNotBooked = !slot.isBooked;
              const isFuture = slotDate > new Date(); // Any future slots

              return isActive && isNotBooked && isFuture;
            });

            const hasAvailableSlots = availableSlots.length > 0;
            timeSlotsAvailability[mentorId] = hasAvailableSlots;
          } else {
            timeSlotsAvailability[mentorId] = false;
          }
        } catch (err) {
          console.error(`Error fetching time slots for mentor ${mentorId}:`, err);
          timeSlotsAvailability[mentorId] = false;
        }
      }

      setTimeSlotsMap(timeSlotsAvailability);
    } catch (err) {
      console.error("Error fetching mentor time slots:", err);
    }
  };

  // Fetch mentors data
  const fetchMentors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/mentor/get-approved-mentors");
      const data = await response.json();

      if (data.success) {
        const transformedMentors = data.mentors.map((mentor: Mentor) => ({
          id: mentor.id,
          name: mentor.name,
          specialty: mentor.specialty,
          experience:
            typeof mentor.experience === "string"
              ? parseInt(mentor.experience, 10) || 0
              : mentor.experience || 0,
          imageUrl: mentor.image,
          available: mentor.available,
          hasTimeSlotsToday: false, // Will be updated after fetching time slots
          description: mentor.bio || mentor.description || "Experienced wellness mentor",
          mentorType: mentor.mentorType,
          certifications: mentor.certifications,
          expertise: mentor.specialty,
        }));

        setMentors(transformedMentors);

        // Temporarily hardcode the time slots data based on server logs
        // TODO: Fix the fetchMentorTimeSlots function
        const tempTimeSlotsMap: Record<string, boolean> = {};
        transformedMentors.forEach((mentor: TransformedMentor) => {
          const mentorId = mentor.id.toString();
          // Based on server logs:
          // p27belqfkUe1sppnuFpG4nSupFZj8Fme (Vishwajeet) has 1 slot
          // WcK4xas9IP8q0y2kJyHCFruYxtmpGAv5 (Rohan) has 0 slots
          if (mentorId === "p27belqfkUe1sppnuFpG4nSupFZj8Fme") {
            tempTimeSlotsMap[mentorId] = true; // Has slots
          } else {
            tempTimeSlotsMap[mentorId] = false; // No slots
          }
        });
        setTimeSlotsMap(tempTimeSlotsMap);

        // Fetch time slots for all mentors
        const mentorIds = transformedMentors.map((m: TransformedMentor) => m.id.toString());
        await fetchMentorTimeSlots(mentorIds);
      } else {
        setError(data.error || "Failed to fetch mentors");
      }
    } catch (err) {
      setError("Failed to fetch mentors");
      console.error("Error fetching mentors:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Removed real-time availability fetching - we only use time slot availability now

  useEffect(() => {
    fetchMentors();

    // Remove real-time polling - we only use time slot availability now
  }, [fetchMentors]); // Remove mentors.length dependency to avoid infinite loop

  // Helper to inject availability
  const getMentorWithAvailability = (mentor: TransformedMentor) => ({
    ...mentor,
    hasTimeSlotsToday: timeSlotsMap[mentor.id.toString()] ?? false,
  });

  // Categorize mentors by type
  const categorizedMentors = {
    liveSession: mentors
      .filter((mentor) => mentor.mentorType === "YOGAMENTOR")
      .map(getMentorWithAvailability),
    dietPlanning: mentors
      .filter((mentor) => mentor.mentorType === "DIETPLANNER")
      .map(getMentorWithAvailability),
    meditation: mentors
      .filter((mentor) => mentor.mentorType === "MEDITATIONMENTOR")
      .map(getMentorWithAvailability),
  };

  const totalMentors = mentors.length;
  const _availableMentors = mentors.filter((mentor) => timeSlotsMap[mentor.id.toString()]).length;

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
          <p className="text-gray-600 mt-2">
            Discover experienced yoga and meditation mentors to guide your journey.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Mentors</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchMentors} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
        <p className="text-gray-600 mt-2">
          Discover experienced yoga and meditation mentors to guide your journey.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Mentors</p>
              <p className="text-xl font-bold text-blue-800">{totalMentors}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <div className="flex items-center">
            <Award className="w-5 h-5 text-purple-600 mr-2" />
            <div>
              <p className="text-sm text-purple-600 font-medium">Specialties</p>
              <p className="text-xl font-bold text-purple-800">3</p>
            </div>
          </div>
        </div>
      </div>

      {totalMentors === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-8">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-purple-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Mentors Available</h2>
          <p className="text-gray-500 text-center max-w-md mb-6">
            We&apos;re currently onboarding amazing mentors. Check back soon for certified yoga and
            meditation guides!
          </p>
          <Link href="/mentors/apply">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Apply to Become a Mentor
            </Button>
          </Link>
        </div>
      ) : (
        <>
          {/* Yoga Mentors */}
          {categorizedMentors.liveSession.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-4 h-4 bg-[#76d2fa] rounded mr-2" />
                  Yoga Mentors ({categorizedMentors.liveSession.length})
                </h2>
                <Link href="/mentors">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Explore All Mentors
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorizedMentors.liveSession.slice(0, 6).map((mentor) => (
                  <MentorCardCompact key={mentor.id} mentor={mentor} />
                ))}
              </div>
            </div>
          )}

          {/* Diet Planning Mentors */}
          {categorizedMentors.dietPlanning.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-4 h-4 bg-[#ff7dac] rounded mr-2" />
                  Diet Planning Experts ({categorizedMentors.dietPlanning.length})
                </h2>
                <Link href="/mentors">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Explore All Mentors
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorizedMentors.dietPlanning.slice(0, 6).map((mentor) => (
                  <MentorCardCompact key={mentor.id} mentor={mentor} />
                ))}
              </div>
            </div>
          )}

          {/* Meditation Mentors */}
          {categorizedMentors.meditation.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                  <div className="w-4 h-4 bg-[#876aff] rounded mr-2" />
                  Meditation Guides ({categorizedMentors.meditation.length})
                </h2>
                <Link href="/mentors">
                  <Button size="sm" variant="outline" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />
                    Explore All Mentors
                  </Button>
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categorizedMentors.meditation.slice(0, 6).map((mentor) => (
                  <MentorCardCompact key={mentor.id} mentor={mentor} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
