/**
 * Centralized type exports
 * Import from here for all type needs: import type { ... } from '@/lib/types'
 */

// MongoDB types
export * from "./mongodb";

// Session/TimeSlot/Schedule types
export * from "./sessions";

// API response types
export * from "./api";

// Utility types (excluding DateValue which is already exported from mongodb)
export type {
  FilterConditions,
  QueryBuilder,
  EditorContent,
  UserDetails,
  TicketMetadata,
  RazorpayPaymentDetails,
  RazorpayError,
} from "./utils";

export { isError, getErrorMessage } from "./utils";

// Common re-exports (legacy compatibility)
export * from "./common";

// Prisma types (for convenience)
export type {
  SessionType,
  ScheduleStatus,
  User,
  SessionBooking,
  Schedule,
  MentorTimeSlot,
} from "@prisma/client";
