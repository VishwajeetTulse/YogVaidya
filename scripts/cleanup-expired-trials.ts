/**
 * TypeScript version of the cleanup script
 * Script to clean up expired trial users
 */

import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface ExpiredTrialUser {
  id: string;
  email: string;
  name: string | null;
  isTrialActive: boolean | null;
  trialEndDate: Date | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate: Date | null;
  createdAt: Date;
}

async function cleanupExpiredTrials(): Promise<void> {
  console.log('🧹 Starting cleanup of expired trial users...');
  
  try {
    // Find users with expired trials that still have subscription details
    const expiredTrialUsers: ExpiredTrialUser[] = await prisma.user.findMany({
      where: {
        AND: [
          {
            trialEndDate: {
              not: null,
              lt: new Date() // Trial end date is in the past
            }
          },
          {
            OR: [
              { isTrialActive: true }, // Still marked as trial active
              { subscriptionPlan: { not: null } }, // Still has subscription plan
              { subscriptionStatus: { not: 'INACTIVE' } } // Status is not inactive
            ]
          }
        ]
      },
      select: {
        id: true,
        email: true,
        name: true,
        isTrialActive: true,
        trialEndDate: true,
        subscriptionPlan: true,
        subscriptionStatus: true,
        subscriptionStartDate: true,
        createdAt: true
      }
    });

    console.log(`📊 Found ${expiredTrialUsers.length} users with expired trials to clean up`);

    if (expiredTrialUsers.length === 0) {
      console.log('✅ No expired trial users found that need cleanup');
      return;
    }

    // Display users that will be updated
    console.log('\n👥 Users to be updated:');
    expiredTrialUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.name || 'No name'}) - Trial ended: ${user.trialEndDate?.toLocaleDateString()}`);
      console.log(`   Current plan: ${user.subscriptionPlan || 'None'}, Status: ${user.subscriptionStatus || 'None'}`);
    });

    // Ask for confirmation in production
    if (process.env.NODE_ENV === 'production') {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const confirmation = await new Promise<string>((resolve) => {
        rl.question('\n⚠️  This will update these users in PRODUCTION. Type "YES" to continue: ', (answer) => {
          rl.close();
          resolve(answer);
        });
      });

      if (confirmation !== 'YES') {
        console.log('❌ Operation cancelled by user');
        return;
      }
    }

    // Update users in batches
    const batchSize = 10;
    let updated = 0;
    let errors = 0;

    for (let i = 0; i < expiredTrialUsers.length; i += batchSize) {
      const batch = expiredTrialUsers.slice(i, i + batchSize);
      
      console.log(`\n🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(expiredTrialUsers.length / batchSize)}`);
      
      for (const user of batch) {
        try {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              // Mark trial as inactive
              isTrialActive: false,
              subscriptionStatus: 'INACTIVE',
              trialEndDate: null,
              
              // Clear all subscription details
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
          
          console.log(`✅ Updated: ${user.email}`);
          updated++;
        } catch (error) {
          console.error(`❌ Failed to update ${user.email}:`, error instanceof Error ? error.message : String(error));
          errors++;
        }
      }
    }

    console.log('\n📈 Cleanup Summary:');
    console.log(`✅ Successfully updated: ${updated} users`);
    console.log(`❌ Errors: ${errors} users`);
    console.log(`📊 Total processed: ${expiredTrialUsers.length} users`);

    if (errors === 0) {
      console.log('\n🎉 All expired trial users have been successfully cleaned up!');
    } else {
      console.log('\n⚠️  Some users could not be updated. Please check the errors above.');
    }

  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    throw error;
  }
}

async function verifyCleanup(): Promise<void> {
  console.log('\n🔍 Verifying cleanup...');
  
  try {
    // Check if there are still users with problematic states
    const remainingIssues = await prisma.user.findMany({
      where: {
        AND: [
          {
            trialEndDate: {
              not: null,
              lt: new Date()
            }
          },
          {
            OR: [
              { isTrialActive: true },
              { subscriptionPlan: { not: null } },
              { subscriptionStatus: { not: 'INACTIVE' } }
            ]
          }
        ]
      },
      select: {
        email: true,
        isTrialActive: true,
        subscriptionPlan: true,
        subscriptionStatus: true
      }
    });

    if (remainingIssues.length === 0) {
      console.log('✅ Verification passed: No remaining issues found');
    } else {
      console.log(`⚠️  Verification found ${remainingIssues.length} users still with issues:`);
      remainingIssues.forEach(user => {
        console.log(`   ${user.email}: Plan=${user.subscriptionPlan}, Status=${user.subscriptionStatus}, TrialActive=${user.isTrialActive}`);
      });
    }
  } catch (error) {
    console.error('Error during verification:', error);
  }
}

async function main(): Promise<void> {
  try {
    await cleanupExpiredTrials();
    await verifyCleanup();
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { cleanupExpiredTrials, verifyCleanup };
