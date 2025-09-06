# Session Booking Implementation Test Plan

## ✅ Completed Features

### 1. Database Schema
- [x] SessionBooking model in Prisma schema
- [x] User relations for student and mentor bookings
- [x] Proper indexes for performance

### 2. API Endpoints
- [x] `/api/mentor/book-session` - Creates Razorpay order
- [x] `/api/mentor/verify-session-payment` - Verifies payment and creates booking
- [x] `/api/mentor/get-approved-mentors` - Fetches available mentors

### 3. UI Components
- [x] SessionCheckout component with 12-hour time picker
- [x] Enhanced styling with gradient backgrounds
- [x] Custom time selection with Select components
- [x] Form validation and error handling
- [x] Session summary display

### 4. Authentication & Authorization
- [x] Protected checkout page requiring authentication
- [x] Mentor ID validation
- [x] User session management

### 5. Payment Integration
- [x] Razorpay order creation
- [x] Payment signature verification
- [x] Database booking creation after successful payment

## 🧪 Test Scenarios

### Test 1: Access Session Checkout
1. Navigate to `/session-checkout?mentorId=MENTOR_ID`
2. Should redirect to signin if not authenticated
3. Should redirect to mentors if mentorId is invalid
4. Should load mentor data and display checkout form

### Test 2: 12-Hour Time Selection
1. Select a date (today or future)
2. Choose hour (01-12), minute (00-59), period (AM/PM)
3. Verify time conversion to 24-hour format for backend
4. Check display shows 12-hour format for user

### Test 3: Form Validation
1. Try submitting without date - should show error
2. Try submitting without complete time - should show error
3. Try submitting with past date - should show error

### Test 4: Payment Flow
1. Fill complete form with valid data
2. Click "Book Session" button
3. Should create Razorpay order
4. Should open payment gateway
5. On successful payment, should verify and create booking
6. Should redirect to dashboard with success message

## 🔧 Manual Testing Steps

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Access Application**
   - Go to http://localhost:3000
   - Sign in with a user account

3. **Find a Mentor**
   - Navigate to mentors page
   - Get a mentor ID from approved mentors

4. **Test Session Booking**
   - Navigate to `/session-checkout?mentorId=YOUR_MENTOR_ID`
   - Fill out the form
   - Test the booking flow

## 🐛 Potential Issues to Check

1. **Mentor ID Mismatch**: Ensure mentor IDs from applications match user IDs
2. **Payment Configuration**: Verify Razorpay keys are properly set
3. **Time Zone Handling**: Ensure consistent time handling across components
4. **Database Connections**: Check Prisma client is properly configured

## 🚀 Next Steps

1. Test complete booking flow end-to-end
2. Add booking history for users
3. Add mentor dashboard to view bookings
4. Implement session status updates (scheduled → ongoing → completed)
5. Add email notifications for booking confirmations
