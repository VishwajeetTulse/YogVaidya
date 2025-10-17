import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";

interface UseTrialExpirationOptions {
  isTrialActive: boolean | null;
  trialEndDate: Date | string | null | undefined;
  onTrialExpired?: () => void;
}

export function useTrialExpiration({
  isTrialActive,
  trialEndDate,
  onTrialExpired,
}: UseTrialExpirationOptions) {
  const { data: session } = useSession();
  const hasUpdatedRef = useRef(false);

  useEffect(() => {
    // Only proceed if user is logged in and we haven't already updated
    if (!session?.user?.email || !isTrialActive || !trialEndDate || hasUpdatedRef.current) {
      return;
    }

    const now = new Date();
    const trialEnd = new Date(trialEndDate);
    const isExpired = now >= trialEnd;

    if (isExpired) {
      // Mark as updated to prevent multiple calls
      hasUpdatedRef.current = true;

      // Update the database
      updateTrialStatus(session.user.email)
        .then((success) => {
          if (success) {
            onTrialExpired?.();
          } else {
            console.error("Failed to update trial status in database");
            // Reset the flag so we can try again
            hasUpdatedRef.current = false;
          }
        })
        .catch((error) => {
          console.error("Error updating trial status:", error);
          // Reset the flag so we can try again
          hasUpdatedRef.current = false;
        });
    }
  }, [session?.user?.email, isTrialActive, trialEndDate, onTrialExpired]);

  return {
    hasTrialExpired: isTrialActive && trialEndDate && new Date() >= new Date(trialEndDate),
  };
}

async function updateTrialStatus(email: string): Promise<boolean> {
  try {
    const response = await fetch("/api/users/update-trial-status", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Failed to update trial status:", data.error);
      return false;
    }

    return data.success;
  } catch (error) {
    console.error("Error calling update trial status API:", error);
    return false;
  }
}
