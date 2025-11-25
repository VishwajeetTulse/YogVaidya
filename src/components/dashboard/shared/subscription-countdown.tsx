"use client";

import React, { useState, useEffect } from "react";
import { Calendar, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type UserDetails } from "@/lib/userDetails";
import Link from "next/link";

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
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    // Don't show for mentors - they don't need subscriptions
    // Don't show during trial period
    if (
      !userDetails ||
      userDetails.role === "MENTOR" ||
      userDetails.isTrialActive
    ) {
      setIsActive(false);
      setIsExpired(false);
      return;
    }

    // Check if subscription is expired or inactive
    if (
      userDetails.subscriptionStatus === "EXPIRED" ||
      userDetails.subscriptionStatus === "INACTIVE"
    ) {
      setIsExpired(true);
      setIsActive(true);
      setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    // For active subscriptions, show countdown
    if (userDetails.subscriptionStatus !== "ACTIVE" || !userDetails.nextBillingDate) {
      setIsActive(false);
      setIsExpired(false);
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
        setIsExpired(false);
      } else {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setIsActive(true);
        setIsExpired(true);
      }
    };

    // Calculate immediately
    calculateTimeRemaining();

    // Update every second
    const timer = setInterval(calculateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [userDetails]);

  // Don't render if not active
  if (!isActive) {
    return null;
  }

  // Show expired subscription card
  if (isExpired) {
    return (
      <Card className="mx-2 mb-2 p-3 bg-gradient-to-br from-red-50 to-red-100 border border-red-300">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-semibold">Subscription Expired</span>
          </div>
          <p className="text-[11px] text-red-600 leading-tight">
            Your subscription has expired. Renew now to continue accessing all features.
          </p>
          <Link href="/pricing">
            <Button 
              size="sm" 
              className="w-full mt-1 bg-red-600 hover:bg-red-700 text-white text-xs h-7"
            >
              Renew Subscription
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  // Show countdown timer (only if timeRemaining is set)
  if (!timeRemaining) {
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
