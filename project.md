# Project: YogVaidya

## Project Overview

YogVaidya is a comprehensive web application that connects users with yoga and meditation mentors. It provides a platform for users to find mentors, book sessions, manage their subscriptions, and engage in interactive sessions. The application features role-based access for users, mentors, moderators, and admins, with integrated payment processing, scheduling, and communication tools.

## Technology Stack

- **Framework**: Next.js 15.3.1 with App Router
- **Database**: MongoDB with Prisma ORM
- **Authentication**: Better Auth
- **UI Library**: Radix UI components with ShadCN UI
- **Styling**: CSS with PostCSS
- **Language**: TypeScript
- **Payment**: Razorpay integration
- **AI Integration**: Google AI SDK for chat functionality
- **Email**: Nodemailer for email services

## Key Features

- User authentication and role-based access control
- Multi-type mentor system (Yoga, Meditation, Diet Planning) with application and approval workflow
- Comprehensive session booking and scheduling system with type-specific features
- Subscription management with trial periods and plan-based feature access
- Integrated chat functionality with AI assistance
- Payment processing and billing with automated renewals
- Admin dashboard for platform management and mentor approval
- Responsive design with dark/light theme support and mentor type-specific theming

## File Structure

### Root Directory

-   `.env.local`: Environment variables (not tracked in git)
-   `.eslintrc.json`: ESLint configuration for code linting
-   `.gitignore`: Git ignore file
-   `components.json`: ShadCN UI component configuration
-   `next.config.ts`: Next.js framework configuration
-   `package.json`: Project dependencies and scripts
-   `postcss.config.mjs`: PostCSS configuration for CSS processing
-   `tsconfig.json`: TypeScript compiler configuration

### `prisma/`

-   `schema.prisma`: Defines the database schema using Prisma ORM with MongoDB. Includes models for:
    - Users with role-based access (USER, MENTOR, MODERATOR, ADMIN)
    - Mentors with specializations (YOGAMENTOR, MEDITATIONMENTOR, DIETPLANNER)
    - Sessions and scheduling with status tracking (YOGA, MEDITATION, DIET session types)
    - Subscriptions and billing management with plan-based access control
    - Trial periods and user onboarding

### `public/`

This directory contains static assets that are publicly accessible.

-   `assets/`: Contains images, SVGs, and other assets used in the application's UI.
-   `proofs/`: Seems to contain PDF documents, possibly proofs of qualifications for mentors.

### `scripts/`

Contains maintenance and utility scripts for database operations and system administration.

-   `cleanup-expired-trials.ts`: TypeScript script to automatically clean up expired trial subscriptions
-   `cleanup-expired-trials.js`: JavaScript version of the cleanup script
-   `fix-trial-history.js`: Script to repair and fix trial history data inconsistencies
-   `fix-user.ts`: TypeScript script for fixing user data and resolving user-related issues
-   `fix-user.js`: JavaScript version of the user fix script
-   `README.md`: Documentation for the scripts directory

### `src/`

This is the main source code directory.

#### `src/app/`

Contains the application's pages and API routes, following the Next.js 15 App Router structure.

-   `favicon.ico`: The application favicon
-   `globals.css`: Global CSS styles and theme variables
-   `layout.tsx`: Root layout component with providers and global setup
-   `page.tsx`: Landing page component

-   **`api/`**: Contains all the API route handlers for backend functionality.
    -   `admin/`: Admin panel API routes for platform management
    -   `analytics/`: Analytics and reporting API endpoints
    -   `auth/`: Authentication API routes (signin, signup, session management)
    -   `billing/`: Payment processing and subscription billing APIs
    -   `chat/`: Real-time chat and AI integration API routes
    -   `cron/`: Scheduled job endpoints for automated tasks
    -   `mentor/`: Mentor-specific functionality and profile management
    -   `mentor-application/`: API routes for mentor application process
    -   `mentors/`: Public mentor listing and search APIs
    -   `subscription/`: Subscription management and trial handling
    -   `users/`: User profile and account management APIs

-   **Pages**:
    -   `checkout/page.tsx`: Subscription checkout and payment processing page
    -   `dashboard/page.tsx`: Main dashboard for authenticated users
    -   `dashboard/plans/page.tsx`: Subscription plan management within dashboard
    -   `debug/page.tsx`: Development debugging and testing page
    -   `forgot-password/page.tsx`: Password reset request page
    -   `mentors/page.tsx`: Public mentor discovery and listing page
    -   `mentors/apply/page.tsx`: Mentor application submission page
    -   `pricing/page.tsx`: Subscription plans and pricing display
    -   `reset-password/page.tsx`: Password reset confirmation page
    -   `signin/page.tsx`: User authentication login page
    -   `signup/page.tsx`: New user registration page
    -   `welcome/page.tsx`: User onboarding and welcome flow

#### `src/components/`

Contains all the reusable React components organized by feature and functionality.

-   `Auth/FormFields.tsx`: Reusable form field components for authentication flows
-   `checkout/Checkout.tsx`: Complete checkout process component with payment integration
-   `common/ServiceCard.tsx`: Reusable card component for displaying services and features

-   **`dashboard/`**: Role-based dashboard components for different user types.
    -   `plans-dashboard.tsx`: Subscription plan management interface
    -   `admin/`: Administrative dashboard components for platform management
    -   `mentor/`: Mentor-specific dashboard components and tools
    -   `moderator/`: Content moderation and user management components
    -   `shared/`: Common dashboard components used across roles
    -   `unified/`: Unified dashboard layout and navigation components
    -   `user/`: Student/user-specific dashboard components

-   **`forms/`**: Form components for various user interactions.
    -   `forgot-password.tsx`: Password reset request form
    -   `reset-password.tsx`: New password confirmation form
    -   `SigninForm.tsx`: User login form with validation
    -   `SignupForm.tsx`: User registration form with field validation

-   **`landing/`**: Landing page sections and marketing components.
    -   `Hero.tsx`: Main hero section with call-to-action
    -   `OurServices.tsx`: Services showcase and feature highlights

-   **`layout/`**: Application-wide layout and navigation components.
    -   `Footer.tsx`: Site footer with links and information
    -   `Navbar.tsx`: Main navigation bar with authentication state

-   **`mentor/`**: Mentor-related display and interaction components.
    -   `mentor-section.tsx`: Mentor profile display section
    -   `MentorApplicationForm.tsx`: Comprehensive mentor application form
    -   `MentorApplicationSubmission.tsx`: Application confirmation and status component
    -   `MentorCarousel.tsx`: Featured mentors carousel display

-   **`ui/`**: Base UI components built on Radix UI primitives.
    -   `avatar.tsx`: User avatar component with fallback
    -   `badge.tsx`: Status and category badge component
    -   `button.tsx`: Button component with variants and sizes
    -   `card.tsx`: Container card component
    -   `checkbox.tsx`: Form checkbox input component
    -   `dialog.tsx`: Modal dialog component
    -   `form.tsx`: Form wrapper and field components
    -   `input.tsx`: Text input component with validation states
    -   `label.tsx`: Form label component
    -   `progress.tsx`: Progress bar component
    -   `select.tsx`: Dropdown select component
    -   `separator.tsx`: Visual separator component
    -   `sheet.tsx`: Slide-out panel component
    -   `sidebar.tsx`: Navigation sidebar component
    -   `skeleton.tsx`: Loading skeleton component
    -   `sonner.tsx`: Toast notification component
    -   `switch.tsx`: Toggle switch component
    -   `table.tsx`: Data table component
    -   `tabs.tsx`: Tab navigation component
    -   `textarea.tsx`: Multi-line text input component
    -   `tooltip.tsx`: Hover tooltip component
    -   `use-toast.tsx`: Toast notification hook

#### `src/hooks/`

Contains custom React hooks for shared functionality and state management.

-   `use-logger.ts`: Custom logging hook for debugging and analytics
-   `use-mobile.ts`: Responsive design hook for mobile device detection
-   `use-trial-expiration.ts`: Trial subscription monitoring and expiration logic
-   `use-trial-welcome.ts`: Trial user onboarding and welcome flow management

#### `src/lib/`

Contains core business logic, utilities, and service integrations.

**Core Files:**
-   `auth-client.ts`: Client-side authentication logic and session management
-   `mentor-type.ts`: TypeScript type definitions for mentor-related data
-   `prisma-middleware-trial.ts`: Prisma middleware for trial subscription logic
-   `session.ts`: Session management utilities and authentication helpers
-   `students.ts`: Student management logic and data operations
-   `subscriptions.ts`: Subscription lifecycle management and billing logic
-   `types.ts`: Global TypeScript type definitions and interfaces
-   `userDetails.ts`: User profile management and data retrieval utilities

**Subdirectories:**

-   **`actions/`**: Server-side actions for data mutations and business logic.
    -   `billing-actions.ts`: Payment processing and subscription management actions
    -   `dashboard-data.ts`: Dashboard data aggregation and analytics
    -   `mentor-application-actions.ts`: Mentor application processing and approval workflows

-   **`config/`**: Application configuration and setup files.
    -   `auth.ts`: Authentication provider configuration (Better Auth setup)
    -   `prisma.ts`: Database connection and Prisma client configuration

-   **`rzp/`**: Razorpay payment gateway integration and utilities.

-   **`schema/`**: Zod schemas for form validation and data validation.

-   **`server/`**: Server-side utilities and backend logic.

-   **`services/`**: External service integrations and communication.
    -   `email-student-for-session.ts`: Session notification email service
    -   `email.ts`: Core email service and template management
    -   `mentor-sync.ts`: Mentor data synchronization service
    -   `razorpay-service.ts`: Razorpay API integration and payment processing
    -   `scheduleEmails.ts`: Automated email scheduling and delivery

-   **`types/`**: Additional TypeScript type definitions organized by feature.

-   **`utils/`**: General utility functions and helper methods.

## Development Scripts

Available npm scripts for development and maintenance:

- `npm run dev`: Start development server with Turbopack for faster builds
- `npm run build`: Generate Prisma client and build production application
- `npm start`: Start production server
- `npm run lint`: Run ESLint for code quality checks
- `npm run fix-user`: Execute user data repair script

## Database Models (Key Entities)

Based on the Prisma schema, the application manages:

- **Users**: Multi-role system (USER, MENTOR, MODERATOR, ADMIN)
- **Mentors**: Specialized in YOGAMENTOR, MEDITATIONMENTOR, or DIETPLANNER with comprehensive application workflow
- **Sessions**: Bookable sessions with scheduling and status tracking (YOGA, MEDITATION, DIET types)
- **Subscriptions**: Trial and paid subscription management with plan-based feature access
- **Payments**: Integrated billing and payment processing

## Authentication & Security

- Better Auth integration for secure authentication
- Role-based access control throughout the application
- Session management with secure token handling
- Password reset and recovery flows
- Trial period management with automatic expiration

## Payment Integration

- Razorpay integration for Indian payment processing
- Subscription lifecycle management
- Trial period handling
- Automated billing and renewal processes
- Payment failure handling and retry logic

## AI and Communication Features

- Google AI SDK integration for intelligent chat functionality
- Real-time communication capabilities
- Automated email notifications for sessions and updates
- Scheduled email delivery system
- Session reminder and follow-up automation

## Architecture Highlights

- **Monorepo Structure**: All code organized in a single repository
- **Type Safety**: Full TypeScript implementation with strict typing
- **Component Library**: Consistent UI with Radix UI and ShadCN components
- **Database ORM**: Prisma for type-safe database operations
- **API Design**: RESTful API routes with proper error handling
- **Responsive Design**: Mobile-first approach with theme support
- **Performance**: Next.js optimizations with Turbopack for development

## Recent Updates: DIETPLANNER Mentor Type Integration

### Overview
A comprehensive implementation was completed to add DIETPLANNER as a new mentor type alongside the existing YOGAMENTOR and MEDITATIONMENTOR types. This integration includes full support for diet planning sessions with proper type safety, UI theming, and business logic.

### Database Schema Changes
**File: `prisma/schema.prisma`**
- Added `DIETPLANNER` to the `MentorType` enum
- Added `DIET` to the `SessionType` enum
- Maintained backward compatibility with existing data

### Core Type System Updates
**Files Updated:**
- `src/lib/types/mentor.ts`: Updated mentor type definitions
- `src/lib/server/mentor-sessions-server.ts`: Added DIET session support
- Various interface definitions: Updated experience field from string to number type

### UI Components Enhanced
**File: `src/components/dashboard/mentor/sections/schedule-section.tsx`**
- Added DIET session type support with green color theme
- Updated form validation with proper SessionType enum usage
- Implemented conditional logic for DIETPLANNER mentors
- Added proper icons and visual indicators for diet planning sessions

### Business Logic Implementation
**Key Features Added:**
- DIETPLANNER mentors automatically default to DIET session type
- DIET sessions require FLOURISH subscription plan for student access
- Proper session type filtering based on mentor type
- Complete integration with existing booking and scheduling system

### API Route Enhancements
**Files Updated:**
- `src/app/api/mentor/schedule/route.ts`: Added DIET session validation
- Mentor profile management APIs: Updated to handle DIETPLANNER type
- Session management endpoints: Full support for DIET session operations

### Form and Validation Updates
- Updated Zod schemas to include DIET session type
- Enhanced mentor application forms with proper type validation
- Implemented proper error handling for new mentor type

### TypeScript Compliance
- Resolved all type mismatches between string and number fields
- Updated experience field handling across all components
- Ensured full type safety with Prisma client integration
- Fixed enum usage with proper SessionType imports

### UI/UX Improvements
- Green gradient theme for DIET sessions (matching the diet/nutrition domain)
- Clock icon for diet planning sessions
- Proper session type display in mentor dashboards
- Consistent theming across all mentor types

### Testing and Validation
- All TypeScript compilation errors resolved
- Development server runs without errors
- DIETPLANNER mentor type detection working in runtime
- Complete end-to-end functionality verified

### Implementation Highlights
1. **Type Safety**: Full TypeScript compliance with proper enum usage
2. **Scalability**: Designed to easily accommodate future mentor types
3. **Consistency**: Maintains existing patterns and conventions
4. **Performance**: No impact on existing functionality
5. **User Experience**: Seamless integration with existing UI flows

This implementation demonstrates a comprehensive approach to feature expansion while maintaining code quality, type safety, and user experience standards.
