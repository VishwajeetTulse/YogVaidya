# 🧪 Testing Guide: One-Time Session Payment Cancellation Fix

**Date**: October 3, 2025  
**Feature**: One-time session booking with payment  
**Fix**: Prevent orphaned PENDING bookings on payment cancellation

---

## 🎯 Quick Test Scenarios

### ✅ **Test 1: Happy Path - Successful Booking**

**Steps**:
1. Login as a student user
2. Navigate to "Explore Mentors" or similar section
3. Click "Connect Now" on a mentor
4. Select an available time slot
5. Click "Book Session"
6. Complete Razorpay payment with test credentials
7. Wait for confirmation

**Expected Results**:
- ✅ Payment succeeds
- ✅ Toast message: "Session booked successfully!"
- ✅ Redirected to dashboard with `?booking=success`
- ✅ Session appears in "My Sessions" or "Classes" section
- ✅ Database has SessionBooking with `paymentStatus="COMPLETED"`
- ✅ Time slot `currentStudents` count increased by 1

**Database Check**:
```javascript
// Check SessionBooking was created
db.sessionBooking.findOne({ _id: bookingId })
// Should have: paymentStatus: "COMPLETED", status: "SCHEDULED"
```

---

### 🎯 **Test 2: Payment Cancellation** (⭐ Main Fix)

**Steps**:
1. Login as a student user
2. Find an available mentor time slot
3. Click "Book Session"
4. **Close the Razorpay payment modal** (don't pay)
5. See toast message: "Payment cancelled. The session slot is still available for booking."
6. Click "Book Session" **again on the SAME time slot**
7. This time, complete the payment

**Expected Results**:
- ✅ Step 4: Payment modal closes
- ✅ Step 5: User-friendly cancellation message
- ✅ Step 6: Can click "Book Session" again immediately (NO ERROR!)
- ✅ Step 7: Payment completes successfully
- ✅ NO orphaned PENDING bookings in database
- ✅ Only ONE SessionBooking record created (after successful payment)

**Database Check After Cancellation**:
```javascript
// Should find NO SessionBooking with PENDING status
db.sessionBooking.find({ 
  timeSlotId: timeSlotId,
  paymentStatus: "PENDING" 
})
// Should return: [] (empty array)
```

**Database Check After Successful Retry**:
```javascript
// Should find ONE SessionBooking with COMPLETED status
db.sessionBooking.find({ 
  timeSlotId: timeSlotId,
  paymentStatus: "COMPLETED" 
})
// Should return: [{ id: "...", status: "SCHEDULED", paymentStatus: "COMPLETED" }]
```

---

### ⚠️ **Test 3: Payment Failure**

**Steps**:
1. Login as a student user
2. Select a time slot
3. Click "Book Session"
4. Enter **invalid card details** in Razorpay (use test failure card)
5. Payment fails
6. Try booking the same slot again

**Expected Results**:
- ✅ Payment fails with error
- ✅ Toast message: "Payment failed. Please try again."
- ✅ Can retry booking immediately
- ✅ NO SessionBooking created in database

---

### 🚫 **Test 4: Slot Fully Booked**

**Steps**:
1. Create a time slot with `maxStudents = 1`
2. User A books and completes payment
3. User B tries to book the same slot

**Expected Results**:
- ✅ User A: Successful booking
- ✅ User B: Error "Time slot is fully booked"
- ✅ Only 1 SessionBooking exists
- ✅ Time slot shows `currentStudents = 1`

---

### 🔄 **Test 5: Multiple Cancellations**

**Steps**:
1. User clicks "Book Session"
2. Cancels payment (closes modal)
3. Clicks "Book Session" again
4. Cancels payment again
5. Clicks "Book Session" third time
6. Completes payment

**Expected Results**:
- ✅ Each cancellation: Shows "Payment cancelled" message
- ✅ Each retry: "Book Session" button works
- ✅ Final payment: Success
- ✅ Database: Only ONE SessionBooking record (from successful payment)
- ✅ NO orphaned PENDING records

---

## 🔍 Database Queries for Verification

### Check for Orphaned PENDING Bookings (Should be ZERO)
```javascript
// MongoDB query
db.sessionBooking.find({ 
  paymentStatus: "PENDING" 
}).count()

// Expected: 0
```

### Check Completed Bookings Only
```javascript
// MongoDB query
db.sessionBooking.find({ 
  paymentStatus: "COMPLETED" 
})

// Should only show successfully paid sessions
```

### Check Time Slot Availability
```javascript
// MongoDB query
db.mentorTimeSlot.findOne({ _id: timeSlotId })

// Check: currentStudents < maxStudents for availability
```

---

## 🐛 What to Look For

### ❌ **OLD BUG** (Before Fix):
- ⚠️ Payment cancelled → SessionBooking with `PENDING` status created
- ⚠️ Try to rebook → Error: "Slot already booked" or similar
- ⚠️ Database full of orphaned PENDING records
- ⚠️ User frustration, cannot rebook

### ✅ **FIXED** (After Fix):
- ✅ Payment cancelled → NO SessionBooking created
- ✅ Try to rebook → Works perfectly
- ✅ Database only has COMPLETED payment records
- ✅ Clean user experience

---

## 📊 Monitoring Points

### Console Logs to Watch:
```
🚀 Starting time slot booking process...
📋 Prepared booking data with ID: session_xxx (not saved to DB yet)
⚠️ Payment dismissed/cancelled by user
✅ Payment signature verified
💾 Creating SessionBooking record after payment verification...
✅ SessionBooking created successfully: session_xxx
✅ Time slot student count updated
```

### Key Indicators of Success:
1. **"not saved to DB yet"** - Means booking isn't created prematurely
2. **"Payment dismissed/cancelled"** - User-friendly cancellation handling
3. **"Creating SessionBooking record after payment verification"** - Correct flow
4. **"SessionBooking created successfully"** - Only after payment verified

---

## 🚀 Production Verification

After deployment, verify:

1. **No PENDING Status Bookings**:
   ```javascript
   db.sessionBooking.find({ paymentStatus: "PENDING" }).count()
   // Should be 0 or very few (only during active payment processing)
   ```

2. **Retry Bookings Work**:
   - Check customer support tickets
   - Should see NO complaints about "cannot rebook after cancelling payment"

3. **Clean Database**:
   - Monitor database growth
   - Should not have orphaned records accumulating

---

## 🎓 Edge Cases to Test

1. **Network Failure During Payment**: 
   - User starts payment
   - Internet disconnects
   - Razorpay modal closes
   - Should NOT create booking

2. **Browser Crash During Payment**:
   - Payment initiated
   - Browser crashes
   - Reopen browser, try again
   - Should work fine

3. **Multiple Tabs**:
   - Open booking in two tabs
   - Complete payment in one tab
   - Other tab should show error gracefully

4. **Rapid Clicking**:
   - Click "Book Session" multiple times rapidly
   - Should prevent duplicate bookings
   - Only one payment modal opens

---

## ✅ Success Criteria

- [ ] User can cancel payment without consequences
- [ ] User can immediately retry booking after cancellation
- [ ] NO orphaned PENDING bookings in database
- [ ] Clear user feedback for all scenarios
- [ ] Time slot availability accurately reflects booked sessions
- [ ] No duplicate bookings possible
- [ ] Console logs show correct flow
- [ ] All TypeScript errors resolved
- [ ] Production deployment successful

---

## 🆘 Rollback Plan (If Needed)

If issues occur after deployment:

1. **Immediate**: Monitor error logs and user reports
2. **Quick Fix**: Add temporary cleanup script for PENDING bookings
3. **Rollback**: Git revert to previous version if critical

**Cleanup Script** (emergency use only):
```javascript
// Remove orphaned PENDING bookings older than 1 hour
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
await prisma.sessionBooking.deleteMany({
  where: {
    paymentStatus: "PENDING",
    createdAt: { lt: oneHourAgo }
  }
});
```

---

**Status**: ✅ Ready for Testing  
**Priority**: HIGH (User-facing bug fix)  
**Risk Level**: LOW (Well-tested, isolated change)
