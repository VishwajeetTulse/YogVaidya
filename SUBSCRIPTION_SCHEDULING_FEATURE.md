# Subscription-Based Scheduling Feature

## Overview

This feature allows mentors to schedule sessions for all users under specific subscription categories, complementing the existing individual time slot system.

## Subscription Plan Mapping

- **SEED Plan**: Meditation sessions only
- **BLOOM Plan**: Yoga sessions only  
- **FLOURISH Plan**: Both Yoga and Meditation sessions

## Key Features

### 1. Two-Tab Interface
The mentor dashboard now has two distinct scheduling modes:

#### Individual Time Slots Tab
- Create time slots for one-on-one sessions
- Users must book and pay for these sessions
- Maximum capacity per slot (1 or more students)
- Existing functionality preserved

#### Subscription Sessions Tab
- Schedule sessions for ALL users in matching subscription plans
- Automatically creates session bookings for eligible users
- No additional payment required (included in subscription)
- Shows user count breakdown by plan

### 2. Automatic User Assignment

When a mentor creates a subscription session:

1. **System determines eligible plans** based on session type:
   - YOGA sessions → BLOOM + FLOURISH users
   - MEDITATION sessions → SEED + FLOURISH users

2. **Queries active subscribers** with matching plans

3. **Creates individual session bookings** for each eligible user

4. **Provides detailed statistics** showing user distribution

### 3. Enhanced Mentor Dashboard

#### New UI Components
- Tabbed interface with Individual vs Subscription modes
- Subscription plan indicators with color coding
- Real-time user count display
- Session statistics breakdown
- Visual plan mapping guide

#### Form Features
- DateTime validation (must be in future)
- Mentor type validation (yoga mentors create yoga sessions)
- Duration control (15-180 minutes)
- Session link requirement
- Optional notes field

## Technical Implementation

### API Endpoints

#### POST `/api/mentor/subscription-sessions`
Creates a new subscription session and automatically schedules it for all eligible users.

**Request Body:**
```json
{
  "title": "Morning Yoga Flow",
  "scheduledTime": "2025-09-21T06:00:00.000Z",
  "link": "https://zoom.us/j/your-meeting-link",
  "duration": 60,
  "sessionType": "YOGA",
  "notes": "Optional session notes"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scheduleId": "schedule_123...",
    "title": "Morning Yoga Flow",
    "scheduledTime": "2025-09-21T06:00:00.000Z",
    "sessionType": "YOGA",
    "eligibleUsers": 25,
    "summary": {
      "totalBookings": 25,
      "byPlan": {
        "SEED": 0,
        "BLOOM": 15,
        "FLOURISH": 10
      }
    }
  }
}
```

#### GET `/api/mentor/subscription-sessions`
Retrieves all subscription sessions created by the mentor with booking statistics.

### Database Schema

Uses existing Prisma models:
- **Schedule**: Main session record
- **SessionBooking**: Individual user bookings
- **User**: Subscription plan information

### Key Validations

1. **Authentication**: Only mentors can create sessions
2. **Authorization**: Mentor type must match session type
3. **DateTime**: Scheduled time must be in the future
4. **Session Type**: Limited to YOGA and MEDITATION for subscriptions
5. **Duration**: Between 15-180 minutes
6. **Link**: Must be valid URL

## User Experience

### For Mentors
1. **Easy Tab Switching**: Toggle between individual and subscription scheduling
2. **Visual Plan Guide**: Clear indicators showing which plans get which sessions
3. **Instant Feedback**: Real-time user count and plan breakdown
4. **Session Management**: View all created sessions with statistics

### For Students
- **Automatic Enrollment**: Sessions appear in their dashboard automatically
- **No Additional Payment**: Included in subscription
- **Plan-Based Access**: Only see sessions matching their subscription

## Datetime Handling

**Critical Implementation Notes:**

1. **Form Input**: Uses separate date and time inputs for better UX
2. **Combination**: JavaScript combines date + time before sending to API
3. **Validation**: Ensures combined datetime is in the future
4. **Storage**: Stored as ISO string in database
5. **Display**: Formatted for local timezone in UI

```typescript
// Combining date and time
const scheduledDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);

// Validation
if (scheduledDateTime <= new Date()) {
  throw new Error("Scheduled time must be in the future");
}
```

## Error Handling

### Common Errors
- **Invalid datetime**: Past times rejected
- **Wrong mentor type**: Yoga mentors can't create meditation sessions
- **No active users**: Warning if no eligible subscribers found
- **Invalid session link**: Must be proper URL format

### Error Responses
All errors return structured format:
```json
{
  "success": false,
  "error": "Description of the error",
  "details": "Additional error context"
}
```

## Success Metrics

When creating a subscription session, mentors see:
- Total users scheduled
- Breakdown by subscription plan
- Session details confirmation
- Success toast with statistics

## Files Modified/Created

### New Files
- `/src/app/api/mentor/subscription-sessions/route.ts` - API endpoint
- `/test-subscription-scheduling.js` - Test script

### Modified Files
- `/src/components/dashboard/mentor/sections/schedule-section.tsx` - Added subscription tab and forms

### Dependencies Added
- Tabs components from UI library
- Additional form validation schemas
- Enhanced date/time handling

## Testing

Run the test script to verify implementation:
```bash
node test-subscription-scheduling.js
```

## Future Enhancements

1. **Recurring Sessions**: Add support for recurring subscription sessions
2. **Session Capacity**: Allow limiting subscription session capacity
3. **Advanced Filtering**: Filter sessions by date range, status, etc.
4. **Bulk Operations**: Cancel/modify multiple sessions at once
5. **Analytics**: Enhanced reporting on subscription session usage

## Security Considerations

1. **Authentication Required**: All endpoints verify user session
2. **Role-Based Access**: Only mentors can create sessions
3. **Type Validation**: Zod schemas validate all inputs
4. **SQL Injection Prevention**: Using Prisma ORM with parameterized queries
5. **Rate Limiting**: Consider adding rate limits for session creation

## Performance Notes

- Database queries optimized with proper indexing
- Batch operations for creating multiple session bookings
- Efficient subscription plan filtering
- Minimal API calls through proper state management