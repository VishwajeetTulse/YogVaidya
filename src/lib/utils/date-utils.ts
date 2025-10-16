/**
 * Date Utilities
 * Helper functions to ensure dates are always proper Date objects
 */

import type { DateValue } from "@/lib/types/mongodb";
import { isMongoDate } from "@/lib/types/mongodb";

/**
 * Ensures a value is a proper Date object
 * If it's a string, converts it to a Date
 * If it's already a Date, returns it as-is
 * If it's invalid, returns current date
 */
export function ensureDateObject(dateValue: DateValue): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (isMongoDate(dateValue)) {
    return new Date(dateValue.$date);
  }

  if (typeof dateValue === "string") {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  if (typeof dateValue === "number") {
    return new Date(dateValue);
  }

  // Fallback to current date if invalid
  console.warn("Invalid date value provided, using current date:", dateValue);
  return new Date();
}

/**
 * Creates a date update object with proper Date objects
 */
export function createDateUpdate(updates: Record<string, unknown> = {}): Record<string, unknown> {
  const result: Record<string, unknown> = {
    updatedAt: new Date(),
    ...updates,
  };

  // Ensure all date fields are proper Date objects
  const dateFields = [
    "createdAt",
    "scheduledAt",
    "scheduledTime",
    "startTime",
    "endTime",
    "manualStartTime",
    "actualEndTime",
  ];

  for (const field of dateFields) {
    if (result[field] !== undefined) {
      result[field] = ensureDateObject(result[field] as DateValue);
    }
  }

  return result;
}
