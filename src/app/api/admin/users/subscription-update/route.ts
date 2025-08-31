import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/config/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { userId, subscriptionPlan, subscriptionStatus, billingPeriod, autoRenewal } = await req.json();

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    // Build update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (subscriptionPlan !== undefined) {
      updateData.subscriptionPlan = subscriptionPlan || null;
    }

    if (subscriptionStatus !== undefined) {
      updateData.subscriptionStatus = subscriptionStatus || null;
    }

    if (billingPeriod !== undefined) {
      updateData.billingPeriod = billingPeriod || null;
    }

    if (autoRenewal !== undefined) {
      updateData.autoRenewal = autoRenewal;
    }

    // If setting a new subscription plan, set start date
    if (subscriptionPlan && subscriptionStatus === 'ACTIVE') {
      updateData.subscriptionStartDate = new Date();
      
      // Set end date based on billing period
      const endDate = new Date();
      if (billingPeriod === 'annual') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }
      updateData.subscriptionEndDate = endDate;
      updateData.nextBillingDate = endDate;
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        billingPeriod: true,
        autoRenewal: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser 
    });

  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update subscription' 
    }, { status: 500 });
  }
}
