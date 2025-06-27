import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import Razorpay from 'razorpay';
import type { RenewalResult } from '@/lib/types';

const prisma = new PrismaClient();

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function GET(request: Request): Promise<NextResponse<RenewalResult>> {
  // Simple auth check
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ 
      success: false, 
      error: 'Unauthorized' 
    }, { status: 401 });
  }

  try {
    // Find users due for renewal today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const usersDue = await prisma.user.findMany({
      where: {
        nextBillingDate: { gte: today, lt: tomorrow },
        subscriptionStatus: 'ACTIVE',
        autoRenewal: true,
        razorpaySubscriptionId: { not: null }, // Only users with Razorpay subscriptions
      },
      select: {
        id: true,
        email: true,
        name: true,
        billingPeriod: true,
        nextBillingDate: true,
        razorpaySubscriptionId: true,
        subscriptionPlan: true,
      }
    });

    let renewed = 0;
    let errors: string[] = [];
    
    // Process each user for renewal
    for (const user of usersDue) {
      try {
        console.log(`Processing renewal for user: ${user.email} (${user.id})`);
        
        // Activate subscription in Razorpay first
        if (user.razorpaySubscriptionId) {
          try {
            // Check current subscription status
            const razorpaySubscription = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
            console.log(`Razorpay subscription ${user.razorpaySubscriptionId} status: ${razorpaySubscription.status}`);
            
            // If subscription is not active, try to resume/activate it
            if (razorpaySubscription.status !== 'active') {
              if (razorpaySubscription.status === 'created') {
                // For subscriptions in 'created' state, we need to activate them
                // This typically happens by making the first charge or updating the subscription
                console.log(`Activating subscription in 'created' state for user: ${user.email}`);
                
                // Try to resume the subscription to activate it
                try {
                  await razorpay.subscriptions.resume(user.razorpaySubscriptionId, {
                    resume_at: 'now'
                  });
                  console.log(`Activated Razorpay subscription for user: ${user.email}`);
                } catch (resumeError) {
                  // If resume doesn't work for created state, that's normal
                  console.log(`Subscription in created state for user: ${user.email} - will be activated on next charge`);
                }
              } else if (razorpaySubscription.status === 'halted') {
                // Resume halted subscription
                await razorpay.subscriptions.resume(user.razorpaySubscriptionId, {
                  resume_at: 'now'
                });
                console.log(`Resumed halted Razorpay subscription for user: ${user.email}`);
              } else if (razorpaySubscription.status === 'cancelled') {
                console.warn(`Cannot activate cancelled subscription for user: ${user.email}`);
                errors.push(`User ${user.email}: Subscription is cancelled in Razorpay`);
                continue;
              } else {
                console.warn(`Subscription status '${razorpaySubscription.status}' for user: ${user.email} - proceeding with database renewal`);
              }
            } else {
              console.log(`Subscription already active for user: ${user.email}`);
            }
          } catch (razorpayError) {
            console.error(`Razorpay error for user ${user.email}:`, razorpayError);
            errors.push(`User ${user.email}: Razorpay activation failed - ${razorpayError instanceof Error ? razorpayError.message : 'Unknown error'}`);
            continue;
          }
        }

        // Calculate next billing date
        const nextBilling = new Date(user.nextBillingDate!);
        if (user.billingPeriod === 'monthly') {
          nextBilling.setMonth(nextBilling.getMonth() + 1);
        } else if (user.billingPeriod === 'annual') {
          nextBilling.setFullYear(nextBilling.getFullYear() + 1);
        }

        // Update database with renewal information
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionStatus: 'ACTIVE', // Ensure status is active
            nextBillingDate: nextBilling,
            lastPaymentDate: new Date(),
            updatedAt: new Date(),
          },
        });

        // Final verification: Check if Razorpay subscription is now active
        let finalVerificationStatus = 'unknown';
        if (user.razorpaySubscriptionId) {
          try {
            const finalCheck = await razorpay.subscriptions.fetch(user.razorpaySubscriptionId);
            finalVerificationStatus = finalCheck.status;
            
            if (finalCheck.status !== 'active') {
              console.warn(`WARNING: Subscription for user ${user.email} is not active after renewal. Status: ${finalCheck.status}`);
              errors.push(`User ${user.email}: Subscription not active after renewal - status: ${finalCheck.status}`);
            } else {
              console.log(`✓ Verified: Subscription is active for user ${user.email}`);
            }
          } catch (verificationError) {
            console.error(`Failed to verify subscription status for user ${user.email}:`, verificationError);
            errors.push(`User ${user.email}: Failed to verify final subscription status`);
          }
        }

        // Log successful renewal to console
        console.log(`Successfully renewed subscription for user: ${user.email}`, {
          userId: user.id,
          email: user.email,
          subscriptionPlan: user.subscriptionPlan,
          billingPeriod: user.billingPeriod,
          nextBillingDate: nextBilling.toISOString(),
          razorpaySubscriptionId: user.razorpaySubscriptionId,
          finalRazorpayStatus: finalVerificationStatus,
          renewedAt: new Date().toISOString(),
        });
        
        renewed++;
        
      } catch (userError) {
        console.error(`Failed to renew subscription for user ${user.email}:`, userError);
        errors.push(`User ${user.email}: ${userError instanceof Error ? userError.message : 'Unknown error'}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Renewed ${renewed} subscriptions${errors.length > 0 ? ` with ${errors.length} errors` : ''}`,
      renewed,
      errors: errors.length > 0 ? errors : undefined
    });
    
  } catch (error) {
    console.error('Simple renewal failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse<RenewalResult>> {
  return GET(request);
}
