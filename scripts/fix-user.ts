/**
 * Simple script to fix the single expired trial user
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixExpiredTrialUser() {
  try {
    console.log('🔧 Fixing expired trial user...');
    
    // Find the user with expired trial
    const user = await prisma.user.findFirst({
      where: {
        trialEndDate: {
          not: null,
          lt: new Date()
        }
      }
    });

    if (!user) {
      console.log('❌ No expired trial user found');
      return;
    }

    console.log(`👤 Found user: ${user.email}`);
    console.log(`   Trial ended: ${user.trialEndDate?.toLocaleDateString()}`);
    console.log(`   Current plan: ${user.subscriptionPlan}`);

    // Clear all subscription data
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isTrialActive: false,
        subscriptionStatus: 'INACTIVE',
        trialEndDate: null,
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
      }
    });

    console.log('✅ User fixed! They will now appear as a new user without subscription.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExpiredTrialUser();
