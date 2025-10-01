const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function aggregationFix() {
  console.log('🔧 Using aggregation pipeline to fix date...\n');
  
  try {
    // Use aggregation pipeline with $merge to update the document
    const result = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        {
          $match: { updatedAt: { $type: "string" } }
        },
        {
          $addFields: {
            updatedAt: { $dateFromString: { dateString: "$updatedAt" } }
          }
        },
        {
          $merge: {
            into: "sessionBooking",
            whenMatched: "replace"
          }
        }
      ]
    });
    
    console.log('Aggregation result:', result);
    
    // Verify the fix
    console.log('\n🔍 Verification...');
    const verification = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (verification && 
        typeof verification === 'object' && 
        'cursor' in verification &&
        verification.cursor &&
        typeof verification.cursor === 'object' &&
        'firstBatch' in verification.cursor &&
        Array.isArray(verification.cursor.firstBatch)) {
      
      console.log(`✅ Found ${verification.cursor.firstBatch.length} sessions with string updatedAt after fix`);
      
      if (verification.cursor.firstBatch.length === 0) {
        console.log('🎉 All string dates have been successfully converted!');
      }
    }
    
  } catch (error) {
    console.error('Error in aggregation fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

aggregationFix();