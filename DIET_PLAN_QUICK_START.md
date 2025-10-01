# Diet Plan Feature - Quick Start Guide

## 🚀 Getting Started

### Step 1: Update Database
```bash
npx prisma db push
```

### Step 2: Verify Installation
All dependencies are already installed! ✅

### Step 3: Restart Development Server
```bash
npm run dev
```

---

## 📋 How to Use

### For DIETPLANNER Mentors:

1. **Login** to your mentor account
2. Navigate to **Dashboard** → **Diet Plans**
3. Click **"Create Diet Plan"**
4. Select a student (only FLOURISH subscribers shown)
5. Enter plan details:
   - Title (e.g., "7-Day Weight Loss Plan")
   - Description (optional)
   - Tags (optional, comma-separated)
6. Use the **rich text editor** to create content:
   - Format text (bold, italic)
   - Add headings
   - Create meal schedule tables
   - Insert food images
7. Choose action:
   - **Save as Draft** - Save for later, student won't see it
   - **Send to Student** - Publish immediately + send email

### For Students:

1. **Login** to your student account
2. Navigate to **Dashboard** → **Diet Plans**
3. If you have **FLOURISH subscription**:
   - View all your diet plans
   - Click to read full content
4. If you **don't have FLOURISH**:
   - See upgrade prompt
   - Click "Upgrade to FLOURISH" to unlock feature

---

## 🎯 Quick Test Scenario

### Test the Complete Flow:

1. **Create a DIETPLANNER mentor** (or use existing)
2. **Create a FLOURISH student** (or upgrade existing)
3. **As Mentor:**
   - Go to Diet Plans section
   - Create a plan for the FLOURISH student
   - Use the editor to add:
     ```
     # 7-Day Meal Plan
     
     ## Monday
     - Breakfast: Oatmeal with fruits
     - Lunch: Grilled chicken salad
     - Dinner: Quinoa bowl
     
     ## Tuesday
     - Breakfast: Smoothie bowl
     ...
     ```
   - Add a table for calorie breakdown
   - Click "Send to Student"
4. **Check Email** - Student should receive notification
5. **As Student:**
   - Login and go to Diet Plans
   - See the new plan
   - Click to view full content
   - Verify formatting is preserved

---

## 🔧 Troubleshooting

### "Property 'dietPlan' does not exist"
**Solution:** Restart your TypeScript server or IDE

### Students can't see diet plans
**Check:**
- Student has FLOURISH subscription
- Subscription status is ACTIVE
- Plan is not saved as draft

### Mentor dropdown is empty
**Check:**
- At least one student has FLOURISH subscription
- Student subscription status is ACTIVE
- You're logged in as a MENTOR with mentorType = DIETPLANNER

### Email not sending
**Check:**
- `.env.local` has `SENDER_EMAIL` and `SENDER_EMAIL_PASSWORD`
- Plan is published (not draft)
- Check terminal for email service errors

---

## 📊 Feature Access Matrix

| User Type | Can Create Plans | Can View Plans | Requires |
|-----------|-----------------|----------------|----------|
| DIETPLANNER Mentor | ✅ Yes | ✅ Own plans | Mentor account |
| Other Mentors | ❌ No | ❌ No | N/A |
| FLOURISH Students | ❌ No | ✅ Yes | FLOURISH subscription |
| Other Students | ❌ No | ❌ No (sees upgrade prompt) | N/A |
| Admin | ❌ No* | ❌ No* | *Future: Admin view |

---

## 🎨 Rich Text Editor Tips

### Creating Tables (Meal Schedules):
1. Click the **table icon** in toolbar
2. Creates a 3x3 table by default
3. Click in cells to type
4. Use toolbar to add/remove rows/columns

### Adding Images:
1. Click the **image icon**
2. Enter image URL
3. Press Enter
4. Image appears inline

### Formatting Text:
- **Bold**: Select text → Click **B** button
- *Italic*: Select text → Click **I** button
- Headings: Click **H1** or **H2** button

---

## 📱 Mobile Usage

The diet plan feature is **fully responsive**:
- ✅ Create plans on tablet
- ✅ View plans on mobile
- ✅ Rich text editor works on touch devices

---

## 🆘 Need Help?

1. Check the full documentation: `DIET_PLAN_FEATURE_COMPLETE.md`
2. Review the project overview: `project.md`
3. Inspect the code comments in components
4. Create a support ticket in the dashboard

---

## 🎉 Feature Highlights

- 🎨 **Rich Formatting** - Tables, images, styled text
- 📧 **Email Notifications** - Automatic when plans are sent
- 💾 **Draft Mode** - Save work-in-progress
- 🔒 **Premium Feature** - FLOURISH subscription required
- 📱 **Responsive** - Works on all devices
- 🏷️ **Tagging** - Organize plans with tags
- 🔗 **Session Linking** - Optional connection to bookings

---

**Enjoy creating personalized diet plans! 🥗**
