// Check for string dates in the problematic timeslot
const { PrismaClient } = require('@prisma/client');

async function checkProblematicSlot() {
  const prisma = new PrismaClient();
  
  try {
    const slotId = 'slot_1759249800990_32zbkrxwg'; // From the error
    
    console.log(`🔍 Checking problematic slot: ${slotId}`);
    
    // Check with raw query first
    console.log('\n1. Raw database check:');
    const rawResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: { id: slotId }
    });
    
    if (rawResult.cursor && rawResult.cursor.firstBatch.length > 0) {
      const slot = rawResult.cursor.firstBatch[0];
      console.log('   Raw slot data:');
      console.log(`   ID: ${slot.id}`);
      console.log(`   startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
      console.log(`   endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
      console.log(`   createdAt: ${JSON.stringify(slot.createdAt)} (${typeof slot.createdAt})`);
      console.log(`   updatedAt: ${JSON.stringify(slot.updatedAt)} (${typeof slot.updatedAt})`);
      
      // Check if any of these are string dates
      const isStartTimeString = typeof slot.startTime === 'string';
      const isEndTimeString = typeof slot.endTime === 'string';
      const isCreatedAtString = typeof slot.createdAt === 'string';
      const isUpdatedAtString = typeof slot.updatedAt === 'string';
      
      console.log('\n2. String date detection:');
      console.log(`   startTime is string: ${isStartTimeString}`);
      console.log(`   endTime is string: ${isEndTimeString}`);
      console.log(`   createdAt is string: ${isCreatedAtString}`);
      console.log(`   updatedAt is string: ${isUpdatedAtString}`);
      
      if (isStartTimeString || isEndTimeString || isCreatedAtString || isUpdatedAtString) {
        console.log('\n❌ FOUND STRING DATES! This will cause Prisma errors.');
        
        // Try to convert the string dates back to proper format
        console.log('\n3. Attempting to fix string dates...');
        
        const updateData = {};
        
        if (isStartTimeString) {
          const dateValue = new Date(slot.startTime);
          if (!isNaN(dateValue.getTime())) {
            updateData.startTime = dateValue;
            console.log(`   Converting startTime: "${slot.startTime}" → ${dateValue}`);
          }
        }
        
        if (isEndTimeString) {
          const dateValue = new Date(slot.endTime);
          if (!isNaN(dateValue.getTime())) {
            updateData.endTime = dateValue;
            console.log(`   Converting endTime: "${slot.endTime}" → ${dateValue}`);
          }
        }
        
        if (isCreatedAtString) {
          const dateValue = new Date(slot.createdAt);
          if (!isNaN(dateValue.getTime())) {
            updateData.createdAt = dateValue;
            console.log(`   Converting createdAt: "${slot.createdAt}" → ${dateValue}`);
          }
        }
        
        if (isUpdatedAtString) {
          const dateValue = new Date(slot.updatedAt);
          if (!isNaN(dateValue.getTime())) {
            updateData.updatedAt = dateValue;
            console.log(`   Converting updatedAt: "${slot.updatedAt}" → ${dateValue}`);
          }
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log('\n4. Fixing the slot...');
          
          // Use raw update to fix the string dates
          const updateResult = await prisma.$runCommandRaw({
            update: 'mentorTimeSlot',
            updates: [{
              q: { id: slotId },
              u: { $set: updateData }
            }]
          });
          
          console.log('   ✅ Update result:', updateResult);
          
          // Verify the fix
          console.log('\n5. Verifying fix...');
          const fixedResult = await prisma.$runCommandRaw({
            find: 'mentorTimeSlot',
            filter: { id: slotId }
          });
          
          if (fixedResult.cursor && fixedResult.cursor.firstBatch.length > 0) {
            const fixedSlot = fixedResult.cursor.firstBatch[0];
            console.log('   Fixed slot data:');
            console.log(`   startTime: ${JSON.stringify(fixedSlot.startTime)} (${typeof fixedSlot.startTime})`);
            console.log(`   endTime: ${JSON.stringify(fixedSlot.endTime)} (${typeof fixedSlot.endTime})`);
            console.log(`   createdAt: ${JSON.stringify(fixedSlot.createdAt)} (${typeof fixedSlot.createdAt})`);
            console.log(`   updatedAt: ${JSON.stringify(fixedSlot.updatedAt)} (${typeof fixedSlot.updatedAt})`);
          }
          
          // Test Prisma query now
          console.log('\n6. Testing Prisma query...');
          try {
            const prismaSlot = await prisma.mentorTimeSlot.findFirst({
              where: { id: slotId }
            });
            
            if (prismaSlot) {
              console.log('   ✅ Prisma query successful!');
              console.log(`   Prisma startTime: ${prismaSlot.startTime} (${typeof prismaSlot.startTime})`);
              console.log(`   Prisma endTime: ${prismaSlot.endTime} (${typeof prismaSlot.endTime})`);
            } else {
              console.log('   ❌ No slot found with Prisma');
            }
          } catch (error) {
            console.log('   ❌ Prisma query still failing:', error.message);
          }
        }
      } else {
        console.log('\n✅ No string dates found. The issue might be elsewhere.');
      }
    } else {
      console.log('   ❌ Slot not found in raw query');
    }
    
    // Also check for any other slots with string dates
    console.log('\n7. Checking all slots for string dates...');
    const allSlotsRaw = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {}
    });
    
    if (allSlotsRaw.cursor && allSlotsRaw.cursor.firstBatch) {
      let stringDateCount = 0;
      
      allSlotsRaw.cursor.firstBatch.forEach((slot, index) => {
        const hasStringDates = 
          typeof slot.startTime === 'string' ||
          typeof slot.endTime === 'string' ||
          typeof slot.createdAt === 'string' ||
          typeof slot.updatedAt === 'string';
          
        if (hasStringDates) {
          stringDateCount++;
          console.log(`   Slot ${index + 1} (${slot.id}) has string dates`);
        }
      });
      
      console.log(`\n   Total slots with string dates: ${stringDateCount}/${allSlotsRaw.cursor.firstBatch.length}`);
    }
    
  } catch (error) {
    console.error('Error checking slot:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkProblematicSlot();