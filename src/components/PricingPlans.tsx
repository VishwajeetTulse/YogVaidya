"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, IndianRupeeIcon } from "lucide-react";
import Link from "next/link";

export default function PricingPlans() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">(
    "monthly"
  );

  // Apply discount for annual billing
  const applyDiscount = (price: number) => {
    if (billingPeriod === "annual") {
      return Math.round(price * 0.8); // 20% discount for annual billing
    }
    return price;
  };

  return (
    <section className="py-24 relative overflow-hidden" id="plans">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100 to-[#f8f9fa] -z-10"></div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-16 relative">
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
            Choose Your Path
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Flexible pricing
            <br />
            for yogis of all levels
          </h2>

          {/* Billing period toggle */}
          <div className="inline-flex items-center bg-gray-200 p-1 rounded-full">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-[#76d2fa] text-white shadow-md"
                  : "bg-transparent text-gray-600 hover:bg-gray-300/50"
              }`}
            >
              MONTHLY
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                billingPeriod === "annual"
                  ? "bg-[#76d2fa] text-white shadow-md"
                  : "bg-transparent text-gray-600 hover:bg-gray-300/50"
              }`}
            >
              ANNUAL
            </button>
          </div>

          {billingPeriod === "annual" && (
            <div className="mt-4 text-green-600 font-medium animate-pulse">
              Save 20% with annual billing
            </div>
          )}
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {/* Basic Plan */}
          <div className="bg-gradient-to-b from-[#76d2fa] to-[#5a9be9] rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] h-full">
            <div className="p-8 flex flex-col h-full">
              {/* Plan header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-white"></div>
                  </div>
                  <span className="text-xs font-semibold bg-white/20 text-white px-4 py-1 rounded-full uppercase">
                    Seed
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end">
                  <span className="text-5xl font-bold text-white flex items-center">
                    <IndianRupeeIcon />
                    <span className="text-5xl font-bold text-white">
                      {applyDiscount(0)}
                    </span>
                  </span>
                  <span className="text-white/70 ml-2 mb-1">
                    / {billingPeriod === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <p className="text-white mt-2">Best for beginners</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mt-4 mb-8 flex-grow">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">One yoga session</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Basic yoga poses</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Online support</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Email assistance</span>
                </div>
              </div>

              {/* Button */}
              <Link href="/checkout?plan=seed" passHref>
                <Button 
                  className="mt-auto w-full py-6 rounded-xl bg-white text-[#5a9be9] hover:bg-white/90 transition-all duration-300 font-medium">
                  GET STARTED
                </Button>
              </Link>
            </div>
          </div>

          {/* Premium Plan - Highlighted */}
          <div className="bg-gradient-to-b from-[#CDC1FF] to-[#876aff] rounded-3xl overflow-hidden shadow-2xl transform md:scale-105 relative h-full z-10">
            <div className="p-8 flex flex-col h-full">
              {/* Popular badge */}
              <div className="absolute -right-12 top-6 bg-white text-[#876aff] text-xs font-bold px-12 py-1 transform rotate-45">
                POPULAR
              </div>

              {/* Plan header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-white"></div>
                  </div>
                  <span className="text-xs font-semibold bg-white/20 text-white px-4 py-1 rounded-full uppercase">
                    Bloom
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end">
                <span className="text-5xl font-bold text-white flex items-center">
                    <IndianRupeeIcon />
                    <span className="text-5xl font-bold text-white">
                      {applyDiscount(1999)}
                    </span>
                  </span>
                  <span className="text-white/70 ml-2 mb-1">
                    / {billingPeriod === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <p className="text-white mt-2">Most popular plan</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mt-4 mb-8 flex-grow">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Live yoga sessions (General)</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Generalized diet plans</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Chat with AI</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">
                    Meditation sessions (Coming soon)
                  </span>
                </div>
              </div>

              {/* Button */}
              <Link href="/checkout?plan=bloom" passHref>
                <Button className="mt-auto w-full py-6 rounded-xl bg-white text-[#876aff] hover:bg-white/90 transition-all duration-300 font-medium">
                  GET STARTED
                </Button>
              </Link>
            </div>
          </div>

          {/* Family Plan */}
          <div className="bg-gradient-to-b from-[#ffa6c5] to-[#ff7dac] rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] h-full">
            <div className="p-8 flex flex-col h-full">
              {/* Plan header */}
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                    <div className="w-7 h-7 rounded-full bg-white"></div>
                  </div>
                  <span className="text-xs font-semibold bg-white/20 text-white px-4 py-1 rounded-full uppercase">
                    Flourish
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-end">
                <span className="text-5xl font-bold text-white flex items-center">
                    <IndianRupeeIcon />
                    <span className="text-5xl font-bold text-white">
                      {applyDiscount(4999)}
                    </span>
                  </span>
                  <span className="text-white/70 ml-2 mb-1">
                    / {billingPeriod === "monthly" ? "mo" : "yr"}
                  </span>
                </div>
                <p className="text-white mt-2">Perfect for special needs</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mt-4 mb-8 flex-grow">
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Live yoga sessions (Individual)</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Personalized diet plans</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Chat with AI</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Meditation sessions (Coming soon)</span>
                </div>
              </div>

              {/* Button */}
              <Link href="/checkout?plan=flourish" passHref>
                <Button className="mt-auto w-full py-6 rounded-xl bg-white text-[#ff7dac] hover:bg-white/90 transition-all duration-300 font-medium">
                  GET STARTED
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Additional info */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <p className="text-gray-600">
            All plans include access to our mobile app, progress tracking, and
            community support. Not sure which plan is right for you? Try our
            7-day free trial on any plan.
          </p>
          <div className="mt-6 flex items-center justify-center space-x-4">
            <span className="flex items-center text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              No credit card required
            </span>
            <span className="flex items-center text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Cancel anytime
            </span>
            <span className="flex items-center text-sm text-gray-600">
              <Check className="h-4 w-4 text-green-500 mr-2" />
              Secure payments
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
