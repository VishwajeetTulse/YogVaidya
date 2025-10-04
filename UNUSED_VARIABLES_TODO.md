# Unused Variables - Manual Fix TODO List

**Created:** October 4, 2025
**Total Items:** ~50-60 unused variables to fix
**Target:** Get errors below 200 (currently at 248)

---

## 📝 How to Fix

For each item below, find the variable and prefix it with `_`:

```typescript
// BEFORE (error):
const variableName = value;

// AFTER (fixed):
const _variableName = value;
```

**For destructuring:**
```typescript
// BEFORE:
const { used, unused } = object;

// AFTER:
const { used, unused: _unused } = object;
```

**After fixing all, run:**
```powershell
npm run lint 2>&1 | Select-String "Error:" | Measure-Object -Line
```

---

## 🔧 Unused Variables by File

### API Routes

#### 1. `src/app/api/mentor/timeslots/route.ts`
- **Line 22:** `getTimeSlotsSchema` - assigned but never used
  ```typescript
  // Find and fix:
  const getTimeSlotsSchema = ... // Change to: const _getTimeSlotsSchema = ...
  ```

#### 2. `src/app/api/mentor/timeslots/[slotId]/book/route.ts`
- **Line 125:** `sessionBooking` - assigned but never used
  ```typescript
  // Find and fix around line 125:
  const sessionBooking = ... // Change to: const _sessionBooking = ...
  ```

#### 3. `src/app/api/mentor/verify-session-payment/route.ts`
- **Line 102:** `sessionBooking` - assigned but never used
  ```typescript
  // Around line 102:
  const sessionBooking = ... // Change to: const _sessionBooking = ...
  ```
- **Line 106:** `scheduleSessionsResult` - assigned but never used
  ```typescript
  // Around line 106:
  const scheduleSessionsResult = ... // Change to: const _scheduleSessionsResult = ...
  ```

---

### Page Components

#### 4. `src/app/timeslot-checkout/page.tsx`
- **Line 20:** `mentorId` - from searchParams, not used
  ```typescript
  // Around line 20:
  const mentorId = searchParams.get(...) // Change to: const _mentorId = ...
  ```

#### 5. `src/components/checkout/TimeSlotCheckout.tsx`
- **Line 61:** `mentorId` - assigned but never used
  ```typescript
  // Around line 61:
  const mentorId = ... // Change to: const _mentorId = ...
  ```

---

### Dashboard Components (Admin)

#### 6. `src/components/dashboard/admin/constants.ts`
- **Line 12:** `Activity` - imported/defined but never used
  ```typescript
  // Check imports or exports around line 12
  // Either remove or prefix with _
  ```

#### 7. `src/components/dashboard/admin/sections/analytics-section.tsx`
- **Line 7:** `Badge` - imported but never used
  ```typescript
  // In imports section:
  import { Badge, ... } from "..." // Remove Badge or use it
  ```

#### 8. `src/components/dashboard/admin/sections/mentor-management-section-new.tsx`
- **Line 22:** `Plus` - icon imported but never used
  ```typescript
  // In imports:
  import { Plus, ... } from "lucide-react" // Remove Plus
  ```
- **Line 42:** `LucideIcon` - type imported but never used
  ```typescript
  // In imports:
  import type { LucideIcon, ... } // Remove LucideIcon
  ```

#### 9. `src/components/dashboard/admin/sections/mentor-management-section.tsx`
- **Line 21:** `Plus` - icon imported but never used
- **Line 41:** `LucideIcon` - type imported but never used
  ```typescript
  // Same as above - remove from imports
  ```

#### 10. `src/components/dashboard/admin/sections/subscription-management-section.tsx`
- **Line 28:** `Filter` - imported but never used
- **Line 36:** `Calendar` - imported but never used
- **Line 37:** `AlertTriangle` - imported but never used
- **Line 38:** `CheckCircle` - imported but never used
- **Line 39:** `XCircle` - imported but never used
  ```typescript
  // Remove all these from lucide-react imports
  ```

#### 11. `src/components/dashboard/admin/sections/ticket-logs-section.tsx`
- **Line 33:** `XCircle` - imported but never used
  ```typescript
  // Remove from imports
  ```

---

### Dashboard Components (Mentor)

#### 12. `src/components/dashboard/mentor/sections/tickets-section.tsx`
- Check for any unused variables (should be clean from previous session)

---

### Dashboard Components (User)

#### 13. `src/components/dashboard/user/sections/tickets-section.tsx`
- **Line 51:** `userDetails` - function parameter not used
  ```typescript
  // Around line 51 in a function definition:
  function someFunction(req, userDetails) { // Change to: function someFunction(req, _userDetails) {
  ```

---

### Mentor Components

#### 14. `src/components/mentor/EnhancedMentorCarousel.tsx`
- **Line 338:** `index` - loop variable not used
  ```typescript
  // Around line 338:
  .map((item, index) => { // Change to: .map((item, _index) => {
  ```

#### 15. `src/components/mentor/MentorApplicationForm.tsx`
- **Line 17:** `Switch` - imported but never used
- **Line 18:** `Label` - imported but never used
  ```typescript
  // Remove from imports
  ```

---

### Library/Server Files

#### 16. `src/lib/server/mentorApplicationServer.ts`
- **Line 6:** `logError` - imported but never used
  ```typescript
  // In imports:
  import { ..., logError } from "..." // Remove logError
  ```

#### 17. `src/lib/subscriptions.ts`
- **Line 8:** `logSystemEvent` - imported but never used
  ```typescript
  // Remove from imports
  ```

#### 18. `src/lib/services/session-status-service.ts`
- **Line 6:** `createDateUpdate` - defined but never used
  ```typescript
  // Around line 6:
  const createDateUpdate = ... // Change to: const _createDateUpdate = ...
  ```
- **Line 33:** `TimeSlotData` - type defined but never used
  ```typescript
  // Around line 33:
  interface TimeSlotData { ... } // Change to: interface _TimeSlotData { ... }
  // OR just remove if truly unused
  ```

---

## 📋 Quick Reference Commands

### Find specific variable in file:
```powershell
# Example: Find 'sessionBooking' in a specific file
Select-String -Path "src/app/api/mentor/timeslots/[slotId]/book/route.ts" -Pattern "sessionBooking" -Context 2,2
```

### Check your progress:
```powershell
# Before fixes:
npm run lint 2>&1 | Select-String "Error:" | Measure-Object -Line
# Should show: 248

# After your fixes:
npm run lint 2>&1 | Select-String "Error:" | Measure-Object -Line
# Target: Below 200
```

### Verify specific file:
```powershell
npm run lint src/app/api/mentor/timeslots/route.ts
```

---

## ✅ Checklist

Mark items as you complete them:

### API Routes (4 files)
- [ ] `src/app/api/mentor/timeslots/route.ts` (1 variable)
- [ ] `src/app/api/mentor/timeslots/[slotId]/book/route.ts` (1 variable)
- [ ] `src/app/api/mentor/verify-session-payment/route.ts` (2 variables)
- [ ] `src/app/timeslot-checkout/page.tsx` (1 variable)

### Components (11 files)
- [ ] `src/components/checkout/TimeSlotCheckout.tsx` (1 variable)
- [ ] `src/components/dashboard/admin/constants.ts` (1 variable)
- [ ] `src/components/dashboard/admin/sections/analytics-section.tsx` (1 import)
- [ ] `src/components/dashboard/admin/sections/mentor-management-section-new.tsx` (2 imports)
- [ ] `src/components/dashboard/admin/sections/mentor-management-section.tsx` (2 imports)
- [ ] `src/components/dashboard/admin/sections/subscription-management-section.tsx` (5 imports)
- [ ] `src/components/dashboard/admin/sections/ticket-logs-section.tsx` (1 import)
- [ ] `src/components/dashboard/user/sections/tickets-section.tsx` (1 parameter)
- [ ] `src/components/mentor/EnhancedMentorCarousel.tsx` (1 variable)
- [ ] `src/components/mentor/MentorApplicationForm.tsx` (2 imports)

### Library Files (3 files)
- [ ] `src/lib/server/mentorApplicationServer.ts` (1 import)
- [ ] `src/lib/subscriptions.ts` (1 import)
- [ ] `src/lib/services/session-status-service.ts` (2 items)

---

## 🎯 Expected Results

**Before your fixes:**
- Errors: 248
- Warnings: 444

**After your fixes (estimated):**
- Errors: ~190-200 (depending on how many you fix)
- Warnings: 444 (unchanged)

**Time estimate:** 30-45 minutes for all fixes

---

## 💡 Tips

1. **Work file by file** - Complete one file before moving to next
2. **Use Find & Replace** - VSCode's Ctrl+H is your friend
3. **Check after each file** - Run lint on that file to verify
4. **Commit frequently** - After every 5-10 files
5. **Take breaks** - Every 15-20 minutes

---

## 🚨 Important Notes

- **DO NOT delete** variables - just prefix with `_`
- **For imports** - you can safely remove unused imports
- **For parameters** - must prefix, cannot remove (breaks function signature)
- **For destructuring** - use: `{ used, unused: _unused }`

---

**When you're done, ping me and I'll continue with the remaining errors (TypeScript any types, console.logs, etc.)!**

Good luck! 🚀
