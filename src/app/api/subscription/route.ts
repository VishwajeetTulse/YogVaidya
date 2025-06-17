// create a razorpay instance and export it
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { auth } from '@/lib/auth';
import { NextRequest } from 'next/server';
import type { Subscriptions } from "razorpay/dist/types/subscriptions";
import type { BillingPeriod } from '@/lib/types';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

import { getPlanIds } from '@/lib/subscriptions';

export async function POST(req: NextRequest) {
    try {
        // Check if user is authenticated
        const session = await auth.api.getSession({ headers: req.headers });
        if (!session) {
            return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
        }        const { plan = 'bloom', billingPeriod = 'monthly' } = await req.json();

        // Validate plan and billing period
        if (!plan || !['seed', 'bloom', 'flourish'].includes(plan)) {
            return NextResponse.json(
                { success: false, message: 'Invalid plan selected' },
                { status: 400 }
            );
        }

        if (!['monthly', 'annual'].includes(billingPeriod)) {
            return NextResponse.json(
                { success: false, message: 'Invalid billing period' },
                { status: 400 }
            );
        }

        const planIds = await getPlanIds();
        const planId = planIds[plan.toUpperCase() as keyof typeof planIds]?.[billingPeriod as BillingPeriod];
        
        if (!planId) {
            return NextResponse.json(
                { success: false, message: 'Plan configuration not found' },
                { status: 400 }
            );
        }

        const subscription: Subscriptions.RazorpaySubscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: true,
            total_count: billingPeriod === 'annual' ? 12 : 1,
            expire_by: Math.floor(Date.now() / 1000) + (billingPeriod === 'annual' ? 31536000 : 2592000), // 1 year or 30 days
            notes: {
                plan_type: plan,
                billing_period: billingPeriod,
                user_id: session.user.id
            }
        });

        return NextResponse.json({
            success: true,
            subscription,
        });
    } catch (error) {
        console.error('Subscription creation error:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to create subscription' },
            { status: 500 }
        );
    }
}
