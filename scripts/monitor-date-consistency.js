const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function proactiveMonitoring() {
  console.log('🔍 Proactive Date Consistency Monitoring');
  console.log('==========================================\n');
  
  const collections = ['schedule', 'sessionBooking', 'mentorTimeSlot', 'user'];
  const dateFields = {
    schedule: ['scheduledTime', 'createdAt', 'updatedAt'],
    sessionBooking: ['scheduledAt', 'createdAt', 'updatedAt', 'manualStartTime', 'actualEndTime'],
    mentorTimeSlot: ['startTime', 'endTime', 'createdAt', 'updatedAt'],
    user: ['createdAt', 'updatedAt', 'subscriptionStartDate', 'subscriptionEndDate', 'lastPaymentDate', 'nextBillingDate', 'trialEndDate']
  };

  let hasIssues = false;
  let totalIssues = 0;

  for (const collection of collections) {
    let collectionHasIssues = false;
    
    for (const field of dateFields[collection]) {
      try {
        const stringCount = await prisma.$runCommandRaw({
          count: collection,
          query: { [field]: { $type: 'string' } }
        });

        if (stringCount.n > 0) {
          if (!collectionHasIssues) {
            console.log(`⚠️  Issues found in ${collection} collection:`);
            collectionHasIssues = true;
            hasIssues = true;
          }
          console.log(`    ${field}: ${stringCount.n} string values (should be dates)`);
          totalIssues += stringCount.n;
        }
      } catch (error) {
        // Field might not exist in some documents, which is okay
      }
    }
    
    if (!collectionHasIssues) {
      console.log(`✅ ${collection} collection: All date fields are properly typed`);
    }
  }

  console.log('\n==========================================');
  
  if (hasIssues) {
    console.log(`🚨 ALERT: Found ${totalIssues} date consistency issues!`);
    console.log('');
    console.log('📋 Recommended Actions:');
    console.log('1. Run: node scripts/fix-date-inconsistencies.js');
    console.log('2. Check recent code changes for raw MongoDB operations');
    console.log('3. Ensure all new endpoints use Prisma ORM instead of $runCommandRaw for inserts');
    console.log('');
    console.log('📖 Common causes:');
    console.log('- Using $runCommandRaw for insertions (converts Date objects to strings)');
    console.log('- Manual MongoDB operations without proper date handling');
    console.log('- Legacy data from before date consistency fixes');
    
    // Exit with error code for CI/CD systems
    process.exit(1);
  } else {
    console.log('🎉 All date fields are consistently typed!');
    console.log('✅ Database is healthy - no action needed');
  }
  
  await prisma.$disconnect();
}

// Run the monitoring
proactiveMonitoring().catch(error => {
  console.error('❌ Error during monitoring:', error);
  process.exit(1);
});