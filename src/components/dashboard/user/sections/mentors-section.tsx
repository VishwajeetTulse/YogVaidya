"use client";

import React, { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Image from "next/image";
import { Calendar, Clock, Video, RefreshCw, Crown, Users, CheckCircle, Heart } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { type SectionProps } from "../types";
import { SubscriptionPrompt } from "../SubscriptionPrompt";
import { getUserMentor, type UserMentorData } from "@/lib/server/user-mentor-server";
import { DashboardSkeleton } from "../../unified/dashboard-skeleton";

interface UserMentorResponseData {
  subscriptionInfo: {
    plan: string | null;
    status: string;
    needsSubscription: boolean;
    nextBillingDate?: string | null;
    isTrialExpired?: boolean;
  };
  assignedMentor: UserMentorData | null;
  availableMentors: UserMentorData[];
  sessionStats: {
    totalScheduled: number;
    upcomingWithMentor: number;
    completedWithMentor: number;
  };
}

export const MentorsSection = ({ setActiveSection }: SectionProps) => {
  const { data: session } = useSession();
  const [mentorData, setMentorData] = useState<UserMentorResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Load user mentor data using server action
  useEffect(() => {
    const loadUserMentor = async () => {
      if (!session?.user) return;

      try {
        const result = await getUserMentor();

        if (result.success && result.data) {
          setMentorData(result.data);
        } else {
          console.error("Failed to load mentor data:", result.error);
          toast.error("Failed to load your mentor information");
        }
      } catch (error) {
        console.error("Error loading mentor data:", error);
        toast.error("Failed to load your mentor information");
      } finally {
        setLoading(false);
      }
    };

    loadUserMentor();
  }, [session]);

  // Refresh function for manual updates
  const refreshMentorData = async () => {
    startTransition(async () => {
      try {
        const result = await getUserMentor();

        if (result.success && result.data) {
          setMentorData(result.data);
          toast.success("Mentor information refreshed successfully");
        } else {
          toast.error("Failed to refresh mentor data");
        }
      } catch (error) {
        console.error("Error refreshing mentor data:", error);
        toast.error("Failed to refresh mentor data");
      }
    });
  };

  // Show loading state
  if (loading) {
    return <DashboardSkeleton />;
  }

  // Show subscription prompt if user needs subscription
  if (mentorData?.subscriptionInfo.needsSubscription) {
    return (
      <SubscriptionPrompt
        subscriptionStatus={mentorData.subscriptionInfo.status}
        subscriptionPlan={mentorData.subscriptionInfo.plan}
        nextBillingDate={mentorData.subscriptionInfo.nextBillingDate}
        isTrialExpired={mentorData.subscriptionInfo.isTrialExpired}
      />
    );
  }

  // If subscription is needed or inactive, show the subscription prompt screen
  if (
    mentorData?.subscriptionInfo.needsSubscription ||
    mentorData?.subscriptionInfo.status === "INACTIVE"
  ) {
    return (
      <SubscriptionPrompt
        subscriptionStatus={mentorData?.subscriptionInfo.status || "INACTIVE"}
        subscriptionPlan={mentorData?.subscriptionInfo.plan || null}
        nextBillingDate={mentorData?.subscriptionInfo.nextBillingDate}
        isTrialExpired={mentorData?.subscriptionInfo.isTrialExpired}
      />
    );
  }

  const getMentorTypeDisplay = (
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null
  ) => {
    if (mentorType === "YOGAMENTOR") return "Yoga Mentor";
    if (mentorType === "MEDITATIONMENTOR") return "Meditation Mentor";
    if (mentorType === "DIETPLANNER") return "Diet Planner";
    return "Mentor";
  };

  const getPlanTypeDisplay = (plan: string | null) => {
    if (plan === "SEED") return "SEED - Meditation Focus";
    if (plan === "BLOOM") return "BLOOM - Yoga Focus";
    if (plan === "FLOURISH") return "FLOURISH - Complete Access";
    return "No Plan";
  };

  const getMentorTypeIcon = (
    mentorType: "YOGAMENTOR" | "MEDITATIONMENTOR" | "DIETPLANNER" | null
  ) => {
    if (mentorType === "YOGAMENTOR") return <Video className="w-5 h-5 text-blue-600" />;
    if (mentorType === "MEDITATIONMENTOR") return <Heart className="w-5 h-5 text-purple-600" />;
    if (mentorType === "DIETPLANNER") return <Users className="w-5 h-5 text-green-600" />;
    return <Users className="w-5 h-5 text-gray-600" />;
  };

  const renderMentorCard = (mentor: UserMentorData, isAssigned: boolean = false) => {
    const avatarColors = isAssigned ? "from-[#876aff] to-[#a792fb]" : "from-[#ff7dac] to-[#ffa6c5]";

    return (
      <Card
        key={mentor.id}
        className={`p-6 transition-all duration-200 ${
          isAssigned
            ? "border-purple-200 bg-gradient-to-br from-purple-50/50 shadow-md"
            : "border-purple-100 hover:border-purple-200"
        }`}
      >
        <div className="text-center">
          {isAssigned && (
            <div className="flex items-center justify-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">Your Assigned Mentor</span>
            </div>
          )}

          <div
            className={`w-20 h-20 bg-gradient-to-br ${avatarColors} rounded-full mx-auto mb-4 flex items-center justify-center`}
          >
            {mentor.image ? (
              <Image
                src={mentor.image}
                alt={mentor.name || "Mentor"}
                width={100}
                height={100}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-xl font-semibold">
                {mentor.name?.charAt(0) || "M"}
              </span>
            )}
          </div>

          <h3 className="font-semibold text-lg">{mentor.name || "Mentor"}</h3>

          <div className="flex items-center justify-center gap-2 mt-1">
            {getMentorTypeIcon(mentor.mentorType)}
            <p className="text-gray-500 text-sm">{getMentorTypeDisplay(mentor.mentorType)}</p>
          </div>

          {/* Experience/Expertise */}
          {mentor.expertise && (
            <p className="text-xs text-gray-600 mt-1 line-clamp-2">{mentor.expertise}</p>
          )}

          {/* Experience Years */}
          {mentor.experience && (
            <p className="text-xs text-purple-600 mt-1 font-medium">
              {mentor.experience} years experience
            </p>
          )}

          {/* Session Statistics */}
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {mentor.totalSessions} sessions
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {mentor.upcomingSessions} upcoming
            </span>
          </div>

          {/* Certifications */}
          {mentor.certifications && (
            <div className="mt-2">
              <p className="text-xs text-blue-600 font-medium">
                Certified in {mentor.certifications.split(",")[0]}{" "}
                {mentor.certifications.split(",").length > 1 ? "& more" : ""}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex mt-4">
            <Button
              size="sm"
              className="flex-1 bg-[#76d2fa] hover:bg-[#5a9be9]"
              onClick={() => setActiveSection("classes")}
            >
              <Calendar className="w-4 h-4 mr-1" />
              View Sessions
            </Button>
          </div>
        </div>
      </Card>
    );
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Mentors</h1>
          <p className="text-gray-600 mt-2">
            Connect with your personal guides for{" "}
            {getPlanTypeDisplay(mentorData?.subscriptionInfo.plan || null).toLowerCase()}.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={refreshMentorData}
          disabled={isPending}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Subscription Info Card */}
      <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-medium">
                {getPlanTypeDisplay(mentorData?.subscriptionInfo.plan || null)}
              </h3>
              <p className="text-sm text-gray-600">
                Status: {mentorData?.subscriptionInfo.status} • Access to{" "}
                {mentorData?.subscriptionInfo.plan === "FLOURISH"
                  ? "all mentors"
                  : "specialized mentors"}
              </p>
            </div>
          </div>
          {mentorData?.sessionStats && (
            <div className="text-right">
              <p className="text-sm font-medium">
                {mentorData.sessionStats.totalScheduled} Total Sessions
              </p>
              <p className="text-xs text-gray-500">
                {mentorData.sessionStats.upcomingWithMentor} upcoming •{" "}
                {mentorData.sessionStats.completedWithMentor} completed
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Assigned Mentor Section */}
      {mentorData?.assignedMentor && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Assigned Mentor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {renderMentorCard(mentorData.assignedMentor, true)}
          </div>
        </div>
      )}

      {/* Empty State - No Assigned Mentor */}
      {!mentorData?.assignedMentor && (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Assigned Mentor Yet</h3>
          <p className="text-gray-500 mb-4">
            You don&apos;t have an assigned mentor yet. Browse available mentors to find your
            perfect yoga guide.
          </p>
          <Button
            onClick={() => setActiveSection("explore-mentors")}
            className="bg-[#876aff] hover:bg-[#7c5cff]"
          >
            Explore Available Mentors
          </Button>
        </div>
      )}
    </div>
  );
};
