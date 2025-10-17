"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, Award, CheckCircle, Heart } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils/utils";

interface MentorCardCompactProps {
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

const MentorCardCompact: React.FC<{ mentor: MentorCardCompactProps }> = ({ mentor }) => {
  const getColorClass = (mentorType: string | null) => {
    switch (mentorType) {
      case "YOGAMENTOR":
        return "bg-[#76d2fa]";
      case "DIETPLANNER":
        return "bg-[#ff7dac]";
      case "MEDITATIONMENTOR":
        return "bg-[#876aff]";
      default:
        return "bg-gray-500";
    }
  };

  const getMentorTypeLabel = (mentorType: string | null) => {
    switch (mentorType) {
      case "YOGAMENTOR":
        return "Yoga Mentor";
      case "DIETPLANNER":
        return "Diet Planner";
      case "MEDITATIONMENTOR":
        return "Meditation Guide";
      default:
        return "Mentor";
    }
  };

  const colorClass = getColorClass(mentor.mentorType);

  // Determine final availability: must be both available AND have time slots today
  // Only use time slot availability - no real-time availability check
  const isActuallyAvailable = mentor.hasTimeSlotsToday;

  return (
    <Card
      className={cn(
        "relative overflow-hidden bg-white hover:shadow-lg transition-all duration-300 group border border-gray-200",
        !isActuallyAvailable && "opacity-75 grayscale-[0.2]"
      )}
    >
      {/* Availability Badge */}
      <div className="absolute top-3 right-3 z-10">
        {isActuallyAvailable ? (
          <Badge className="bg-green-500 text-white border-0 text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Available
          </Badge>
        ) : (
          <Badge className="bg-red-500 text-white border-0 text-xs">
            <Clock className="w-3 h-3 mr-1" />
            Busy
          </Badge>
        )}
      </div>

      <CardContent className="p-4">
        {/* Header with Avatar and Basic Info */}
        <div className="flex items-start space-x-3 mb-3">
          <div className="relative">
            <Avatar
              className={cn(
                "w-12 h-12 border-2 border-white shadow-sm",
                isActuallyAvailable
                  ? "ring-2 ring-green-400 ring-offset-1"
                  : "ring-2 ring-gray-300 ring-offset-1"
              )}
            >
              <AvatarImage src={mentor.imageUrl} alt={mentor.name} />
              <AvatarFallback className={cn("text-white text-sm font-semibold", colorClass)}>
                {mentor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>

            {/* Real-time availability indicator */}
            <div className="absolute -bottom-1 -right-1">
              <div
                className={cn(
                  "w-4 h-4 rounded-full border-2 border-white flex items-center justify-center",
                  isActuallyAvailable ? "bg-green-500" : "bg-red-500"
                )}
              >
                <div
                  className={cn(
                    "w-1.5 h-1.5 rounded-full bg-white",
                    isActuallyAvailable && "animate-pulse"
                  )}
                />
              </div>
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 text-sm truncate">{mentor.name}</h3>
            <p className="text-xs text-gray-600 mb-1">{getMentorTypeLabel(mentor.mentorType)}</p>
            <div className="flex items-center text-xs text-gray-500">
              <Award className="w-3 h-3 mr-1" />
              {mentor.experience}+ years
            </div>
          </div>
        </div>

        {/* Description */}
        <p
          className="text-xs text-gray-600 mb-3 overflow-hidden"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
          }}
        >
          {mentor.description}
        </p>

        {/* Specialty */}
        <div className="mb-3">
          <Badge variant="outline" className="text-xs">
            {mentor.specialty}
          </Badge>
        </div>

        {/* Action Button - Same as /mentors page */}
        <div className="mt-3">
          {isActuallyAvailable ? (
            <Link href={`/mentors/${mentor.id}/timeslots`}>
              <Button
                className={cn(
                  "w-full border-0 font-semibold transition-all duration-200 text-xs py-1.5",
                  "text-white",
                  colorClass
                )}
                size="sm"
              >
                <Heart className="w-3 h-3 mr-1" />
                Connect Now
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full border-0 font-semibold transition-all duration-200 text-xs py-1.5 bg-gray-400 text-white cursor-not-allowed"
              size="sm"
              disabled
            >
              <Clock className="w-3 h-3 mr-1" />
              Currently Busy
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MentorCardCompact;
