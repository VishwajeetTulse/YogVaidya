# YogVaidya Project - Current Context & Issues Summary

**Date**: October 3, 2025  
**Focus Areas**: One-Time Sessions & Dashboard Overviews

---

## 📋 Project Overview

YogVaidya is a comprehensive platform connecting users with yoga, meditation, and diet planning mentors. Built with:
- **Stack**: Next.js 15.3.1, MongoDB, Prisma, Better Auth, Razorpay
- **Features**: Role-based dashboards, session booking, subscriptions, AI chat, payment processing

### Key Roles:
1. **USER** (Students) - Book sessions, manage subscriptions
2. **MENTOR** - Conduct sessions, manage schedules
3. **ADMIN** - Platform management
4. **MODERATOR** - Content moderation

### Session Types:
1. **Subscription Sessions** - Regular sessions for subscribed users (SEED, BLOOM, FLOURISH plans)
2. **One-Time Individual Sessions** - Pay-per-session bookings via SessionBooking model

---

## ✅ Recently Completed Fixes

### 1. **DateTime Handling** (Multiple files fixed)
- ✅ Fixed MongoDB date conversion errors across the application
- ✅ Session auto-completion working properly
- ✅ Duration calculations accurate (actual vs planned)
- ✅ Dashboard data loading without errors

### 2. **One-to-One Mentor Filtering** ✅
**File**: `src/lib/server/user-mentor-server.ts`  
**Issue**: One-time session mentors were appearing in "My Mentors" section  
**Solution**: Only show mentors with "ongoing relationships":
  - Has recurring sessions
  - Has group sessions (maxStudents > 1)
  - Has future scheduled sessions
  - Has multiple sessions with user

### 3. **One-to-One Session Navigation** ✅
**Files**: MentorTimeSlotBrowser, SessionCheckout components  
**Issue**: Back button redirected to `/mentors` instead of `/dashboard`  
**Solution**: Updated all navigation paths to return to user dashboard

### 4. **Session Duration Display** ✅
- Completed sessions show actual duration
- Ongoing sessions show real-time elapsed time
- Scheduled sessions show planned duration
- Proper fallback hierarchy implemented

---

## 🎯 CURRENT FOCUS: Issues to Address

### A. **One-Time Session Issues**

#### 1. **Session Booking Flow**
**Current State**:
- ✅ SessionCheckout component with 12-hour time picker
- ✅ Payment integration via Razorpay working
- ✅ SessionBooking model stores bookings correctly
- ✅ API endpoints functioning (`/api/mentor/book-session`, `/api/mentor/verify-session-payment`)

**Potential Issues to Check**:
- [ ] Are one-time sessions appearing correctly in student dashboard?
- [ ] Are one-time sessions visible in mentor's "My Sessions" section?
- [ ] Is the status update flow working (SCHEDULED → ONGOING → COMPLETED)?
- [ ] Are completed one-time sessions being excluded from "My Mentors" (should be ✅ fixed)

#### 2. **Session Display & Visibility**
**Files to Review**:
- `src/components/dashboard/user/sections/classes-section.tsx` (student view)
- `src/components/dashboard/mentor/sections/sessions-section.tsx` (mentor view)
- `src/lib/server/user-sessions-server.ts` (fetches user sessions)
- `src/lib/server/mentor-sessions-server.ts` (fetches mentor sessions)

**What to Verify**:
- [ ] One-time sessions (SessionBooking) merged with subscription sessions (Schedule)
- [ ] Correct filtering by status (SCHEDULED, ONGOING, COMPLETED)
- [ ] Proper session categorization (individual vs subscription)
- [ ] Action buttons showing correctly (Start Session, Join, etc.)

---

### B. **Dashboard Overview Issues**

#### 1. **User Dashboard Overview**
**File**: `src/components/dashboard/user/sections/overview-section.tsx`  
**Current Features**:
- Welcome message with personalized greeting
- Trial status banner (if on trial)
- No access banner (if subscription expired)
- Today's schedule section
- Upcoming sessions section
- Quick action cards

**Potential Issues**:
- [ ] Are one-time booked sessions appearing in "Today's Schedule"?
- [ ] Are session counts accurate (classes this week)?
- [ ] Is practice time calculation correct?
- [ ] Are streak days calculating properly?
- [ ] Are upcoming sessions from both subscription AND one-time bookings showing?

**Data Source**: `src/lib/actions/dashboard-data.ts`
```typescript
// Returns: classesThisWeek, totalPracticeTime, goalsAchieved, 
// streakDays, todaySchedule, upcomingSessions, monthlyStats
```

#### 2. **Mentor Dashboard Overview**
**File**: `src/components/dashboard/mentor/sections/overview-section.tsx`  
**Current Features**:
- Active students count
- Sessions this week count
- Average rating
- Today's sessions list
- Upcoming sessions list
- Recent activity feed
- Monthly stats

**Potential Issues**:
- [ ] Are one-time individual bookings appearing in today's sessions?
- [ ] Are both subscription and one-time sessions merged correctly?
- [ ] Is the session count accurate?
- [ ] Are earnings calculations including one-time session payments?
- [ ] Are session action buttons working (Start Session)?

**Data Source**: `src/lib/server/mentor-overview-server.ts`

---

## 🔍 Files to Investigate

### Critical Files for One-Time Sessions:
1. **User Side**:
   - `src/lib/server/user-sessions-server.ts` - Fetches all user sessions
   - `src/components/dashboard/user/sections/classes-section.tsx` - Displays sessions
   - `src/lib/actions/dashboard-data.ts` - Dashboard overview data

2. **Mentor Side**:
   - `src/lib/server/mentor-sessions-server.ts` - Fetches mentor sessions
   - `src/components/dashboard/mentor/sections/sessions-section.tsx` - Displays bookings
   - `src/lib/server/mentor-overview-server.ts` - Overview dashboard data

3. **Session Management**:
   - `src/lib/services/session-service.ts` - Session completion logic
   - `src/lib/services/session-status-service.ts` - Auto status updates
   - `src/app/api/admin/update-session-status/route.ts` - Status update endpoint

---

## 🧪 Testing Checklist

### One-Time Sessions:
- [ ] Book a one-time session as a student
- [ ] Verify session appears in student's "Classes" section
- [ ] Verify session appears in mentor's "My Sessions" section
- [ ] Test "Start Session" button (mentor side)
- [ ] Test "Join Session" button (student side)
- [ ] Verify session status updates automatically (SCHEDULED → ONGOING → COMPLETED)
- [ ] Confirm completed one-time session does NOT appear in "My Mentors"
- [ ] Verify payment status is tracked correctly

### Dashboard Overviews:
**Student Dashboard**:
- [ ] Today's schedule shows both subscription AND one-time sessions
- [ ] Upcoming sessions includes all session types
- [ ] Classes this week count is accurate
- [ ] Practice time calculation correct
- [ ] Streak days working
- [ ] Quick actions navigate correctly

**Mentor Dashboard**:
- [ ] Today's sessions shows both session types
- [ ] Upcoming sessions merged correctly
- [ ] Active students count accurate
- [ ] Sessions this week correct
- [ ] Monthly stats include all session types
- [ ] Recent activity shows latest updates

---

## 🚀 Known Working Features

1. ✅ **Authentication & Authorization** - Better Auth integration working
2. ✅ **Payment Processing** - Razorpay integration functional
3. ✅ **Session Auto-Completion** - Sessions complete automatically after duration
4. ✅ **Duration Tracking** - Actual vs planned duration calculated correctly
5. ✅ **Date Handling** - MongoDB date conversion robust
6. ✅ **Mentor Filtering** - "My Mentors" only shows ongoing relationships
7. ✅ **Navigation** - Back buttons redirect to correct dashboards
8. ✅ **Subscription Management** - Trial periods and plan upgrades working
9. ✅ **Real-time Updates** - `useSessionStatusUpdates` hook updates every minute
10. ✅ **DIETPLANNER Integration** - Full support for diet planning mentors

---

## 📊 Database Models

### Key Collections:
1. **Schedule** - Subscription-based recurring sessions
2. **SessionBooking** - One-time individual session bookings
3. **User** - All users (students, mentors, admins)
4. **MentorTimeSlot** - Available time slots for booking
5. **MentorApplication** - Mentor onboarding applications

### Important Fields:
```typescript
SessionBooking {
  id, userId, mentorId, timeSlotId
  status: SCHEDULED | ONGOING | COMPLETED | CANCELLED
  paymentStatus: PENDING | COMPLETED | FAILED
  scheduledAt, createdAt, updatedAt
  manualStartTime, actualEndTime, actualDuration
}

Schedule {
  id, mentorId, userId
  sessionType: YOGA | MEDITATION | DIET
  status: SCHEDULED | ONGOING | COMPLETED | CANCELLED
  scheduledTime, duration
  manualStartTime, actualEndTime, actualDuration
}
```

---

## 🎯 Next Steps

1. **Verify One-Time Session Display**
   - Check user dashboard classes section
   - Check mentor dashboard sessions section
   - Ensure both subscription and one-time sessions visible

2. **Test Dashboard Overview Accuracy**
   - Verify session counts include all types
   - Check today's schedule completeness
   - Validate upcoming sessions merging

3. **Test Session Flow End-to-End**
   - Book → Pay → Schedule → Join → Start → Complete
   - Verify status updates at each step
   - Check notifications/emails if enabled

4. **Edge Case Testing**
   - Cancelled sessions handling
   - Failed payments
   - Expired time slots
   - Concurrent bookings prevention

---

## 📝 Notes

- **Auto-refresh**: Dashboards auto-update session status every 60 seconds
- **Session Duration**: Default 45-60 minutes, tracks actual duration
- **Trial Period**: Users get full access during trial, no subscription needed
- **One-Time vs Subscription**: Clear separation in database and UI
- **Mentor Types**: YOGAMENTOR, MEDITATIONMENTOR, DIETPLANNER with type-specific theming

---

**Ready to start debugging! 🚀**

Let me know which specific issue you'd like to tackle first:
1. One-time session visibility issues
2. Dashboard overview data accuracy
3. Session status flow problems
4. Other specific concerns
