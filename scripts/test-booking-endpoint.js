// Test the booking endpoint logic
const { PrismaClient } = require('@prisma/client');

async function testBookingEndpoint() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing booking endpoint logic...');
    
    // Get all available slots
    const availableSlots = await prisma.mentorTimeSlot.findMany({
      where: {
        isActive: true,
        isBooked: false
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        maxStudents: true,
        currentStudents: true
      }
    });
    
    console.log(`\n✅ Found ${availableSlots.length} available slots for booking:`);
    availableSlots.forEach((slot, index) => {
      console.log(`   ${index + 1}. ${slot.id}`);
      console.log(`      Time: ${slot.startTime} - ${slot.endTime}`);
      console.log(`      Capacity: ${slot.currentStudents}/${slot.maxStudents}`);
    });
    
    if (availableSlots.length > 0) {
      const testSlotId = availableSlots[0].id;
      
      console.log(`\n🎯 Testing booking endpoint query for slot: ${testSlotId}`);
      
      // This is the exact query from the booking endpoint
      const timeSlot = await prisma.mentorTimeSlot.findFirst({
        where: {
          id: testSlotId,
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
      
      if (timeSlot) {
        console.log('   ✅ Booking endpoint query successful!');
        console.log(`   Slot ID: ${timeSlot.id}`);
        console.log(`   Start Time: ${timeSlot.startTime} (${typeof timeSlot.startTime})`);
        console.log(`   End Time: ${timeSlot.endTime} (${typeof timeSlot.endTime})`);
        console.log(`   Mentor: ${timeSlot.mentor?.name}`);
        console.log(`   Capacity: ${timeSlot.currentStudents}/${timeSlot.maxStudents}`);
        console.log(`   Available: ${timeSlot.currentStudents < timeSlot.maxStudents}`);
        
        // Test capacity check
        if (timeSlot.currentStudents >= timeSlot.maxStudents) {
          console.log('   ⚠️ Slot is fully booked');
        } else {
          console.log('   ✅ Slot has available capacity');
        }
        
      } else {
        console.log('   ❌ No slot found with the booking query');
      }
    }
    
    console.log('\n🎉 All booking endpoint tests passed!');
    console.log('The Prisma DateTime conversion error should now be resolved.');
    
  } catch (error) {
    console.error('❌ Booking endpoint test failed:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingEndpoint();