# Diet Plan Feature - Setup Instructions

## 🚨 Important: Environment Configuration Required

Before the diet plan feature can work, you need to ensure your environment variables are properly configured.

---

## Step 1: Configure Environment Variables

Create or update your `.env.local` file in the project root with the following variables:

```env
# Database
DATABASE_URL="your-mongodb-connection-string"

# Email Service
SENDER_EMAIL="your-email@gmail.com"
SENDER_EMAIL_PASSWORD="your-app-password"

# App URL (for email links)
NEXT_PUBLIC_APP_URL="http://localhost:3000"  # or your production URL
```

### Getting Your MongoDB Connection String:

If you're using MongoDB Atlas:
1. Go to your MongoDB Atlas dashboard
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Format: `mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority`

---

## Step 2: Push Database Changes

Once `.env.local` is configured with `DATABASE_URL`, run:

```bash
npx prisma db push
```

This will:
- ✅ Create the `dietPlan` collection in MongoDB
- ✅ Add necessary indexes
- ✅ Update relations

**Expected Output:**
```
✔ Your database is now in sync with your Prisma schema
```

---

## Step 3: Verify Prisma Client

Ensure Prisma client is generated with the new model:

```bash
npx prisma generate
```

**Expected Output:**
```
✔ Generated Prisma Client
```

---

## Step 4: Start Development Server

```bash
npm run dev
```

The server should start without errors on `http://localhost:3000`

---

## 🧪 Testing the Feature

### Quick Test Checklist:

#### 1. **Create Test Users** (if not already done)

You'll need:
- ✅ A DIETPLANNER mentor account
- ✅ A student with FLOURISH subscription

#### 2. **Test Mentor Flow:**

```
1. Login as DIETPLANNER mentor
2. Go to Dashboard → Diet Plans
3. You should see:
   - "Create Diet Plan" form
   - Student dropdown (showing FLOURISH subscribers)
4. Create a test plan:
   - Select student
   - Title: "Test Diet Plan"
   - Add content using editor
   - Click "Send to Student"
5. Check terminal for email logs
6. Verify plan appears in "Your Diet Plans" section
```

#### 3. **Test Student Flow:**

```
1. Login as FLOURISH student
2. Go to Dashboard → Diet Plans
3. You should see:
   - List of received plans
   - Click to view full content
4. Verify:
   - Formatting is preserved
   - Mentor name shows
   - Creation date shows
```

#### 4. **Test Non-FLOURISH Student:**

```
1. Login as student without FLOURISH
2. Go to Dashboard → Diet Plans
3. You should see:
   - Upgrade prompt
   - "Upgrade to FLOURISH" button
```

---

## 🔧 Troubleshooting

### Error: "Environment variable not found: DATABASE_URL"

**Problem:** `.env.local` file is missing or doesn't have DATABASE_URL

**Solution:**
1. Create `.env.local` in project root
2. Add `DATABASE_URL="your-connection-string"`
3. Run `npx prisma db push` again

---

### Error: "Property 'dietPlan' does not exist"

**Problem:** TypeScript hasn't picked up the new Prisma types

**Solution:**
1. Restart your IDE/editor (VS Code)
2. Or run: `npx prisma generate`
3. Or restart TypeScript server in VS Code:
   - Press `Ctrl+Shift+P`
   - Type "TypeScript: Restart TS Server"
   - Press Enter

---

### No students showing in mentor dropdown

**Problem:** No students have FLOURISH subscription

**Solution:**
1. Go to admin dashboard
2. Find a student
3. Update their subscription:
   - `subscriptionPlan: "FLOURISH"`
   - `subscriptionStatus: "ACTIVE"`
4. Or create a new student with FLOURISH plan

---

### Email not sending

**Problem:** Email service not configured

**Solution:**

For development (using MailDev):
```bash
# Install MailDev globally
npm install -g maildev

# Run MailDev
maildev

# View emails at: http://localhost:1080
```

For production (using Gmail):
1. Enable 2-factor authentication on your Gmail
2. Generate an App Password:
   - Go to Google Account → Security
   - App Passwords
   - Generate new password
3. Add to `.env.local`:
   ```
   SENDER_EMAIL="your-email@gmail.com"
   SENDER_EMAIL_PASSWORD="generated-app-password"
   ```

---

### Student can't see diet plans

**Checklist:**
- [ ] Student has `subscriptionPlan: "FLOURISH"`
- [ ] Student has `subscriptionStatus: "ACTIVE"`
- [ ] Diet plan is NOT saved as draft (isDraft: false)
- [ ] Diet plan was created for this specific student

---

## 📊 Database Verification

To verify the diet plan collection was created:

### Using MongoDB Compass:
1. Connect to your database
2. Look for `dietPlan` collection
3. Check indexes are created

### Using Prisma Studio:
```bash
npx prisma studio
```
- Opens at `http://localhost:5555`
- Navigate to `DietPlan` model
- You can view/edit data visually

---

## 🎯 Next Steps After Setup

Once everything is working:

1. **Test the complete flow** (mentor create → student view)
2. **Check email notifications** work
3. **Test on mobile devices** (responsive design)
4. **Create sample diet plans** for demo
5. **Document for your team** (internal wiki)
6. **Deploy to staging** for QA testing
7. **Deploy to production** when ready

---

## 📝 Sample Data

### Sample Diet Plan Content:

```markdown
# 7-Day Balanced Diet Plan

## Overview
This plan is designed to help you achieve your health goals with balanced nutrition.

## Daily Guidelines
- Drink 8 glasses of water
- Avoid processed foods
- Exercise 30 minutes daily

## Weekly Schedule

### Monday
**Breakfast:** Oatmeal with berries and nuts
**Lunch:** Grilled chicken salad with olive oil
**Dinner:** Baked salmon with steamed vegetables

### Tuesday
**Breakfast:** Greek yogurt with honey and granola
**Lunch:** Quinoa bowl with chickpeas
**Dinner:** Vegetable stir-fry with tofu

... (continue for other days)

## Notes
- Adjust portions based on your calorie needs
- Substitute foods based on preferences
- Consult with your doctor for dietary restrictions
```

---

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. Check all error messages in terminal
2. Review browser console for client-side errors
3. Verify all dependencies installed: `npm install`
4. Clear Next.js cache: `rm -rf .next` then `npm run dev`
5. Check MongoDB connection is active
6. Verify user roles and subscriptions in database

---

## ✅ Success Indicators

You'll know everything is working when:

- ✅ `npx prisma db push` completes successfully
- ✅ Dev server starts without errors
- ✅ "Diet Plans" appears in both mentor and student dashboards
- ✅ Mentor can select students from dropdown
- ✅ Rich text editor loads properly
- ✅ Diet plans are created and saved to database
- ✅ Students can view their plans
- ✅ Email notifications are sent (check logs)

---

## 🎉 You're All Set!

Once these steps are complete, your diet plan feature will be fully functional!

**Need help?** Check the other documentation files:
- `DIET_PLAN_FEATURE_COMPLETE.md` - Technical details
- `DIET_PLAN_QUICK_START.md` - Usage guide
- `project.md` - Project overview
