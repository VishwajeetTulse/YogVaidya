/**
 * Common types - Re-exports for convenience
 * This file re-exports types from specialized modules
 * to maintain backwards compatibility and provide a single import point
 */

// Re-export MongoDB types
export type {
  MongoDocument,
  MongoCommandResult,
  MongoDate,
  MongoObjectId,
  DateValue,
  MongoFilter,
} from "./mongodb";

export { isMongoDate, isMongoObjectId } from "./mongodb";

// Re-export Session types
export type {
  SessionBookingDocument,
  ScheduleDocument,
  TimeSlotDocument,
  SessionWithMentor,
  TimeSlotWithMentor,
  ScheduleWithBookings,
} from "./sessions";

// Re-export API types
export type {
  ApiResponse,
  PaginatedResponse,
  ListResponse,
  ErrorResponse,
  SuccessResponse,
} from "./api";

// Re-export utility types
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

// React event handler types (keep here for convenience)
export type ReactMouseEvent<T = HTMLElement> = React.MouseEvent<T>;
export type ReactChangeEvent<T = HTMLInputElement> = React.ChangeEvent<T>;
export type ReactFormEvent<T = HTMLFormElement> = React.FormEvent<T>;

// Legacy exports for backwards compatibility
// TODO: Migrate usages to specific imports from specialized modules
export type { SessionBookingDocument as SessionDocument } from "./sessions";

export type {
  MongoCommandResult as MongoAggregateResult,
  MongoCommandResult as MongoFindResult,
} from "./mongodb";

export interface MongoUpdateResult {
  ok: number;
  n: number;
  nModified: number;
}

export interface MongoDeleteResult {
  ok: number;
  n: number;
}
