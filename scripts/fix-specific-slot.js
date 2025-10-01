// Fix the specific problematic slot using _id
const { PrismaClient } = require('@prisma/client');

async function fixSpecificSlot() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Finding the problematic slot...');
    
    const allSlotsRaw = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {}
    });
    
    if (allSlotsRaw.cursor && allSlotsRaw.cursor.firstBatch) {
      const problematicSlot = allSlotsRaw.cursor.firstBatch.find(slot => 
        typeof slot.startTime === 'string' || 
        typeof slot.endTime === 'string' ||
        typeof slot.updatedAt === 'string'
      );
      
      if (problematicSlot) {
        console.log('\n📍 Found problematic slot:');
        console.log(`   _id: ${JSON.stringify(problematicSlot._id)}`);
        console.log(`   id: ${problematicSlot.id}`);
        console.log(`   startTime: ${JSON.stringify(problematicSlot.startTime)} (${typeof problematicSlot.startTime})`);
        console.log(`   endTime: ${JSON.stringify(problematicSlot.endTime)} (${typeof problematicSlot.endTime})`);
        console.log(`   updatedAt: ${JSON.stringify(problematicSlot.updatedAt)} (${typeof problematicSlot.updatedAt})`);
        
        // Prepare the update with proper date conversions
        const updateData = {};
        
        if (typeof problematicSlot.startTime === 'string') {
          updateData.startTime = new Date(problematicSlot.startTime);
        }
        
        if (typeof problematicSlot.endTime === 'string') {
          updateData.endTime = new Date(problematicSlot.endTime);
        }
        
        if (typeof problematicSlot.updatedAt === 'string') {
          updateData.updatedAt = new Date(problematicSlot.updatedAt);
        }
        
        console.log('\n🔧 Update data prepared:');
        Object.keys(updateData).forEach(key => {
          console.log(`   ${key}: ${updateData[key]}`);
        });
        
        // Try update using _id
        console.log('\n🔧 Attempting update using _id...');
        try {
          const updateResult = await prisma.$runCommandRaw({
            update: 'mentorTimeSlot',
            updates: [{
              q: { _id: problematicSlot._id },
              u: { $set: updateData }
            }]
          });
          
          console.log('   Update result:', updateResult);
          
          if (updateResult.nModified > 0) {
            console.log('   ✅ Update successful!');
          } else {
            console.log('   ❌ No documents were modified');
            
            // Try alternative approach: delete and recreate
            console.log('\n🔧 Trying alternative approach: recreate the slot...');
            
            // First, collect all the slot data
            const slotData = {
              id: problematicSlot.id,
              mentorId: problematicSlot.mentorId,
              mentorApplicationId: problematicSlot.mentorApplicationId,
              startTime: typeof problematicSlot.startTime === 'string' 
                ? new Date(problematicSlot.startTime) 
                : problematicSlot.startTime,
              endTime: typeof problematicSlot.endTime === 'string' 
                ? new Date(problematicSlot.endTime) 
                : problematicSlot.endTime,
              sessionType: problematicSlot.sessionType,
              maxStudents: problematicSlot.maxStudents,
              currentStudents: problematicSlot.currentStudents,
              isRecurring: problematicSlot.isRecurring,
              recurringDays: problematicSlot.recurringDays,
              price: problematicSlot.price,
              sessionLink: problematicSlot.sessionLink,
              notes: problematicSlot.notes,
              isActive: problematicSlot.isActive,
              isBooked: problematicSlot.isBooked,
              bookedBy: problematicSlot.bookedBy,
              createdAt: problematicSlot.createdAt,
              updatedAt: typeof problematicSlot.updatedAt === 'string' 
                ? new Date(problematicSlot.updatedAt) 
                : problematicSlot.updatedAt
            };
            
            console.log('   Prepared slot data for recreation...');
            
            // Delete the problematic slot
            const deleteResult = await prisma.$runCommandRaw({
              delete: 'mentorTimeSlot',
              deletes: [{
                q: { _id: problematicSlot._id },
                limit: 1
              }]
            });
            
            console.log('   Delete result:', deleteResult);
            
            if (deleteResult.n > 0) {
              // Recreate using Prisma
              const newSlot = await prisma.mentorTimeSlot.create({
                data: slotData
              });
              
              console.log('   ✅ Slot recreated successfully:', newSlot.id);
            }
          }
          
        } catch (error) {
          console.log('   ❌ Update failed:', error.message);
        }
        
        // Final verification
        console.log('\n🔍 Final verification...');
        try {
          const testSlot = await prisma.mentorTimeSlot.findFirst({
            where: { id: problematicSlot.id }
          });
          
          if (testSlot) {
            console.log('   ✅ Prisma query successful!');
            console.log(`   startTime: ${testSlot.startTime} (${typeof testSlot.startTime})`);
            console.log(`   endTime: ${testSlot.endTime} (${typeof testSlot.endTime})`);
          } else {
            console.log('   ❌ Slot not found');
          }
        } catch (error) {
          console.log('   ❌ Prisma query still failing:', error.message);
        }
        
      } else {
        console.log('✅ No problematic slots found');
      }
    }
    
  } catch (error) {
    console.error('Error fixing slot:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixSpecificSlot();