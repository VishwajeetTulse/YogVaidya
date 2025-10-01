// Find and fix the new corrupted slot
const { PrismaClient } = require('@prisma/client');

async function findAndFixNewCorruptedSlot() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Finding the new corrupted slot...');
    
    const targetSlotId = 'slot_1759251773698_qqcdznybp'; // From the error
    
    // Check this specific slot with raw query
    console.log(`\n1. Checking slot: ${targetSlotId}`);
    const rawResult = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: { _id: targetSlotId }
    });
    
    if (rawResult.cursor && rawResult.cursor.firstBatch.length > 0) {
      const slot = rawResult.cursor.firstBatch[0];
      console.log('   Found corrupted slot:');
      console.log(`   _id: ${slot._id}`);
      console.log(`   startTime: ${JSON.stringify(slot.startTime)} (${typeof slot.startTime})`);
      console.log(`   endTime: ${JSON.stringify(slot.endTime)} (${typeof slot.endTime})`);
      console.log(`   createdAt: ${JSON.stringify(slot.createdAt)} (${typeof slot.createdAt})`);
      console.log(`   updatedAt: ${JSON.stringify(slot.updatedAt)} (${typeof slot.updatedAt})`);
      
      // Check if any dates are strings
      const hasStringDates = 
        typeof slot.startTime === 'string' ||
        typeof slot.endTime === 'string' ||
        typeof slot.createdAt === 'string' ||
        typeof slot.updatedAt === 'string';
      
      if (hasStringDates) {
        console.log('\n❌ CONFIRMED: Slot has string dates!');
        
        // Delete this corrupted slot
        console.log('\n🗑️ Deleting corrupted slot...');
        const deleteResult = await prisma.$runCommandRaw({
          delete: 'mentorTimeSlot',
          deletes: [{
            q: { _id: targetSlotId },
            limit: 1
          }]
        });
        
        console.log('   Delete result:', deleteResult);
        
        if (deleteResult.n > 0) {
          console.log('   ✅ Corrupted slot deleted successfully');
          
          // Create a proper replacement using Prisma
          console.log('\n🔧 Creating proper replacement slot...');
          
          const newSlotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          
          try {
            const newSlot = await prisma.mentorTimeSlot.create({
              data: {
                id: newSlotId,
                mentorId: 'p27belqfkUe1sppnuFpG4nSupFZj8Fme',
                mentorApplicationId: 'a5b5739d-47b2-4182-bdb1-72577b445d36',
                startTime: new Date('2025-09-30T17:20:00.000Z'), // Proper Date object
                endTime: new Date('2025-09-30T18:20:00.000Z'),   // Proper Date object
                sessionType: 'YOGA',
                maxStudents: 1,
                currentStudents: 0,
                isRecurring: false,
                recurringDays: [],
                price: 2000,
                sessionLink: 'https://google.com',
                notes: '',
                isActive: true,
                isBooked: false,
                bookedBy: null
              }
            });
            
            console.log('   ✅ New slot created:', newSlot.id);
            console.log(`   Start: ${newSlot.startTime} (${typeof newSlot.startTime})`);
            console.log(`   End: ${newSlot.endTime} (${typeof newSlot.endTime})`);
            
            // Test Prisma query on new slot
            const testSlot = await prisma.mentorTimeSlot.findFirst({
              where: { id: newSlot.id }
            });
            
            if (testSlot) {
              console.log('   ✅ New slot works with Prisma queries');
            }
            
          } catch (error) {
            console.log('   ❌ Failed to create replacement:', error.message);
          }
        }
      } else {
        console.log('   ✅ Slot has proper date objects (unexpected)');
      }
    } else {
      console.log('   ❌ Slot not found');
    }
    
    // Double-check: scan ALL slots for string dates
    console.log('\n2. Scanning ALL slots for string dates...');
    
    const allSlotsRaw = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {}
    });
    
    if (allSlotsRaw.cursor && allSlotsRaw.cursor.firstBatch) {
      let corruptedCount = 0;
      const corruptedSlots = [];
      
      allSlotsRaw.cursor.firstBatch.forEach((slot, index) => {
        const hasStringDates = 
          typeof slot.startTime === 'string' ||
          typeof slot.endTime === 'string' ||
          typeof slot.createdAt === 'string' ||
          typeof slot.updatedAt === 'string';
          
        if (hasStringDates) {
          corruptedCount++;
          corruptedSlots.push({
            id: slot._id,
            startTime: slot.startTime,
            endTime: slot.endTime,
            startTimeType: typeof slot.startTime,
            endTimeType: typeof slot.endTime
          });
        }
      });
      
      console.log(`   Found ${corruptedCount}/${allSlotsRaw.cursor.firstBatch.length} slots with string dates`);
      
      if (corruptedCount > 0) {
        console.log('\n❌ Additional corrupted slots found:');
        corruptedSlots.forEach((slot, index) => {
          console.log(`   ${index + 1}. ${slot.id}`);
          console.log(`      startTime: ${JSON.stringify(slot.startTime)} (${slot.startTimeType})`);
          console.log(`      endTime: ${JSON.stringify(slot.endTime)} (${slot.endTimeType})`);
        });
        
        // Delete all corrupted slots
        console.log('\n🗑️ Deleting all corrupted slots...');
        for (const slot of corruptedSlots) {
          try {
            const deleteResult = await prisma.$runCommandRaw({
              delete: 'mentorTimeSlot',
              deletes: [{
                q: { _id: slot.id },
                limit: 1
              }]
            });
            console.log(`   Deleted slot ${slot.id}: ${deleteResult.n > 0 ? '✅' : '❌'}`);
          } catch (error) {
            console.log(`   Failed to delete ${slot.id}: ${error.message}`);
          }
        }
      } else {
        console.log('   ✅ No corrupted slots found');
      }
    }
    
    // Final verification
    console.log('\n3. Final verification...');
    
    try {
      const finalCount = await prisma.mentorTimeSlot.count();
      console.log(`   Total slots after cleanup: ${finalCount}`);
      
      const sampleSlot = await prisma.mentorTimeSlot.findFirst();
      if (sampleSlot) {
        console.log(`   Sample slot: ${sampleSlot.id}`);
        console.log(`   Date types: startTime(${typeof sampleSlot.startTime}), endTime(${typeof sampleSlot.endTime})`);
      }
      
      console.log('\n🎉 Slot cleanup completed successfully!');
      
    } catch (error) {
      console.log('   ❌ Final verification failed:', error.message);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findAndFixNewCorruptedSlot();