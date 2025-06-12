// create a razorpay instance and export it
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import type { Subscriptions } from "razorpay/dist/types/subscriptions";

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req: NextRequest) {
    // Check if user is authenticated
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const subscription: Subscriptions.RazorpaySubscription = await razorpay.subscriptions.create({
        plan_id: process.env.PLAN_ID!,
        customer_notify: true,
        // quantity: 1,
        total_count: 12,
        // start_at: 1495995837,
        expire_by: Math.floor(Date.now() / 1000) + 31536000,

    });
    console.log(subscription);

    // If you want to redirect:
    return NextResponse.json({
        success: true,
        subscription,
    });
}
