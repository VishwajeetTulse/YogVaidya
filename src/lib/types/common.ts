// MongoDB Command Result Types
// Common type definitions for MongoDB $runCommandRaw results

export interface MongoDocument {
  _id: string;
  [key: string]: unknown;
}

export interface MongoCommandResult<T = MongoDocument> {
  cursor?: {
    firstBatch: T[];
    id: number;
    ns: string;
  };
  ok: number;
  n?: number;
}

export interface MongoAggregateResult<T = MongoDocument> {
  cursor: {
    firstBatch: T[];
    id: number;
    ns: string;
  };
  ok: number;
}

export interface MongoFindResult<T = MongoDocument> {
  cursor: {
    firstBatch: T[];
    id: number;
    ns: string;
  };
  ok: number;
}

export interface MongoUpdateResult {
  ok: number;
  n: number;
  nModified: number;
}

export interface MongoDeleteResult {
  ok: number;
  n: number;
}

// Session-related types
export interface SessionDocument extends MongoDocument {
  userId: string;
  mentorId: string;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  scheduledTime: Date | string;
  status: string;
  duration?: number;
  notes?: string;
}

export interface TimeSlotDocument extends MongoDocument {
  mentorId: string;
  startTime: Date | string;
  endTime: Date | string;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
  isBooked: boolean;
  isActive: boolean;
  price?: number;
}

// Event handler types
export type ReactMouseEvent<T = HTMLElement> = React.MouseEvent<T>;
export type ReactChangeEvent<T = HTMLInputElement> = React.ChangeEvent<T>;
export type ReactFormEvent<T = HTMLFormElement> = React.FormEvent<T>;

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
}
