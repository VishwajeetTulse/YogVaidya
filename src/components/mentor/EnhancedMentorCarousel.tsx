"use client";

import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, ChevronRight, Clock, Award, Heart, CheckCircle } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";
import { cn } from "@/lib/utils/utils";

interface EnhancedMentorProps {
  id: string | number;
  name: string;
  specialty: string;
  experience: number;
  imageUrl: string;
  available: boolean;
  description: string;
  mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null;
  certifications?: string;
  expertise?: string;
  sessionPrice?: number;
}

interface EnhancedMentorCarouselProps {
  mentors: EnhancedMentorProps[];
  title: string;
  colorClass: string;
}

const MentorCard: React.FC<{ mentor: EnhancedMentorProps; colorClass: string }> = ({
  mentor,
  colorClass,
}) => {
  return (
    <Card
      className={cn(
        "relative overflow-hidden h-full bg-white/95 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300 group md:w-smw",
        !mentor.available && "opacity-75 grayscale-[0.2]"
      )}
    >
      {/* Availability Badge - Responsive positioning */}
      <div className="absolute top-3 right-3 z-10">
        {mentor.available ? (
          <Badge className="bg-green-500 text-white border-0 animate-pulse text-xs">
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

      {/* Overlay for unavailable mentors */}
      {!mentor.available && (
        <div className="absolute inset-0 bg-gray-900/10 z-5 pointer-events-none" />
      )}

      <CardContent className="p-4 md:p-4 h-full">
        {/* Responsive Layout: Mobile (vertical) vs Desktop (landscape) */}
        <div className="flex flex-col md:flex-row h-full">
          {/* Avatar Section */}
          <div className="flex md:flex-col items-center md:items-center mb-4 md:mb-0 md:mr-3 md:w-24 flex-shrink-0">
            <div className="relative mr-3 md:mr-0 md:mb-2">
              <Avatar
                className={cn(
                  "w-16 h-16 md:w-16 md:h-16 border-3 border-white shadow-md transition-all duration-300",
                  mentor.available
                    ? "ring-2 ring-green-400 ring-offset-1"
                    : "ring-2 ring-gray-300 ring-offset-1"
                )}
              >
                <AvatarImage src={mentor.imageUrl} alt={mentor.name} />
                <AvatarFallback
                  className={cn("text-white text-sm md:text-sm font-semibold", colorClass)}
                >
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
                    "w-5 h-5 md:w-5 md:h-5 rounded-full border-2 border-white flex items-center justify-center transition-all duration-300",
                    mentor.available ? "bg-green-500" : "bg-red-500"
                  )}
                >
                  <div
                    className={cn(
                      "w-1.5 h-1.5 md:w-1.5 md:h-1.5 rounded-full",
                      mentor.available ? "bg-white animate-pulse" : "bg-white"
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Mobile: Name beside avatar, Desktop: Name below avatar */}
            <div className="flex-1 md:flex-none md:text-center">
              <h3 className="font-bold text-base md:text-sm text-gray-900 mb-1 md:mb-0.5">
                {mentor.name}
              </h3>
              <p className="text-sm md:text-xs text-gray-600 font-medium md:mb-1">
                {mentor.specialty}
              </p>

              {/* Status indicator - compact for desktop */}
              <div className="mt-1 md:mt-0">
                <p
                  className={cn(
                    "text-xs md:text-xs font-medium",
                    mentor.available ? "text-green-600" : "text-red-600"
                  )}
                >
                  {mentor.available ? "🟢 Available" : "🔴 Busy"}
                </p>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 flex flex-col justify-between min-h-0">
            {/* Top Content */}
            <div className="space-y-2 md:space-y-1.5">
              {/* Experience and Type - Horizontal layout for desktop efficiency */}
              <div className="flex flex-row md:flex-row gap-2 md:gap-2 items-center md:justify-between">
                {/* Experience */}
                <div className="flex items-center flex-1 md:flex-none">
                  <Award
                    className={cn("w-3 h-3 md:w-3 md:h-3 mr-1", colorClass.replace("bg-", "text-"))}
                  />
                  <span className="text-xs md:text-xs font-medium text-gray-700">
                    {mentor.experience === 0
                      ? "New mentor"
                      : mentor.experience === 1
                        ? "1+ year"
                        : `${mentor.experience}+ years`}
                  </span>
                </div>

                {/* Mentor Type Badge - Compact for desktop */}
                <div className="flex justify-end md:justify-end">
                  <Badge
                    variant="outline"
                    className="text-xs md:text-xs px-1.5 py-0.5 md:px-1.5 md:py-0.5"
                  >
                    {mentor.mentorType === "YOGAMENTOR" && "Yoga"}
                    {mentor.mentorType === "MEDITATIONMENTOR" && "Meditation"}
                    {mentor.mentorType === "DIETPLANNER" && "Diet"}
                  </Badge>
                </div>
              </div>

              {/* Description - More compact for desktop */}
              <div className="hidden sm:block">
                <p className="text-xs md:text-xs text-gray-700 leading-relaxed">
                  {mentor.description.length > 100
                    ? `${mentor.description.slice(0, 100)}...`
                    : mentor.description}
                </p>
              </div>

              {/* Certifications - Compact desktop version */}
              {mentor.certifications && (
                <div className="hidden md:block">
                  <p className="text-xs text-gray-600 italic">
                    <span className="font-medium">Cert:</span>{" "}
                    {mentor.certifications.length > 45
                      ? `${mentor.certifications.slice(0, 45)}...`
                      : mentor.certifications}
                  </p>
                </div>
              )}

              {/* Pricing Information */}
              {mentor.sessionPrice && mentor.sessionPrice > 0 && (
                <div className="flex items-center justify-center bg-gray-50 rounded-lg p-2 mt-2">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-900">₹{mentor.sessionPrice}</div>
                    <div className="text-xs text-gray-600">per session</div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Action Section */}
            <div className="mt-3 md:mt-2 space-y-1.5 md:space-y-1">
              {mentor.available ? (
                <Link href={`/mentors/${mentor.id}/timeslots`}>
                  <Button
                    className={cn(
                      "w-full border-0 font-semibold transition-all duration-200 group-hover:scale-105 text-xs md:text-xs py-1.5 md:py-1.5",
                      "text-white",
                      colorClass
                    )}
                    size="sm"
                  >
                    <Heart className="w-3 h-3 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                    Connect Now
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full border-0 font-semibold transition-all duration-200 text-xs md:text-xs py-1.5 md:py-1.5 bg-gray-400 text-white cursor-not-allowed"
                  size="sm"
                  disabled
                >
                  <Clock className="w-3 h-3 md:w-3 md:h-3 mr-1.5 md:mr-1" />
                  Currently Busy
                </Button>
              )}

              {/* Availability message - Compact desktop version */}
              <div className="hidden md:block">
                <div
                  className={cn(
                    "text-center text-xs font-medium transition-all duration-300",
                    mentor.available ? "text-green-600" : "text-red-600"
                  )}
                >
                  {mentor.available ? "Ready to book" : "Back soon"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const EnhancedMentorCarousel: React.FC<EnhancedMentorCarouselProps> = ({
  mentors,
  title,
  colorClass,
}) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    dragFree: false,
    containScroll: "trimSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!mentors || mentors.length === 0) {
    return (
      <div className="py-16">
        <h2 className="text-2xl font-bold text-center mb-8">{title}</h2>
        <div className="text-center text-gray-500">
          <p>No mentors available in this category yet.</p>
          <p className="text-sm mt-2">
            We&apos;re actively onboarding expert mentors. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  // Count available mentors
  const availableMentors = mentors.filter((mentor) => mentor.available);

  return (
    <section className="py-16">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Connect with our verified expert mentors. Each mentor brings real experience and genuine
          credentials to guide your wellness journey.
        </p>

        {/* Real Stats */}
        <div className="flex items-center justify-center space-x-8 mt-6">
          <div className="text-center">
            <div className={cn("text-2xl font-bold", colorClass.replace("bg-", "text-"))}>
              {mentors.length}
            </div>
            <div className="text-sm text-gray-600">Expert Mentors</div>
          </div>
          <div className="text-center">
            <div className={cn("text-2xl font-bold", colorClass.replace("bg-", "text-"))}>
              {availableMentors.length}
            </div>
            <div className="text-sm text-gray-600">Available Now</div>
          </div>
          <div className="text-center">
            <div className={cn("text-2xl font-bold", colorClass.replace("bg-", "text-"))}>
              {Math.round(
                mentors.reduce((sum, mentor) => sum + mentor.experience, 0) / mentors.length
              ) || 0}
            </div>
            <div className="text-sm text-gray-600">Avg. Experience (Years)</div>
          </div>
        </div>
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Navigation Buttons */}
        {mentors.length > 3 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
              onClick={scrollPrev}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm border-gray-300 hover:bg-white"
              onClick={scrollNext}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </>
        )}

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {mentors.map((mentor) => (
              <div key={mentor.id} className="flex-none w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 px-3">
                <MentorCard mentor={mentor} colorClass={colorClass} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default EnhancedMentorCarousel;
