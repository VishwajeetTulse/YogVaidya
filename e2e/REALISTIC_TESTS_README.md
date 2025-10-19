# E2E Testing - Realistic Test Suite

## Overview

This directory contains realistic end-to-end tests that match the actual YogVaidya application features and workflows. Tests are written based on the real project structure, actual routes, and implemented features.

## Test Files

### 1. `auth-and-signup.spec.ts`
Tests for authentication and user registration workflows.

**Test Groups:**
- **User Signup Flow** - Register new users, validate forms, profile redirect
  - Navigate to signup from home
  - Display signup form
  - Validate email format
  - Empty field validation
  - Successful signup with redirect to profile completion

- **User Login Flow** - Sign in with credentials, form validation
  - Display signin form
  - Invalid credentials error handling
  - Signup link visibility
  - Navigate to signup from signin page

- **Password Reset Flow** - Forgot password and reset functionality
  - Forgot password page display
  - Navigate to forgot password from signin
  - Reset form with token validation
  - Invalid/expired token handling

**Routes Tested:** `/signup`, `/signin`, `/forgot-password`, `/reset-password?token=XXX`

**Real Features:**
- Better Auth integration for session management
- Form validation and error handling
- Email-based password recovery
- User profile completion flow

---

### 2. `mentor-and-booking.spec.ts`
Tests for browsing mentors and booking sessions.

**Test Groups:**
- **Mentor Browsing** - Find and view mentors, search/filter
  - Navigate to mentors page
  - Display mentor list
  - Filter/search mentors
  - View mentor profile details
  - Display mentor information (bio, experience, specialization)

- **Session Booking Flow** - Book sessions with mentors
  - Display available timeslots
  - Allow booking sessions
  - Redirect to checkout
  - Display session details on checkout

- **Timeslot Selection** - Select available time slots
  - Display available timeslots
  - Allow selecting timeslots
  - Validate slot selection

**Routes Tested:** `/mentors`, `/mentors/[id]`, `/session-checkout`, `/timeslot-checkout`

**Real Features:**
- Mentor listing and profile pages
- Real mentor timeslots
- Session booking workflow
- Integration with checkout system

---

### 3. `checkout-and-payment.spec.ts`
Tests for pricing, plan selection, and payment checkout.

**Test Groups:**
- **Pricing & Plan Selection** - View plans and select subscription
  - Navigate to pricing page
  - Display subscription plans
  - Display three plans: seed, bloom, flourish (actual project plans)
  - Display plan details (price, features, duration)
  - Select individual plans

- **Checkout Process** - Complete checkout with Razorpay
  - Navigate to checkout with plan parameter
  - Display checkout form
  - Display order summary
  - Validate required fields
  - Razorpay payment gateway integration

- **Session Checkout** - Book individual sessions
  - Navigate to session checkout
  - Display session details
  - Display payment form

- **Timeslot Checkout** - Select available timeslots
  - Navigate to timeslot checkout
  - Display available times
  - Allow selecting timeslot

**Routes Tested:** `/pricing`, `/checkout?plan=seed|bloom|flourish`, `/session-checkout`, `/timeslot-checkout`

**Real Features:**
- Three fixed subscription plans: seed, bloom, flourish
- Razorpay payment gateway integration
- Plan parameter validation
- Order summary display
- Timeslot/session specific checkout

---

### 4. `dashboard.spec.ts`
Tests for user dashboard and account management.

**Test Groups:**
- **Profile Completion** - Complete user profile after signup
  - Navigate to profile completion page
  - Display form fields
  - Validate required fields
  - Fill profile information
  - Submit completed profile

- **Dashboard Navigation** - Access authenticated dashboard
  - Navigate to dashboard (authentication required)
  - Display navigation/menu
  - Redirect unauthenticated users to signin

- **Dashboard Sections** - Access different dashboard subsections
  - Diet plans section (`/dashboard/diet-plan`)
  - Mentor section (`/dashboard/mentor`)
  - Plans/subscription section (`/dashboard/plans`)
  - Timeslots section (`/dashboard/timeslots`)

- **Session Management** - Manage scheduled sessions
  - Display scheduled sessions
  - Display session details (date, time, mentor)
  - Allow canceling sessions

- **Account Settings** - Manage user account and preferences
  - Navigate to profile/account settings
  - Display user information
  - Allow updating user information
  - Display subscription info

**Routes Tested:** `/complete-profile`, `/dashboard`, `/dashboard/diet-plan`, `/dashboard/mentor`, `/dashboard/plans`, `/dashboard/timeslots`

**Real Features:**
- Complete profile flow after signup
- Multi-section dashboard
- Session management and cancellation
- Account information display and editing
- Subscription status tracking

---

### 5. `admin-and-analytics.spec.ts`
Tests for admin features and analytics.

**Test Groups:**
- **Admin Access** - Access admin features
  - Require authentication for admin
  - Display admin dashboard
  - Display admin navigation menu

- **Analytics Dashboard** - View analytics and metrics
  - Navigate to analytics
  - Display analytics dashboard
  - Display user statistics
  - Display session analytics
  - Filter by date range
  - Display revenue/billing analytics

- **User Management** - Manage application users
  - Display user list
  - Search for users
  - Display user details
  - View user profiles
  - Filter by role/status

- **Mentor Management** - Manage mentors and applications
  - Access mentor management API
  - Display mentor list
  - View pending applications
  - Allow approving applications

- **Content Management** - Manage plans and content
  - Display diet plans management
  - Create new diet plans
  - Display subscription plans (seed, bloom, flourish)
  - Edit plan details

- **Moderation** - Content moderation
  - Access moderation API
  - Display moderation dashboard
  - Display reported content/issues

- **System Management** - System-level features
  - Access debug endpoints
  - Access test endpoints
  - Access cron/automation
  - Access support tickets

**Routes Tested:** `/api/admin`, `/api/analytics`, `/api/users`, `/api/mentor`, `/api/mentor-application`, `/api/diet-plans`, `/api/moderator`, `/api/debug`, `/api/test`, `/api/cron`, `/api/tickets`, `/api/billing`

**Real Features:**
- Admin authentication and authorization
- User analytics and metrics
- Mentor application approval system
- Diet plan management
- Subscription plan management (seed, bloom, flourish)
- Content moderation
- System administration tools

---

## Real Project Features Tested

### Authentication & Authorization
- ✅ Signup with profile completion
- ✅ Signin with credentials
- ✅ Forgot password flow
- ✅ Password reset with token validation
- ✅ Session-based authentication (Better Auth)
- ✅ Role-based access (admin, moderator, mentor, student)

### User Features
- ✅ Complete profile information
- ✅ View and manage dashboard
- ✅ Browse and filter mentors
- ✅ Book sessions with mentors
- ✅ Select timeslots for sessions
- ✅ View scheduled sessions
- ✅ Manage diet plans
- ✅ Account settings and preferences
- ✅ Subscription management

### Mentor Features
- ✅ Mentor profile and availability
- ✅ Session timeslots
- ✅ Session bookings
- ✅ Mentor applications (apply process)

### Payment & Subscription
- ✅ Pricing page with three plans (seed, bloom, flourish)
- ✅ Plan selection and checkout
- ✅ Razorpay payment gateway integration
- ✅ Order summary and confirmation
- ✅ Session-specific checkout
- ✅ Timeslot-specific checkout

### Admin & Analytics
- ✅ Admin dashboard access
- ✅ User analytics and metrics
- ✅ Session analytics
- ✅ User management and search
- ✅ Mentor management and applications
- ✅ Diet plan management
- ✅ Subscription plan management
- ✅ Content moderation
- ✅ System administration

---

## Running the Tests

### Prerequisites
- Node.js and npm installed
- Application running at `http://localhost:3000`
- Playwright installed (`npm install @playwright/test`)

### Run All E2E Tests
```bash
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test e2e/auth-and-signup.spec.ts
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests with UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run Tests on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Test Report
```bash
npx playwright show-report
```

---

## Test Structure

All tests follow a consistent structure:

```typescript
test.describe('Feature Group', () => {
  test('should perform specific action', async ({ page }) => {
    // Setup
    await page.goto('/route');
    await page.waitForLoadState('networkidle');

    // Action
    await page.locator('selector').click();

    // Assertion
    await expect(element).toBeVisible();
  });
});
```

### Key Testing Patterns

1. **Flexible Selectors** - Uses text-based selectors for resilience
   ```typescript
   page.locator('button', { hasText: /save|submit/i })
   ```

2. **Conditional Visibility** - Handles optional UI elements
   ```typescript
   if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
     // Action
   }
   ```

3. **Network Idle Waiting** - Ensures data is loaded
   ```typescript
   await page.waitForLoadState('networkidle');
   ```

4. **Defensive Timeouts** - Handles slow or missing elements
   ```typescript
   await element.isVisible({ timeout: 1000 }).catch(() => false)
   ```

---

## Test Coverage Summary

### Total Tests: ~50+ realistic scenarios

| File | Tests | Coverage |
|------|-------|----------|
| auth-and-signup.spec.ts | 14 | Authentication, signup, password reset |
| mentor-and-booking.spec.ts | 11 | Mentor browsing, session booking, timeslots |
| checkout-and-payment.spec.ts | 16 | Pricing, plan selection, checkout, payment |
| dashboard.spec.ts | 15 | Profile, dashboard sections, sessions, account |
| admin-and-analytics.spec.ts | 25 | Admin features, analytics, user/mentor management |

**Total: ~81 realistic end-to-end tests**

---

## Differences from Previous Placeholder Tests

### ✅ Removed (Unrealistic Features)
- ❌ Two-factor authentication (2FA) - not implemented in project
- ❌ Social login (Google/GitHub OAuth) - not implemented
- ❌ Generic subscription upgrade/downgrade - project uses fixed 3-plan system
- ❌ Payment refunds - not part of current implementation
- ❌ Theoretical features without actual project routes

### ✅ Added (Real Features)
- ✅ Actual signup flow with profile completion
- ✅ Real mentor browsing and session booking
- ✅ Actual subscription plans (seed, bloom, flourish)
- ✅ Real Razorpay payment integration
- ✅ Dashboard with multiple sections (diet plans, sessions, mentors)
- ✅ Admin features and analytics
- ✅ Moderation and system management
- ✅ All tests use actual project routes and features

---

## Notes for Developers

- Tests are designed to run against a development server at `localhost:3000`
- Tests use `waitForLoadState('networkidle')` to ensure data is loaded before interactions
- Tests handle optional UI elements gracefully
- Tests use flexible selectors to be resilient to UI changes
- Admin and analytics tests may require specific roles/permissions
- Some tests verify API endpoints directly (returning JSON)

---

## Future Improvements

1. Add visual regression testing for UI consistency
2. Add performance testing for critical user journeys
3. Add accessibility testing (a11y)
4. Add load testing for concurrent users
5. Mock payment gateway responses for reliable testing
6. Add database seeding for specific test scenarios
7. Add test data cleanup after test runs
