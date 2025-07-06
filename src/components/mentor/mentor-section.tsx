"use client";

import React from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { UserPlus, Check } from "lucide-react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import MentorCarousel from "@/components/mentor/MentorCarousel";
import Link from "next/link";

// Sample mentor data by category
const MENTORS_DATA = {
  liveSession: [
    {
      id: 1,
      name: "Priya Sharma",
      specialty: "Hatha Yoga",
      experience: "10+ years",
      imageUrl: "/assets/mentor-1.svg",
      available: true,
      description: "Specializes in gentle, alignment-focused yoga practices for all levels.",
    },
    {
      id: 2,
      name: "Priya Sharma",
      specialty: "Hatha Yoga",
      experience: "10+ years",
      imageUrl: "/assets/mentor-1.svg",
      available: true,
      description: "Specializes in gentle, alignment-focused yoga practices for all levels.",
    },
    {
      id: 3,
      name: "Priya Sharma",
      specialty: "Hatha Yoga",
      experience: "10+ years",
      imageUrl: "/assets/mentor-1.svg",
      available: true,
      description: "Specializes in gentle, alignment-focused yoga practices for all levels.",
    },
    {
      id: 4,
      name: "Priya Sharma",
      specialty: "Hatha Yoga",
      experience: "10+ years",
      imageUrl: "/assets/mentor-1.svg",
      available: true,
      description: "Specializes in gentle, alignment-focused yoga practices for all levels.",
    },
    {
      id: 5,
      name: "Raj Patel",
      specialty: "Ashtanga Yoga",
      experience: "8 years",
      imageUrl: "/assets/mentor-2.svg",
      available: true,
      description: "Expert in dynamic, physically demanding practice with synchronized breathing.",
    },
    {
      id: 6,
      name: "Meena Verma",
      specialty: "Vinyasa Flow",
      experience: "6 years",
      imageUrl: "/assets/mentor-2.svg",
      available: true,
      description: "Specializes in fluid, movement-intensive yoga sequences that build strength and flexibility.",
    },
    {
      id: 7,
      name: "Vikram Reddy",
      specialty: "Power Yoga",
      experience: "7 years",
      imageUrl: "/assets/mentor-2.svg",
      available: true,
      description: "Teaches vigorous, fitness-based approach to vinyasa-style yoga for energy and vitality.",
    },
  ],
  dietPlanning: [
    {
      id: 5,
      name: "Meera Joshi",
      specialty: "Ayurvedic Nutrition",
      experience: "15 years",
      imageUrl: "/assets/mentor-3.svg",
      available: true,
      description: "Creates customized diet plans based on Ayurvedic principles and body types.",
    },
    {
      id: 6,
      name: "Arjun Kapoor",
      specialty: "Holistic Nutrition",
      experience: "9 years",
      imageUrl: "/assets/mentor-3.svg",
      available: true,
      description: "Designs balanced meal plans to complement your yoga practice and lifestyle goals.",
    },
  ],
  meditation: [
    {
      id: 7,
      name: "Ananya Gupta",
      specialty: "Mindfulness Meditation",
      experience: "12 years",
      imageUrl: "/assets/mentor-1.svg",
      available: false,
      description: "Guides practitioners through focused awareness and presence techniques.",
    },
    {
      id: 8,
      name: "Rohan Sharma",
      specialty: "Transcendental Meditation",
      experience: "10 years",
      imageUrl: "/assets/mentor-1.svg",
      available: false,
      description: "Expert in mantra-based meditation practices for deep relaxation and stress relief.",
    },
  ],
};

export default function MentorsPage() {
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Navbar with back button */}
      <Navbar showBackButton={true} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-10 relative">
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
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

        {/* Live Session Mentors */}
        <MentorCarousel 
          mentors={MENTORS_DATA.liveSession}
          title="Live Session Mentors"
          colorClass="bg-[#76d2fa]"
          buttonText="Book Session"
        />

        {/* Diet Planning Mentors */}
        <MentorCarousel 
          mentors={MENTORS_DATA.dietPlanning}
          title="Diet Planning Experts"
          colorClass="bg-[#ff7dac]"
          buttonText="Book Consultation"
        />

        {/* Meditation Mentors - Coming Soon */}
        <MentorCarousel 
          mentors={MENTORS_DATA.meditation}
          title="Meditation Guides"
          colorClass="bg-[#876aff]"
          buttonText="Join Waitlist"
          disabled={true}
        />

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
