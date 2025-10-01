const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cursorFix() {
  console.log('🔧 Using cursor aggregation to fix date...\n');
  
  try {
    // Use aggregation with cursor
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
      ],
      cursor: {}
    });
    
    console.log('Aggregation result:', result);
    
  } catch (error) {
    console.error('Error in cursor aggregation:', error);
    
    // Try direct updateOne approach
    console.log('\n🔧 Trying updateOne approach...');
    
    try {
      const updateResult = await prisma.$runCommandRaw({
        updateOne: 'sessionBooking',
        filter: { updatedAt: { $type: "string" } },
        update: [{
          $set: {
            updatedAt: { $dateFromString: { dateString: "$updatedAt" } }
          }
        }]
      });
      
      console.log('UpdateOne result:', updateResult);
      
    } catch (updateError) {
      console.error('UpdateOne also failed:', updateError);
      
      // Final approach: use bulkWrite
      console.log('\n🔧 Final approach - using bulkWrite...');
      
      try {
        // First get the document
        const sessionResult = await prisma.$runCommandRaw({
          find: 'sessionBooking',
          filter: { updatedAt: { $type: "string" } }
        });
        
        if (sessionResult && 
            typeof sessionResult === 'object' && 
            'cursor' in sessionResult &&
            sessionResult.cursor &&
            typeof sessionResult.cursor === 'object' &&
            'firstBatch' in sessionResult.cursor &&
            Array.isArray(sessionResult.cursor.firstBatch) &&
            sessionResult.cursor.firstBatch.length > 0) {
          
          const session = sessionResult.cursor.firstBatch[0];
          const newDate = new Date(session.updatedAt);
          
          console.log(`Converting string "${session.updatedAt}" to Date: ${newDate.toISOString()}`);
          
          const bulkResult = await prisma.$runCommandRaw({
            bulkWrite: 'sessionBooking',
            requests: [{
              updateOne: {
                filter: { _id: session._id },
                update: { $set: { updatedAt: newDate } }
              }
            }]
          });
          
          console.log('BulkWrite result:', bulkResult);
        }
        
      } catch (bulkError) {
        console.error('BulkWrite also failed:', bulkError);
      }
    }
  }
  
  // Final verification
  try {
    console.log('\n🔍 Final verification...');
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
      
      console.log(`Found ${verification.cursor.firstBatch.length} sessions with string updatedAt`);
      
      if (verification.cursor.firstBatch.length === 0) {
        console.log('🎉 Success! All string dates have been converted!');
      }
    }
  } catch (verifyError) {
    console.error('Verification error:', verifyError);
  } finally {
    await prisma.$disconnect();
  }
}

cursorFix();