"use client";

import { useState } from "react";
import { toast } from "sonner";

export function useLogger() {
  const [isLogging, setIsLogging] = useState(false);

  /**
   * Logs an event to the system log
   */
  const logEvent = async (params: {
    action: string;
    category: string;
    details?: string;
    level: "INFO" | "WARNING" | "ERROR";
    metadata?: any;
  }) => {
    setIsLogging(true);
    try {
      const response = await fetch('/api/admin/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Failed to create log: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating log:", error);
      toast.error("Failed to log event. Check the console for details.");
      return null;
    } finally {
      setIsLogging(false);
    }
  };

  /**
   * Log info level event
   */
  const logInfo = (action: string, category: string, details?: string, metadata?: any) => {
    return logEvent({
      action,
      category,
      details,
      level: "INFO",
      metadata,
    });
  };

  /**
   * Log warning level event
   */
  const logWarning = (action: string, category: string, details?: string, metadata?: any) => {
    return logEvent({
      action,
      category,
      details,
      level: "WARNING",
      metadata,
    });
  };

  /**
   * Log error level event
   */
  const logError = (action: string, category: string, details?: string, metadata?: any) => {
    return logEvent({
      action,
      category,
      details,
      level: "ERROR",
      metadata,
    });
  };

  return {
    logEvent,
    logInfo,
    logWarning,
    logError,
    isLogging,
  };
}
