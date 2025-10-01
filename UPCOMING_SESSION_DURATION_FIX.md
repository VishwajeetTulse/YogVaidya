## Upcoming Session Duration Fix - RESOLVED ✅

### 🔍 **Problem Identified**
Upcoming sessions on the mentor dashboard were showing static duration of 60 minutes instead of the actual planned duration from their time slots.

### 🧩 **Root Cause Analysis**

The issue was in the MongoDB aggregation pipeline in `getMentorSessions()`:

1. **Data Source**: Mentor sessions come from two sources:
   - **Schedule collection** (legacy system) - No time slot data available
   - **SessionBooking collection** (new system) - Has time slot data via `timeSlotId`

2. **Aggregation Issue**: The SessionBooking aggregation pipeline:
   - ✅ **Joined** with `mentorTimeSlot` collection via `$lookup`
   - ✅ **Created** `timeSlotData` field with time slot information
   - ❌ **Did NOT project** `timeSlotData` in the final output

3. **Function Failure**: Without `timeSlotData`, the `calculateActualDuration()` function:
   - Could not access time slot start/end times
   - Fell back to static durations (60 min YOGA, 30 min MEDITATION, 45 min DIET)

### 🛠️ **Solution Implemented**

#### **Fixed Aggregation Projection**
Added `timeSlotData: 1` to the SessionBooking aggregation projection:

```typescript
$project: {
  _id: 1,
  sessionType: 1,
  status: 1,
  link: '$timeSlotData.sessionLink',
  createdAt: 1,
  updatedAt: 1,
  studentId: '$userId',
  studentName: '$studentData.name',
  studentEmail: '$studentData.email',
  paymentStatus: 1,
  timeSlotData: 1  // ⭐ ADDED: Include time slot data for duration calculation
}
```

#### **Working Duration Logic**
Now `calculateActualDuration()` can access `session.timeSlotData` for scheduled sessions:

```typescript
if (session.status === 'SCHEDULED') {
  if (session.timeSlotData?.startTime && session.timeSlotData?.endTime) {
    const startTime = convertMongoDate(session.timeSlotData.startTime);
    const endTime = convertMongoDate(session.timeSlotData.endTime);
    
    if (startTime && endTime && !isNaN(startTime.getTime()) && !isNaN(endTime.getTime())) {
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationMinutes = Math.round(durationMs / (1000 * 60));
      return Math.max(durationMinutes, 1); // ⭐ ACTUAL planned duration
    }
  }
  
  // Fallback only for sessions without time slot data
  return 60; // Default for YOGA
}
```

### ✅ **Results**

**Before Fix:**
- Session with 30-minute time slot: Showed 60 minutes (fallback)
- All YOGA sessions: Showed 60 minutes (static)

**After Fix:**
- Session with 30-minute time slot: Shows 30 minutes ✅ (actual planned duration)
- Sessions without time slots: Show 60 minutes (appropriate fallback)

### 📊 **Session Types & Expected Behavior**

| Session Type | Time Slot Data | Duration Shown | Behavior |
|--------------|----------------|----------------|----------|
| **SessionBooking with valid time slot** | ✅ Available | **Actual planned duration** (e.g., 30 min) | ✅ Fixed |
| **SessionBooking with deleted time slot** | ❌ Missing | **Fallback duration** (60 min YOGA) | ✅ Expected |
| **Schedule collection (legacy)** | ❌ Not applicable | **Fallback duration** (60 min YOGA) | ✅ Expected |

### 🎯 **Key Improvements**
- ✅ **Accurate Planning**: Users see actual planned duration for their time slots
- ✅ **Better Scheduling**: Mentors know exact time commitments
- ✅ **Data Consistency**: Duration reflects actual time slot configuration
- ✅ **Graceful Fallbacks**: Sessions without time slots still show reasonable defaults

### 📋 **Data Analysis Results**
Out of 8 scheduled sessions analyzed:
- **1 session**: Has valid time slot data → Now shows actual planned duration ✅
- **3 sessions**: Orphaned (deleted time slots) → Shows fallback duration ✅
- **4 sessions**: Legacy (no time slot IDs) → Shows fallback duration ✅

---

**Status**: ✅ **RESOLVED** - Upcoming sessions with valid time slot data now display their actual planned duration instead of static 60-minute fallbacks.