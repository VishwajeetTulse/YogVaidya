## Real-Time Duration Display Fix - ONGOING Sessions

### 📋 Issue
**Problem**: When student gets option to join session (ONGOING status), duration shows default 60 minutes instead of elapsed time  
**Root Cause**: Frontend was displaying server-calculated duration which is only computed at query time, not updated in real-time  
**Status**: ✅ FIXED

---

## 🔍 Problem Analysis

### **The Issue**:
1. Mentor starts session → Status becomes ONGOING
2. Student dashboard shows "Join Now" button ✅
3. Duration shows "60 minutes" ❌ (should show elapsed time)
4. Duration doesn't update until page refresh

### **Why It Happened**:
- Backend aggregation calculates duration using `$$NOW` (query execution time)
- Frontend displays the pre-calculated value
- Duration becomes stale immediately after query
- No client-side recalculation for ONGOING sessions

---

## ✅ Solution Implemented

### **Three-Layer Fix**:

#### **1. Backend: Include `manualStartTime` in Response**
**Files**: `src/lib/server/user-sessions-server.ts`

**Changes**:
- Added `manualStartTime` to `UserSessionData` interface
- Included `manualStartTime` in aggregation projections (2 pipelines)
- Converted to ISO string format for safe transmission

```typescript
manualStartTime: {
  $cond: {
    if: { $ne: ['$manualStartTime', null] },
    then: {
      $cond: {
        if: { $eq: [{ $type: '$manualStartTime' }, 'date'] },
        then: { $dateToString: { format: '%Y-%m-%dT%H:%M:%S.%LZ', date: '$manualStartTime' } },
        else: '$manualStartTime'
      }
    },
    else: null
  }
}
```

#### **2. Frontend: Client-Side Duration Calculation**
**File**: `src/components/dashboard/user/sections/classes-section.tsx`

**New Function**:
```typescript
const calculateDisplayDuration = (sessionItem: SessionData): number => {
  // For ONGOING sessions, calculate elapsed time from actual start
  if (sessionItem.status === "ONGOING") {
    const startTimeStr = sessionItem.manualStartTime || sessionItem.scheduledTime;
    const startTime = new Date(startTimeStr);
    const currentTime = new Date();
    
    if (!isNaN(startTime.getTime())) {
      const elapsedMs = currentTime.getTime() - startTime.getTime();
      const elapsedMinutes = Math.round(elapsedMs / (1000 * 60));
      return Math.max(elapsedMinutes, 1);
    }
  }
  
  // For other statuses, use server-calculated duration
  return sessionItem.duration || 60;
};
```

**Display Updated**:
```tsx
<Clock className="w-4 h-4" />
{Math.round(calculateDisplayDuration(sessionItem))} minutes
{sessionItem.status === "ONGOING" && " (ongoing)"}
```

#### **3. Auto-Update: Periodic Re-render**
**Added**:
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    setUpdateTrigger(prev => prev + 1); // Force re-render
  }, 60000); // Every minute

  return () => clearInterval(interval);
}, []);
```

---

## 🎯 How It Works Now

### **Timeline Example**:

**10:00 AM** - Mentor starts session
- Backend: `manualStartTime = 10:00 AM`
- Student sees: "Join Now" button
- Duration: **"0 minutes (ongoing)"** ✅

**10:05 AM** - 5 minutes into session
- Student refreshes or auto-update triggers
- Frontend calculates: `currentTime - manualStartTime`
- Duration: **"5 minutes (ongoing)"** ✅

**10:30 AM** - 30 minutes into session
- Duration: **"30 minutes (ongoing)"** ✅

**10:45 AM** - Session continues past planned 60 minutes
- Duration: **"45 minutes (ongoing)"** (not capped!) ✅

**11:00 AM** - Mentor completes session
- Status changes to COMPLETED
- Duration: **"60 minutes"** (final actual duration) ✅

---

## 📊 Calculation Logic by Status

| Session Status | Duration Source | Calculation | Updates |
|---------------|----------------|-------------|---------|
| **ONGOING** | **Client-side** | `now - manualStartTime` | Every minute |
| COMPLETED | Server-side | `actualEndTime - manualStartTime` | Static (final) |
| SCHEDULED | Server-side | `timeSlotEnd - timeSlotStart` | Static (planned) |

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────┐
│           Mentor Starts Session (10:00 AM)              │
│          manualStartTime = 2025-10-03T10:00:00Z         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Backend Aggregation Query          │
        │  - Status: ONGOING                  │
        │  - duration: 0 ($$NOW - start)      │
        │  - manualStartTime: 10:00 AM        │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  Frontend Receives Data             │
        │  - sessionItem.status = "ONGOING"   │
        │  - sessionItem.manualStartTime      │
        └─────────────┬───────────────────────┘
                      │
                      ▼
        ┌─────────────────────────────────────┐
        │  calculateDisplayDuration()         │
        │  currentTime = 10:05 AM             │
        │  elapsed = 10:05 - 10:00 = 5 min    │
        │  → Display: "5 minutes (ongoing)"   │
        └─────────────┬───────────────────────┘
                      │
                      │ Auto-update (every 60s)
                      │ or Component re-render
                      ▼
        ┌─────────────────────────────────────┐
        │  Re-calculate                       │
        │  currentTime = 10:10 AM             │
        │  elapsed = 10:10 - 10:00 = 10 min   │
        │  → Display: "10 minutes (ongoing)"  │
        └─────────────────────────────────────┘
```

---

## 🛡️ Fallback Logic

### **Priority for Start Time** (ONGOING sessions):
1. ✅ `manualStartTime` (when mentor actually started)
2. ✅ `scheduledTime` (if no manual start recorded)
3. ✅ 60 minutes (if both fail)

### **Why This Works**:
- Uses most accurate time available
- Gracefully handles missing data
- Always shows a reasonable value

---

## 📈 Before vs After

| Scenario | Before | After |
|----------|--------|-------|
| **Session just started** | "60 minutes" ❌ | "1 minute (ongoing)" ✅ |
| **Session ongoing 15 min** | "60 minutes" ❌ | "15 minutes (ongoing)" ✅ |
| **Session ongoing 45 min** | "60 minutes" ❌ | "45 minutes (ongoing)" ✅ |
| **Overtime (90 min)** | "60 minutes" ❌ | "90 minutes (ongoing)" ✅ |
| **After refresh** | Same stale value ❌ | Updated elapsed time ✅ |
| **Auto-update (every min)** | No update ❌ | Duration increases ✅ |

---

## 🎨 UI Changes

### **Duration Display**:
```tsx
// Before
{sessionItem.duration} minutes

// After
{Math.round(calculateDisplayDuration(sessionItem))} minutes
{sessionItem.status === "ONGOING" && " (ongoing)"}
```

### **Visual Indicator**:
- Shows "(ongoing)" label for ONGOING sessions
- Duration updates in real-time
- Clear indication that session is active

---

## 🔧 Technical Details

### **Key Components**:

1. **Backend Projection**:
   - Projects `manualStartTime` field
   - Converts date to ISO string
   - Handles null values gracefully

2. **Frontend Interface**:
   ```typescript
   interface SessionData {
     manualStartTime: string | null;
     // ... other fields
   }
   ```

3. **Duration Calculator**:
   ```typescript
   const calculateDisplayDuration = (sessionItem: SessionData): number
   ```

4. **Auto-Update Hook**:
   ```typescript
   useEffect(() => {
     const interval = setInterval(() => {
       setUpdateTrigger(prev => prev + 1);
     }, 60000);
     return () => clearInterval(interval);
   }, []);
   ```

### **Date Handling**:
- Backend: ISO 8601 strings (`2025-10-03T10:00:00.000Z`)
- Frontend: JavaScript Date objects
- Arithmetic: Milliseconds → Minutes conversion
- Rounding: `Math.round()` for clean display

---

## 🧪 Testing Guide

### **Test Case 1: Session Start**
1. Mentor starts session
2. Student dashboard shows "Join Now"
3. **Expected**: Duration shows "0-2 minutes (ongoing)"

### **Test Case 2: Elapsed Time**
1. Wait 5 minutes
2. Refresh student dashboard
3. **Expected**: Duration shows "~5 minutes (ongoing)"

### **Test Case 3: Auto-Update**
1. Keep dashboard open
2. Wait 60 seconds
3. **Expected**: Duration increases by 1 minute automatically

### **Test Case 4: Long Session**
1. Let session run 90 minutes
2. Check duration display
3. **Expected**: Shows "90 minutes (ongoing)" (not capped at 60)

### **Test Case 5: Session Completion**
1. Mentor completes session
2. Check completed tab
3. **Expected**: Shows final actual duration, no "(ongoing)" label

---

## 📊 Performance Impact

### **Minimal Overhead**:
- ✅ Client-side calculation is lightweight (simple subtraction)
- ✅ Auto-update runs once per minute (not CPU-intensive)
- ✅ No additional API calls
- ✅ Uses existing data from initial query

### **Benefits**:
- Real-time accuracy without backend load
- Better user experience
- Reduced server queries
- Immediate updates

---

## 💡 Future Enhancements

### **Possible Improvements**:
1. **Second-precision updates** (current: minute-precision)
2. **Live countdown** for scheduled sessions
3. **Visual timer** component
4. **Session duration warnings** (overtime alerts)
5. **Historical duration analytics**

---

## ✅ Verification Checklist

- [x] Backend includes `manualStartTime` in response
- [x] Frontend calculates elapsed time for ONGOING
- [x] Duration updates automatically every minute
- [x] "(ongoing)" label shows for active sessions
- [x] Completed sessions show final duration
- [x] Scheduled sessions show planned duration
- [x] No "Duration not available" errors
- [x] Works across page refreshes
- [x] Handles missing `manualStartTime` gracefully
- [x] Overtime sessions show actual elapsed time

---

**Status**: ✅ COMPLETE  
**Date**: October 3, 2025  
**Files Modified**: 2
- `src/lib/server/user-sessions-server.ts` (backend data)
- `src/components/dashboard/user/sections/classes-section.tsx` (frontend display)

**Impact**: ONGOING sessions now show accurate, real-time elapsed duration!
