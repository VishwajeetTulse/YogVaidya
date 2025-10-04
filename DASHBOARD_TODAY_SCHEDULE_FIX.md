# Dashboard Today's Schedule Fix

## Issue Report
**Reported by**: Real users testing the platform  
**Issue**: "The today's schedule session is not consistent, check for it on both subscription and one-to-one sessions"

Users reported that the dashboard's "Today's Schedule" was not showing all their sessions. Specifically, one-to-one paid sessions (SessionBooking) were missing from the today's schedule view.

## Root Cause
The user dashboard data fetching function (`src/lib/actions/dashboard-data.ts`) was only querying the `schedule` collection (subscription-based recurring sessions) but was not including the `sessionBooking` collection (one-time paid individual sessions).

### Before Fix
```typescript
// Only queried schedule collection
const todayScheduleResult = await prisma.$runCommandRaw({
  aggregate: 'schedule',  // ❌ Missing sessionBooking!
  pipeline: [
    { $match: { scheduledTime: { $gte: startOfDay, $lte: endOfDay } } },
    // ...
  ]
});
```

This meant users who booked one-to-one sessions with mentors would not see those sessions in their "Today's Schedule" widget.

## Solution
Updated the `getDashboardData` function to query **both** collections and merge the results, mirroring the approach used successfully in the mentor dashboard (`mentor-overview-server.ts`).

### Implementation Details

#### 1. Query Both Collections
- **Schedule Collection**: Subscription-based recurring sessions (existing functionality)
- **SessionBooking Collection**: One-time paid individual sessions (newly added)

#### 2. Filter Criteria
**For Schedule sessions:**
- `userId` matches current user
- `scheduledTime` is between start and end of today

**For SessionBooking sessions:**
- `userId` matches current user
- `scheduledAt` is between start and end of today
- `paymentStatus` is "COMPLETED" (only show paid bookings)

#### 3. Data Processing
Each session type is processed to include:
- Converted MongoDB dates to JavaScript Date objects
- Mentor information via `$lookup`
- Session category identifier (`'subscription'` or `'individual'`)
- Standardized `scheduledTime` field (note: SessionBooking uses `scheduledAt` natively)

#### 4. Merging and Sorting
All sessions from both collections are:
1. Combined into a single array
2. Sorted by `scheduledTime` in ascending order
3. Returned as `todaySchedule`

## Files Modified
- **`src/lib/actions/dashboard-data.ts`**
  - Lines ~240-370: Added dual-collection query for `todaySchedule`
  - Lines ~387-540: Added dual-collection query for `upcomingSessions`

## Code Structure

### Today's Schedule Query
```typescript
// 1. Query subscription sessions
const todayScheduleResult = await prisma.$runCommandRaw({
  aggregate: 'schedule',
  pipeline: [
    { $match: { userId: session.user.id, scheduledTime: { $gte: startOfDay, $lte: endOfDay } } },
    { $lookup: { from: 'user', localField: 'mentorId', foreignField: '_id', as: 'mentor' } },
    // ... date conversions and sorting
  ]
});

// 2. Query one-to-one sessions
const todayBookingsResult = await prisma.$runCommandRaw({
  aggregate: 'sessionBooking',
  pipeline: [
    { $match: { 
      userId: session.user.id, 
      scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      paymentStatus: "COMPLETED" 
    }},
    { $lookup: { from: 'user', localField: 'mentorId', foreignField: '_id', as: 'mentor' } },
    // ... date conversions and sorting
  ]
});

// 3. Merge both result sets
let todaySchedule: any[] = [];
scheduleSessions.forEach(session => {
  todaySchedule.push({ ...session, sessionCategory: 'subscription' });
});
bookingSessions.forEach(session => {
  todaySchedule.push({ ...session, sessionCategory: 'individual' });
});

// 4. Sort by time
todaySchedule.sort((a, b) => new Date(a.scheduledTime) - new Date(b.scheduledTime));
```

### Upcoming Sessions Query
The same dual-collection approach was applied to `upcomingSessions` (next 7 days), with an additional `.slice(0, 5)` to limit results to 5 sessions.

## Session Categories
Sessions now include a `sessionCategory` field for UI differentiation:
- `'subscription'`: Sessions from the Schedule collection
- `'individual'`: Sessions from the SessionBooking collection

## Testing Checklist
- [ ] User with only subscription sessions sees them in today's schedule
- [ ] User with only one-to-one sessions sees them in today's schedule
- [ ] User with both session types sees all sessions merged and sorted by time
- [ ] Only COMPLETED payment status one-to-one sessions are shown
- [ ] Sessions are correctly sorted chronologically
- [ ] Mentor information displays correctly for both session types
- [ ] Upcoming sessions (next 7 days) also include both types
- [ ] Mobile responsive display works for mixed session types

## Related Features
- **Mentor Dashboard**: Already correctly implemented dual-collection queries (`mentor-overview-server.ts`)
- **Payment Verification**: Only creates SessionBooking after payment completion (prevents PENDING orphans)
- **Session Types**: Supports "MEDITATION", "YOGA", "CONSULTATION" for SessionBooking

## Impact
- ✅ Users now see complete today's schedule including all booked sessions
- ✅ Consistency between subscription and one-to-one sessions
- ✅ Better user experience and schedule visibility
- ✅ Aligns user dashboard with mentor dashboard implementation

## Future Enhancements
Consider adding:
- Visual distinction between subscription and one-to-one sessions in UI
- Filter/toggle to show only specific session types
- Calendar view with both session types
- Session status indicators (upcoming, ongoing, completed)
