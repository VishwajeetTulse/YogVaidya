/**
 * PHASE 2 ERROR HANDLER & RESPONSE INTEGRATION GUIDE
 * How to actively use error handlers in your API routes
 * 
 * Files Created:
 * - src/lib/utils/error-handler.ts (Error classes & utilities)
 * - src/lib/utils/response-handler.ts (Response formatters)
 * - next.config.ts (Security headers - automatic)
 */

// ============================================================================
// BEFORE: Old Pattern (Inconsistent)
// ============================================================================
/*
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/config/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    // Problem 1: Inconsistent error responses
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    
    // Problem 2: Different format for different errors
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Access denied" }, { status: 403 });
    }
    
    const data = await prisma.user.findMany({...});
    
    // Problem 3: Inconsistent success response
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
    // Problem 4: Generic error handling
    return NextResponse.json(
      { error: "Something went wrong" }, 
      { status: 500 }
    );
  }
}
*/

// ============================================================================
// AFTER: New Pattern (Consistent & Standardized)
// ============================================================================
/*
import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import {
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  ValidationError,
} from "@/lib/utils/error-handler";
import {
  successResponse,
  errorResponse,
  createdResponse,
  notFoundResponse,
} from "@/lib/utils/response-handler";

export async function GET(req: NextRequest) {
  try {
    // Step 1: Validate authentication
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      throw new AuthenticationError("User not authenticated");
    }

    // Step 2: Check authorization
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "ADMIN") {
      throw new AuthorizationError("Only admins can access this resource");
    }

    // Step 3: Database operations
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { createdAt: "desc" },
    });

    // Step 4: Return standardized success response
    return successResponse(users, 200, "Users retrieved successfully");
  } catch (error) {
    // Automatic error handling - handles all error types
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    if (!body.email) {
      throw new ValidationError("Email is required");
    }

    // Check for duplicates
    const existing = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existing) {
      throw new ConflictError("Email already exists", { email: body.email });
    }

    // Create resource
    const user = await prisma.user.create({
      data: body,
    });

    // Return 201 Created response
    return createdResponse(user);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    const resource = await prisma.user.findUnique({ where: { id } });
    if (!resource) {
      throw new NotFoundError("User not found");
    }

    await prisma.user.delete({ where: { id } });
    
    return noContentResponse("User deleted successfully");
  } catch (error) {
    return errorResponse(error);
  }
}
*/

// ============================================================================
// ERROR CLASSES QUICK REFERENCE
// ============================================================================
/*
throw new AuthenticationError(
  "User not authenticated",
  { userId: "missing" }  // optional details for dev env
);
// Returns: 401 UNAUTHORIZED

throw new AuthorizationError(
  "Insufficient permissions",
  { requiredRole: "ADMIN", userRole: "USER" }
);
// Returns: 403 FORBIDDEN

throw new ValidationError(
  "Email format invalid",
  { field: "email", value: "invalid-email" }
);
// Returns: 400 VALIDATION_ERROR

throw new NotFoundError("Mentor not found");
// Returns: 404 NOT_FOUND

throw new ConflictError("Email already exists");
// Returns: 409 CONFLICT

throw new DatabaseError("Query failed");
// Returns: 500 DATABASE_ERROR

throw new ExternalServiceError("Razorpay API failed");
// Returns: 502 EXTERNAL_SERVICE_ERROR

throw new InternalServerError("Unexpected error");
// Returns: 500 INTERNAL_SERVER_ERROR
*/

// ============================================================================
// RESPONSE HELPERS QUICK REFERENCE
// ============================================================================
/*
// Success responses
successResponse(data, 200, "Fetched successfully");
createdResponse(user, "User created");  // 201
noContentResponse("Deleted");           // 204

// Error responses - Auto-handled in catch block
errorResponse(error);  // Automatically maps error type to status code

// Or manually for specific cases
badRequestResponse("Invalid email format");
unauthorizedResponse("Please login first");
forbiddenResponse("You don't have permission");
notFoundResponse("Resource not found");
conflictResponse("Email already in use");
internalErrorResponse("Server error occurred");
*/

// ============================================================================
// EXAMPLE: Convert Existing API Route
// ============================================================================
/*
// File: src/app/api/mentor/pricing/route.ts

import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/config/auth";
import { prisma } from "@/lib/config/prisma";
import {
  AuthenticationError,
  ValidationError,
  NotFoundError,
} from "@/lib/utils/error-handler";
import { successResponse, errorResponse } from "@/lib/utils/response-handler";

export async function GET(req: NextRequest) {
  try {
    const { mentorId } = Object.fromEntries(req.nextUrl.searchParams);

    if (!mentorId) {
      throw new ValidationError("mentorId parameter required");
    }

    const mentor = await prisma.mentor.findUnique({
      where: { id: mentorId },
      select: { pricing: true, sessionDuration: true },
    });

    if (!mentor) {
      throw new NotFoundError("Mentor not found");
    }

    return successResponse(mentor, 200, "Mentor pricing retrieved");
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      throw new AuthenticationError();
    }

    const body = await req.json();
    if (!body.pricing || body.pricing < 0) {
      throw new ValidationError("Valid pricing required");
    }

    const mentor = await prisma.mentor.update({
      where: { userId: session.user.id },
      data: { pricing: body.pricing },
    });

    return successResponse(mentor, 200, "Pricing updated");
  } catch (error) {
    return errorResponse(error);
  }
}
*/

// ============================================================================
// WHAT GETS RETURNED AUTOMATICALLY
// ============================================================================
/*
Success Response:
{
  "success": true,
  "data": { ... },
  "message": "Users retrieved successfully",
  "timestamp": "2025-10-17T10:30:45.123Z"
}

Error Response:
{
  "success": false,
  "error": "User not authenticated",
  "code": "UNAUTHORIZED",
  "statusCode": 401,
  "details": { ... },  // Only in development mode
  "timestamp": "2025-10-17T10:30:45.123Z"
}
*/

// ============================================================================
// MIGRATION STRATEGY FOR ALL API ROUTES
// ============================================================================
/*
Step 1: Import error handlers and response helpers
  import { AuthenticationError, ValidationError, ... } from "@/lib/utils/error-handler";
  import { successResponse, errorResponse, ... } from "@/lib/utils/response-handler";

Step 2: Replace manual checks with throws
  OLD: if (!session) return NextResponse.json({...}, {status: 401});
  NEW: if (!session) throw new AuthenticationError();

Step 3: Replace success responses
  OLD: return NextResponse.json({ data }, { status: 200 });
  NEW: return successResponse(data);

Step 4: Replace error handling
  OLD: catch (error) { return NextResponse.json(...); }
  NEW: catch (error) { return errorResponse(error); }

This works because:
- errorResponse() automatically extracts status code from error type
- All responses are standardized for frontend
- Development mode shows error details for debugging
- Production mode hides sensitive details
*/

// ============================================================================
// TESTING THE INTEGRATION
// ============================================================================
/*
curl -X GET http://localhost:3000/api/admin/users/subscriptions \
  -H "Authorization: Bearer YOUR_TOKEN"

// Success Response (200)
{
  "success": true,
  "data": [...users...],
  "message": "Users retrieved successfully",
  "timestamp": "2025-10-17T10:30:45.123Z"
}

// Auth Error Response (401)
{
  "success": false,
  "error": "User not authenticated",
  "code": "UNAUTHORIZED",
  "statusCode": 401,
  "timestamp": "2025-10-17T10:30:45.123Z"
}

// Validation Error Response (400)
{
  "success": false,
  "error": "Email is required",
  "code": "VALIDATION_ERROR",
  "statusCode": 400,
  "details": { field: "email" },  // Only in dev
  "timestamp": "2025-10-17T10:30:45.123Z"
}
*/

export default {};
