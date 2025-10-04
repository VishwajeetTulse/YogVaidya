"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, IndianRupeeIcon, Crown, Star, Sparkles } from "lucide-react";
import Link from "next/link";

export default function PlansDashboard() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");

  // Apply discount for annual billing
  const applyDiscount = (price: number) => {
    if (billingPeriod === "annual") {
      return Math.round(price * 0.8); // 20% discount for annual billing
    }
    return price;
  };

  const plans = [
    {
      id: "seed",
      name: "Seed",
      price: 1999,
      originalPrice: 1999,
      description: "Perfect for meditation enthusiasts",
      gradient: "from-[#76d2fa] to-[#5a9be9]",
      textColor: "text-[#5a9be9]",
      icon: <Star className="w-7 h-7 text-white" />,
      features: ["Live meditation sessions", "Basic meditation guides", "Online support"],
      isPopular: false,
    },
    {
      id: "bloom",
      name: "Bloom",
      price: 1999,
      originalPrice: 1999,
      description: "Perfect for yoga enthusiasts",
      gradient: "from-[#CDC1FF] to-[#876aff]",
      textColor: "text-[#876aff]",
      icon: <Crown className="w-7 h-7 text-white" />,
      features: ["Live yoga sessions", "Pose guidance and corrections", "Online Support"],
      isPopular: true,
    },
    {
      id: "flourish",
      name: "Flourish",
      price: 4999,
      originalPrice: 4999,
      description: "Complete wellness journey",
      gradient: "from-[#ffa6c5] to-[#ff7dac]",
      textColor: "text-[#ff7dac]",
      icon: <Sparkles className="w-7 h-7 text-white" />,
      features: ["Live yoga sessions", "Live meditation sessions", "Personalized diet plan"],
      isPopular: false,
    },
  ];

  return (
    <section className="py-12 relative overflow-hidden" id="plans">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white -z-10" />
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#76d2fa]/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-[#FFCCEA]/10 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-12 relative">
          <span className="inline-block px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium mb-4">
            Your Plans
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6">
            Choose the perfect plan
            <br />
            for your wellness journey
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
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-gradient-to-b ${plan.gradient} rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:translate-y-[-8px] h-full ${
                plan.isPopular ? "transform md:scale-105 relative z-10" : ""
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -right-12 top-6 bg-white text-[#876aff] text-xs font-bold px-12 py-1 transform rotate-45">
                  POPULAR
                </div>
              )}

              <div className="p-8 flex flex-col h-full">
                {/* Plan header */}
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                      {plan.icon}
                    </div>
                    <span className="text-xs font-semibold bg-white/20 text-white px-4 py-1 rounded-full uppercase">
                      {plan.name}
                    </span>
                  </div>
                </div>
                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-end">
                    <span className="text-5xl font-bold text-white flex items-center">
                      <IndianRupeeIcon className="w-8 h-8" />
                      <span className="text-5xl font-bold text-white">
                        {applyDiscount(plan.price)}
                      </span>
                    </span>
                    <span className="text-white/70 ml-2 mb-1">/ mo</span>
                  </div>
                  <p className="text-white mt-2">{plan.description}</p>
                </div>
                {/* Features */}
                <div className="space-y-4 mt-4 mb-8 flex-grow">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-white mr-3 flex-shrink-0" />
                      <span className="text-white">{feature}</span>
                    </div>
                  ))}
                </div>{" "}
                {/* Button */}
                <Link href={`/checkout?plan=${plan.id}&billing=${billingPeriod}`} passHref>
                  <Button
                    className={`mt-auto w-full py-6 rounded-xl bg-white ${plan.textColor} hover:bg-white/90 transition-all duration-300 font-medium`}
                  >
                    {plan.id === "seed" ? "GET STARTED" : "UPGRADE NOW"}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Additional info */}
        <div className="text-center mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Why choose Yoga Vaidya?</h3>
          <p className="text-gray-600">
            All plans include access to our mobile app, progress tracking, and community support.
            Not sure which plan is right for you? Try our 7-day free trial on any plan.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
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
