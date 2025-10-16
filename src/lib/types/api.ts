/**
 * API Response types
 * Standard response formats for all API endpoints
 */

// Base API response
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Paginated API response
export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
  };
  message?: string;
}

// List response (for backwards compatibility)
export interface ListResponse<T = unknown> {
  success: boolean;
  data: T[];
  total?: number;
  message?: string;
}

// Error response
export interface ErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  statusCode?: number;
}

// Success response
export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}
