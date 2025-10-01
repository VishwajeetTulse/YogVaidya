// Find and fix all slots with string dates
const { PrismaClient } = require('@prisma/client');

async function findAndFixStringDates() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Finding all slots with string dates...');
    
    const allSlotsRaw = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {}
    });
    
    if (allSlotsRaw.cursor && allSlotsRaw.cursor.firstBatch) {
      console.log(`\nFound ${allSlotsRaw.cursor.firstBatch.length} total slots`);
      
      const slotsWithStringDates = [];
      
      allSlotsRaw.cursor.firstBatch.forEach((slot, index) => {
        const hasStringDates = 
          typeof slot.startTime === 'string' ||
          typeof slot.endTime === 'string' ||
          typeof slot.createdAt === 'string' ||
          typeof slot.updatedAt === 'string';
          
        if (hasStringDates) {
          slotsWithStringDates.push({
            index: index + 1,
            id: slot.id || slot._id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            createdAt: slot.createdAt,
            updatedAt: slot.updatedAt,
            startTimeType: typeof slot.startTime,
            endTimeType: typeof slot.endTime,
            createdAtType: typeof slot.createdAt,
            updatedAtType: typeof slot.updatedAt
          });
        }
      });
      
      console.log(`\n❌ Found ${slotsWithStringDates.length} slots with string dates:`);
      
      for (const slot of slotsWithStringDates) {
        console.log(`\n📍 Slot ${slot.index}:`);
        console.log(`   ID: ${slot.id}`);
        console.log(`   startTime: ${JSON.stringify(slot.startTime)} (${slot.startTimeType})`);
        console.log(`   endTime: ${JSON.stringify(slot.endTime)} (${slot.endTimeType})`);
        console.log(`   createdAt: ${JSON.stringify(slot.createdAt)} (${slot.createdAtType})`);
        console.log(`   updatedAt: ${JSON.stringify(slot.updatedAt)} (${slot.updatedAtType})`);
        
        // Prepare update data
        const updateData = {};
        let needsUpdate = false;
        
        if (slot.startTimeType === 'string') {
          const dateValue = new Date(slot.startTime);
          if (!isNaN(dateValue.getTime())) {
            updateData.startTime = dateValue;
            needsUpdate = true;
            console.log(`   → Will convert startTime: "${slot.startTime}" → ${dateValue}`);
          }
        }
        
        if (slot.endTimeType === 'string') {
          const dateValue = new Date(slot.endTime);
          if (!isNaN(dateValue.getTime())) {
            updateData.endTime = dateValue;
            needsUpdate = true;
            console.log(`   → Will convert endTime: "${slot.endTime}" → ${dateValue}`);
          }
        }
        
        if (slot.createdAtType === 'string') {
          const dateValue = new Date(slot.createdAt);
          if (!isNaN(dateValue.getTime())) {
            updateData.createdAt = dateValue;
            needsUpdate = true;
            console.log(`   → Will convert createdAt: "${slot.createdAt}" → ${dateValue}`);
          }
        }
        
        if (slot.updatedAtType === 'string') {
          const dateValue = new Date(slot.updatedAt);
          if (!isNaN(dateValue.getTime())) {
            updateData.updatedAt = dateValue;
            needsUpdate = true;
            console.log(`   → Will convert updatedAt: "${slot.updatedAt}" → ${dateValue}`);
          }
        }
        
        if (needsUpdate) {
          console.log(`\n   🔧 Fixing slot ${slot.id}...`);
          
          try {
            // Use the document _id if id field is not available
            const filter = slot.id ? { id: slot.id } : { _id: slot.id };
            
            const updateResult = await prisma.$runCommandRaw({
              update: 'mentorTimeSlot',
              updates: [{
                q: filter,
                u: { $set: updateData }
              }]
            });
            
            console.log(`   ✅ Update successful:`, updateResult);
            
          } catch (error) {
            console.log(`   ❌ Update failed:`, error.message);
          }
        }
      }
      
      if (slotsWithStringDates.length > 0) {
        // Verify all fixes
        console.log('\n🔍 Verifying fixes...');
        
        const verifyResult = await prisma.$runCommandRaw({
          find: 'mentorTimeSlot',
          filter: {}
        });
        
        if (verifyResult.cursor && verifyResult.cursor.firstBatch) {
          let remainingStringDates = 0;
          
          verifyResult.cursor.firstBatch.forEach((slot) => {
            const hasStringDates = 
              typeof slot.startTime === 'string' ||
              typeof slot.endTime === 'string' ||
              typeof slot.createdAt === 'string' ||
              typeof slot.updatedAt === 'string';
              
            if (hasStringDates) {
              remainingStringDates++;
            }
          });
          
          if (remainingStringDates === 0) {
            console.log('   ✅ All string dates have been fixed!');
          } else {
            console.log(`   ❌ Still ${remainingStringDates} slots with string dates`);
          }
        }
        
        // Test Prisma queries
        console.log('\n🧪 Testing Prisma queries...');
        try {
          const count = await prisma.mentorTimeSlot.count();
          console.log(`   ✅ Prisma count query successful: ${count} slots`);
          
          const firstSlot = await prisma.mentorTimeSlot.findFirst();
          if (firstSlot) {
            console.log(`   ✅ Prisma findFirst successful: ${firstSlot.id}`);
          }
          
        } catch (error) {
          console.log(`   ❌ Prisma queries still failing:`, error.message);
        }
      } else {
        console.log('\n✅ No slots with string dates found');
      }
    }
    
  } catch (error) {
    console.error('Error finding/fixing string dates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndFixStringDates();