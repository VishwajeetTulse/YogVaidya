/**
 * Utility type helpers and common patterns
 * Reusable across the application
 */

import type { JSONContent } from "@tiptap/core";
import type { DateValue as MongoDateValue } from "./mongodb";

// Re-export MongoDB DateValue for convenience
export type DateValue = MongoDateValue;

// Generic filter builder type
export type FilterConditions<T = Record<string, unknown>> = {
  [K in keyof T]?:
    | T[K]
    | {
        equals?: T[K];
        not?: T[K];
        in?: T[K][];
        notIn?: T[K][];
        lt?: T[K];
        lte?: T[K];
        gt?: T[K];
        gte?: T[K];
      };
};

// Flexible query builder
export type QueryBuilder = Record<string, unknown>;

// TipTap editor content type (for diet plans, etc.)
export type EditorContent = JSONContent;

// User details (minimal, for props)
export interface UserDetails {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image?: string | null;
}

// Ticket metadata type (JSON field)
export interface TicketMetadata {
  browser?: string;
  os?: string;
  userAgent?: string;
  timestamp?: string;
  previousStatus?: string;
  assignedBy?: string;
  priority?: string;
  tags?: string[];
  ticketNumber?: string;
  [key: string]: unknown;
}

// Razorpay payment details
export interface RazorpayPaymentDetails {
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  order_id?: string;
  payment_id?: string;
  status?: string;
  method?: string;
  amount?: number;
  currency?: string;
  email?: string;
  contact?: string;
  [key: string]: unknown;
}

// Razorpay error callback
export interface RazorpayError {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id?: string;
    payment_id?: string;
    [key: string]: unknown;
  };
}

// Type guard for unknown errors
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

// Extract error message safely
export function getErrorMessage(error: unknown): string {
  if (isError(error)) return error.message;
  if (typeof error === "string") return error;
  return "Unknown error";
}
