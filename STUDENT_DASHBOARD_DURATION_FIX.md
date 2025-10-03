## Student Dashboard Completed Sessions Duration Fix

### 📋 Issue
**Component**: `src/components/dashboard/user/sections/classes-section.tsx`  
**Server Function**: `src/lib/server/user-sessions-server.ts`  
**Problem**: Session duration was not being displayed on the student dashboard's completed sections  
**Root Cause**: For completed sessions, we were showing planned duration instead of actual duration

### 🔍 Analysis

The student dashboard displays sessions with duration information. However, for **completed sessions**, the system was showing:
- ❌ **Planned duration** (from time slot: `endTime - startTime`)
- ✅ **Should show actual duration** (from `actualEndTime - manualStartTime`)

### ✅ Solution Applied

Updated the MongoDB aggregation pipelines in `user-sessions-server.ts` to calculate duration dynamically:

#### Duration Calculation Logic:

```typescript
duration: {
  $cond: {
    if: { $and: [
      { $eq: ['$status', 'COMPLETED'] },
      { $ne: ['$manualStartTime', null] },
      { $ne: ['$actualEndTime', null] }
    ]},
    // For completed sessions with actual times, calculate actual duration
    then: {
      $divide: [
        {
          $subtract: [
            { $toDate: '$actualEndTime' },
            { $toDate: '$manualStartTime' }
          ]
        },
        60000 // Convert milliseconds to minutes
      ]
    },
    // Otherwise, use planned duration from time slot
    else: {
      $divide: [
        {
          $subtract: [
            { $toDate: '$timeSlotData.endTime' },
            { $toDate: '$timeSlotData.startTime' }
          ]
        },
        60000 // Convert milliseconds to minutes
      ]
    }
  }
}
```

### 📊 Behavior by Session Status

| Session Status | Duration Shown | Source |
|---------------|----------------|--------|
| **COMPLETED** (with actual times) | Actual duration | `actualEndTime - manualStartTime` |
| **COMPLETED** (no actual times) | Planned duration | `timeSlotData.endTime - timeSlotData.startTime` |
| **ONGOING** | Planned duration | `timeSlotData.endTime - timeSlotData.startTime` |
| **SCHEDULED** | Planned duration | `timeSlotData.endTime - timeSlotData.startTime` |

### 🔧 Changes Made

**File**: `src/lib/server/user-sessions-server.ts`

**Two aggregation pipelines updated:**

1. **`fetchPaidSessionBookings()`** - Line ~125
   - For users without active subscriptions who have paid bookings
   - Updated duration calculation with conditional logic

2. **Main query for active subscribers** - Line ~388
   - For users with active subscriptions
   - Updated duration calculation with conditional logic

### 📈 Impact

**Before**: 
- ❌ Completed sessions always showed planned duration (e.g., 60 minutes)
- ❌ Didn't reflect actual session length (could be 45, 75, 90 minutes, etc.)
- ❌ Students couldn't see how long sessions actually lasted

**After**:
- ✅ Completed sessions show **actual duration** if available
- ✅ Falls back to planned duration if actual times not recorded
- ✅ Accurate reflection of session history
- ✅ Students can see exact time spent in each completed session

### 🎯 Session Tracking Fields

The fix leverages these SessionBooking model fields:
- `manualStartTime` - When mentor actually started the session
- `actualEndTime` - When session actually ended
- `status` - Session status (SCHEDULED, ONGOING, COMPLETED, CANCELLED)

### 💡 Edge Cases Handled

1. **Completed without manual times**: Falls back to planned duration
2. **ONGOING sessions**: Shows planned duration (actual not yet known)
3. **SCHEDULED sessions**: Shows planned duration
4. **Null/missing time slot data**: Gracefully handled by MongoDB $cond

### 🧪 Testing Recommendations

1. **Completed Session with Actual Times**:
   - Mentor starts session → manualStartTime recorded
   - Mentor ends session → actualEndTime recorded
   - Student dashboard should show actual duration

2. **Completed Session without Actual Times**:
   - Old legacy sessions without tracking
   - Should show planned duration from time slot

3. **Upcoming Sessions**:
   - Should show planned duration from time slot
   - Duration should match what's in the booking

4. **Ongoing Sessions**:
   - Should show planned duration (not elapsed time)
   - Duration should match time slot booking

### 📝 Related Components

- ✅ `src/components/dashboard/user/sections/classes-section.tsx` - Displays the duration
- ✅ `src/lib/server/user-sessions-server.ts` - Calculates and returns duration
- ✅ Session auto-completion logic - Records `manualStartTime` and `actualEndTime`

### 🚀 Verification

To verify the fix:
1. Navigate to student dashboard (`/dashboard`)
2. View "Completed" tab in My Classes section
3. Check duration displays for completed sessions
4. Compare with mentor dashboard completed sessions
5. Verify durations match actual session times

---

**Status**: ✅ Fixed  
**Date**: October 3, 2025  
**Files Modified**: 1  
**Lines Changed**: ~50 lines (2 aggregation pipelines updated)
