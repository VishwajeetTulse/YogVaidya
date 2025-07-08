const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixTrialHistory() {
  try {
    console.log('🔧 Fixing trial history for users who had trials but trialEndDate was cleared...');
    
    // Update users who have trialUsed: true but trialEndDate: null
    // This preserves the fact that they had a trial
    const result = await prisma.user.updateMany({
      where: {
        trialUsed: true,
        trialEndDate: null
      },
      data: {
        // Set trialEndDate to yesterday to show they had a trial that expired
        trialEndDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        updatedAt: new Date()
      }
    });

    console.log(`✅ DONE! Updated ${result.count} users to have proper trial history!`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixTrialHistory();
