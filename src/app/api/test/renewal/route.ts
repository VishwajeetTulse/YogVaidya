import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { RenewalStats } from '@/lib/types';

const prisma = new PrismaClient();

export async function GET(): Promise<NextResponse<{ success: boolean; data?: RenewalStats; error?: string }>> {
  try {
    // Quick test of the renewal logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Count users due for renewal
    const dueCount = await prisma.user.count({
      where: {
        nextBillingDate: { gte: today, lt: tomorrow },
        subscriptionStatus: 'ACTIVE',
        autoRenewal: true,
      }
    });

    // Count total active subscriptions
    const activeCount = await prisma.user.count({
      where: {
        subscriptionStatus: 'ACTIVE'
      }
    });

    // Count users with Razorpay subscriptions
    const razorpayCount = await prisma.user.count({
      where: {
        razorpaySubscriptionId: { not: null }
      }
    });

    const stats: RenewalStats = {
      usersDueToday: dueCount,
      totalActiveSubscriptions: activeCount,
      usersWithRazorpaySubscriptions: razorpayCount,
      testDate: today.toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
