"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

function WelcomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const startTrial = async () => {
      try {
        // First start the trial for new users
        const response = await fetch("/api/users/start-trial", { method: "POST" });
        const result = await response.json();

        if (result.success) {
          if (result.data?.user) {
            // A new trial was started
            toast.success("Welcome! Your free trial has started.");
          } else {
            // User already has a subscription or used a trial
            toast.info("Welcome back!");
          }
        } else {
          // Handle cases where the API call fails but we shouldn't block the user
          if (
            result.error &&
            result.message !== "User already has subscription or has used trial"
          ) {
            toast.error("Could not start free trial.", { description: result.error });
          }
        }

        // Then check if user has phone number
        const profileResponse = await fetch("/api/users/profile", { cache: "no-store" });
        const profileResult = await profileResponse.json();

        if (profileResult.success && !profileResult.data?.phone) {
          // User doesn't have phone number, redirect to profile completion
          const from = searchParams.get("from");
          let finalRedirect = "/dashboard";
          if (from === "pricing") {
            finalRedirect = "/pricing";
          } else if (from === "mentor") {
            finalRedirect = "/mentors/apply";
          }

          // Add delay to show success message before redirecting to profile completion
          setTimeout(() => {
            router.replace(`/complete-profile?redirectTo=${encodeURIComponent(finalRedirect)}`);
          }, 2000);
          return;
        }
      } catch (err) {
        console.error("Error starting trial:", err);
        toast.error("An error occurred while setting up your account.");
      } finally {
        // Only redirect if user has phone number
        const profileResponse = await fetch("/api/users/profile", { cache: "no-store" });
        const profileResult = await profileResponse.json();

        if (profileResult.success && profileResult.data?.phone) {
          const from = searchParams.get("from");
          let redirect_url = "/dashboard";
          if (from === "pricing") {
            redirect_url = "/pricing";
          } else if (from === "mentor") {
            redirect_url = "/mentors/apply";
          }

          // Add delay to show success message
          setTimeout(() => {
            router.replace(redirect_url);
          }, 2000);
        }
      }
    };

    startTrial();
  }, [router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        {/* Animated loading spinner with YogVaidya colors */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Outer spinning ring */}
          <div className="w-20 h-20 border-4 border-transparent border-t-[#76d2fa] border-r-[#5abe9b] rounded-full animate-spin" />
          {/* Inner pulsing dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gradient-to-r from-[#76d2fa] to-[#5abe9b] rounded-full animate-pulse" />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">Setting up your account...</h1>
        <p className="text-gray-600 text-lg">
          Please wait while we get things ready for your wellness journey.
        </p>

        {/* Additional decorative elements */}
        <div className="flex justify-center items-center mt-6 space-x-1">
          <div className="w-2 h-2 bg-[#76d2fa] rounded-full animate-bounce" />
          <div
            className="w-2 h-2 bg-[#5abe9b] rounded-full animate-bounce"
            style={{ animationDelay: "0.1s" }}
          />
          <div
            className="w-2 h-2 bg-[#5a9be9] rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          />
        </div>
      </div>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#f0f9ff] via-white to-[#f0fdf4]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#5abe9b] mx-auto" />
          </div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
