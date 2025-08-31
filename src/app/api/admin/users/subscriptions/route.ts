import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/config/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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

    // Fetch all users with subscription data
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        billingPeriod: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        trialUsed: true,
        isTrialActive: true,
        trialEndDate: true,
        paymentAmount: true,
        autoRenewal: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter to only show actual customers (USER role)
    const filteredUsers = users.filter((u) => u.role === 'USER');

    return NextResponse.json({ 
      success: true, 
      users: filteredUsers 
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch user subscriptions' 
    }, { status: 500 });
  }
}
