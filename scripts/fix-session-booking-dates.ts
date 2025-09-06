import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSessionBookingDates() {
  try {
    console.log('🔧 Starting to fix SessionBooking date fields...');
    
    // Use Prisma's raw database access to fix string dates
    const result = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { scheduledAt: { $type: "string" } },
          u: [
            {
              $set: {
                scheduledAt: {
                  $dateFromString: {
                    dateString: "$scheduledAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    
    console.log('✅ Fixed scheduledAt fields:', result);
    
    // Fix createdAt fields if they are strings
    const createdAtResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { createdAt: { $type: "string" } },
          u: [
            {
              $set: {
                createdAt: {
                  $dateFromString: {
                    dateString: "$createdAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    
    console.log('✅ Fixed createdAt fields:', createdAtResult);
    
    // Fix updatedAt fields if they are strings
    const updatedAtResult = await prisma.$runCommandRaw({
      update: 'sessionBooking',
      updates: [
        {
          q: { updatedAt: { $type: "string" } },
          u: [
            {
              $set: {
                updatedAt: {
                  $dateFromString: {
                    dateString: "$updatedAt"
                  }
                }
              }
            }
          ],
          multi: true
        }
      ]
    });
    
    console.log('✅ Fixed updatedAt fields:', updatedAtResult);
    
    // Verify the fix by counting remaining string dates
    const remainingStringDates = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        {
          $match: {
            $or: [
              { scheduledAt: { $type: "string" } },
              { createdAt: { $type: "string" } },
              { updatedAt: { $type: "string" } }
            ]
          }
        },
        {
          $count: "total"
        }
      ],
      cursor: {}
    });
    
    console.log('🔍 Remaining documents with string dates:', remainingStringDates);
    console.log('🎉 Date conversion completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing session booking dates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Prisma connection closed');
  }
}

// Run the script
fixSessionBookingDates()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
