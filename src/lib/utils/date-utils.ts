/**
 * Date Utilities
 * Helper functions to ensure dates are always proper Date objects
 */

/**
 * Ensures a value is a proper Date object
 * If it's a string, converts it to a Date
 * If it's already a Date, returns it as-is
 * If it's invalid, returns current date
 */
export function ensureDateObject(dateValue: any): Date {
  if (dateValue instanceof Date) {
    return dateValue;
  }

  if (typeof dateValue === "string") {
    const parsed = new Date(dateValue);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  // Fallback to current date if invalid
  console.warn("Invalid date value provided, using current date:", dateValue);
  return new Date();
}

/**
 * Creates a date update object with proper Date objects
 */
export function createDateUpdate(updates: Record<string, any> = {}): Record<string, any> {
  const result: Record<string, any> = {
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
      result[field] = ensureDateObject(result[field]);
    }
  }

  return result;
}
