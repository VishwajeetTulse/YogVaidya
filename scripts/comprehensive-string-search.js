const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveStringDateSearch() {
  console.log('🔍 Comprehensive String Date Search\n');
  
  try {
    const collections = ['sessionBooking', 'mentorTimeSlot', 'schedule', 'user'];
    const dateFields = ['createdAt', 'updatedAt', 'scheduledAt', 'startTime', 'endTime', 'trialStartDate', 'trialEndDate', 'subscriptionStartDate', 'subscriptionEndDate', 'manualStartTime', 'actualEndTime'];
    
    for (const collection of collections) {
      console.log(`📋 Checking ${collection} collection:`);
      
      for (const field of dateFields) {
        try {
          const result = await prisma.$runCommandRaw({
            find: collection,
            filter: { [field]: { $type: "string" } }
          });
          
          if (result && 
              typeof result === 'object' && 
              'cursor' in result &&
              result.cursor &&
              typeof result.cursor === 'object' &&
              'firstBatch' in result.cursor &&
              Array.isArray(result.cursor.firstBatch) &&
              result.cursor.firstBatch.length > 0) {
            
            console.log(`   ❌ Found ${result.cursor.firstBatch.length} records with string ${field}`);
            result.cursor.firstBatch.forEach((record, index) => {
              console.log(`      ${index + 1}. ID: ${record._id}, ${field}: ${record[field]} (${typeof record[field]})`);
            });
          }
        } catch (error) {
          // Field might not exist in this collection, skip silently
        }
      }
    }
    
    // Also check for any documents that have mixed types
    console.log('\n🔍 Checking for mixed date types...');
    
    try {
      const mixedResult = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: {
          $or: [
            { createdAt: { $type: "string" } },
            { updatedAt: { $type: "string" } },
            { scheduledAt: { $type: "string" } },
            { manualStartTime: { $type: "string" } },
            { actualEndTime: { $type: "string" } }
          ]
        }
      });
      
      if (mixedResult && 
          typeof mixedResult === 'object' && 
          'cursor' in mixedResult &&
          mixedResult.cursor &&
          typeof mixedResult.cursor === 'object' &&
          'firstBatch' in mixedResult.cursor &&
          Array.isArray(mixedResult.cursor.firstBatch)) {
        
        if (mixedResult.cursor.firstBatch.length > 0) {
          console.log(`❌ Found ${mixedResult.cursor.firstBatch.length} sessionBooking records with string dates:`);
          mixedResult.cursor.firstBatch.forEach((record, index) => {
            console.log(`   ${index + 1}. ID: ${record._id}`);
            ['createdAt', 'updatedAt', 'scheduledAt', 'manualStartTime', 'actualEndTime'].forEach(field => {
              if (record[field]) {
                console.log(`      ${field}: ${record[field]} (${typeof record[field]})`);
              }
            });
            console.log('');
          });
        } else {
          console.log('✅ No sessionBooking records with string dates found');
        }
      }
    } catch (error) {
      console.error('Error checking mixed types:', error);
    }
    
  } catch (error) {
    console.error('❌ Search failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

comprehensiveStringDateSearch();