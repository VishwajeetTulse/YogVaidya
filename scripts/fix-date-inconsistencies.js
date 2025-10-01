const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function auditDateFields() {
  console.log('🔍 Auditing date field inconsistencies...\n');
  
  const collections = ['schedule', 'sessionBooking', 'mentorTimeSlot', 'user'];
  const dateFields = {
    schedule: ['scheduledTime', 'createdAt', 'updatedAt'],
    sessionBooking: ['scheduledAt', 'createdAt', 'updatedAt', 'manualStartTime', 'actualEndTime'],
    mentorTimeSlot: ['startTime', 'endTime', 'createdAt', 'updatedAt'],
    user: ['createdAt', 'updatedAt', 'subscriptionStartDate', 'subscriptionEndDate', 'lastPaymentDate', 'nextBillingDate', 'trialEndDate']
  };

  let totalInconsistencies = 0;

  for (const collection of collections) {
    console.log(`📊 Checking ${collection} collection:`);
    
    for (const field of dateFields[collection]) {
      try {
        // Count string dates
        const stringCount = await prisma.$runCommandRaw({
          count: collection,
          query: { [field]: { $type: "string" } }
        });
        
        // Count proper dates
        const dateCount = await prisma.$runCommandRaw({
          count: collection,
          query: { [field]: { $type: "date" } }
        });

        if (stringCount.n > 0) {
          console.log(`  ⚠️  ${field}: ${stringCount.n} string values, ${dateCount.n} proper dates`);
          totalInconsistencies += stringCount.n;
        } else {
          console.log(`  ✅ ${field}: ${dateCount.n} proper dates (no issues)`);
        }
      } catch (error) {
        console.log(`  ❓ ${field}: Could not check (field may not exist)`);
      }
    }
    console.log('');
  }

  console.log(`📈 Total inconsistencies found: ${totalInconsistencies}`);
  return totalInconsistencies;
}

async function fixDateInconsistencies() {
  try {
    console.log('🔧 Starting to fix date field inconsistencies...\n');
    
    // First audit to see what we're dealing with
    const inconsistencies = await auditDateFields();
    
    if (inconsistencies === 0) {
      console.log('🎉 No date inconsistencies found! All fields are properly typed.');
      return;
    }

    console.log('\n🚀 Proceeding with fixes...\n');
    
    const collections = [
      {
        name: 'schedule',
        fields: ['scheduledTime', 'createdAt', 'updatedAt']
      },
      {
        name: 'sessionBooking', 
        fields: ['scheduledAt', 'createdAt', 'updatedAt', 'manualStartTime', 'actualEndTime']
      },
      {
        name: 'mentorTimeSlot',
        fields: ['startTime', 'endTime', 'createdAt', 'updatedAt']
      },
      {
        name: 'user',
        fields: ['createdAt', 'updatedAt', 'subscriptionStartDate', 'subscriptionEndDate', 'lastPaymentDate', 'nextBillingDate', 'trialEndDate']
      }
    ];

    for (const collection of collections) {
      console.log(`📅 Fixing ${collection.name} collection...`);
      
      for (const field of collection.fields) {
        try {
          const result = await prisma.$runCommandRaw({
            update: collection.name,
            updates: [
              {
                q: { [field]: { $type: "string" } },
                u: [
                  {
                    $set: {
                      [field]: {
                        $cond: {
                          if: { $eq: [`$${field}`, null] },
                          then: null,
                          else: {
                            $dateFromString: {
                              dateString: `$${field}`,
                              onError: null,
                              onNull: null
                            }
                          }
                        }
                      }
                    }
                  }
                ],
                multi: true
              }
            ]
          });
          
          if (result.nModified && result.nModified > 0) {
            console.log(`  ✅ Fixed ${result.nModified} records for ${field}`);
          } else {
            console.log(`  ℹ️  No string values found for ${field}`);
          }
        } catch (error) {
          console.log(`  ❌ Error fixing ${field}:`, error.message);
        }
      }
      console.log('');
    }

    console.log('🔍 Final audit after fixes...\n');
    await auditDateFields();
    
    console.log('🎉 Date field fix process completed!');
    
  } catch (error) {
    console.error('❌ Error during fix process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the audit and fix
fixDateInconsistencies();