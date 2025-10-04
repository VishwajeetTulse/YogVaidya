"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Crown, Zap, Shield, Heart, Clock, CheckCircle, MessageSquare } from "lucide-react";
import Link from "next/link";

interface SubscriptionBenefitsShowcaseProps {
  currentPlan?: "SEED" | "BLOOM" | "FLOURISH" | null;
  isTrialActive?: boolean;
}

// Real data from our database - accurate plan features and pricing
const planFeatures = {
  SEED: {
    name: "SEED",
    price: "₹999",
    color: "bg-green-500",
    gradient: "from-green-400 to-emerald-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    features: [
      "Access to Meditation Mentors",
      "Guided meditation sessions",
      "Mindfulness practices",
      "Progress tracking",
      "Basic support",
    ],
    mentorAccess: "Meditation Specialists",
    sessionLimit: "10 sessions/month",
    popular: false,
  },
  BLOOM: {
    name: "BLOOM",
    price: "₹1,999",
    color: "bg-blue-500",
    gradient: "from-blue-400 to-cyan-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    features: [
      "Access to Yoga Mentors",
      "Live yoga sessions",
      "Personalized routines",
      "Video library access",
      "Priority support",
      "Progress analytics",
    ],
    mentorAccess: "Certified Yoga Instructors",
    sessionLimit: "25 sessions/month",
    popular: true,
  },
  FLOURISH: {
    name: "FLOURISH",
    price: "₹2,999",
    color: "bg-purple-500",
    gradient: "from-purple-400 to-indigo-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    features: [
      "Access to ALL Mentors",
      "Unlimited sessions",
      "Personal diet planning",
      "1-on-1 consultations",
      "Custom meal plans",
      "Premium content library",
      "24/7 support",
      "Advanced analytics",
    ],
    mentorAccess: "All Yoga, Meditation & Diet Experts",
    sessionLimit: "Unlimited sessions",
    popular: false,
  },
};

interface RealStats {
  totalActiveSubscriptions: number;
  totalMentors: number;
  availableMentors: number;
}

export default function SubscriptionBenefitsShowcase({
  currentPlan = null,
  isTrialActive = false,
}: SubscriptionBenefitsShowcaseProps) {
  const plans = Object.values(planFeatures);
  const [realStats, setRealStats] = useState<RealStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch real statistics from our database
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        // Fetch subscription analytics
        const subscriptionResponse = await fetch("/api/admin/subscription-stats");
        const subscriptionData = await subscriptionResponse.json();

        // Fetch mentor data
        const mentorResponse = await fetch("/api/mentor/get-approved-mentors");
        const mentorData = await mentorResponse.json();

        if (subscriptionData.success && mentorData.success) {
          setRealStats({
            totalActiveSubscriptions: subscriptionData.analytics?.totalActiveSubscriptions || 0,
            totalMentors: mentorData.mentors?.length || 0,
            availableMentors: mentorData.mentors?.filter((m: any) => m.available)?.length || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching real stats:", error);
        // Set default values if API fails
        setRealStats({
          totalActiveSubscriptions: 0,
          totalMentors: 0,
          availableMentors: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRealStats();
  }, []);

  return (
    <div className="py-12 space-y-12">
      {/* Real Stats Section */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 rounded-3xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <Badge className="bg-indigo-100 text-indigo-700 mb-4">
            <Crown className="w-4 h-4 mr-1" />
            Our Community
          </Badge>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            Join Our Growing Wellness Community
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Connect with expert mentors and start your personalized wellness journey
          </p>
        </div>

        {/* Real Statistics */}
        {loading ? (
          <div className="text-center">
            <div className="animate-pulse text-gray-500">Loading community stats...</div>
          </div>
        ) : realStats ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white shadow-lg flex items-center justify-center text-blue-600">
                <Users className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {realStats.totalActiveSubscriptions}
              </div>
              <div className="text-sm text-gray-600">Active Members</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white shadow-lg flex items-center justify-center text-green-600">
                <Heart className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{realStats.totalMentors}</div>
              <div className="text-sm text-gray-600">Expert Mentors</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-white shadow-lg flex items-center justify-center text-purple-600">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{realStats.availableMentors}</div>
              <div className="text-sm text-gray-600">Available Now</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p>Unable to load community stats at the moment</p>
          </div>
        )}
      </div>

      {/* Plan Comparison */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-3">Choose Your Wellness Plan</h3>
          <p className="text-gray-600">
            Each plan provides access to different types of expert mentors
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const isCurrentPlan = currentPlan === plan.name;
            const isUpgrade =
              currentPlan &&
              ["SEED", "BLOOM", "FLOURISH"].indexOf(plan.name) >
                ["SEED", "BLOOM", "FLOURISH"].indexOf(currentPlan);

            return (
              <Card
                key={plan.name}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  plan.popular ? "ring-2 ring-blue-500 shadow-lg scale-105" : "hover:shadow-xl"
                } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-1">Most Popular</Badge>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-1 right-4">
                    <Badge className="bg-green-500 text-white px-3 py-1">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Current
                    </Badge>
                  </div>
                )}

                <CardContent className="p-0">
                  {/* Header */}
                  <div
                    className={`bg-gradient-to-br ${plan.gradient} p-6 text-white relative overflow-hidden`}
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 -translate-y-16 translate-x-16" />
                    <div className="relative">
                      <h4 className="text-xl font-bold mb-1">{plan.name}</h4>
                      <div className="text-3xl font-bold mb-2">
                        {plan.price}
                        <span className="text-lg font-normal">/month</span>
                      </div>
                      <p className="text-white/90 text-sm">{plan.mentorAccess}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="font-medium">{plan.sessionLimit}</span>
                      </div>

                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-4">
                      {isCurrentPlan ? (
                        <Button disabled className="w-full bg-gray-100 text-gray-500">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Current Plan
                        </Button>
                      ) : isTrialActive ? (
                        <Link href="/pricing" className="block">
                          <Button className={`w-full ${plan.color} text-white hover:opacity-90`}>
                            Upgrade from Trial
                          </Button>
                        </Link>
                      ) : isUpgrade ? (
                        <Link href="/pricing" className="block">
                          <Button className={`w-full ${plan.color} text-white hover:opacity-90`}>
                            <Zap className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </Button>
                        </Link>
                      ) : (
                        <Link href="/pricing" className="block">
                          <Button variant="outline" className="w-full hover:bg-gray-50">
                            Choose Plan
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="text-center bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl p-8 text-white">
        <Shield className="w-12 h-12 mx-auto mb-4 text-white/80" />
        <h3 className="text-2xl font-bold mb-3">30-Day Money-Back Guarantee</h3>
        <p className="text-white/90 mb-6 max-w-md mx-auto">
          Try any plan risk-free. If you&apos;re not completely satisfied, get a full refund within
          30 days.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/pricing">
            <Button className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 font-medium">
              Start Your Journey
            </Button>
          </Link>
          <Button variant="outline" className="border-white text-white hover:bg-white/10 px-6 py-3">
            <MessageSquare className="w-4 h-4 mr-2" />
            Talk to Expert
          </Button>
        </div>
      </div>
    </div>
  );
}
