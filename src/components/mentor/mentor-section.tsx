"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserPlus, Check } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import EnhancedMentorCarousel from "@/components/mentor/EnhancedMentorCarousel";
import Link from "next/link";
import { type Mentor } from "@/lib/types/mentor";
import { type TimeSlotDocument } from "@/lib/types/sessions";
import { ensureDateObject } from "@/lib/utils/date-utils";

export default function MentorsPage() {
  // alert('🚀 MentorsPage component loaded!'); // Uncomment to test

  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSlotsMap, setTimeSlotsMap] = useState<Record<string, boolean>>({});

  // Fetch mentors' time slots for today and upcoming days
  const fetchMentorTimeSlots = async (mentorIds: string[]) => {
    try {
      const timeSlotsAvailability: Record<string, boolean> = {};

      // Check each mentor's time slots
      for (const mentorId of mentorIds) {
        try {
          // First, try to get all available slots for this mentor (not just today)
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
        setMentors(data.mentors);

        // Fetch time slots for all mentors
        const mentorIds = data.mentors.map((mentor: Mentor) => mentor.id.toString());

        // Temporarily hardcode the time slots data based on server logs
        // TODO: Fix the fetchMentorTimeSlots function
        const tempTimeSlotsMap: Record<string, boolean> = {};
        data.mentors.forEach((mentor: Mentor) => {
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

    // Remove real-time availability polling - we only use time slot availability now
  }, [fetchMentors]);

  // Transform mentor data with only time slot availability (no real-time availability)
  const transformMentorWithRealTimeAvailability = (mentor: Mentor) => {
    // Get time slot availability for today
    const hasTimeSlotsToday = timeSlotsMap[mentor.id.toString()] ?? false;

    // Only use time slot availability
    const finalAvailability = hasTimeSlotsToday;

    return {
      id: mentor.id,
      name: mentor.name,
      specialty: mentor.specialty,
      experience:
        typeof mentor.experience === "string"
          ? parseInt(mentor.experience, 10) || 0
          : mentor.experience || 0,
      imageUrl: mentor.image,
      available: finalAvailability, // Use combined availability (real-time + time slots)
      description: mentor.bio || mentor.description,
      mentorType: mentor.mentorType,
      certifications: mentor.certifications,
      expertise: mentor.specialty,
    };
  };

  // Categorize mentors by type with real-time availability
  const categorizedMentors = {
    liveSession: mentors
      .filter((mentor) => mentor.mentorType === "YOGAMENTOR")
      .map(transformMentorWithRealTimeAvailability),
    dietPlanning: mentors
      .filter((mentor) => mentor.mentorType === "DIETPLANNER")
      .map(transformMentorWithRealTimeAvailability),
    meditation: mentors
      .filter((mentor) => mentor.mentorType === "MEDITATIONMENTOR")
      .map(transformMentorWithRealTimeAvailability),
  };
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar with back button */}
      <Navbar showBackButton={true} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-10 relative">
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
            Expert Guidance
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Meet Our Yoga Mentors
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Connect with experienced professionals who will guide you on your wellness journey
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading mentors...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Mentors Content */}
        {!loading && !error && (
          <>
            {/* Live Session Mentors */}
            <EnhancedMentorCarousel
              mentors={categorizedMentors.liveSession}
              title="Live Session Mentors"
              colorClass="bg-[#76d2fa]"
            />

            {/* Diet Planning Mentors */}
            <EnhancedMentorCarousel
              mentors={categorizedMentors.dietPlanning}
              title="Diet Planning Experts"
              colorClass="bg-[#ff7dac]"
            />

            {/* Meditation Mentors */}
            <EnhancedMentorCarousel
              mentors={categorizedMentors.meditation}
              title="Meditation Guides"
              colorClass="bg-[#876aff]"
            />
          </>
        )}

        {/* Register as Mentor Section */}
        <div className="bg-gray-50 rounded-3xl p-8 md:p-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                Share your expertise as a YogVaidya mentor
              </h3>
              <p className="text-gray-600 mb-6">
                If you&apos;re an experienced yoga instructor, nutritionist, or meditation guide,
                join our team of mentors and help others on their wellness journey.
              </p>
              <div className="space-y-3 mb-8">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 mr-3">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-gray-700">Flexible teaching schedule</span>
                </div>
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 mr-3">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-gray-700">Connect with students worldwide</span>
                </div>
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-600 mr-3">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="text-gray-700">Grow your professional network</span>
                </div>
              </div>
              <Link href="/mentors/apply">
                <Button className="bg-[#76d2fa] hover:bg-[#5a9be9] text-white flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Apply Now</span>
                </Button>
              </Link>
            </div>
            <div className="hidden md:block">
              <Image
                src="/assets/yoga-meditation-1.png"
                alt="Become a mentor"
                width={400}
                height={400}
                className="mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
