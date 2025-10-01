# Diet Plan Debug Guide

## Current Issue: "Failed to fetch diet plans"

The student section is getting an error when trying to load diet plans.

## Debug Steps

### 1. Restart Dev Server
```powershell
# Stop current server (Ctrl+C)
npm run dev
```

### 2. Check Browser Console

When you go to the Diet Plans section as a student, you should see:

**Success Logs:**
```
🔍 Fetching diet plans for student...
📡 Response status: 200
✅ Diet plans data: { dietPlans: [...] }
```

**Error Logs:**
```
🔍 Fetching diet plans for student...
📡 Response status: 401 (or 500)
❌ Error response: { error: "..." }
```

### 3. Check Terminal (Server) Logs

You should see:
```
🔍 GET Diet Plans - User: cm2xxx Role: USER
📋 Query params - mentorId: null
🎓 Fetching plans for STUDENT: cm2xxx
✅ Returning X diet plans
```

## What I Added

### Client-Side Logging (user/sections/diet-plans-section.tsx)
```typescript
console.log("🔍 Fetching diet plans for student...");
console.log("📡 Response status:", response.status);
console.log("✅ Diet plans data:", data);
```

### Server-Side Logging (api/mentor/diet-plans/route.ts)
```typescript
console.log("🔍 GET Diet Plans - User:", session?.user?.id, "Role:", session?.user?.role);
console.log("📋 Query params - mentorId:", mentorId);
console.log("🎓 Fetching plans for STUDENT:", session.user.id);
console.log("✅ Returning", transformedDietPlans.length, "diet plans");
```

## Common Causes

### Cause 1: TypeScript Not Updated
**Solution:** Restart dev server
```powershell
npm run dev
```

### Cause 2: Not Logged In
**Solution:** Make sure you're logged in as a FLOURISH student

### Cause 3: No Diet Plans Created
**Solution:** Create a diet plan for this student first
- Log in as DIETPLANNER mentor
- Create a diet plan for the FLOURISH student
- Save and send (not draft)

### Cause 4: Database Connection
**Solution:** Check DATABASE_URL is set correctly

### Cause 5: Prisma Client Stale
**Solution:** 
```powershell
npx prisma generate
npm run dev
```

## Testing Flow

### Step 1: Create a Diet Plan (As Mentor)
1. Log in as DIETPLANNER mentor
2. Go to Diet Plans section
3. Select a FLOURISH student
4. Fill in title and content
5. Click "Send to Student"

### Step 2: View Diet Plan (As Student)
1. Log in as the FLOURISH student
2. Go to Diet Plans section
3. Should see the diet plan card
4. Click "View Diet Plan"
5. Should open detail page

### Step 3: Check Logs
- Browser console should show success logs
- Terminal should show API request logs

## API Behavior

The `/api/mentor/diet-plans` endpoint handles both:

**For Mentors:**
- Requires `mentorId` query param
- Returns plans created by that mentor

**For Students:**
- No query param needed
- Returns plans assigned to logged-in student
- Excludes drafts (isDraft: false)

## Next Steps

1. **Restart dev server**
2. **Clear browser cache** if needed
3. **Check console logs** to see exact error
4. **Report specific error** from console for further debugging
