"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles, User  } from "lucide-react";
import OurServices from "@/components/OurServices";
import PricingPlans from "@/components/PricingPlans";
import Footer from "@/components/Footer";

export default function YogaLandingPage() {
  return (
    <div className="bg-gray-100 min-h-screen overflow-x-hidden">
      <CustomStyles />
      
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-indigo-400 flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-5 h-5 text-white"
            >
              <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
            </svg>
          </div>
          <span className="text-2xl font-semibold text-gray-800">
            YogaVaidya
          </span>
        </div>

        <nav className="hidden md:flex items-center space-x-10">
          <Link
            href="#"
            className="text-gray-800 hover:text-indigo-600 transition-colors"
          >
            Home
          </Link>
          <Link
            href="#services"
            className="text-gray-800 hover:text-indigo-600 transition-colors"
          >
            Services
          </Link>
          <Link
            href="#plans"
            className="text-gray-800 hover:text-indigo-600 transition-colors"
          >
            Plans
          </Link>
          <Link
            href="#"
            className="text-gray-800 hover:text-indigo-600 transition-colors"
          >
            
          </Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-20 relative">
        <div className="absolute top-10 left-20">
          {/* <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M3.55 19.09L3.54 19.08C3.18 18.72 3 18.25 3 17.77C3 17.29 3.18 16.82 3.55 16.45L16.45 3.55C16.82 3.18 17.29 3 17.77 3C18.25 3 18.72 3.18 19.08 3.54L19.09 3.55C19.45 3.91 19.63 4.38 19.63 4.86C19.63 5.34 19.45 5.81 19.08 6.18L6.18 19.08C5.81 19.45 5.34 19.63 4.86 19.63C4.38 19.63 3.91 19.45 3.55 19.09Z"
              fill="black"
            />
            <path
              d="M13.89 21.5C13.59 21.5 13.29 21.41 13.04 21.24C12.79 21.07 12.61 20.83 12.5 20.56C12.4 20.29 12.39 19.99 12.47 19.71C12.55 19.43 12.71 19.18 12.93 18.99L18.99 12.93C19.18 12.71 19.43 12.55 19.71 12.47C19.99 12.39 20.29 12.4 20.56 12.5C20.83 12.61 21.07 12.79 21.24 13.04C21.41 13.29 21.5 13.59 21.5 13.89C21.5 14.29 21.34 14.68 21.06 14.96L15.01 21.01C14.73 21.34 14.32 21.5 13.89 21.5Z"
              fill="black"
            />
            <path
              d="M4.89 12.5C4.59 12.5 4.29 12.41 4.04 12.24C3.79 12.07 3.61 11.83 3.5 11.56C3.4 11.29 3.39 10.99 3.47 10.71C3.55 10.43 3.71 10.18 3.93 9.99L9.99 3.93C10.18 3.71 10.43 3.55 10.71 3.47C10.99 3.39 11.29 3.4 11.56 3.5C11.83 3.61 12.07 3.79 12.24 4.04C12.41 4.29 12.5 4.59 12.5 4.89C12.5 5.29 12.34 5.68 12.06 5.96L6.01 12.01C5.73 12.34 5.32 12.5 4.89 12.5Z"
              fill="black"
            />
          </svg> */}
          <Sparkles className="w-10 h-10 text-emerald-400" />
        </div>

        {/* Main Heading */}
        <div className="text-center mb-10">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Get better peace <br />
            of{" "}
            <span className="inline-block bg-green-400 px-4 py-1 rounded-md text-white">
              mind
            </span>
          </h1>
          <Button className="rounded-full bg-gray-900 hover:bg-gray-800 text-white px-8 py-6">
            Register Now
          </Button>
        </div>

        {/* Stats and Images */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-12 pt-10 relative">
          {/* Left Quote Section */}
          <div className="relative mx-auto md:mx-0 md:-mt-32 z-10">
            <div className="bg-[#76d2fa] rounded-2xl p-8 shadow-lg">
              <p className="text-[#876aff] italic mb-5">
                Awaken. Transform. Inspire.
              </p>
              <h3 className="text-4xl font-bold mb-6">
                <span className="text-[#FFF6E3]">Yoga And</span>
                <br />
                <span className="text-[#FFF6E3]">Meditation</span>
                <span className="text-[#FFF6E3]"> Elevating</span>
                <br />
                <span className="text-[#FFF6E3]"> The </span>
                <span className="text-[#ecc8ff] italic">Body</span>
                <span className="text-[#FFF6E3]">, </span>
                <span className="text-[#ecc8ff] italic"> Mind</span>
                <span className="text-[#FFF6E3]">, And </span>
                <span className="text-[#ecc8ff] italic">Soul</span>
                <span className="text-[#FFF6E3]">.</span>
              </h3>
            </div>
          </div>

          {/* Center Image */}
          <div className="relative mx-auto md:mx-0 flex items-center justify-center">
            <div className="absolute w-[450px] h-[450px] rounded-full bg-purple-100/40 animate-custom-pulse"></div>
            <div className="absolute w-[380px] h-[380px] rounded-full bg-purple-200/50 animate-custom-pulse-2"></div>
            <div className="absolute w-[310px] h-[310px] rounded-full bg-purple-300/60 animate-custom-pulse-3"></div>
            <div className="absolute w-[240px] h-[240px] rounded-full bg-purple-400/70 animate-custom-pulse-4"></div>
            <div className="relative z-10 w-[400px] h-[400px] flex items-center justify-center">
              <Image
                src="/assets/yoga-meditation-2.png"
                alt="Yoga meditation"
                width={380}
                height={380}
                className="object-contain scale-110"
              />
            </div>
          </div>

          {/* Right Stats */}
          <div className="mx-auto md:mx-0 md:w-full md:-mt-32">
            <div className="relative">
              <div className="absolute -inset-2 bg-[#FFCCEA]/20 rounded-3xl blur-sm"></div>
              <div className="bg-[#FFCCEA] rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex">
                  {/* Vertical Pink Image */}
                  <div className="w-1/3">
                    <Image
                      src="/assets/yoga-mat.jpg"
                      alt="Yoga with mat"
                      width={200}
                      height={300}
                      className="object-cover h-full min-h-[250px]"
                    />
                  </div>

                  {/* Stats Container */}
                  <div className="w-2/3 p-4">
                    {/* Stats with white background */}
                    <div className="bg-white rounded-xl p-4 shadow-md">
                      <div className="mb-4">
                        <h3 className="text-4xl font-bold text-[#95dcfa]">
                          80+
                        </h3>
                        <p className="text-gray-700 font-medium">
                          Yoga classes
                        </p>
                      </div>

                      <div>
                        <h3 className="text-4xl font-bold text-[#a792fb]">
                          400+
                        </h3>
                        <p className="text-gray-700 font-medium">Participant</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Services Section */}
      <OurServices />

      {/* Pricing Plans Section */}
      <PricingPlans />

      {/* Footer */}
      <Footer />
    </div>
  );
}

// Add this at the end of the file for the animation delays
const styles = `
  @keyframes customPulse {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.7;
      transform: scale(1.1);
    }
  }
  
  @keyframes customPulse2 {
    0%, 100% {
      opacity: 0.9;
      transform: scale(1);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.08);
    }
  }
  
  @keyframes customPulse3 {
    0%, 100% {
      opacity: 0.8;
      transform: scale(0.98);
    }
    50% {
      opacity: 0.5;
      transform: scale(1.06);
    }
  }
  
  @keyframes customPulse4 {
    0%, 100% {
      opacity: 0.7;
      transform: scale(0.95);
    }
    50% {
      opacity: 0.4;
      transform: scale(1.04);
    }
  }
  
  .animate-custom-pulse {
    animation: customPulse 4s ease-in-out infinite;
  }
  
  .animate-custom-pulse-2 {
    animation: customPulse2 5s ease-in-out infinite;
  }
  
  .animate-custom-pulse-3 {
    animation: customPulse3 6s ease-in-out infinite;
  }
  
  .animate-custom-pulse-4 {
    animation: customPulse4 7s ease-in-out infinite;
  }
  
  .animation-delay-1000 {
    animation-delay: 1000ms;
  }
  
  .animation-delay-2000 {
    animation-delay: 2000ms;
  }
  
  .animation-delay-3000 {
    animation-delay: 3000ms;
  }
`;

function CustomStyles() {
  return <style jsx global>{styles}</style>;
}
