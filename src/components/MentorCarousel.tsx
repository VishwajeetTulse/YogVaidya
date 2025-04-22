"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";

type Mentor = {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  imageUrl: string;
  available: boolean;
  description: string;
};

interface MentorCarouselProps {
  mentors: Mentor[];
  title: string;
  colorClass: string;
  buttonText: string;
  disabled?: boolean;
}

export default function MentorCarousel({
  mentors,
  title,
  colorClass,
  buttonText,
  disabled = false,
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
        <div
          className={`w-12 h-12 rounded-full ${colorClass}/20 flex items-center justify-center mr-4`}
        >
          <div className={`w-6 h-6 rounded-full ${colorClass}`}></div>
        </div>
        <h3 className="text-2xl font-bold text-gray-800">{title}</h3>
      </div>

      <div className="relative">
        {/* Navigation buttons */}
        {scrollSnaps.length > 1 && (
          <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full bg-white shadow-md ${
                !prevBtnEnabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={scrollPrev}
              disabled={!prevBtnEnabled}
            >
              <ChevronLeft className="h-5 w-5 text-gray-800" />
            </Button>
          </div>
        )}

        {scrollSnaps.length > 1 && (
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10">
            <Button
              variant="outline"
              size="icon"
              className={`rounded-full bg-white shadow-md ${
                !nextBtnEnabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-gray-100"
              }`}
              onClick={scrollNext}
              disabled={!nextBtnEnabled}
            >
              <ChevronRight className="h-5 w-5 text-gray-800" />
            </Button>
          </div>
        )}

        {/* Carousel */}
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {mentors.map((mentor) => (
              <div
                key={mentor.id}
                className="flex-grow-0 flex-shrink-0 w-full sm:w-1/2 lg:w-1/3 pl-0 pr-8"
              >
                <div
                  className={`bg-white rounded-2xl overflow-hidden transition-all hover:-translate-y-1 ${
                    disabled ? "opacity-70" : ""
                  }`}
                >
                  <div className={`relative h-64 ${colorClass}/10`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image
                        src={mentor.imageUrl}
                        alt={mentor.name}
                        width={150}
                        height={150}
                        className={`rounded-full ${
                          disabled ? "grayscale" : ""
                        }`}
                      />
                    </div>
                    {mentor.available && !disabled && (
                      <div className="absolute top-4 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        Available Now
                      </div>
                    )}
                    {disabled && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <span className="text-white font-bold">
                          Coming Soon
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-1">
                      {mentor.name}
                    </h4>
                    <p
                      className={`font-medium mb-3 ${
                        colorClass === "bg-[#76d2fa]"
                          ? "text-indigo-600"
                          : colorClass === "bg-[#ff7dac]"
                          ? "text-pink-600"
                          : "text-purple-600"
                      }`}
                    >
                      {mentor.specialty}
                    </p>
                    <p className="text-gray-600 mb-4">{mentor.description}</p>
                    <div className="flex items-center text-gray-500 mb-6">
                      <span className="text-sm">
                        {mentor.experience} experience
                      </span>
                    </div>
                    <Button
                      className={`w-full ${
                        colorClass === "bg-[#76d2fa]"
                          ? "bg-[#76d2fa] hover:bg-[#5a9be9]"
                          : colorClass === "bg-[#ff7dac]"
                          ? "bg-[#ff7dac] hover:bg-[#e56a97]"
                          : "bg-[#876aff] hover:bg-[#7258e6]"
                      } text-white ${disabled ? "opacity-50" : ""}`}
                      disabled={disabled}
                    >
                      {buttonText}
                    </Button>
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
                className={`w-2.5 h-2.5 rounded-full ${
                  index === selectedIndex ? colorClass : "bg-gray-300"
                }`}
                onClick={() => emblaApi?.scrollTo(index)}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
