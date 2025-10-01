// Check database collections and structure
const { PrismaClient } = require('@prisma/client');

async function checkCollections() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking Database Collections');
    
    // List all collections
    console.log('\n1. Available collections:');
    const collections = await prisma.$runCommandRaw({
      listCollections: 1
    });
    
    if (collections.cursor && collections.cursor.firstBatch) {
      collections.cursor.firstBatch.forEach(collection => {
        console.log(`   - ${collection.name} (type: ${collection.type})`);
      });
    }
    
    // Try different collection names
    const possibleNames = ['MentorTimeSlot', 'mentorTimeSlot', 'MentorTimeSlots', 'mentortimeslot'];
    
    for (const collectionName of possibleNames) {
      console.log(`\n2. Trying collection name: ${collectionName}`);
      try {
        const result = await prisma.$runCommandRaw({
          find: collectionName,
          filter: {},
          limit: 1
        });
        
        if (result.cursor && result.cursor.firstBatch) {
          console.log(`   ✅ Found ${result.cursor.firstBatch.length} documents in ${collectionName}`);
          if (result.cursor.firstBatch.length > 0) {
            const doc = result.cursor.firstBatch[0];
            console.log(`   Sample document keys:`, Object.keys(doc));
            if (doc.startTime) {
              console.log(`   Sample startTime:`, JSON.stringify(doc.startTime));
            }
          }
        } else {
          console.log(`   ❌ No results from ${collectionName}`);
        }
      } catch (error) {
        console.log(`   ❌ Error with ${collectionName}:`, error.message);
      }
    }
    
    // Check Prisma model names
    console.log('\n3. Checking what Prisma actually uses:');
    const prismaCount = await prisma.mentorTimeSlot.count();
    console.log(`   Prisma mentorTimeSlot.count(): ${prismaCount}`);
    
    // Try to get the first record and see its structure
    if (prismaCount > 0) {
      const firstSlot = await prisma.mentorTimeSlot.findFirst({
        select: {
          id: true,
          mentorId: true,
          startTime: true,
          endTime: true
        }
      });
      
      console.log('\n4. First slot via Prisma:');
      console.log(`   ID: ${firstSlot.id}`);
      console.log(`   MentorId: ${firstSlot.mentorId}`);
      console.log(`   StartTime: ${firstSlot.startTime} (${typeof firstSlot.startTime})`);
      console.log(`   EndTime: ${firstSlot.endTime} (${typeof firstSlot.endTime})`);
    }
    
  } catch (error) {
    console.error('Error checking collections:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCollections();