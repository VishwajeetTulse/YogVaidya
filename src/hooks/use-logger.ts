"use client";

import { useState } from "react";
import { toast } from "sonner";
import { type Prisma } from "@prisma/client";
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
    metadata?: Prisma.JsonValue;
  }) => {
    setIsLogging(true);
    try {
      const response = await fetch("/api/admin/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error:", errorText);
        throw new Error(`Failed to create log: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();

      return result;
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
  const logInfo = (
    action: string,
    category: string,
    details?: string,
    metadata?: Prisma.JsonValue
  ) => {
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
  const logWarning = (
    action: string,
    category: string,
    details?: string,
    metadata?: Prisma.JsonValue
  ) => {
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
  const logError = (
    action: string,
    category: string,
    details?: string,
    metadata?: Prisma.JsonValue
  ) => {
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
