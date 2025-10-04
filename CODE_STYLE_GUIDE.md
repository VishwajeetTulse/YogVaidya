# Code Style Guide

**Version:** 1.0
**Last Updated:** Phase 1 Implementation
**Applies To:** All TypeScript/JavaScript code in the YogVaidya project

---

## Overview

This guide documents the coding standards and best practices for the YogVaidya project. All code should follow these conventions to ensure consistency, maintainability, and quality across the codebase.

---

## Table of Contents

1. [Formatting Rules](#formatting-rules)
2. [TypeScript Guidelines](#typescript-guidelines)
3. [Naming Conventions](#naming-conventions)
4. [React Best Practices](#react-best-practices)
5. [Import Organization](#import-organization)
6. [Error Handling](#error-handling)
7. [Logging Standards](#logging-standards)
8. [Comments and Documentation](#comments-and-documentation)
9. [Automated Tools](#automated-tools)
10. [Common Issues to Avoid](#common-issues-to-avoid)

---

## Formatting Rules

### Automated with Prettier

The following rules are **automatically enforced** by Prettier:

- **Line Width:** 100 characters maximum
- **Indentation:** 2 spaces (no tabs)
- **Quotes:** Double quotes for strings
- **Semicolons:** Required at end of statements
- **Trailing Commas:** ES5-compatible (objects, arrays)
- **Line Endings:** LF (Unix-style)
- **Arrow Function Parens:** Always include parentheses around arrow function parameters

### VS Code Integration

- **Auto-format on save** is enabled (`.vscode/settings.json`)
- **Auto-fix ESLint on save** is enabled
- **Organize imports on save** is enabled

### Running Formatters Manually

```bash
# Format all files
npm run format

# Check formatting without modifying files
npm run format:check

# Auto-fix ESLint issues
npm run lint:fix

# Check for all issues (formatting + linting)
npm run check-all
```

---

## TypeScript Guidelines

### Type Safety

✅ **DO:**
```typescript
// Use explicit types for function parameters and return values
function calculateDuration(startDate: Date, endDate: Date): number {
  return endDate.getTime() - startDate.getTime();
}

// Use proper interfaces for complex objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type guards for runtime checks
function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
```

❌ **DON'T:**
```typescript
// Avoid 'any' type - use proper types or 'unknown'
function processData(data: any) { // ❌ Bad
  return data.value;
}

// Avoid implicit 'any' in parameters
function handleError(error) { // ❌ Bad
  console.log(error);
}
```

### Type Annotations

- **Always** provide types for:
  - Function parameters
  - Function return values
  - Exported variables and constants
  - Component props
- **Let TypeScript infer** for:
  - Simple variable assignments
  - Return values of simple arrow functions
  - Generic type parameters when they can be inferred

### Handling MongoDB/Prisma Types

```typescript
// Use proper Prisma types
import { User, Session } from "@prisma/client";

// For MongoDB date conversion, create typed utilities
function convertMongoDate<T extends { createdAt?: unknown }>(
  obj: T
): T & { createdAt: Date } {
  return {
    ...obj,
    createdAt: obj.createdAt instanceof Date
      ? obj.createdAt
      : new Date(obj.createdAt as string),
  };
}
```

---

## Naming Conventions

### Variables and Functions

| Type | Convention | Example |
|------|------------|---------|
| Variables | `camelCase` | `userName`, `isActive` |
| Constants | `UPPER_SNAKE_CASE` | `MAX_RETRIES`, `API_URL` |
| Functions | `camelCase` | `getUserData`, `handleSubmit` |
| Private methods | `_camelCase` | `_internalHelper` |
| Boolean variables | `is/has/should` prefix | `isLoading`, `hasPermission`, `shouldRender` |

### Components and Types

| Type | Convention | Example |
|------|------------|---------|
| React Components | `PascalCase` | `UserProfile`, `DashboardSection` |
| Interfaces | `PascalCase` | `UserDetails`, `SessionData` |
| Type Aliases | `PascalCase` | `ResponseStatus`, `FilterOptions` |
| Enums | `PascalCase` | `UserRole`, `PaymentStatus` |
| Enum Members | `PascalCase` | `UserRole.Admin`, `PaymentStatus.Completed` |

### Files and Folders

| Type | Convention | Example |
|------|------------|---------|
| Components | `PascalCase.tsx` | `UserProfile.tsx`, `MentorCard.tsx` |
| Utilities | `kebab-case.ts` | `date-utils.ts`, `api-helpers.ts` |
| API Routes | `kebab-case/route.ts` | `mentor-applications/route.ts` |
| Server Actions | `kebab-case-actions.ts` | `dashboard-data.ts`, `billing-actions.ts` |
| Types | `kebab-case.ts` | `session-types.ts`, `user-types.ts` |

---

## React Best Practices

### Component Structure

```typescript
// 1. Imports (grouped and ordered)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 2. Types and Interfaces
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

// 3. Component Definition
export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // 4. Hooks (in order: state, effects, custom hooks)
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, [userId]);

  // 5. Event Handlers
  const handleUpdate = async () => {
    // ...
  };

  // 6. Render helpers
  const renderUserDetails = () => {
    // ...
  };

  // 7. Return JSX
  return (
    <div>
      {/* ... */}
    </div>
  );
}
```

### Hook Dependencies

✅ **DO:**
```typescript
// Include all dependencies
useEffect(() => {
  fetchData(userId, filters);
}, [userId, filters]); // ✅ Complete dependency array

// Or extract function inside effect
useEffect(() => {
  const loadData = async () => {
    await fetchData();
  };
  loadData();
}, []); // ✅ No external dependencies
```

❌ **DON'T:**
```typescript
// Missing dependencies
useEffect(() => {
  fetchData(userId);
}, []); // ❌ Missing 'userId'
```

### Prop Validation

```typescript
// Use TypeScript interfaces for props
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean; // Optional props marked with ?
  variant?: "primary" | "secondary"; // Use union types for variants
}

// Destructure with defaults
export function Button({
  label,
  onClick,
  disabled = false,
  variant = "primary"
}: ButtonProps) {
  // ...
}
```

---

## Import Organization

### Order of Imports

1. **React and Next.js** imports
2. **Third-party libraries** (e.g., `date-fns`, `zod`)
3. **Internal utilities** (e.g., `@/lib/utils`)
4. **Components**
5. **Types**
6. **Styles** (if separate)

### Example

```typescript
// 1. React/Next.js
import { useState } from "react";
import { useRouter } from "next/navigation";

// 2. Third-party
import { format } from "date-fns";
import { z } from "zod";

// 3. Internal utilities
import { cn } from "@/lib/utils";
import { getUserDetails } from "@/lib/userDetails";

// 4. Components
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// 5. Types
import type { User, Session } from "@prisma/client";
```

### Import Aliases

Use path aliases defined in `tsconfig.json`:

```typescript
// ✅ Use aliases
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";

// ❌ Avoid relative paths for deep nesting
import { Button } from "../../../components/ui/button";
```

---

## Error Handling

### Try-Catch Blocks

```typescript
// Server actions
export async function getUserData(userId: string) {
  try {
    const user = await db.user.findUnique({ where: { id: userId } });
    return { success: true, data: user };
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}

// Client-side async operations
const handleSubmit = async () => {
  try {
    setIsLoading(true);
    const result = await submitForm(formData);

    if (result.success) {
      toast.success("Form submitted successfully");
    } else {
      toast.error(result.error || "Failed to submit form");
    }
  } catch (error) {
    console.error("Form submission error:", error);
    toast.error("An unexpected error occurred");
  } finally {
    setIsLoading(false);
  }
};
```

### Error Responses

```typescript
// API routes - consistent error format
return NextResponse.json(
  { error: "User not found" },
  { status: 404 }
);

// Server actions - consistent return type
return {
  success: false,
  error: "Invalid credentials"
};
```

---

## Logging Standards

### Console Usage

**ONLY use these console methods:**
- `console.error()` - For errors
- `console.warn()` - For warnings

**DO NOT use:**
- ❌ `console.log()` - Remove all instances or replace with proper logging
- ❌ `console.info()` - Not allowed
- ❌ `console.debug()` - Not allowed

### Logging Examples

```typescript
// ✅ Development logging (to be removed or replaced)
if (process.env.NODE_ENV === "development") {
  console.warn("Debug: User state changed", user);
}

// ✅ Error logging
try {
  await processPayment(order);
} catch (error) {
  console.error("Payment processing failed:", {
    orderId: order.id,
    error: error instanceof Error ? error.message : "Unknown error",
  });
}

// ❌ Production console.log (remove these)
console.log("User logged in"); // Remove or replace
```

### Structured Logging

For production, use the logger hook:

```typescript
import { useLogger } from "@/hooks/use-logger";

export function MyComponent() {
  const logger = useLogger();

  const handleAction = async () => {
    try {
      await performAction();
      logger.info("Action completed successfully");
    } catch (error) {
      logger.error("Action failed", { error });
    }
  };
}
```

---

## Comments and Documentation

### When to Comment

✅ **DO comment:**
- Complex algorithms or business logic
- Non-obvious workarounds or hacks
- API endpoint documentation
- Public utility functions
- Type definitions for external libraries

❌ **DON'T comment:**
- Self-explanatory code
- What the code does (code should be self-documenting)
- Commented-out code (delete it instead)

### Comment Style

```typescript
/**
 * Calculates the duration between two dates in milliseconds.
 *
 * @param startDate - The start date
 * @param endDate - The end date
 * @returns The duration in milliseconds
 * @throws {Error} If endDate is before startDate
 */
export function calculateDuration(startDate: Date, endDate: Date): number {
  if (endDate < startDate) {
    throw new Error("End date must be after start date");
  }
  return endDate.getTime() - startDate.getTime();
}

// HACK: Temporary workaround for MongoDB date conversion issue
// TODO: Replace with proper Prisma date handling once upgraded
const fixedDate = new Date(mongoDate as string);
```

---

## Automated Tools

### Prettier Configuration

Location: `.prettierrc.json`

```json
{
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

### ESLint Rules

Key rules enforced (`.eslintrc.json`):

- **TypeScript:** No `any` types, no unused vars (must start with `_` if intentionally unused)
- **React:** Hooks rules, no unescaped entities in JSX
- **Imports:** No require imports (use ES6 imports)
- **Console:** Only `console.warn()` and `console.error()` allowed
- **Naming:** camelCase for functions/vars, PascalCase for types/components

### Pre-commit Checklist

Before committing code:

```bash
# 1. Format all files
npm run format

# 2. Check for linting issues
npm run lint:fix

# 3. Run type checking
npm run type-check

# 4. Verify no errors remain
npm run check-all
```

---

## Common Issues to Avoid

### 1. Unused Variables

❌ **Problem:**
```typescript
import { User, Session, Post } from "@prisma/client"; // Post is unused

function getUser(userId: string) {
  const userName = "John"; // userName is unused
  return db.user.findUnique({ where: { id: userId } });
}
```

✅ **Solution:**
```typescript
import { User, Session } from "@prisma/client";

function getUser(userId: string) {
  return db.user.findUnique({ where: { id: userId } });
}

// If variable must exist but is unused, prefix with _
function processData(_unusedParam: string, activeData: string) {
  return activeData.toUpperCase();
}
```

### 2. Any Types

❌ **Problem:**
```typescript
function processUser(data: any) {
  return data.name.toUpperCase();
}
```

✅ **Solution:**
```typescript
interface UserData {
  name: string;
  email: string;
}

function processUser(data: UserData) {
  return data.name.toUpperCase();
}

// For truly unknown types:
function processUnknown(data: unknown) {
  if (typeof data === "object" && data !== null && "name" in data) {
    return (data as { name: string }).name.toUpperCase();
  }
  throw new Error("Invalid data format");
}
```

### 3. Missing React Hook Dependencies

❌ **Problem:**
```typescript
useEffect(() => {
  fetchData(userId);
}, []); // Missing userId dependency
```

✅ **Solution:**
```typescript
// Option 1: Include all dependencies
useEffect(() => {
  fetchData(userId);
}, [userId]);

// Option 2: Extract function inside effect
useEffect(() => {
  const loadData = async () => {
    const result = await fetch(`/api/users/${userId}`);
    setData(await result.json());
  };
  loadData();
}, [userId]);

// Option 3: Use useCallback for stable function reference
const fetchData = useCallback(async () => {
  const result = await fetch(`/api/users/${userId}`);
  setData(await result.json());
}, [userId]);

useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 4. Unescaped JSX Entities

❌ **Problem:**
```typescript
<p>It's a beautiful day</p> // Apostrophe not escaped
```

✅ **Solution:**
```typescript
<p>It&apos;s a beautiful day</p>
// Or use curly braces with JavaScript string
<p>{"It's a beautiful day"}</p>
```

### 5. Console.log in Production

❌ **Problem:**
```typescript
console.log("User data:", userData); // Logs to production console
```

✅ **Solution:**
```typescript
// Development only
if (process.env.NODE_ENV === "development") {
  console.warn("Debug: User data", userData);
}

// Production - use proper error logging
try {
  processUserData(userData);
} catch (error) {
  console.error("Failed to process user data:", error);
  // Also send to logging service in production
}
```

---

## Quick Reference

### Commands

| Command | Purpose |
|---------|---------|
| `npm run format` | Format all files with Prettier |
| `npm run format:check` | Check formatting without changes |
| `npm run lint` | Check for ESLint errors |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run lint:strict` | Strict linting (treats warnings as errors) |
| `npm run check-all` | Run both Prettier and ESLint checks |

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Component | PascalCase.tsx | `UserProfile.tsx` |
| Page | kebab-case/page.tsx | `mentor-dashboard/page.tsx` |
| API Route | kebab-case/route.ts | `user-sessions/route.ts` |
| Utility | kebab-case.ts | `date-utils.ts` |
| Type | kebab-case.ts | `session-types.ts` |

---

## Next Steps

After establishing code style (Phase 1), the project will move to:

- **Phase 2:** Component Architecture Standardization
- **Phase 3:** Type System Enhancement
- **Phase 4:** Error Handling Consistency
- **Phase 5:** Performance Optimization
- **Phase 6:** Testing Strategy
- **Phase 7:** Documentation Standards
- **Phase 8:** Security Audit
- **Phase 9:** Dependency Management
- **Phase 10:** Monitoring and Logging

See `CONSISTENCY_MAINTENANCE_PLAN.md` for the complete roadmap.

---

**Remember:** Code style is automatically enforced by Prettier and ESLint. When in doubt, run `npm run format` and `npm run lint:fix` to apply corrections automatically.
