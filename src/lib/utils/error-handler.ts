/**
 * Centralized Error Handler
 * Provides a consistent error handling pattern across the entire application
 * Used for API routes, server actions, and client-side operations
 */

/**
 * Standard application error class
 * Extends Error to provide structured error information
 */
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Authentication error - User not authenticated
 */
export class AuthenticationError extends AppError {
  constructor(message = "Authentication required", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
    this.name = "AuthenticationError";
  }
}

/**
 * Authorization error - User lacks permissions
 */
export class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);
    this.name = "AuthorizationError";
  }
}

/**
 * Validation error - Invalid input data
 */
export class ValidationError extends AppError {
  constructor(message = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

/**
 * Not found error - Resource doesn't exist
 */
export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
    this.name = "NotFoundError";
  }
}

/**
 * Conflict error - Resource conflict (e.g., duplicate)
 */
export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
    this.name = "ConflictError";
  }
}

/**
 * Rate limit error - Too many requests
 */
export class RateLimitError extends AppError {
  constructor(message = "Too many requests", details?: unknown) {
    super(message, 429, "RATE_LIMIT", details);
    this.name = "RateLimitError";
  }
}

/**
 * Database error - Database operation failed
 */
export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details?: unknown) {
    super(message, 500, "DATABASE_ERROR", details);
    this.name = "DatabaseError";
  }
}

/**
 * External service error - External API/service failed
 */
export class ExternalServiceError extends AppError {
  constructor(message = "External service error", details?: unknown) {
    super(message, 502, "EXTERNAL_SERVICE_ERROR", details);
    this.name = "ExternalServiceError";
  }
}

/**
 * Internal server error - Unexpected error
 */
export class InternalServerError extends AppError {
  constructor(message = "Internal server error", details?: unknown) {
    super(message, 500, "INTERNAL_SERVER_ERROR", details);
    this.name = "InternalServerError";
  }
}

/**
 * Extract error message from unknown error type
 * @param error - Unknown error
 * @returns Error message string
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "An unexpected error occurred";
}

/**
 * Extract status code from unknown error type
 * @param error - Unknown error
 * @returns HTTP status code
 */
export function getStatusCode(error: unknown): number {
  if (error instanceof AppError) {
    return error.statusCode;
  }
  return 500;
}

/**
 * Extract error code from unknown error type
 * @param error - Unknown error
 * @returns Error code string
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof AppError && error.code) {
    return error.code;
  }
  return "INTERNAL_SERVER_ERROR";
}

/**
 * Format error for API response
 * @param error - Error object
 * @param details - Optional error details
 * @returns Formatted error object
 */
export function formatErrorResponse(
  error: unknown,
  details?: unknown
): {
  error: string;
  code: string;
  statusCode: number;
  details?: unknown;
} {
  return {
    error: getErrorMessage(error),
    code: getErrorCode(error),
    statusCode: getStatusCode(error),
    details: process.env.NODE_ENV === "development" ? details : undefined,
  };
}

/**
 * Format error for logging
 * @param error - Error object
 * @returns Formatted error string
 */
export function formatErrorForLogging(error: unknown): string {
  if (error instanceof AppError) {
    return `[${error.code || "ERROR"}] ${error.message} (${error.statusCode})`;
  }
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}

/**
 * Check if error is an AppError instance
 * @param error - Unknown error
 * @returns Boolean indicating if error is AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
