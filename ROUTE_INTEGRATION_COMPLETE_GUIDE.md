# Route Integration Complete Reference Guide

## Pattern 1: Authentication Checks

### BEFORE:
```typescript
if (!session?.user?.id) {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}
```

### AFTER:
```typescript
if (!session?.user?.id) {
  throw new AuthenticationError("User session not found");
}
```

---

## Pattern 2: Validation Errors

### BEFORE:
```typescript
if (error instanceof z.ZodError) {
  return NextResponse.json(
    { success: false, error: "Invalid request data", details: error.errors },
    { status: 400 }
  );
}
```

### AFTER (Validation errors will be caught and handled by errorResponse):
```typescript
// Let it throw automatically or explicitly throw:
if (error instanceof z.ZodError) {
  throw new ValidationError("Invalid request data");
}
```

---

## Pattern 3: Not Found Errors

### BEFORE:
```typescript
if (!resource) {
  return NextResponse.json(
    { success: false, error: "Resource not found" },
    { status: 404 }
  );
}
```

### AFTER:
```typescript
if (!resource) {
  throw new NotFoundError("Resource not found");
}
```

---

## Pattern 4: Conflict Errors

### BEFORE:
```typescript
if (slot.currentStudents >= slot.maxStudents) {
  return NextResponse.json(
    { success: false, error: "Slot is fully booked" },
    { status: 409 }
  );
}
```

### AFTER:
```typescript
if (slot.currentStudents >= slot.maxStudents) {
  throw new ConflictError("Slot is fully booked");
}
```

---

## Pattern 5: Success Responses

### BEFORE (Various formats):
```typescript
// Format 1:
return NextResponse.json({ success: true, data: result });

// Format 2:
return NextResponse.json({ success: true, data: result }, { status: 200 });

// Format 3:
return NextResponse.json(result);

// Format 4 (Created):
return NextResponse.json(result, { status: 201 });
```

### AFTER:
```typescript
// All become:
return successResponse(result); // Default 200

// Or if created:
return createdResponse(result); // 201
```

---

## Pattern 6: Catch Blocks

### BEFORE:
```typescript
catch (error) {
  console.error("Error:", error);
  
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { success: false, error: "Invalid data", details: error.errors },
      { status: 400 }
    );
  }
  
  return NextResponse.json(
    { success: false, error: "Server error" },
    { status: 500 }
  );
}
```

### AFTER:
```typescript
catch (error) {
  return errorResponse(error);
}
```

The `errorResponse()` function automatically:
- Detects Z odError and converts to ValidationError
- Detects custom AppErrors and gets their status code
- Returns proper error format for unknown errors

---

## Pattern 7: Authorization Checks

### BEFORE:
```typescript
if (user?.role !== "ADMIN") {
  return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
}
```

### AFTER:
```typescript
if (user?.role !== "ADMIN") {
  throw new AuthorizationError("Admin access required");
}
```

---

## Pattern 8: External Service Errors

### BEFORE:
```typescript
try {
  const payment = await razorpay.orders.create({ amount: 1000 });
} catch (error) {
  return NextResponse.json(
    { success: false, error: "Payment service error" },
    { status: 502 }
  );
}
```

### AFTER:
```typescript
try {
  const payment = await razorpay.orders.create({ amount: 1000 });
} catch (error) {
  throw new ExternalServiceError("Payment service error");
}
```

---

## STEP-BY-STEP Integration Process

For each route file:

### 1. Update Imports (at top of file)

REMOVE:
```typescript
import { NextResponse } from "next/server";
// or
import { NextResponse, type NextRequest } from "next/server";
```

CHANGE TO:
```typescript
import { type NextRequest } from "next/server"; // If NextRequest is used
// If NextRequest is NOT used in GET/POST/PUT/DELETE parameters, remove this line
```

ADD (after other imports):
```typescript
import { AuthenticationError, AuthorizationError, ValidationError, NotFoundError, ConflictError, RateLimitError, DatabaseError, ExternalServiceError, InternalServerError } from "@/lib/utils/error-handler";
import { successResponse, errorResponse, createdResponse, noContentResponse } from "@/lib/utils/response-handler";
```

### 2. Find All Error Returns

Search for: `return NextResponse.json`

Replace with appropriate throw or response pattern above.

### 3. Replace Catch Blocks

Find:
```typescript
} catch (error) {
  // ... custom error handling
  return NextResponse.json(...)
}
```

Replace with:
```typescript
} catch (error) {
  return errorResponse(error);
}
```

### 4. Replace Success Returns

Find all: `return NextResponse.json({ success: true`

Replace with: `return successResponse(...)`

### 5. Verify & Test

- Run `npm run build` - must pass
- Run `npm run lint` - must pass
- Check console for proper error messages

---

## HTTP Status Code Reference

```
401 → AuthenticationError("message")
403 → AuthorizationError("message")
400 → ValidationError("message") or ZodError
404 → NotFoundError("message")
409 → ConflictError("message")
429 → RateLimitError("message")
500 → DatabaseError() or InternalServerError()
502 → ExternalServiceError()
```

---

## Import Selection

Only import the error types you actually USE in each file:

```typescript
// If route only checks auth:
import { AuthenticationError } from "@/lib/utils/error-handler";

// If route checks auth + validation:
import { AuthenticationError, ValidationError } from "@/lib/utils/error-handler";

// Full list (import only what you need):
import {
  AuthenticationError,      // 401
  AuthorizationError,       // 403
  ValidationError,          // 400
  NotFoundError,            // 404
  ConflictError,            // 409
  RateLimitError,           // 429
  DatabaseError,            // 500
  ExternalServiceError,     // 502
  InternalServerError       // 500
} from "@/lib/utils/error-handler";
```

---

## Response Handler Reference

```typescript
// Get success response with data
successResponse(data)                          // 200 OK
successResponse(data, 200, "Custom message")   // 200 with message

// Create (201)
createdResponse(data)                          // 201 Created
createdResponse(data, "Custom message")        // 201 with message

// No content (204)
noContentResponse()                            // 204 No Content

// Error (auto-detects status code)
errorResponse(error)                           // Auto status code

// Status-specific helpers (return ErrorResponse)
badRequestResponse("message")                  // 400
unauthorizedResponse("message")                // 401
forbiddenResponse("message")                   // 403
notFoundResponse("message")                    // 404
conflictResponse("message")                    // 409
internalErrorResponse("message")               // 500
```

---

## Example: Complete Route Transformation

### BEFORE (with NextResponse):
```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";

const schema = z.object({ name: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const data = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const result = await prisma.someModel.create({
      data: { ...data, userId: user.id },
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    console.error("Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 }
    );
  }
}
```

### AFTER (with error handlers):
```typescript
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/config/prisma";
import { z } from "zod";
import { AuthenticationError, NotFoundError, ValidationError } from "@/lib/utils/error-handler";
import { createdResponse, errorResponse } from "@/lib/utils/response-handler";

const schema = z.object({ name: z.string().min(1) });

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    
    if (!session?.user?.id) {
      throw new AuthenticationError("User session not found");
    }

    const body = await request.json();
    const data = schema.parse(body);

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    const result = await prisma.someModel.create({
      data: { ...data, userId: user.id },
    });

    return createdResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### Key Changes:
1. ✅ Removed `NextResponse` import
2. ✅ Added error and response handler imports
3. ✅ Replaced error returns with `throw new Error(...)`
4. ✅ Replaced success return with `createdResponse(...)`
5. ✅ Simplified catch block to single line: `return errorResponse(error)`
6. ✅ Removed manual z.ZodError handling (now auto-detected)
7. ✅ Removed console.error (error handlers log automatically)

---

## Critical Notes

1. **ZodError Handling**: Don't need to manually catch Z odError - `errorResponse()` auto-detects and converts to ValidationError
2. **Error Logging**: All errors are logged automatically by error handlers
3. **Type Safety**: All errors are properly typed with correct HTTP status codes
4. **Response Format**: All responses follow standard format automatically
5. **Unused Imports**: Remove any error classes you don't throw in a route

---

## Testing Each Route

After conversion, verify:

```bash
npm run build    # Must compile successfully
npm run lint     # No ESLint errors
npm run format   # Code formatting correct
```

If build fails, check for:
- Incomplete replacements
- Missing imports
- Syntax errors in throw statements

---

## Need Help?

If a route doesn't fit these patterns:
- Check if it's streaming (chat/route.ts) - different pattern
- Check if it's file download - special handling needed
- Check if it has middleware - may need adjustment
- Document the special case and proceed with standard routes first

