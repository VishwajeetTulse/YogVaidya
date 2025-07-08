import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/config/auth';
import { prisma } from '@/lib/config/prisma';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    // Verify that the user can only update their own trial status
    if (email !== session.user.email) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Find the user and check if trial has actually expired
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        isTrialActive: true,
        trialEndDate: true,
        subscriptionStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if trial is actually expired
    const now = new Date();
    const isTrialExpired = user.isTrialActive && 
      user.trialEndDate && 
      now >= new Date(user.trialEndDate);

    if (!isTrialExpired) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Trial is not expired or user is not in trial period',
          currentStatus: {
            isTrialActive: user.isTrialActive,
            trialEndDate: user.trialEndDate,
            subscriptionStatus: user.subscriptionStatus
          }
        },
        { status: 400 }
      );
    }

    // Update the user's trial status and clear subscription details
    const updatedUser = await prisma.user.update({
      where: { email },
      data: {
        isTrialActive: false,
        subscriptionStatus: 'INACTIVE',
        subscriptionPlan: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null,
        nextBillingDate: null,
        billingPeriod: null,
        razorpaySubscriptionId: null,
        razorpayCustomerId: null,
        lastPaymentDate: null,
        paymentAmount: null,
        autoRenewal: null,
      },
      select: {
        id: true,
        isTrialActive: true,
        trialEndDate: true,
        subscriptionStatus: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        message: 'Trial status updated successfully',
        updatedUser
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating trial status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
