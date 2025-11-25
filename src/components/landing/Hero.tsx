"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function Hero() {
  return (
    <section className="max-w-7xl mx-auto px-4 pt-10 pb-20 relative">
      <div className="absolute top-10 right-20">
        <Sparkles className="w-20 h-20 text-emerald-200" />
      </div>

      {/* Main Heading */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Get better peace <br />
          of{" "}
          <span className="inline-block bg-green-400 mt-2 px-4 py-1 rounded-md text-white">
            mind
          </span>
        </h1>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href="/signup?from=hero">
            <Button className="rounded-full bg-gray-900 hover:bg-gray-800 text-white px-8 py-6">
              Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats and Images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-12 pt-10 relative">
        {/* Left Quote Section */}
        <div className="relative mx-auto md:mx-0 md:-mt-32 z-10">
          <div className="bg-[#76d2fa] rounded-2xl p-8 shadow-lg">
            <p className="text-[#876aff] italic mb-5">Awaken. Transform. Inspire.</p>
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
          <div className="absolute w-[450px] h-[450px] rounded-full bg-purple-100/40 animate-custom-pulse" />
          <div className="absolute w-[380px] h-[380px] rounded-full bg-purple-200/50 animate-custom-pulse-2" />
          <div className="absolute w-[310px] h-[310px] rounded-full bg-purple-300/60 animate-custom-pulse-3" />
          <div className="absolute w-[240px] h-[240px] rounded-full bg-purple-400/70 animate-custom-pulse-4" />
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
            <div className="absolute -inset-2 bg-[#FFCCEA]/20 rounded-3xl blur-sm" />
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
                      <h3 className="text-4xl font-bold text-[#95dcfa]">80+</h3>
                      <p className="text-gray-700 font-medium">Yoga classes</p>
                    </div>

                    <div>
                      <h3 className="text-4xl font-bold text-[#a792fb]">400+</h3>
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
  );
}
