import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@/lib/config/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is moderator or admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || (user.role !== 'MODERATOR' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { userId, extendDays } = await req.json();

    if (!userId || !extendDays) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID and extend days are required' 
      }, { status: 400 });
    }

    // Limit extension days for moderators
    if (user.role === 'MODERATOR' && extendDays > 30) {
      return NextResponse.json({ 
        success: false, 
        error: 'Moderators can only extend trials up to 30 days' 
      }, { status: 400 });
    }

    // Get current user data
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        isTrialActive: true,
        trialEndDate: true,
        trialUsed: true
      }
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    // Only allow modifying customer accounts (USER role)
    if (targetUser.role !== 'USER') {
      return NextResponse.json({ 
        success: false, 
        error: 'Can only modify customer accounts' 
      }, { status: 403 });
    }

    // Calculate new trial end date
    let newTrialEndDate: Date;
    
    if (targetUser.isTrialActive && targetUser.trialEndDate) {
      // Extend existing trial
      newTrialEndDate = new Date(targetUser.trialEndDate);
      newTrialEndDate.setDate(newTrialEndDate.getDate() + extendDays);
    } else {
      // Start new trial or extend expired trial
      newTrialEndDate = new Date();
      newTrialEndDate.setDate(newTrialEndDate.getDate() + extendDays);
    }

    // Update the user with extended trial
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isTrialActive: true,
        trialEndDate: newTrialEndDate,
        trialUsed: true, // Mark that trial has been used
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        isTrialActive: true,
        trialEndDate: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: `Trial extended by ${extendDays} days until ${newTrialEndDate.toLocaleDateString('en-IN')}`
    });

  } catch (error) {
    console.error('Error extending trial:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to extend trial' 
    }, { status: 500 });
  }
}
