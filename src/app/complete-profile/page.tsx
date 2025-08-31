"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useSearchParams, useRouter } from "next/navigation";
import ProfileCompletionForm from "@/components/forms/ProfileCompletionForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function CompleteProfilePage() {
  const { data: session, isPending } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  const redirectTo = searchParams.get("redirectTo") || "/dashboard";

  useEffect(() => {
    if (isPending) return;

    if (!session?.user) {
      // Not authenticated, redirect to sign in
      router.replace(`/signin?from=${encodeURIComponent(redirectTo)}`);
      return;
    }

    // Check if user already has phone number
    const checkUserProfile = async () => {
      try {
        const response = await fetch("/api/users/profile");
        const result = await response.json();

        if (result.success && result.user?.phone) {
          // User already has phone number, redirect to intended destination
          router.replace(redirectTo);
          return;
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUserProfile();
  }, [session, isPending, router, redirectTo]);

  if (isPending || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#76d2fa]/10 to-[#5abe9b]/10 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8">
          <div className="text-center mb-8">
            <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-3/4 mx-auto mb-2" />
            <Skeleton className="h-4 w-full mx-auto" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null; // Will redirect in useEffect
  }

  return (
    <ProfileCompletionForm
      userEmail={session.user.email}
      userName={session.user.name || undefined}
      redirectTo={redirectTo}
    />
  );
}
