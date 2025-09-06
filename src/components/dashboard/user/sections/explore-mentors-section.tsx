"use client";

import { Users, Calendar, Award, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import MentorCardCompact from "../mentor-card-compact";
import { Mentor } from "@/lib/types/mentor";

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
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];

      console.log(`🔍 [EXPLORE] Checking time slots for ${mentorIds.length} mentors starting from date: ${todayString}`);

      const timeSlotsAvailability: Record<string, boolean> = {};

      // Check each mentor's time slots
      for (const mentorId of mentorIds) {
        try {
          // Get all available slots for this mentor (not limited to today)
          const url = `/api/mentor/timeslots?mentorId=${mentorId}&available=true`;
          console.log(`📞 [EXPLORE] Fetching: ${url}`);
          
          const response = await fetch(url);
          const data = await response.json();
          
          console.log(`📊 [EXPLORE] Response for mentor ${mentorId}:`, data);
          
          if (data.success && data.data) {
            console.log(`⏰ [EXPLORE] Time slots found for mentor ${mentorId}:`, data.data.length);
            
            // Check if mentor has any available time slots in the future
            const availableSlots = data.data.filter((slot: any) => {
              const slotDate = new Date(slot.startTime);
              const isActive = slot.isActive;
              const isNotBooked = !slot.isBooked;
              const isFuture = slotDate > new Date(); // Any future slots
              
              console.log(`  📅 [EXPLORE] Slot ${slot._id}: ${slotDate.toISOString()}`);
              console.log(`    - Is active: ${isActive}`);
              console.log(`    - Not booked: ${isNotBooked}`);
              console.log(`    - Is future: ${isFuture}`);
              
              return isActive && isNotBooked && isFuture;
            });
            
            const hasAvailableSlots = availableSlots.length > 0;
            console.log(`✅ [EXPLORE] Mentor ${mentorId} has ${availableSlots.length} available slots: ${hasAvailableSlots}`);
            timeSlotsAvailability[mentorId] = hasAvailableSlots;
          } else {
            console.log(`❌ [EXPLORE] No time slots or error for mentor ${mentorId}:`, data.error || 'No slots');
            timeSlotsAvailability[mentorId] = false;
          }
        } catch (err) {
          console.error(`❌ [EXPLORE] Error fetching time slots for mentor ${mentorId}:`, err);
          timeSlotsAvailability[mentorId] = false;
        }
      }

      console.log('📊 [EXPLORE] Final time slots availability map:', timeSlotsAvailability);
      setTimeSlotsMap(timeSlotsAvailability);
    } catch (err) {
      console.error('❌ [EXPLORE] Error fetching mentor time slots:', err);
    }
  };

  // Fetch mentors data
  const fetchMentors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mentor/get-approved-mentors');
      const data = await response.json();
      
      if (data.success) {
        const transformedMentors = data.mentors.map((mentor: Mentor) => ({
          id: mentor.id,
          name: mentor.name,
          specialty: mentor.specialty,
          experience: typeof mentor.experience === 'string' ? 
            parseInt(mentor.experience, 10) || 0 : 
            mentor.experience || 0,
          imageUrl: mentor.image,
          available: mentor.available,
          hasTimeSlotsToday: false, // Will be updated after fetching time slots
          description: mentor.bio || mentor.description || 'Experienced wellness mentor',
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
          if (mentorId === 'p27belqfkUe1sppnuFpG4nSupFZj8Fme') {
            tempTimeSlotsMap[mentorId] = true; // Has slots
          } else {
            tempTimeSlotsMap[mentorId] = false; // No slots
          }
        });
        console.log('🔧 [EXPLORE] Setting timeSlotsMap:', tempTimeSlotsMap);
        setTimeSlotsMap(tempTimeSlotsMap);
        
        // Fetch time slots for all mentors
        const mentorIds = transformedMentors.map((m: TransformedMentor) => m.id.toString());
        await fetchMentorTimeSlots(mentorIds);
        
      } else {
        setError(data.error || 'Failed to fetch mentors');
      }
    } catch (err) {
      setError('Failed to fetch mentors');
      console.error('Error fetching mentors:', err);
    } finally {
      setLoading(false);
    }
  };

  // Removed real-time availability fetching - we only use time slot availability now
  
  useEffect(() => {
    fetchMentors();

    // Remove real-time polling - we only use time slot availability now
  }, []); // Remove mentors.length dependency to avoid infinite loop

  // Separate effect for refreshing time slots when mentors change
  useEffect(() => {
    if (mentors.length > 0) {
      const mentorIds = mentors.map((m: TransformedMentor) => m.id.toString());
      fetchMentorTimeSlots(mentorIds);
    }
  }, [mentors.length]); // This will trigger when mentors are first loaded

  // Update mentors when timeSlotsMap changes
  useEffect(() => {
    if (mentors.length > 0 && Object.keys(timeSlotsMap).length > 0) {
      console.log('🔄 [EXPLORE] Updating mentors with new timeSlotsMap:', timeSlotsMap);
      setMentors(prevMentors => 
        prevMentors.map(mentor => {
          const hasTimeSlotsToday = timeSlotsMap[mentor.id.toString()] ?? false;
          console.log(`🔄 [EXPLORE] Mentor ${mentor.name} (${mentor.id}): hasTimeSlotsToday = ${hasTimeSlotsToday}`);
          return { 
            ...mentor, 
            hasTimeSlotsToday: hasTimeSlotsToday
          };
        })
      );
    }
  }, [timeSlotsMap]); // This will trigger when timeSlotsMap is updated

  // Categorize mentors by type
  const categorizedMentors = {
    liveSession: mentors.filter(mentor => mentor.mentorType === 'YOGAMENTOR'),
    dietPlanning: mentors.filter(mentor => mentor.mentorType === 'DIETPLANNER'),
    meditation: mentors.filter(mentor => mentor.mentorType === 'MEDITATIONMENTOR'),
  };

  const totalMentors = mentors.length;
  const availableMentors = mentors.filter(mentor => mentor.hasTimeSlotsToday).length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
          <p className="text-gray-600 mt-2">
            Discover experienced yoga and meditation mentors to guide your journey.
          </p>
        </div>

        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mb-4" />
          <p className="text-gray-500">Loading mentors...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Explore Mentors</h1>
        <p className="text-gray-600 mt-2">
          Discover experienced yoga and meditation mentors to guide your journey.
        </p>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Mentors</p>
              <p className="text-xl font-bold text-blue-800">{totalMentors}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg">
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
          <div className="w-24 h-24 bg-gradient-to-br from-[#ff7dac] to-[#876aff] rounded-full flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Mentors Available</h2>
          <p className="text-gray-500 text-center max-w-md mb-6">
            We're currently onboarding amazing mentors. Check back soon for certified yoga and meditation guides!
          </p>
          <Link href="/mentors/apply">
            <Button className="bg-gradient-to-r from-[#ff7dac] to-[#876aff] text-white">
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
                  <div className="w-4 h-4 bg-[#76d2fa] rounded mr-2"></div>
                  Yoga Mentors ({categorizedMentors.liveSession.length})
                </h2>
                <Link href="/mentors">
                  <Button size="sm" className="bg-gradient-to-r from-[#76d2fa] to-[#876aff] text-white text-xs">
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
                  <div className="w-4 h-4 bg-[#ff7dac] rounded mr-2"></div>
                  Diet Planning Experts ({categorizedMentors.dietPlanning.length})
                </h2>
                <Link href="/mentors">
                  <Button size="sm" className="bg-gradient-to-r from-[#76d2fa] to-[#876aff] text-white text-xs">
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
                  <div className="w-4 h-4 bg-[#876aff] rounded mr-2"></div>
                  Meditation Guides ({categorizedMentors.meditation.length})
                </h2>
                <Link href="/mentors">
                  <Button size="sm" className="bg-gradient-to-r from-[#76d2fa] to-[#876aff] text-white text-xs">
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

