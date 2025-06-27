# 🚀 YogVaidya Subscription Renewal - Vercel Cron

## ✅ Simple Automated Renewal System

### What It Does
- **Runs daily at 9:00 AM** automatically
- **Finds users** whose subscriptions are due today
- **Extends billing dates** by one billing period (monthly/annual)
- **Updates database** with new renewal dates
- **Zero maintenance** required

---

## 🔧 How It Works

1. **Daily Check**: Vercel Cron triggers at 9 AM daily
2. **Find Due Users**: Queries users with `nextBillingDate = today`
3. **Check Razorpay Status**: Verifies subscription status in Razorpay
4. **Activate Subscriptions**: Handles "created" state subscriptions and activates them
5. **Extend Billing**: Extends their subscription by one period
6. **Update Database**: Records new billing date and ensures status is ACTIVE
7. **Done**: Users continue with active subscriptions

---

## 🚀 Setup (2 Steps)

### 1. Deploy to Vercel
```bash
vercel --prod
```

### 2. Add Environment Variables
In your Vercel dashboard, add:
```
CRON_SECRET=simple_secret_123
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**That's it!** The system will automatically run daily renewals.

---

## 🧪 Testing

### Test Endpoint Manually
```bash
curl -X POST "https://your-app.vercel.app/api/cron/subscription-renewal" \
  -H "Authorization: Bearer simple_secret_123"
```

### Check Renewal Status
```bash
curl "https://your-app.vercel.app/api/test/renewal"
```

---

## 📁 Files Included

- **`/api/cron/subscription-renewal`** - Main renewal endpoint with Razorpay integration
- **`/api/test/renewal`** - Test endpoint for checking renewal stats
- **`/api/test/razorpay-status`** - Test endpoint for checking Razorpay subscription statuses
- **`vercel.json`** - Cron configuration
- **`/components/admin/SimpleRenewalDashboard`** - Admin panel component

---

## 🎯 Admin Panel Usage

Add to your admin dashboard:
```tsx
import { SimpleRenewalDashboard } from '@/components/admin/SimpleRenewalDashboard';

export default function AdminPage() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <SimpleRenewalDashboard />
    </div>
  );
}
```

---

## 🔒 Security

- ✅ API protected with Bearer token
- ✅ Environment variables secured
- ✅ Only processes users with `autoRenewal: true`
- ✅ Logs all activities for monitoring

---

## 📊 Monitoring

Check Vercel function logs to monitor:
- Number of renewals processed daily
- Any errors or failures
- Execution time and performance

**Your subscription renewal system is ready!** 🎉
