"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Link from "next/link";

type Mentor = {
  id: string | number;
  name: string;
  specialty: string;
  experience: number; // Changed from string to number
  imageUrl: string;
  available: boolean;
  description: string;
};

interface MentorCarouselProps {
  mentors: Mentor[];
  title: string;
  colorClass: string;
}

export default function MentorCarousel({
  mentors,
  title,
  colorClass,
}: MentorCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: "start",
    skipSnaps: false,
  });
  const [prevBtnEnabled, setPrevBtnEnabled] = useState(false);
  const [nextBtnEnabled, setNextBtnEnabled] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

  const scrollPrev = useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi]
  );
  const scrollNext = useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi]
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
    setPrevBtnEnabled(emblaApi.canScrollPrev());
    setNextBtnEnabled(emblaApi.canScrollNext());
  }, [emblaApi, setSelectedIndex]);

  useEffect(() => {
    if (!emblaApi) return;

    onSelect();
    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
    };
  }, [emblaApi, setScrollSnaps, onSelect]);

  return (
    <div className="mb-20">
      <div className="flex items-center mb-8">
        <div className="flex items-center">
          <div
            className={`w-2 h-8 rounded-full ${
              colorClass === "bg-[#76d2fa]"
                ? "bg-blue-500"
                : colorClass === "bg-[#ff7dac]"
                ? "bg-pink-500"
                : "bg-purple-500"
            } mr-4`}
          ></div>
          <h3 className="text-2xl font-semibold text-gray-900">{title}</h3>
        </div>
      </div>

      <div className="relative">
        {/* Empty State */}
        {mentors.length === 0 && (
          <div className="text-center py-12">
            <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
              colorClass === "bg-[#76d2fa]"
                ? "bg-blue-100"
                : colorClass === "bg-[#ff7dac]"
                ? "bg-pink-100"
                : "bg-purple-100"
            }`}>
              <svg className={`w-8 h-8 ${
                colorClass === "bg-[#76d2fa]"
                  ? "text-blue-400"
                  : colorClass === "bg-[#ff7dac]"
                  ? "text-pink-400"
                  : "text-purple-400"
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-700 mb-2">
              No mentors available yet
            </h4>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              We&apos;re currently reviewing applications for this category. Check back soon or apply to become a mentor!
            </p>
            <Link href="/mentors/apply">
              <Button className={`${
                colorClass === "bg-[#76d2fa]"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : colorClass === "bg-[#ff7dac]"
                  ? "bg-pink-600 hover:bg-pink-700"
                  : "bg-purple-600 hover:bg-purple-700"
              } text-white`}>
                Apply as Mentor
              </Button>
            </Link>
          </div>
        )}

        {/* Show carousel only if mentors exist */}
        {mentors.length > 0 && (
          <>
            {/* Navigation buttons */}
            {scrollSnaps.length > 1 && (
              <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full bg-white border-gray-200 shadow-sm ${
                    !prevBtnEnabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={scrollPrev}
                  disabled={!prevBtnEnabled}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            )}

            {scrollSnaps.length > 1 && (
              <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
                <Button
                  variant="outline"
                  size="icon"
                  className={`rounded-full bg-white border-gray-200 shadow-sm ${
                    !nextBtnEnabled
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-50 hover:border-gray-300"
                  }`}
                  onClick={scrollNext}
                  disabled={!nextBtnEnabled}
                >
                  <ChevronRight className="h-5 w-5 text-gray-600" />
                </Button>
              </div>
            )}

            {/* Carousel */}
            <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="flex-grow-0 flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 xl:w-1/4 pl-0 pr-4"
              >
                <div
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-gray-200"
                >
                  <div className={`relative p-5 ${
                    colorClass === "bg-[#76d2fa]"
                      ? "bg-gradient-to-br from-blue-50 to-blue-100"
                      : colorClass === "bg-[#ff7dac]"
                      ? "bg-gradient-to-br from-pink-50 to-pink-100"
                      : "bg-gradient-to-br from-purple-50 to-purple-100"
                  }`}>
                    <div className="flex justify-center">
                      <div className="relative">
                        <Image
                          src={mentor.imageUrl || "/assets/default-avatar.svg"}
                          alt={mentor.name}
                          width={90}
                          height={90}
                          className="rounded-full border-3 border-white shadow-md"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/default-avatar.svg";
                          }}
                        />
                        {mentor.available && (
                          <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow-sm">
                            Available
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="text-center mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        {mentor.name}
                      </h4>
                      <p className={`text-xs font-medium px-3 py-1 rounded-full inline-block ${
                        colorClass === "bg-[#76d2fa]"
                          ? "bg-blue-100 text-blue-700"
                          : colorClass === "bg-[#ff7dac]"
                          ? "bg-pink-100 text-pink-700"
                          : "bg-purple-100 text-purple-700"
                      }`}>
                        {mentor.specialty}
                      </p>
                    </div>
                    
                    {mentor.description && (
                      <p className="text-gray-600 text-xs leading-relaxed mb-3 text-center line-clamp-2">
                        {mentor.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-center text-gray-500 mb-4">
                      <div className={`flex items-center px-2 py-1 rounded-full ${
                        colorClass === "bg-[#76d2fa]"
                          ? "bg-blue-50"
                          : colorClass === "bg-[#ff7dac]"
                          ? "bg-pink-50"
                          : "bg-purple-50"
                      }`}>
                        <svg className="w-3 h-3 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-xs font-medium text-gray-600">
                          {mentor.experience} years
                        </span>
                      </div>
                    </div>
                    
                    <Link href="/pricing" className="block">
                      <Button
                        className={`w-full font-medium py-2 text-sm transition-all duration-200 ${
                          colorClass === "bg-[#76d2fa]"
                            ? "bg-blue-400 hover:bg-blue-500 text-white shadow-sm hover:shadow-md"
                            : colorClass === "bg-[#ff7dac]"
                            ? "bg-pink-400 hover:bg-pink-500 text-white shadow-sm hover:shadow-md"
                            : "bg-purple-400 hover:bg-purple-500 text-white shadow-sm hover:shadow-md"
                        }`}
                      >
                        Get Subscription
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

            {/* Dots */}
            {scrollSnaps.length > 1 && (
              <div className="flex justify-center mt-6 space-x-2">
                {scrollSnaps.map((_, index) => (
                  <button
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                      index === selectedIndex 
                        ? "bg-gray-800 w-6" 
                        : "bg-gray-300 hover:bg-gray-400"
                    }`}
                    onClick={() => emblaApi?.scrollTo(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

