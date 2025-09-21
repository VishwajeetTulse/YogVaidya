/**
 * Utility functions for handling MongoDB datetime conversions
 */

/**
 * Convert MongoDB datetime object to JavaScript Date
 * Handles both { $date: 'ISO_STRING' } format and regular Date objects
 */
export function convertMongoDate(mongoDate: any): Date | null {
  if (!mongoDate) return null;

  // If it's already a Date object, return it
  if (mongoDate instanceof Date) {
    return mongoDate;
  }

  // If it's a MongoDB extended JSON date format
  if (typeof mongoDate === 'object' && mongoDate.$date) {
    try {
      return new Date(mongoDate.$date);
    } catch (error) {
      console.error('Failed to convert MongoDB date:', mongoDate, error);
      return null;
    }
  }

  // If it's a string, try to parse it
  if (typeof mongoDate === 'string') {
    try {
      const date = new Date(mongoDate);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      console.error('Failed to parse date string:', mongoDate, error);
      return null;
    }
  }

  // If it's a number (timestamp), convert it
  if (typeof mongoDate === 'number') {
    try {
      return new Date(mongoDate);
    } catch (error) {
      console.error('Failed to convert timestamp:', mongoDate, error);
      return null;
    }
  }

  console.error('Unknown date format:', mongoDate);
  return null;
}

/**
 * Safely convert MongoDB datetime to ISO string
 */
export function mongoDateToISOString(mongoDate: any): string | null {
  const date = convertMongoDate(mongoDate);
  return date ? date.toISOString() : null;
}

/**
 * Check if a MongoDB datetime is valid
 */
export function isValidMongoDate(mongoDate: any): boolean {
  const date = convertMongoDate(mongoDate);
  return date !== null && !isNaN(date.getTime());
}