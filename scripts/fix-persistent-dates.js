const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixPersistentStringDates() {
  console.log('🔧 Fixing Persistent String Date Records\n');
  
  try {
    // Fix the sessionBooking record
    console.log('1. Fixing sessionBooking record...');
    const sessionResult = await prisma.$runCommandRaw({
      aggregate: 'sessionBooking',
      pipeline: [
        { $match: { _id: 'session_1759245260291_e5lzspwbe', updatedAt: { $type: "string" } } },
        { $addFields: { updatedAt: { $dateFromString: { dateString: "$updatedAt" } } } },
        { $merge: { into: "sessionBooking", whenMatched: "replace" } }
      ],
      cursor: {}
    });
    console.log('   ✅ SessionBooking fix result:', sessionResult);
    
    // Fix the schedule record
    console.log('2. Fixing schedule record...');
    const scheduleResult = await prisma.$runCommandRaw({
      aggregate: 'schedule',
      pipeline: [
        { $match: { _id: 'schedule_1758371648488_v4wvc0sln', actualEndTime: { $type: "string" } } },
        { $addFields: { actualEndTime: { $dateFromString: { dateString: "$actualEndTime" } } } },
        { $merge: { into: "schedule", whenMatched: "replace" } }
      ],
      cursor: {}
    });
    console.log('   ✅ Schedule fix result:', scheduleResult);
    
    // Final verification
    console.log('\n🔍 Final verification...');
    
    // Check sessionBooking
    const sessionCheck = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: 'session_1759245260291_e5lzspwbe' }
    });
    
    if (sessionCheck && 
        typeof sessionCheck === 'object' && 
        'cursor' in sessionCheck &&
        sessionCheck.cursor &&
        typeof sessionCheck.cursor === 'object' &&
        'firstBatch' in sessionCheck.cursor &&
        Array.isArray(sessionCheck.cursor.firstBatch) &&
        sessionCheck.cursor.firstBatch.length > 0) {
      
      const session = sessionCheck.cursor.firstBatch[0];
      console.log(`   Session updatedAt: ${session.updatedAt} (${typeof session.updatedAt})`);
    }
    
    // Check schedule
    const scheduleCheck = await prisma.$runCommandRaw({
      find: 'schedule',
      filter: { _id: 'schedule_1758371648488_v4wvc0sln' }
    });
    
    if (scheduleCheck && 
        typeof scheduleCheck === 'object' && 
        'cursor' in scheduleCheck &&
        scheduleCheck.cursor &&
        typeof scheduleCheck.cursor === 'object' &&
        'firstBatch' in scheduleCheck.cursor &&
        Array.isArray(scheduleCheck.cursor.firstBatch) &&
        scheduleCheck.cursor.firstBatch.length > 0) {
      
      const schedule = scheduleCheck.cursor.firstBatch[0];
      console.log(`   Schedule actualEndTime: ${schedule.actualEndTime} (${typeof schedule.actualEndTime})`);
    }
    
    // Run comprehensive check
    console.log('\n🧪 Running comprehensive check...');
    const allStringDates = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: {
        $or: [
          { createdAt: { $type: "string" } },
          { updatedAt: { $type: "string" } },
          { scheduledAt: { $type: "string" } }
        ]
      }
    });
    
    if (allStringDates && 
        typeof allStringDates === 'object' && 
        'cursor' in allStringDates &&
        allStringDates.cursor &&
        typeof allStringDates.cursor === 'object' &&
        'firstBatch' in allStringDates.cursor &&
        Array.isArray(allStringDates.cursor.firstBatch)) {
      
      console.log(`   Found ${allStringDates.cursor.firstBatch.length} sessions with string dates after fix`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixPersistentStringDates();