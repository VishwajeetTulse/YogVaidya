# 🎯 YogVaidya Consistency Maintenance Plan

## Overview
A comprehensive plan to maintain consistency across the entire YogVaidya platform now that all features are implemented. This plan focuses on code quality, design patterns, documentation, and long-term maintainability.

---

## 📊 Current Project Status

### ✅ Completed Features
- User authentication & authorization (Better Auth)
- Dashboard systems (User, Mentor, Admin, Moderator)
- Subscription management (Bloom, Flourish plans)
- Session booking & scheduling
- Diet plan management with rich editor
- Payment integration (Razorpay)
- Toast notifications (Sonner)
- Real-time features
- Logging & monitoring

### 🎨 Tech Stack
- **Frontend**: Next.js 15.3.1, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI primitives
- **Database**: MongoDB with Prisma ORM
- **Auth**: Better Auth
- **Payments**: Razorpay
- **Editor**: TipTap
- **AI**: Google Gemini

---

## 🗺️ Consistency Plan - Phase by Phase

---

## Phase 1: Code Style & Formatting (Week 1)

### 🎯 Goal
Establish and enforce consistent code style across the entire codebase.

### Tasks

#### 1.1 ESLint Configuration Enhancement
**Priority**: HIGH
**File**: `.eslintrc.json`

**Actions**:
```json
{
  "extends": [
    "next/core-web-vitals",
    "next/typescript"
  ],
  "rules": {
    // Import organization
    "import/order": ["error", {
      "groups": [
        "builtin",
        "external",
        "internal",
        "parent",
        "sibling",
        "index"
      ],
      "pathGroups": [
        {
          "pattern": "react",
          "group": "external",
          "position": "before"
        },
        {
          "pattern": "@/components/**",
          "group": "internal",
          "position": "after"
        },
        {
          "pattern": "@/lib/**",
          "group": "internal",
          "position": "after"
        }
      ],
      "pathGroupsExcludedImportTypes": ["react"],
      "alphabetize": {
        "order": "asc",
        "caseInsensitive": true
      }
    }],

    // Consistency rules
    "react/jsx-curly-brace-presence": ["error", { "props": "never", "children": "never" }],
    "react/self-closing-comp": ["error", { "component": true, "html": true }],
    "prefer-const": "error",
    "no-var": "error",

    // TypeScript specific
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],

    // Naming conventions
    "@typescript-eslint/naming-convention": [
      "error",
      {
        "selector": "interface",
        "format": ["PascalCase"],
        "custom": {
          "regex": "^I[A-Z]",
          "match": false
        }
      },
      {
        "selector": "typeAlias",
        "format": ["PascalCase"]
      },
      {
        "selector": "enum",
        "format": ["PascalCase"]
      }
    ]
  }
}
```

**Commands to add to package.json**:
```json
"scripts": {
  "lint": "next lint",
  "lint:fix": "next lint --fix",
  "lint:strict": "next lint --max-warnings 0"
}
```

#### 1.2 Prettier Configuration
**Priority**: HIGH
**File**: `.prettierrc.json` (create new)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf",
  "bracketSpacing": true,
  "jsxSingleQuote": false,
  "bracketSameLine": false
}
```

**File**: `.prettierignore` (create new)
```
node_modules
.next
out
dist
build
coverage
*.md
*.mdx
pnpm-lock.yaml
package-lock.json
```

**Commands to add**:
```json
"scripts": {
  "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\"",
  "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,css,scss,md}\""
}
```

#### 1.3 VS Code Settings
**Priority**: MEDIUM
**File**: `.vscode/settings.json` (create new)

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "files.eol": "\n",
  "files.trimTrailingWhitespace": true,
  "files.insertFinalNewline": true
}
```

**File**: `.vscode/extensions.json` (create new)
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

---

## Phase 2: Component Architecture Standardization (Week 2)

### 🎯 Goal
Standardize component structure, prop patterns, and file organization.

### Tasks

#### 2.1 Component File Structure Standard
**Priority**: HIGH

**Standard Pattern**:
```tsx
// 1. Client/Server directive (if needed)
"use client";

// 2. External imports (React, Next.js, third-party)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 3. Internal UI components
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// 4. Icons
import { Calendar, Clock, User } from "lucide-react";

// 5. Utilities and hooks
import { toast } from "sonner";
import { useSession } from "@/lib/auth-client";

// 6. Types and interfaces
import type { User, Session } from "@/lib/types";

// 7. Type definitions (if not imported)
interface ComponentProps {
  id: string;
  title: string;
  onUpdate?: (data: unknown) => void;
}

// 8. Component definition
export default function ComponentName({ id, title, onUpdate }: ComponentProps) {
  // State declarations
  const [loading, setLoading] = useState(false);

  // Hooks
  const router = useRouter();
  const { data: session } = useSession();

  // Effects
  useEffect(() => {
    // Effect logic
  }, []);

  // Event handlers
  const handleSubmit = async () => {
    // Handler logic
  };

  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

#### 2.2 Prop Interface Naming Convention
**Priority**: HIGH

**Current Issues Found**:
- Inconsistent naming: `DietPlansSectionProps`, `StatCardProps`, `TimeSlot`
- Some components use inline props, some use interfaces

**Standard to Adopt**:
```tsx
// ✅ GOOD: ComponentName + Props suffix
interface TimeSlotCheckoutProps {
  slotId: string;
  mentorId: string;
}

// ✅ GOOD: Descriptive entity types
interface TimeSlot {
  id: string;
  scheduledAt: Date;
  sessionType: string;
}

// ❌ BAD: Generic or unclear names
interface Props {
  data: any;
}
```

**Action Items**:
1. Audit all component files
2. Rename inconsistent prop interfaces
3. Create a `COMPONENT_STANDARDS.md` guide

#### 2.3 Component Organization by Feature
**Priority**: MEDIUM

**Current Structure**:
```
src/components/
├── dashboard/
│   ├── admin/
│   ├── mentor/
│   ├── user/
│   └── shared/
├── forms/
├── ui/
└── ...
```

**Improvements Needed**:
1. **Create feature-based barrel exports**:
   ```tsx
   // src/components/dashboard/user/index.ts
   export { default as ProfileSection } from './sections/profile-section';
   export { default as PlansSection } from './sections/plans-section';
   export { default as TicketsSection } from './sections/tickets-section';
   ```

2. **Standardize section component naming**:
   - All dashboard sections: `*-section.tsx` ✅ (already consistent!)
   - All form components: `*Form.tsx` or `*-form.tsx`
   - All layout components: `*Layout.tsx`

---

## Phase 3: TypeScript Type Safety Enhancement (Week 3)

### 🎯 Goal
Eliminate `any` types, strengthen type safety, create shared type definitions.

### Tasks

#### 3.1 Central Type Definitions
**Priority**: HIGH
**File**: `src/lib/types/index.ts` (enhance existing)

**Add Missing Types**:
```typescript
// User & Auth Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  subscriptionStartDate?: Date;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = "USER" | "MENTOR" | "ADMIN" | "MODERATOR";
export type SubscriptionPlan = "BLOOM" | "FLOURISH" | null;

// Session Types
export interface SessionBooking {
  id: string;
  userId: string;
  mentorId: string;
  timeSlotId: string;
  sessionType: SessionType;
  scheduledAt: Date;
  duration: number;
  status: SessionStatus;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type SessionType = "YOGA" | "MEDITATION" | "CONSULTATION";
export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED";

// Mentor Types
export interface MentorProfile {
  id: string;
  userId: string;
  specialization: string[];
  experience: number;
  rating: number;
  bio?: string;
  certifications?: string[];
  availability: TimeSlot[];
}

export interface TimeSlot {
  id: string;
  mentorId: string;
  startTime: Date;
  endTime: Date;
  sessionType: SessionType;
  isBooked: boolean;
  price: number;
  isActive: boolean;
}

// Diet Plan Types
export interface DietPlan {
  id: string;
  mentorId: string;
  studentId: string;
  title: string;
  description?: string;
  content: any; // TipTap JSON
  isDraft: boolean;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// Component Prop Types
export interface DashboardSectionProps {
  userDetails: User;
  setActiveSection?: (section: string) => void;
}
```

#### 3.2 Eliminate `any` Types
**Priority**: HIGH

**Audit Command**:
```bash
# Find all 'any' usage
grep -r ":\s*any" src/ --include="*.ts" --include="*.tsx" | wc -l
```

**Found Issues**:
- `content?: any` in DietPlan interfaces
- `onChange: (json: any) => void` in DietPlanEditor
- `data: any` in various API handlers

**Action Items**:
1. Create specific types for TipTap content
2. Type all API response handlers
3. Add `@typescript-eslint/no-explicit-any` to ESLint rules

#### 3.3 Type-safe API Routes
**Priority**: MEDIUM

**Create**: `src/lib/types/api.ts`
```typescript
import type { NextRequest } from 'next/server';

export interface TypedNextRequest<T = unknown> extends NextRequest {
  json(): Promise<T>;
}

// Example usage:
export interface CreateTimeSlotRequest {
  startTime: string;
  endTime: string;
  sessionType: SessionType;
  price: number;
}

export interface CreateTimeSlotResponse {
  success: boolean;
  timeSlot?: TimeSlot;
  error?: string;
}
```

---

## Phase 4: Styling Consistency (Week 4)

### 🎯 Goal
Standardize colors, spacing, component variants, and design tokens.

### Tasks

#### 4.1 Design Token System
**Priority**: HIGH
**File**: `tailwind.config.ts` (enhance existing)

**Current Issues**:
- Hardcoded colors: `#876aff`, `#76d2fa`, `#ff7dac`, `#5abe9b`
- Inconsistent spacing
- Color values scattered across components

**Solution - Create Design Tokens**:
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // Brand Colors
        brand: {
          primary: '#876aff',      // Purple (Bloom)
          secondary: '#76d2fa',    // Blue
          accent: '#5abe9b',       // Green
          flourish: '#ff7dac',     // Pink (Flourish)
        },

        // Plan-specific gradients
        bloom: {
          from: '#CDC1FF',
          to: '#876aff',
          text: '#876aff',
        },
        flourish: {
          from: '#ffa6c5',
          to: '#ff7dac',
          text: '#ff7dac',
        },

        // Status colors
        status: {
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          info: '#3b82f6',
        },

        // Session type colors
        session: {
          yoga: '#876aff',
          meditation: '#76d2fa',
          consultation: '#5abe9b',
        },
      },

      spacing: {
        'section': '6rem',      // 96px - standard section spacing
        'card': '1.5rem',       // 24px - standard card padding
        'form': '2rem',         // 32px - form element spacing
      },

      borderRadius: {
        'card': '0.75rem',      // 12px
        'button': '0.5rem',     // 8px
      },

      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
    },
  },
};
```

**Action Items**:
1. Find and replace all hardcoded colors with design tokens
2. Update components to use new token system
3. Create a `DESIGN_SYSTEM.md` documentation

#### 4.2 Component Variant Standardization
**Priority**: MEDIUM

**Current Issues**:
- Button styles inconsistent across components
- Card styles vary
- Badge variants not standardized

**Create**: `src/lib/utils/component-variants.ts`
```typescript
import { cva, type VariantProps } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-button font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-brand-primary text-white hover:bg-brand-primary/90',
        destructive: 'bg-status-error text-white hover:bg-status-error/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-brand-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-button px-3',
        lg: 'h-11 rounded-button px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-brand-primary text-white',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        success: 'border-transparent bg-status-success text-white',
        warning: 'border-transparent bg-status-warning text-white',
        error: 'border-transparent bg-status-error text-white',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);
```

#### 4.3 Global CSS Cleanup
**Priority**: MEDIUM
**File**: `src/app/globals.css`

**Standardize**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Design tokens already in Tailwind config, but CSS variables for dynamic usage */
    --brand-primary: 135 106 255;      /* #876aff */
    --brand-secondary: 118 210 250;    /* #76d2fa */
    --brand-accent: 90 190 155;        /* #5abe9b */

    --radius: 0.5rem;
  }
}

@layer components {
  /* Standardized component classes */
  .section-container {
    @apply max-w-7xl mx-auto px-4 py-section;
  }

  .card-standard {
    @apply bg-white rounded-card shadow-card p-card;
  }

  .gradient-bloom {
    @apply bg-gradient-to-r from-bloom-from to-bloom-to;
  }

  .gradient-flourish {
    @apply bg-gradient-to-r from-flourish-from to-flourish-to;
  }
}
```

---

## Phase 5: Error Handling & Validation (Week 5)

### 🎯 Goal
Implement consistent error handling, input validation, and user feedback patterns.

### Tasks

#### 5.1 Centralized Error Handler
**Priority**: HIGH
**File**: `src/lib/utils/error-handler.ts` (create new)

```typescript
import { toast } from 'sonner';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const ErrorCodes = {
  // Auth errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',

  // Payment errors
  PAYMENT_FAILED: 'PAYMENT_FAILED',
  PAYMENT_VERIFICATION_FAILED: 'PAYMENT_VERIFICATION_FAILED',

  // General errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
} as const;

export function handleError(error: unknown, context?: string): void {
  console.error(`[${context || 'Error'}]:`, error);

  if (error instanceof AppError) {
    toast.error(error.message);
    return;
  }

  if (error instanceof Error) {
    toast.error(error.message || 'An unexpected error occurred');
    return;
  }

  toast.error('An unexpected error occurred. Please try again.');
}

// API Error Handler
export function handleApiError(error: unknown): Response {
  if (error instanceof AppError) {
    return Response.json(
      {
        success: false,
        error: error.message,
        code: error.code,
      },
      { status: error.statusCode }
    );
  }

  console.error('Unhandled API error:', error);

  return Response.json(
    {
      success: false,
      error: 'Internal server error',
      code: ErrorCodes.INTERNAL_ERROR,
    },
    { status: 500 }
  );
}
```

#### 5.2 Zod Schema Library
**Priority**: HIGH
**File**: `src/lib/validations/schemas.ts` (create new)

```typescript
import { z } from 'zod';

// User schemas
export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  phone: z.string()
    .regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number')
    .optional(),
});

// Session schemas
export const createTimeSlotSchema = z.object({
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  sessionType: z.enum(['YOGA', 'MEDITATION', 'CONSULTATION']),
  price: z.number().positive('Price must be positive'),
  maxParticipants: z.number().int().positive().optional(),
});

export const bookTimeSlotSchema = z.object({
  timeSlotId: z.string(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Diet plan schemas
export const createDietPlanSchema = z.object({
  studentId: z.string(),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  content: z.any(), // TipTap JSON
  isDraft: z.boolean().default(true),
  tags: z.array(z.string()).optional(),
});

// Export types
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type CreateTimeSlotInput = z.infer<typeof createTimeSlotSchema>;
export type BookTimeSlotInput = z.infer<typeof bookTimeSlotSchema>;
export type CreateDietPlanInput = z.infer<typeof createDietPlanSchema>;
```

**Usage in Components**:
```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signInSchema, type SignInInput } from '@/lib/validations/schemas';

export default function SignInForm() {
  const form = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
  });

  // ...
}
```

#### 5.3 Toast Notification Standards
**Priority**: MEDIUM

**Already Done** ✅ - Documented in `TOAST_NOTIFICATIONS_MIGRATION.md`

**Additional Standards**:
```typescript
// src/lib/utils/toast-helpers.ts
import { toast } from 'sonner';

export const toastMessages = {
  // Success messages
  success: {
    saved: 'Changes saved successfully',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
  },

  // Error messages
  error: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    unauthorized: 'Please sign in to continue.',
    forbidden: 'You don not have permission to perform this action.',
  },

  // Validation messages
  validation: {
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email address',
    invalidPhone: 'Please enter a valid phone number',
  },
};

// Shorthand helpers
export const showSuccess = (message: string) => toast.success(message);
export const showError = (message: string) => toast.error(message);
export const showWarning = (message: string) => toast.warning(message);
export const showInfo = (message: string) => toast.info(message);

// Confirmation helper
export const confirmAction = (
  message: string,
  onConfirm: () => void | Promise<void>
) => {
  toast.warning(message, {
    action: {
      label: 'Confirm',
      onClick: onConfirm,
    },
    cancel: {
      label: 'Cancel',
      onClick: () => {},
    },
  });
};
```

---

## Phase 6: Documentation & Comments (Week 6)

### 🎯 Goal
Create comprehensive documentation and establish commenting standards.

### Tasks

#### 6.1 TSDoc/JSDoc Standards
**Priority**: MEDIUM

**Standard Pattern**:
```typescript
/**
 * Creates a new time slot for a mentor
 *
 * @param mentorId - The ID of the mentor creating the slot
 * @param slotData - Time slot configuration data
 * @returns Promise resolving to the created time slot
 * @throws {AppError} If the mentor is not found or validation fails
 *
 * @example
 * ```ts
 * const slot = await createTimeSlot('mentor_123', {
 *   startTime: new Date('2025-10-05T10:00:00Z'),
 *   endTime: new Date('2025-10-05T11:00:00Z'),
 *   sessionType: 'YOGA',
 *   price: 500
 * });
 * ```
 */
export async function createTimeSlot(
  mentorId: string,
  slotData: CreateTimeSlotInput
): Promise<TimeSlot> {
  // Implementation
}
```

**Action Items**:
1. Document all public functions/methods
2. Document complex algorithms
3. Add examples for commonly used utilities

#### 6.2 Component Documentation
**Priority**: MEDIUM

**Pattern for Component Files**:
```tsx
/**
 * TimeSlotCheckout Component
 *
 * Handles the checkout process for booking mentor time slots.
 * Integrates with Razorpay for payment processing.
 *
 * @component
 * @example
 * ```tsx
 * <TimeSlotCheckout />
 * ```
 */
export default function TimeSlotCheckout() {
  // Implementation
}
```

#### 6.3 API Route Documentation
**Priority**: HIGH

**Create**: `API_DOCUMENTATION.md`

Structure:
```markdown
# API Documentation

## Authentication APIs

### POST /api/auth/signup
Create a new user account.

**Request Body:**
\`\`\`json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "phone": "string" (optional)
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "data": {
    "user": { ... }
  }
}
\`\`\`

**Error Codes:**
- `VALIDATION_ERROR` - Invalid input
- `ALREADY_EXISTS` - Email already registered
```

#### 6.4 Architecture Documentation
**Priority**: MEDIUM

**Create**: `ARCHITECTURE.md`
```markdown
# YogVaidya Architecture

## Overview
YogVaidya is a Next.js application following a feature-based architecture...

## Directory Structure
...

## Data Flow
...

## Authentication Flow
...

## Payment Flow
...
```

---

## Phase 7: Performance & Optimization (Week 7)

### 🎯 Goal
Optimize bundle size, implement lazy loading, improve performance.

### Tasks

#### 7.1 Code Splitting & Lazy Loading
**Priority**: HIGH

**Audit Large Imports**:
```bash
# Analyze bundle
npm run build
# Check .next/analyze/ for bundle composition
```

**Implement Lazy Loading**:
```tsx
// Before
import MentorTimeSlotManager from '@/components/dashboard/mentor/TimeSlotManager';

// After
import dynamic from 'next/dynamic';

const MentorTimeSlotManager = dynamic(
  () => import('@/components/dashboard/mentor/TimeSlotManager'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // if component is client-only
  }
);
```

**Target Components**:
- Rich text editor (DietPlanEditor)
- Large dashboard sections
- Chart/visualization components

#### 7.2 Image Optimization
**Priority**: MEDIUM

**Ensure all images use Next.js Image**:
```tsx
// ✅ GOOD
import Image from 'next/image';
<Image src="/assets/yoga.svg" alt="Yoga" width={400} height={300} />

// ❌ BAD
<img src="/assets/yoga.svg" alt="Yoga" />
```

**Action Items**:
1. Audit all `<img>` tags
2. Convert to Next.js `<Image>`
3. Add proper width/height attributes
4. Implement blur placeholders for large images

#### 7.3 Database Query Optimization
**Priority**: HIGH

**Add Indexes** (if not already present):
```prisma
model SessionBooking {
  // ... existing fields

  @@index([userId, scheduledAt])
  @@index([mentorId, scheduledAt])
  @@index([paymentStatus])
}

model Schedule {
  // ... existing fields

  @@index([userId, scheduledTime])
  @@index([mentorId, scheduledTime])
}
```

**Implement Query Caching**:
```typescript
// src/lib/cache/query-cache.ts
import { unstable_cache } from 'next/cache';

export const getMentorProfile = unstable_cache(
  async (mentorId: string) => {
    return await prisma.mentor.findUnique({ where: { id: mentorId } });
  },
  ['mentor-profile'],
  { revalidate: 3600 } // 1 hour
);
```

---

## Phase 8: Testing Infrastructure (Week 8)

### 🎯 Goal
Establish testing patterns and critical test coverage.

### Tasks

#### 8.1 Testing Setup
**Priority**: HIGH

**Install Dependencies**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

**Configure Jest**: `jest.config.js`
```javascript
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

#### 8.2 Unit Testing Priority
**Priority**: MEDIUM

**Focus Areas**:
1. Utility functions (`src/lib/utils/`)
2. Validation schemas (`src/lib/validations/`)
3. Type conversions (`convertMongoDate`, etc.)
4. Business logic functions

**Example Test**:
```typescript
// src/lib/utils/__tests__/date-utils.test.ts
import { convertMongoDate } from '../date-utils';

describe('convertMongoDate', () => {
  it('should convert MongoDB date object to JS Date', () => {
    const mongoDate = { $date: '2025-10-05T10:00:00.000Z' };
    const result = convertMongoDate(mongoDate);
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe('2025-10-05T10:00:00.000Z');
  });

  it('should return existing Date unchanged', () => {
    const date = new Date('2025-10-05T10:00:00.000Z');
    const result = convertMongoDate(date);
    expect(result).toBe(date);
  });
});
```

#### 8.3 Component Testing
**Priority**: LOW (for now)

**Test Critical User Flows**:
- Sign in/Sign up forms
- Checkout process
- Time slot booking

---

## Phase 9: Security & Best Practices (Week 9)

### 🎯 Goal
Implement security best practices and vulnerability scanning.

### Tasks

#### 9.1 Environment Variable Validation
**Priority**: HIGH
**File**: `src/lib/config/env.ts` (create new)

```typescript
import { z } from 'zod';

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),

  // Razorpay
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),

  // Email
  EMAIL_FROM: z.string().email(),
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string(),
  SMTP_USER: z.string(),
  SMTP_PASSWORD: z.string(),

  // AI
  GOOGLE_GENERATIVE_AI_API_KEY: z.string(),

  // Node environment
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

export const env = envSchema.parse(process.env);
```

#### 9.2 API Rate Limiting
**Priority**: MEDIUM
**File**: `src/middleware.ts` (enhance)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory rate limiter (use Redis in production)
const rateLimit = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
};

export function middleware(request: NextRequest) {
  const ip = request.ip ?? 'anonymous';
  const now = Date.now();

  const userLimit = rateLimit.get(ip);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimit.set(ip, {
      count: 1,
      resetAt: now + RATE_LIMIT.windowMs,
    });
  } else {
    userLimit.count++;

    if (userLimit.count > RATE_LIMIT.max) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

#### 9.3 Security Headers
**Priority**: HIGH
**File**: `next.config.ts` (enhance)

```typescript
const nextConfig = {
  // ... existing config

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};
```

---

## Phase 10: Monitoring & Analytics (Week 10)

### 🎯 Goal
Implement logging, error tracking, and usage analytics.

### Tasks

#### 10.1 Structured Logging
**Priority**: HIGH

**Already Implemented** ✅ - You have `useLogger` hook!

**Enhance**:
```typescript
// src/lib/utils/logger.ts
export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => {
    console.log(`[INFO] ${message}`, meta);
    // Send to logging service in production
  },

  error: (message: string, error?: unknown, meta?: Record<string, unknown>) => {
    console.error(`[ERROR] ${message}`, error, meta);
    // Send to error tracking service (Sentry, etc.)
  },

  warn: (message: string, meta?: Record<string, unknown>) => {
    console.warn(`[WARN] ${message}`, meta);
  },

  debug: (message: string, meta?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, meta);
    }
  },
};
```

#### 10.2 Error Tracking Integration
**Priority**: MEDIUM

**Consider**: Sentry, LogRocket, or similar

```bash
npm install @sentry/nextjs
```

#### 10.3 Analytics Dashboard
**Priority**: LOW

**Metrics to Track**:
- User signups
- Session bookings
- Payment success rate
- Page views
- Error rates

---

## 📋 Maintenance Checklist (Ongoing)

### Daily
- [ ] Monitor error logs
- [ ] Review user feedback/support tickets
- [ ] Check payment transaction status

### Weekly
- [ ] Review and merge dependency updates
- [ ] Run `npm audit` and fix vulnerabilities
- [ ] Review database performance metrics
- [ ] Check disk space and database size

### Monthly
- [ ] Review and update documentation
- [ ] Audit unused dependencies
- [ ] Review and optimize slow queries
- [ ] Update security policies
- [ ] Review user analytics and usage patterns

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Performance review and optimization
- [ ] Code review sessions with team
- [ ] Update disaster recovery plan

---

## 🚀 Quick Start Implementation Order

### Week 1-2: Foundation (Immediate Priority)
1. ✅ Set up ESLint + Prettier
2. ✅ Configure VS Code settings
3. ✅ Create type definitions file
4. ✅ Set up design tokens in Tailwind

### Week 3-4: Code Quality
5. ✅ Eliminate `any` types
6. ✅ Standardize component structure
7. ✅ Implement error handling patterns
8. ✅ Create validation schemas

### Week 5-6: Documentation
9. ✅ Document API routes
10. ✅ Add TSDoc comments
11. ✅ Create architecture docs
12. ✅ Update README

### Week 7-8: Optimization
13. ✅ Implement lazy loading
14. ✅ Optimize images
15. ✅ Add database indexes
16. ✅ Set up basic tests

### Week 9-10: Security & Monitoring
17. ✅ Validate environment variables
18. ✅ Add security headers
19. ✅ Implement rate limiting
20. ✅ Set up error tracking

---

## 📊 Success Metrics

### Code Quality
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors
- ✅ < 10 ESLint warnings
- ✅ No `any` types in new code
- ✅ 80%+ test coverage for utilities

### Performance
- ✅ Lighthouse score > 90
- ✅ First Contentful Paint < 1.8s
- ✅ Time to Interactive < 3.8s
- ✅ Bundle size < 250KB (main)

### Developer Experience
- ✅ All components documented
- ✅ All APIs documented
- ✅ Onboarding docs complete
- ✅ Consistent code style

---

## 🔧 Tools & Resources

### Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Error Lens

### Helpful Commands
```bash
# Code quality
npm run lint              # Check linting
npm run lint:fix          # Fix linting issues
npm run format            # Format code with Prettier
npm run type-check        # Check TypeScript types

# Testing
npm test                  # Run tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report

# Build
npm run build            # Production build
npm run analyze          # Analyze bundle size

# Database
npm run db:push          # Push schema changes
npm run db:generate      # Generate Prisma client
npm run db:studio        # Open Prisma Studio
```

---

## 📚 Documentation Files to Create

1. `ARCHITECTURE.md` - System architecture overview
2. `API_DOCUMENTATION.md` - Complete API reference
3. `DESIGN_SYSTEM.md` - Design tokens and component guide
4. `COMPONENT_STANDARDS.md` - Component development guide
5. `CONTRIBUTING.md` - How to contribute to the project
6. `DEPLOYMENT.md` - Deployment procedures
7. `SECURITY.md` - Security policies and best practices
8. `CHANGELOG.md` - Version history

---

## 🎯 Final Goal

**A maintainable, scalable, and consistent codebase where:**
- Any developer can understand the code quickly
- Changes are predictable and safe
- Bugs are caught early
- Performance is optimized
- Security is prioritized
- Documentation is comprehensive

---

**Next Steps**:
1. Review this plan
2. Prioritize phases based on your immediate needs
3. Create GitHub issues/tasks for each phase
4. Start with Phase 1 (ESLint + Prettier setup)
5. Work through phases systematically

Would you like me to start implementing any specific phase?
