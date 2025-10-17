/**
 * API Response Utilities
 * Provides standardized response formatting for all API endpoints
 */

import { NextResponse } from "next/server";
import { getErrorCode, getErrorMessage, getStatusCode } from "./error-handler";

/**
 * Standard success response type
 */
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  timestamp: string;
}

/**
 * Standard error response type
 */
export interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  statusCode: number;
  details?: unknown;
  timestamp: string;
}

/**
 * Union type for all API responses
 */
export type ApiResponse<T = unknown> = SuccessResponse<T> | ErrorResponse;

/**
 * Create a standardized success response
 * @param data - Response data payload
 * @param message - Optional success message
 * @returns Success response object
 */
export function createSuccessResponse<T = unknown>(data: T, message?: string): SuccessResponse<T> {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create a standardized error response
 * @param error - Error object or message
 * @param details - Optional error details
 * @returns Error response object
 */
export function createErrorResponse(error: unknown, details?: unknown): ErrorResponse {
  return {
    success: false,
    error: getErrorMessage(error),
    code: getErrorCode(error),
    statusCode: getStatusCode(error),
    details: process.env.NODE_ENV === "development" ? details : undefined,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Return standardized success response from API route
 * @param data - Response data
 * @param statusCode - HTTP status code (default: 200)
 * @param message - Optional message
 * @returns NextResponse
 */
export function successResponse<T = unknown>(
  data: T,
  statusCode: number = 200,
  message?: string
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(createSuccessResponse(data, message), {
    status: statusCode,
  });
}

/**
 * Return standardized error response from API route
 * @param error - Error object or message
 * @param statusCode - HTTP status code (override from error if provided)
 * @param details - Optional error details
 * @returns NextResponse
 */
export function errorResponse(
  error: unknown,
  statusCode?: number,
  details?: unknown
): NextResponse<ErrorResponse> {
  const errorResponseObj = createErrorResponse(error, details);
  const responseStatus = statusCode || errorResponseObj.statusCode;

  return NextResponse.json(errorResponseObj, { status: responseStatus });
}

/**
 * Success response with 201 Created status
 * @param data - Response data
 * @param message - Optional message
 * @returns NextResponse
 */
export function createdResponse<T = unknown>(
  data: T,
  message: string = "Resource created successfully"
): NextResponse<SuccessResponse<T>> {
  return successResponse(data, 201, message);
}

/**
 * No content response (204)
 * @param message - Optional message
 * @returns NextResponse
 */
export function noContentResponse(
  message: string = "Operation completed successfully"
): NextResponse<SuccessResponse<null>> {
  return successResponse(null, 204, message);
}

/**
 * Bad request response (400)
 * @param error - Error message
 * @param details - Optional error details
 * @returns NextResponse
 */
export function badRequestResponse(error: string, details?: unknown): NextResponse<ErrorResponse> {
  return errorResponse(
    {
      message: error,
      statusCode: 400,
      code: "BAD_REQUEST",
    },
    400,
    details
  );
}

/**
 * Unauthorized response (401)
 * @param error - Error message
 * @param details - Optional error details
 * @returns NextResponse
 */
export function unauthorizedResponse(
  error: string = "Unauthorized",
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(
    {
      message: error,
      statusCode: 401,
      code: "UNAUTHORIZED",
    },
    401,
    details
  );
}

/**
 * Forbidden response (403)
 * @param error - Error message
 * @param details - Optional error details
 * @returns NextResponse
 */
export function forbiddenResponse(
  error: string = "Forbidden",
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(
    {
      message: error,
      statusCode: 403,
      code: "FORBIDDEN",
    },
    403,
    details
  );
}

/**
 * Not found response (404)
 * @param error - Error message
 * @param details - Optional error details
 * @returns NextResponse
 */
export function notFoundResponse(
  error: string = "Resource not found",
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(
    {
      message: error,
      statusCode: 404,
      code: "NOT_FOUND",
    },
    404,
    details
  );
}

/**
 * Conflict response (409)
 * @param error - Error message
 * @param details - Optional error details
 * @returns NextResponse
 */
export function conflictResponse(
  error: string = "Resource conflict",
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(
    {
      message: error,
      statusCode: 409,
      code: "CONFLICT",
    },
    409,
    details
  );
}

/**
 * Internal server error response (500)
 * @param error - Error message
 * @param details - Optional error details
 * @returns NextResponse
 */
export function internalErrorResponse(
  error: string = "Internal server error",
  details?: unknown
): NextResponse<ErrorResponse> {
  return errorResponse(
    {
      message: error,
      statusCode: 500,
      code: "INTERNAL_SERVER_ERROR",
    },
    500,
    details
  );
}
