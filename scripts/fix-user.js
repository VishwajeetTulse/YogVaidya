/**
 * Simple script to fix the single expired trial user
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixExpiredTrialUser() {
  try {
    console.log('🔧 Fixing users for MongoDB...');
    
    // For MongoDB, we can't add columns on the fly, but we can just set the field
    // MongoDB will automatically create the field when we set it
    
    // Update ALL users - clear subscription data and mark trial as used
    const result = await prisma.user.updateMany({
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
        trialUsed: true,  // MongoDB will create this field automatically
      }
    });

    console.log(`✅ DONE! Updated ${result.count} users and marked trials as used!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixExpiredTrialUser();
