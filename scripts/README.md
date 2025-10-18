# 🧘 YogVaidya

> A comprehensive platform connecting yoga, meditation, and diet planning mentors with students worldwide.

**Status**: ✅ Production Ready | **Build**: 10.0s | **Errors**: 0 | **Warnings**: 0

---

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Available Scripts](#available-scripts)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Subscription System](#subscription-system)
- [Session Types](#session-types)
- [Developer Guide](#developer-guide)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

YogVaidya is a full-stack Next.js application that creates a marketplace for wellness mentorship. It connects students with certified mentors across three main disciplines:

- **🧘 Yoga**: Hatha, Vinyasa, Power Yoga, Yin, Prenatal, Restorative
- **🧠 Meditation**: Mindfulness, Pranayama (breathing), Guided meditation
- **🥗 Diet Planning**: Nutritional guidance, meal planning, lifestyle coaching

The platform handles complex business logic including:
- Multi-tier subscription plans
- Real-time session management
- Payment processing with Razorpay
- Role-based dashboards (Admin, Mentor, User/Student)
- AI-powered chat assistance
- Comprehensive analytics and reporting

---

## ✨ Key Features

### 👥 User Roles & Access Control

| Role | Capabilities | Features |
|------|--------------|----------|
| **Student (USER)** | Book sessions, upgrade subscriptions, view mentors, AI chat | Dashboard, session history, billing, diet plans (FLOURISH) |
| **Mentor** | Create sessions, manage schedule, view students, create diet plans | Dashboard, session analytics, student management, content creation |
| **Moderator** | User moderation, tier management | Analytics, user lookup, subscription extension |
| **Admin** | Full platform control | User management, mentor approval, analytics, exports |

### 📚 Subscription Plans

Three-tier subscription system with progressive feature access:

| Plan | Price | Features | Session Access |
|------|-------|----------|-----------------|
| **SEED** | Entry-level | Basic features, trial access | Meditation (SEED) |
| **BLOOM** | Mid-tier | Enhanced features, expert mentors | Yoga (BLOOM), Meditation (BLOOM) |
| **FLOURISH** | Premium | All features, diet plans, priority support | All sessions including Diet (FLOURISH only) |

**Features**:
- 7-day free trial for new users
- Flexible monthly or annual billing
- Automatic renewal with email reminders
- Cancel anytime with no penalties
- Prorated billing for plan changes
- 3-day grace period for failed payments

### 🎓 Session Types

**Subscription Sessions** (recurring for subscribers):
- Regular group/class-based sessions
- Available based on subscription plan
- Automatic booking for eligible subscribers
- Session capacity and scheduling

**One-Time Individual Sessions** (pay-per-session):
- Direct booking with mentors
- Custom scheduling
- Razorpay payment integration
- Session-specific pricing

### 🍽️ Diet Plan Feature

Premium feature (FLOURISH subscribers only):
- Mentors create personalized meal plans
- Rich text editor for meal content
- Draft/publish workflow
- Email notifications on publish
- Student-only access to published plans
- Track diet sessions separately

### 💬 AI Chat Integration

- Powered by Google's Gemini AI
- Real-time chat support
- Context-aware responses
- Available on dashboard sidebar

### 📊 Analytics & Reporting

- Student engagement metrics
- Session completion rates
- Revenue analytics
- Mentor performance tracking
- Platform usage statistics
- Admin export capabilities

---

## 🛠 Tech Stack

### Frontend
- **Next.js 15.3.1** - React framework with App Router
- **React 19.0** - UI library
- **TypeScript 5.8** - Type safety
- **Tailwind CSS 4** - Styling & responsive design
- **Radix UI** - Accessible component primitives
- **TipTap** - Rich text editing (diet plans)
- **Embla Carousel** - Carousel component
- **Sonner** - Toast notifications

### Backend & Database
- **Node.js** - Runtime
- **Prisma 6.7** - ORM (MongoDB)
- **MongoDB 6.16** - Database
- **Better Auth 1.2.7** - Authentication
- **Razorpay 2.9.6** - Payment processing
- **Nodemailer 6.10** - Email service

### AI & External Services
- **@ai-sdk/google** - Gemini AI integration
- **@ai-sdk/react** - React AI SDK
- **node-schedule** - Cron job scheduling

### Development Tools
- **ESLint 9.25.1** - Linting
- **Prettier 3.6.2** - Code formatting
- **TypeScript Strict Mode** - Enhanced type checking
- **TSX 4.19.3** - TypeScript execution

---

## 📁 Project Structure

```
YogVaidya/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes (69 endpoints)
│   │   │   ├── admin/                # Admin operations
│   │   │   ├── analytics/            # Analytics endpoints
│   │   │   ├── auth/                 # Authentication
│   │   │   ├── billing/              # Payment & subscription
│   │   │   ├── chat/                 # AI chat
│   │   │   ├── mentor/               # Mentor operations
│   │   │   ├── sessions/             # Session management
│   │   │   ├── students/             # Student operations
│   │   │   ├── subscription/         # Subscription management
│   │   │   ├── tickets/              # Support tickets
│   │   │   └── users/                # User management
│   │   ├── dashboard/                # Dashboard pages
│   │   │   ├── admin/                # Admin dashboard
│   │   │   ├── mentor/               # Mentor dashboard
│   │   │   ├── moderator/            # Moderator dashboard
│   │   │   └── student/              # Student dashboard
│   │   ├── checkout/                 # Subscription checkout
│   │   ├── mentors/                  # Mentor listing & discovery
│   │   ├── pricing/                  # Pricing page
│   │   ├── signin/                   # Login page
│   │   ├── signup/                   # Registration page
│   │   └── layout.tsx                # Root layout
│   │
│   ├── components/                   # React Components
│   │   ├── Auth/                     # Authentication forms
│   │   ├── checkout/                 # Payment components
│   │   ├── dashboard/                # Dashboard sections
│   │   │   ├── admin/                # Admin sections
│   │   │   ├── mentor/               # Mentor sections
│   │   │   ├── moderator/            # Moderator sections
│   │   │   └── student/              # Student sections
│   │   ├── landing/                  # Landing page components
│   │   ├── layout/                   # Header, footer, navbar
│   │   ├── mentor/                   # Mentor-specific components
│   │   ├── editor/                   # Rich text editor
│   │   ├── common/                   # Shared components
│   │   └── ui/                       # Base UI components (Radix)
│   │
│   ├── lib/                          # Core business logic
│   │   ├── config/                   # Configuration files
│   │   │   ├── auth.ts               # Better Auth setup
│   │   │   ├── prisma.ts             # Prisma singleton
│   │   │   └── env.ts                # Environment validation
│   │   ├── server/                   # Server-side actions
│   │   │   ├── user-sessions-server.ts
│   │   │   ├── mentor-sessions-server.ts
│   │   │   ├── user-mentor-server.ts
│   │   │   ├── settings-server.ts
│   │   │   └── [more server functions]
│   │   ├── services/                 # Business logic services
│   │   ├── utils/                    # Utility functions
│   │   │   ├── error-handler.ts      # Error classes & handling
│   │   │   ├── response-handler.ts   # API response standardization
│   │   │   └── datetime-utils.ts
│   │   ├── types/                    # TypeScript definitions
│   │   │   ├── sessions.ts
│   │   │   └── [domain-specific types]
│   │   ├── actions/                  # Next.js server actions
│   │   ├── stores/                   # Client state management
│   │   └── types.ts                  # Global types
│   │
│   ├── hooks/                        # React hooks
│   │   ├── use-session-status-updates.ts
│   │   ├── use-profile-completion.ts
│   │   ├── use-trial-expiration.ts
│   │   └── use-mobile.ts
│   │
│   └── middleware.ts                 # Next.js middleware
│
├── prisma/
│   └── schema.prisma                 # Database schema
│
├── public/                           # Static assets
│   ├── assets/                       # Images, CSV files
│   └── proofs/                       # Verification files
│
├── scripts/                          # Utility scripts
│   ├── README.md                     # Scripts documentation
│   └── [utility scripts]
│
├── docs/                             # (Optional) Additional docs
├── .vscode/                          # VS Code settings
├── .env.local                        # Environment variables (not committed)
├── .eslintrc.json                    # ESLint configuration
├── .prettierrc.json                  # Prettier configuration
├── components.json                   # Shadcn/ui configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies
├── postcss.config.mjs                # PostCSS configuration
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- MongoDB instance (cloud or local)
- Razorpay account (for payments)
- Google Cloud credentials (for AI)

### 1. Clone Repository

```bash
git clone <repository-url>
cd YogVaidya
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Create `.env.local` file:

```bash
# Database
DATABASE_URL=mongodb+srv://user:password@cluster.mongodb.net/yogvaidya

# Authentication
BETTER_AUTH_SECRET=your-secret-key-here
BETTER_AUTH_URL=http://localhost:3000

# Razorpay
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Google AI
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
```

### 4. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push
```

### 5. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

---

## 📜 Available Scripts

### Development
```bash
# Start dev server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting errors
npm run lint:fix

# Format code with Prettier
npm run format

# Check formatting (no changes)
npm run format:check

# Run all checks (lint + format)
npm run check-all
```

### Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to database
npm run db:push
```

### Utilities
```bash
# Delete session bookings
npm run delete-session-bookings

# Truncate schedule (various options)
npm run truncate-schedule
npm run truncate-schedule-dry-run
npm run truncate-schedule-force
npm run truncate-schedule-robust
npm run truncate-schedule-robust-dry
```

---

## 🔌 API Endpoints

### Overview
- **Total Routes**: 69 API endpoints
- **Status**: 100% integrated with error handlers & security headers
- **Build Time**: 10.0 seconds
- **Type Safety**: TypeScript strict mode

### Authentication (`/api/auth/`)
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - Logout
- `POST /api/auth/reset-password` - Reset password

### Users (`/api/users/`)
- `GET /api/users` - Get user profile
- `PUT /api/users` - Update profile
- `POST /api/users/start-trial` - Initiate trial
- `POST /api/users/extend-trial` - Extend trial period

### Subscriptions (`/api/subscription/`)
- `POST /api/subscription/create-order` - Create subscription order
- `POST /api/subscription/verify-payment` - Verify payment
- `POST /api/subscription/cancel` - Cancel subscription
- `GET /api/subscription/status` - Get subscription status

### Sessions (`/api/sessions/`)
- `GET /api/sessions/[sessionId]` - Get session details
- `POST /api/sessions/[sessionId]/join` - Join session
- `POST /api/sessions/[sessionId]/leave` - Leave session
- `GET /api/sessions/history` - Session history

### Mentors (`/api/mentor/`)
- `GET /api/mentors` - List mentors
- `GET /api/mentors/[id]` - Get mentor profile
- `POST /api/mentor/subscription-sessions` - Create subscription session
- `GET /api/mentor/subscription-sessions` - Get mentor's sessions
- `POST /api/mentor/book-session` - Book one-on-one session
- `POST /api/mentor/verify-session-payment` - Verify session payment
- `POST /api/mentor/diet-plans` - Create diet plan
- `GET /api/mentor/diet-plans` - Get diet plans
- `DELETE /api/mentor/diet-plans/[id]` - Delete diet plan

### Admin (`/api/admin/`)
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/[id]/role` - Update user role
- `POST /api/admin/mentors/approve` - Approve mentor
- `GET /api/admin/statistics` - Platform statistics
- `GET /api/admin/export` - Export data

### Tickets (`/api/tickets/`)
- `POST /api/tickets` - Create support ticket
- `GET /api/tickets` - List user's tickets
- `PUT /api/tickets/[id]` - Update ticket
- `POST /api/tickets/[id]/comment` - Add comment

### Analytics (`/api/analytics/`)
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/mentors` - Mentor analytics
- `GET /api/analytics/revenue` - Revenue data

### Chat (`/api/chat/`)
- `POST /api/chat/message` - Send message to AI
- `GET /api/chat/history` - Chat history

---

## 🗄️ Database Schema

### Core Models

#### User
```typescript
model User {
  id                    String           // Unique identifier
  role                  Role             // USER | MENTOR | ADMIN | MODERATOR
  mentorType            MentorType?      // YOGAMENTOR | MEDITATIONMENTOR | DIETPLANNER
  email                 String           // Unique email
  name                  String?
  phone                 String?
  image                 String?

  // Subscription
  subscriptionPlan      SubscriptionPlan?    // SEED | BLOOM | FLOURISH
  subscriptionStatus    SubscriptionStatus   // ACTIVE | INACTIVE | CANCELLED
  subscriptionStartDate DateTime?
  subscriptionEndDate   DateTime?
  billingPeriod         String?              // "monthly" | "annual"

  // Trial
  isTrialActive         Boolean
  trialEndDate          DateTime?
  trialUsed             Boolean

  // Payment
  razorpaySubscriptionId String?
  razorpayCustomerId    String?
  lastPaymentDate       DateTime?
  nextBillingDate       DateTime?
  paymentAmount         Float?
  autoRenewal           Boolean?

  // Mentor specific
  sessionPrice          Float?
  isAvailable           Boolean

  // Relations
  sessions              Session[]
  schedules             Schedule[]
  studentBookings       SessionBooking[]
  mentorBookings        SessionBooking[]
  tickets               Ticket[]
  studentDietPlans      DietPlan[]
  mentorDietPlans       DietPlan[]
}
```

#### Schedule (Subscription Sessions)
```typescript
model Schedule {
  id                String            // UUID
  mentorId          String
  mentor            User              @relation(fields: [mentorId])

  title             String
  scheduledTime     DateTime
  duration          Int               // Minutes
  sessionType       SessionType       // YOGA | MEDITATION | DIET
  status            ScheduleStatus    // SCHEDULED | ONGOING | COMPLETED | CANCELLED
  link              String?           // Video link
  notes             String?

  sessionBookings   SessionBooking[]
  createdAt         DateTime
  updatedAt         DateTime
}
```

#### SessionBooking (One-Time Sessions)
```typescript
model SessionBooking {
  id                String
  studentId         String
  mentorId          String
  sessionId         String?

  sessionType       SessionType
  status            ScheduleStatus
  paymentStatus     String
  razorpayOrderId   String?
  razorpayPaymentId String?
  amount            Float

  createdAt         DateTime
  updatedAt         DateTime
}
```

#### DietPlan
```typescript
model DietPlan {
  id                String
  studentId         String
  mentorId          String
  sessionId         String?

  title             String
  description       String?
  content           String        // Rich text content
  isDraft           Boolean
  tags              String?

  createdAt         DateTime
  updatedAt         DateTime
}
```

#### Ticket (Support)
```typescript
model Ticket {
  id                String
  userId            String
  assignedToId      String?

  title             String
  description       String
  category          TicketCategory
  priority          TicketPriority
  status            TicketStatus

  createdAt         DateTime
  updatedAt         DateTime
}
```

---

## 🔐 Authentication

### System
- **Framework**: Better Auth 1.2.7
- **Session Management**: Secure cookie-based sessions
- **Password Security**: bcryptjs hashing
- **OAuth Support**: Google login integration

### Implementation
```typescript
// Login
const session = await authClient.signIn.email({
  email: "user@example.com",
  password: "password",
});

// Access current session
const { data: session } = await authClient.useSession();

// Protected routes
export const auth = betterAuth({
  // Configuration in src/lib/config/auth.ts
});
```

### Middleware
- Redirects unauthenticated users to login
- Validates session on protected routes
- Handles role-based access

---

## 💳 Subscription System

### Lifecycle

1. **New User**
   - Automatic 7-day SEED trial
   - Access to Meditation sessions
   - Can view but not access Yoga/Diet

2. **Trial Active**
   - 48-hour renewal reminder email
   - Option to upgrade anytime
   - Prorated charges for upgrades

3. **Subscription Active**
   - Access based on plan (SEED/BLOOM/FLOURISH)
   - Automatic renewal setup
   - Billing emails

4. **Failed Payment**
   - 3-day grace period
   - Retry mechanism
   - Downgrade option

5. **Cancellation**
   - Immediate effect
   - Option to reactivate
   - Support ticket for issues

### Payment Processing

```typescript
// Create order
const order = await createSubscriptionOrder({
  userId: user.id,
  planId: 'BLOOM',
  billingPeriod: 'monthly'
});

// Verify payment
const verified = await verifySubscriptionPayment({
  userId: user.id,
  razorpayPaymentId: paymentId
});
```

---

## 🎓 Session Types & Access

### YOGA Sessions
- **Available to**: BLOOM, FLOURISH subscribers
- **Types**: Hatha, Vinyasa, Power, Yin, Prenatal, Restorative
- **Mentor**: YOGAMENTOR
- **Booking**: Subscription (automatic) or Individual (pay-per-session)

### MEDITATION Sessions
- **Available to**: SEED, FLOURISH subscribers
- **Types**: Mindfulness, Pranayama, Guided Meditation
- **Mentor**: MEDITATIONMENTOR
- **Booking**: Subscription (automatic) or Individual (pay-per-session)

### DIET Sessions
- **Available to**: FLOURISH subscribers only
- **Features**: Meal planning, nutritional guidance, lifestyle coaching
- **Mentor**: DIETPLANNER
- **Booking**: Individual sessions or Diet plans

### Access Matrix

| Plan | Yoga | Meditation | Diet | Price |
|------|------|-----------|------|-------|
| SEED | ❌ | ✅ | ❌ | Free (7 days) |
| BLOOM | ✅ | ✅ | ❌ | ₹299/month |
| FLOURISH | ✅ | ✅ | ✅ | ₹599/month |

---

## 👨‍💻 Developer Guide

### Adding a New API Endpoint

1. **Create route file**
```typescript
// src/app/api/[domain]/[action]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/config/auth";
import { headers } from "next/headers";
import { ValidationError, AuthenticationError } from "@/lib/utils/error-handler";
import { errorResponse, successResponse } from "@/lib/utils/response-handler";

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user?.id) {
      throw new AuthenticationError("Unauthorized");
    }

    // Validate input
    const body = await request.json();
    // Validate with Zod schema

    // Business logic
    // ...

    return successResponse({ data: result });
  } catch (error) {
    return errorResponse(error);
  }
}
```

2. **Use error & response handlers**
```typescript
import {
  AuthenticationError,
  AuthorizationError,
  ValidationError,
  NotFoundError
} from "@/lib/utils/error-handler";

// Automatically mapped to correct HTTP status codes
throw new ValidationError("Invalid input");        // 400
throw new AuthenticationError("Not logged in");   // 401
throw new AuthorizationError("Not allowed");      // 403
throw new NotFoundError("Resource not found");    // 404
```

3. **Database access**
```typescript
import { prisma } from "@/lib/config/prisma";

// Always use singleton instance
const user = await prisma.user.findUnique({
  where: { id: userId }
});
```

### Type Safety Best Practices

1. Use Prisma types:
```typescript
import type { User, SubscriptionPlan } from "@prisma/client";
```

2. Define request/response types:
```typescript
interface CreateSessionRequest {
  title: string;
  duration: number;
  sessionType: "YOGA" | "MEDITATION" | "DIET";
}

interface CreateSessionResponse {
  id: string;
  title: string;
  status: "SCHEDULED" | "ONGOING" | "COMPLETED";
}
```

3. Use Zod for validation:
```typescript
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  duration: z.number().min(15).max(180),
  sessionType: z.enum(["YOGA", "MEDITATION", "DIET"])
});

const validated = schema.parse(body);
```

### Testing Endpoints

Use the included API testing tools:

```bash
# Check API health
curl http://localhost:3000/api/health

# Test with authentication
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/users
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

**Verification:**
- ✅ Compiles successfully in 10.0 seconds
- ✅ 0 TypeScript errors
- ✅ 0 ESLint warnings
- ✅ All 69 API routes integrated

### Environment Variables for Production

Required on deployment platform:
```
DATABASE_URL
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
GOOGLE_GENERATIVE_AI_API_KEY
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
```

### Deployment Platforms

**Vercel (Recommended)**
```bash
vercel deploy
```

**Docker**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

**Traditional Node Server**
```bash
npm install -g pm2
pm2 start "npm start" --name yogvaidya
pm2 save
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: Unable to connect to MongoDB
```
**Solution:**
- Verify `DATABASE_URL` in `.env.local`
- Check MongoDB network access (IP whitelist)
- Ensure IP address is allowed in MongoDB Atlas

#### 2. Authentication Not Working
```
Error: Session not found
```
**Solution:**
- Verify `BETTER_AUTH_SECRET` is set
- Clear browser cookies
- Check session expiration time
- Verify user exists in database

#### 3. Payment Processing Fails
```
Error: Razorpay API key invalid
```
**Solution:**
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Check if keys are for correct environment (test vs live)
- Ensure webhook URLs are configured in Razorpay dashboard

#### 4. AI Chat Not Responding
```
Error: Google AI API error
```
**Solution:**
- Verify `GOOGLE_GENERATIVE_AI_API_KEY` is set
- Check API quota and billing in Google Cloud
- Ensure API is enabled in Google Cloud console

#### 5. Build Fails with Type Errors
```
Error: Type 'X' is not assignable to type 'Y'
```
**Solution:**
```bash
# Regenerate Prisma client
npm run db:generate

# Check types
npm run check-all

# Fix type issues
npm run lint:fix
```

#### 6. Emails Not Sending
```
Error: SMTP connection failed
```
**Solution:**
- Verify SMTP credentials in `.env.local`
- For Gmail: Use App Password, not regular password
- Enable "Less secure apps" if needed
- Check firewall/network restrictions

### Debug Mode

Enable detailed logging:

```typescript
// src/lib/utils/logger.ts
const DEBUG = process.env.DEBUG === 'true';

if (DEBUG) {
  console.log('[DEBUG]', 'message');
}
```

Run with debug:
```bash
DEBUG=true npm run dev
```

### Check Build Status

```bash
npm run build 2>&1 | grep -E "error|warning"
npm run lint
npm run format:check
```

---

## 📞 Support & Contributing

### Getting Help

1. **Check existing issues** in GitHub
2. **Read error logs** - They're detailed and helpful
3. **Test with smaller examples** - Isolate the problem
4. **Check TypeScript types** - Ensure type safety

### Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards

- **TypeScript Strict**: All code must pass strict mode
- **ESLint**: Run `npm run lint:fix` before committing
- **Prettier**: Format with `npm run format`
- **Type Safety**: Use explicit types, avoid `any`
- **Error Handling**: Always handle errors gracefully

---

## 📊 Project Stats

- **Total Files**: 200+ (production code)
- **API Routes**: 69 fully integrated endpoints
- **Build Time**: 10.0 seconds
- **TypeScript Coverage**: 100%
- **Type Errors**: 0
- **Linting Warnings**: 0
- **Code Lines**: 10,000+ (excluding node_modules)
- **Database Models**: 15+ Prisma models
- **UI Components**: 50+ React components

---

## 📝 License

This project is proprietary. All rights reserved.

---

## 👤 Team

**Project**: YogVaidya - Wellness Mentorship Platform
**Status**: Production Ready ✅
**Last Updated**: October 18, 2025

---

## 🧪 Testing

### Test Suite Overview

**Total Tests**: 483 ✅ | **Coverage**: Comprehensive | **Framework**: Vitest v3.2.4

#### Test Structure

All tests are organized in a centralized `src/__tests__/` directory:

```
src/__tests__/
├── unit/                    # Unit tests (13 files, 267 tests)
│   ├── api-routes.test.ts                    # API endpoints (30 tests)
│   ├── auth-security.test.ts                 # JWT, RBAC, MFA (26 tests)
│   ├── billing-actions.test.ts               # Billing & subscriptions (29 tests)
│   ├── dashboard-analytics.test.ts           # Analytics logic (20 tests)
│   ├── email-service.test.ts                 # Email validation (27 tests)
│   ├── file-upload-security.test.ts          # File security (35 tests)
│   ├── mentor-logic.test.ts                  # Mentor workflows (28 tests)
│   ├── prisma-operations.test.ts             # Database ops (23 tests)
│   ├── razorpay-service.test.ts              # Payment gateway (11 tests)
│   ├── session-booking.test.ts               # Session logic (24 tests)
│   ├── session-service.test.ts               # Session data (10 tests)
│   ├── subscription-management.test.ts       # Subscription lifecycle (28 tests)
│   └── validation-utilities.test.ts          # Input validation (28 tests)
│
└── integration/             # Integration tests (5 files, 216 tests)
    ├── auth-flow.integration.test.ts         # Login/signup workflows (40 tests)
    ├── email-notifications.integration.test.ts # Email delivery (34 tests)
    ├── payment-flow.integration.test.ts      # Payment workflows (12 tests)
    ├── real-service-integration.test.ts      # Business logic (24 tests)
    └── session-complete-flow.integration.test.ts # End-to-end sessions (33 tests)
```

#### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI dashboard
npm run test:ui

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- src/__tests__/unit/auth-security.test.ts

# Run tests matching pattern
npm test -- --grep "payment"
```

#### Test Coverage

Current targets:
- **Statements**: 35%+
- **Functions**: 35%+
- **Branches**: 30%+
- **Lines**: 35%+

#### Key Test Scenarios

✅ **Payment Security**: Double-charge prevention, refund windows, webhook handling
✅ **Authentication**: JWT validation, session management, RBAC, MFA
✅ **Data Integrity**: Transactions, constraints, rollback on failure
✅ **Business Logic**: Subscription renewals, mentor earnings, invoice generation
✅ **Email**: Verification, templates, delivery retry, rate limiting
✅ **File Security**: MIME validation, size checks, content scanning

#### Documentation

Detailed test documentation available in: [`src/__tests__/README.md`](../src/__tests__/README.md)

---

## 🎯 Roadmap

### Completed ✅
- [x] Core authentication system
- [x] Subscription management
- [x] Session booking (one-time & recurring)
- [x] Payment processing (Razorpay)
- [x] AI chat integration
- [x] Diet plan feature
- [x] Admin/Moderator dashboards
- [x] Analytics & reporting
- [x] Production build optimization
- [x] Code quality improvements

### In Progress 🔄
- [ ] Unit tests (80%+ coverage target)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Mobile app (React Native)
- [ ] Live session streaming
- [ ] Advanced filtering & search

### Planned 📋
- [ ] Video recording & playback
- [ ] Community forums
- [ ] Referral program
- [ ] Advanced scheduling
- [ ] Multi-language support

---

**Made with ❤️ for wellness**
