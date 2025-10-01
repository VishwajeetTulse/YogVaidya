# Diet Plan API Fix - Next.js 15 Params Issue

## Issue
The diet plan detail page shows "Error: Failed to fetch diet plan" because Next.js 15 changed how dynamic route parameters work.

## Root Cause
In Next.js 15, the `params` in API routes are now a **Promise** that needs to be awaited, but TypeScript may show errors due to stale Prisma client types.

## Fixes Applied

### 1. Updated API Route Parameters

**File**: `src/app/api/diet-plans/[id]/route.ts`
```typescript
// BEFORE (Next.js 14 style)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const dietPlan = await prisma.dietPlan.findUnique({
    where: { id: params.id },
  });
}

// AFTER (Next.js 15 style)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dietPlan = await prisma.dietPlan.findUnique({
    where: { id },
  });
}
```

### 2. Updated Download Route

**File**: `src/app/api/diet-plans/[id]/download/route.ts`
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... rest of code
}
```

### 3. Added Debug Logging

**File**: `src/app/dashboard/diet-plan/[id]/page.tsx`
```typescript
const fetchDietPlan = async () => {
  try {
    console.log("🔍 Fetching diet plan:", planId);
    const response = await fetch(`/api/diet-plans/${planId}`);
    console.log("📡 Response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("❌ Error response:", errorData);
      // ... handle error
    }
  }
}
```

## How to Test

### 1. Restart Dev Server
The changes require a fresh server start:
```powershell
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Clear Next.js Cache (if needed)
```powershell
rm -r .next
npm run dev
```

### 3. Test the Flow
1. Log in as DIETPLANNER mentor
2. Go to Diet Plans section
3. Create a new diet plan for a FLOURISH student
4. Click "View" button
5. Check browser console for debug logs:
   - `🔍 Fetching diet plan: <id>`
   - `📡 Response status: 200` (or error code)
   - `✅ Diet plan data: {...}`

### 4. Verify Authorization
The API checks:
- User is authenticated (401 if not)
- User is either the mentor who created it OR the student it's for (403 if not)

## Common Issues

### Issue 1: TypeScript Errors (Property 'dietPlan' does not exist)
**Solution**: Restart VS Code or TypeScript server
```
Command Palette (Ctrl+Shift+P) → TypeScript: Restart TS Server
```

### Issue 2: 401 Unauthorized
**Cause**: User not logged in or session expired
**Solution**: Log in again

### Issue 3: 403 Forbidden
**Cause**: User trying to access someone else's diet plan
**Solution**: Only mentors who created the plan or students it's assigned to can view it

### Issue 4: 404 Not Found
**Cause**: Diet plan ID doesn't exist in database
**Solution**: Check the ID in the URL is valid

## API Response Format

### Success Response
```json
{
  "success": true,
  "dietPlan": {
    "id": "cm2xxx",
    "title": "7-Day Diet Plan",
    "description": "Custom plan for...",
    "content": { /* TipTap JSON */ },
    "tags": ["vegan", "high-protein"],  // Now array (transformed from string)
    "isDraft": false,
    "createdAt": "2025-10-01T...",
    "student": {
      "id": "cm2xxx",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "mentor": {
      "id": "cm2xxx",
      "name": "Jane Mentor",
      "email": "jane@example.com"
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Unauthorized" | "Diet plan not found" | "Failed to fetch diet plan"
}
```

## Changes Summary

### Modified Files:
1. `src/app/api/diet-plans/[id]/route.ts` - Added `await params`
2. `src/app/api/diet-plans/[id]/download/route.ts` - Added `await params`
3. `src/app/dashboard/diet-plan/[id]/page.tsx` - Added debug logging

### Commands Run:
```powershell
npx prisma generate  # Regenerate Prisma client
```

## Next Steps

If the error persists after restarting the dev server:

1. **Check browser console** for the detailed error logs
2. **Check terminal** for any server-side errors
3. **Verify database connection** is working
4. **Test API directly** using browser:
   ```
   http://localhost:3000/api/diet-plans/[actual-id-from-database]
   ```

## Related Documentation
- [Next.js 15 Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [Prisma Client Generation](https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client)
