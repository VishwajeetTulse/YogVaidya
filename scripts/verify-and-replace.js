// Verify the fix and create a replacement slot if needed
const { PrismaClient } = require('@prisma/client');

async function verifyAndCreateReplacement() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verifying current database state...');
    
    // Check all slots
    const allSlots = await prisma.mentorTimeSlot.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        isBooked: true,
        mentorId: true
      }
    });
    
    console.log(`\n✅ Found ${allSlots.length} slots via Prisma (all working properly)`);
    allSlots.forEach((slot, index) => {
      console.log(`   ${index + 1}. ${slot.id}`);
      console.log(`      Start: ${slot.startTime} (${typeof slot.startTime})`);
      console.log(`      End: ${slot.endTime} (${typeof slot.endTime})`);
      console.log(`      Booked: ${slot.isBooked}`);
    });
    
    // Test the specific slot ID that was causing issues
    console.log('\n🧪 Testing the previously problematic slot ID...');
    const problemSlot = await prisma.mentorTimeSlot.findFirst({
      where: { id: 'slot_1759249800990_32zbkrxwg' }
    });
    
    if (problemSlot) {
      console.log('   ❌ Still exists:', problemSlot.id);
    } else {
      console.log('   ✅ Problematic slot has been removed');
    }
    
    // Check raw database for any remaining string dates
    console.log('\n🔍 Checking raw database for string dates...');
    const rawSlots = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {}
    });
    
    if (rawSlots.cursor && rawSlots.cursor.firstBatch) {
      let stringDateCount = 0;
      
      rawSlots.cursor.firstBatch.forEach((slot, index) => {
        const hasStringDates = 
          typeof slot.startTime === 'string' ||
          typeof slot.endTime === 'string' ||
          typeof slot.createdAt === 'string' ||
          typeof slot.updatedAt === 'string';
          
        if (hasStringDates) {
          stringDateCount++;
          console.log(`   ❌ Slot ${index + 1} still has string dates`);
        }
      });
      
      if (stringDateCount === 0) {
        console.log('   ✅ No string dates found in raw database');
      }
    }
    
    // Test the booking endpoint scenario
    console.log('\n🧪 Testing booking endpoint scenario...');
    if (allSlots.length > 0) {
      const testSlot = allSlots[0];
      
      try {
        const bookingTestSlot = await prisma.mentorTimeSlot.findFirst({
          where: {
            id: testSlot.id,
            isActive: true
          },
          include: {
            mentor: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        if (bookingTestSlot) {
          console.log('   ✅ Booking endpoint query successful');
          console.log(`   Found slot: ${bookingTestSlot.id}`);
          console.log(`   Mentor: ${bookingTestSlot.mentor?.name || 'N/A'}`);
        } else {
          console.log('   ⚠️ No active slot found');
        }
        
      } catch (error) {
        console.log('   ❌ Booking endpoint query failed:', error.message);
      }
    }
    
    // Create a replacement slot if we removed the one from the error
    console.log('\n🔧 Creating a replacement slot for testing...');
    const replacementSlotId = `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const newSlot = await prisma.mentorTimeSlot.create({
        data: {
          id: replacementSlotId,
          mentorId: 'p27belqfkUe1sppnuFpG4nSupFZj8Fme',
          mentorApplicationId: 'a5b5739d-47b2-4182-bdb1-72577b445d36',
          startTime: new Date('2025-09-30T17:05:00.000Z'),
          endTime: new Date('2025-09-30T18:05:00.000Z'),
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
      
      console.log('   ✅ Replacement slot created:', newSlot.id);
      console.log(`   Start: ${newSlot.startTime}`);
      console.log(`   End: ${newSlot.endTime}`);
      
    } catch (error) {
      console.log('   ❌ Failed to create replacement slot:', error.message);
    }
    
  } catch (error) {
    console.error('Error in verification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAndCreateReplacement();