"use client";

import React, { useState, useEffect } from "react";
import { Calendar } from "lucide-react";
import { Card } from "@/components/ui/card";
import { type UserDetails } from "@/lib/userDetails";

interface SubscriptionCountdownProps {
  userDetails: UserDetails | null;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export const SubscriptionCountdown: React.FC<SubscriptionCountdownProps> = ({ userDetails }) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if user has an active subscription and next billing date
    // Don't show countdown during trial period
    if (
      !userDetails ||
      userDetails.subscriptionStatus !== "ACTIVE" ||
      !userDetails.nextBillingDate ||
      userDetails.isTrialActive
    ) {
      setIsActive(false);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date().getTime();
      const targetDate = new Date(userDetails.nextBillingDate!).getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        const timeData = { days, hours, minutes, seconds };
        setTimeRemaining(timeData);

        // Only show the countdown when 10 days or less remaining
        setIsActive(days <= 10);
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsActive(true); // Show when expired
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [userDetails]);

  // Don't render if user doesn't have active subscription
  if (!isActive || !timeRemaining) {
    return null;
  }

  const formatNumber = (num: number) => num.toString().padStart(2, "0");

  // Determine urgency level based on days remaining
  const getUrgencyLevel = () => {
    if (!timeRemaining) return "normal";
    if (timeRemaining.days <= 3) return "critical";
    if (timeRemaining.days <= 7) return "warning";
    return "normal";
  };

  const urgencyLevel = getUrgencyLevel();

  // Dynamic styling based on urgency
  const getCardStyles = () => {
    switch (urgencyLevel) {
      case "critical":
        return "mx-2 mb-2 p-3 bg-gradient-to-br from-red-50 to-red-100 border border-red-300";
      case "warning":
        return "mx-2 mb-2 p-3 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-300";
      default:
        return "mx-2 mb-2 p-3 bg-gradient-to-br from-[#76d2fa]/5 to-[#5a9be9]/5 border border-[#76d2fa]/20";
    }
  };

  const getTimerStyles = () => {
    switch (urgencyLevel) {
      case "critical":
        return "bg-gradient-to-br from-red-500 to-red-600 text-white";
      case "warning":
        return "bg-gradient-to-br from-orange-500 to-orange-600 text-white";
      default:
        return "bg-gradient-to-br from-[#76d2fa] to-[#5a9be9] text-white";
    }
  };

  const getHeaderText = () => {
    if (timeRemaining?.days === 0) return "Subscription Expires Today!";
    if (timeRemaining?.days === 1) return "Subscription Expires Tomorrow!";
    return "Next Billing Cycle";
  };

  return (
    <Card className={getCardStyles()}>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <Calendar className="w-3 h-3" />
          <span className="font-medium">{getHeaderText()}</span>
        </div>

        <div className="flex items-center justify-center gap-1 text-xs">
          <div
            className={`flex flex-col items-center ${getTimerStyles()} rounded px-1.5 py-1 min-w-[28px]`}
          >
            <span className="font-bold text-xs leading-none">
              {formatNumber(timeRemaining.days)}
            </span>
            <span className="text-[9px] leading-none">days</span>
          </div>
          <span className="text-gray-400 font-bold">:</span>
          <div
            className={`flex flex-col items-center ${getTimerStyles()} rounded px-1.5 py-1 min-w-[28px]`}
          >
            <span className="font-bold text-xs leading-none">
              {formatNumber(timeRemaining.hours)}
            </span>
            <span className="text-[9px] leading-none">hrs</span>
          </div>
          <span className="text-gray-400 font-bold">:</span>
          <div
            className={`flex flex-col items-center ${getTimerStyles()} rounded px-1.5 py-1 min-w-[28px]`}
          >
            <span className="font-bold text-xs leading-none">
              {formatNumber(timeRemaining.minutes)}
            </span>
            <span className="text-[9px] leading-none">min</span>
          </div>
          <span className="text-gray-400 font-bold">:</span>
          <div
            className={`flex flex-col items-center ${getTimerStyles()} rounded px-1.5 py-1 min-w-[28px]`}
          >
            <span className="font-bold text-xs leading-none">
              {formatNumber(timeRemaining.seconds)}
            </span>
            <span className="text-[9px] leading-none">sec</span>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[10px] text-gray-500 leading-tight">
            Until renewal on{" "}
            {userDetails?.nextBillingDate
              ? new Date(userDetails.nextBillingDate).toLocaleDateString()
              : "N/A"}
          </p>
        </div>
      </div>
    </Card>
  );
};
