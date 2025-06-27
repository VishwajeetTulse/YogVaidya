import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET() {
  try {
    // Get users with Razorpay subscriptions
    const users = await prisma.user.findMany({
      where: {
        razorpaySubscriptionId: { not: null },
      },
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        billingPeriod: true,
        nextBillingDate: true,
        razorpaySubscriptionId: true,
        autoRenewal: true,
      },
      take: 5, // Limit to 5 users for testing
    });

    const subscriptionStatuses = [];

    for (const user of users) {
      try {
        if (user.razorpaySubscriptionId) {
          const razorpaySubscription = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
          
          subscriptionStatuses.push({
            email: user.email,
            name: user.name,
            databaseStatus: user.subscriptionStatus,
            razorpayStatus: razorpaySubscription.status,
            subscriptionPlan: user.subscriptionPlan,
            billingPeriod: user.billingPeriod,
            nextBillingDate: user.nextBillingDate,
            autoRenewal: user.autoRenewal,
            razorpaySubscriptionId: user.razorpaySubscriptionId,
          });
        }
      } catch (razorpayError) {
        subscriptionStatuses.push({
          email: user.email,
          name: user.name,
          databaseStatus: user.subscriptionStatus,
          razorpayStatus: 'ERROR',
          error: razorpayError instanceof Error ? razorpayError.message : 'Unknown error',
          razorpaySubscriptionId: user.razorpaySubscriptionId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      totalUsers: users.length,
      subscriptions: subscriptionStatuses,
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
