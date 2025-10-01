# Diet Plan Student Fetching Fix

## Issue
The Diet Plans section for DIETPLANNER mentors showed "No students with FLOURISH subscription found" even when FLOURISH students existed in the database.

## Root Cause
The component was attempting to fetch students from a non-existent API endpoint:
```tsx
const studentsRes = await fetch(`/api/mentor/students?mentorId=${mentorId}`);
```

This endpoint `/api/mentor/students` was never created during the initial implementation.

## Solution
Refactored the component to use the existing server-side function `getMentorStudentsData()` from `@/lib/server/mentor-students-server` instead of making an API call.

### Changes Made

#### 1. **diet-plans-section.tsx** (Lines 1-110)
- Added import: `import { getMentorStudentsData } from "@/lib/server/mentor-students-server";`
- Updated `Student` interface to match `MentorStudentData`:
  ```tsx
  interface Student {
    id: string;
    name: string;
    email: string;
    subscriptionPlan: "BLOOM" | "FLOURISH";
    subscriptionStartDate: Date | null;
    createdAt: Date;
  }
  ```
- Replaced API fetch with direct server function call:
  ```tsx
  const studentsData = await getMentorStudentsData();
  if (studentsData.success && studentsData.data) {
    const flourishStudents = studentsData.data.students.filter(
      (s) => s.subscriptionPlan === "FLOURISH"
    );
    setStudents(flourishStudents);
  }
  ```

#### 2. **students.ts** (Line 16)
Fixed the `getStudents()` function to properly handle DIETPLANNER mentor type:
```tsx
// BEFORE (missing DIETPLANNER case)
subscriptionPlan: {
  in: [mentortype == "YOGAMENTOR" ? "BLOOM" : "SEED" , "FLOURISH" ]
}

// AFTER (handles all mentor types)
subscriptionPlan: {
  in: [mentortype == "YOGAMENTOR" ? "BLOOM" : mentortype == "DIETPLANNER" ? "FLOURISH" : "SEED" , "FLOURISH" ]
}
```

## Technical Details

### Mentor Type to Subscription Plan Mapping
- **YOGAMENTOR**: Works with BLOOM and FLOURISH students
- **MEDITATIONMENTOR**: Works with SEED and FLOURISH students  
- **DIETPLANNER**: Works with FLOURISH students only

### Why This Approach is Better
1. **No API Endpoint Needed**: Avoids creating a redundant endpoint when functionality already exists
2. **Consistent Logic**: Uses the same student-fetching logic as other mentor dashboard sections
3. **Type Safety**: Direct function call provides better TypeScript type checking
4. **Server-Side**: Keeps sensitive database queries on the server
5. **Centralized**: Changes to student filtering logic only need to be made in one place

## Testing Steps
1. Log in as a DIETPLANNER mentor
2. Navigate to "Diet Plans" section
3. Verify FLOURISH students appear in the dropdown
4. Create a diet plan for a FLOURISH student
5. Confirm the plan is saved and the student receives an email notification

## Related Files
- `src/components/dashboard/mentor/sections/diet-plans-section.tsx` - Diet plans UI
- `src/lib/server/mentor-students-server.ts` - Student fetching server function
- `src/lib/server/mentor-overview-server.ts` - Contains `getMentorStudents()` helper
- `src/lib/students.ts` - Legacy `getStudents()` function (now fixed)

## Prevention
When implementing new mentor features:
1. Check existing server functions before creating new API endpoints
2. Ensure mentor type logic handles all three types: YOGAMENTOR, MEDITATIONMENTOR, DIETPLANNER
3. Test with actual data for each subscription plan: SEED, BLOOM, FLOURISH
