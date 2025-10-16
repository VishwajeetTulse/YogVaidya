import { useEffect, useRef } from "react";

/**
 * Hook to automatically update session statuses
 * This runs periodically to check for sessions that need status updates
 */
export function useSessionStatusUpdates(
  enabled: boolean = true,
  intervalMs: number = 60000 // Check every minute
) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateSessionStatuses = async () => {
    try {

      // Use the admin endpoint for client-side updates (no auth required)
      const response = await fetch("/api/admin/update-session-status", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.startedSessions > 0 || result.completedSessions > 0) {

          // You could emit an event here to refresh relevant UI components
          window.dispatchEvent(
            new CustomEvent("session-status-updated", {
              detail: {
                started: result.startedSessions,
                completed: result.completedSessions,
                updates: result.updates,
              },
            })
          );
        }
      } else {
        console.warn("Failed to update session statuses:", response.statusText);
      }
    } catch (error) {
      console.error("Error updating session statuses:", error);
    }
  };

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Run immediately on mount
    updateSessionStatuses();

    // Set up periodic updates
    intervalRef.current = setInterval(updateSessionStatuses, intervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, intervalMs]);

  // Return manual trigger function
  return {
    updateNow: updateSessionStatuses,
    isEnabled: enabled,
  };
}
