// Database health monitor for date consistency
const { PrismaClient } = require('@prisma/client');

async function monitorDatabaseHealth() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏥 DATABASE HEALTH MONITOR');
    console.log('========================');
    console.log(`Run time: ${new Date().toISOString()}`);
    
    // 1. Check MentorTimeSlot consistency
    console.log('\n📅 MentorTimeSlot Health Check:');
    
    const timeSlotCount = await prisma.mentorTimeSlot.count();
    console.log(`   Total slots: ${timeSlotCount}`);
    
    if (timeSlotCount === 0) {
      console.log('   ⚠️ No timeslots found in database');
    } else {
      // Check for string dates using raw query
      const rawSlots = await prisma.$runCommandRaw({
        find: 'mentorTimeSlot',
        filter: {}
      });
      
      if (rawSlots.cursor && rawSlots.cursor.firstBatch) {
        let healthySlots = 0;
        let corruptedSlots = 0;
        const issues = [];
        
        rawSlots.cursor.firstBatch.forEach((slot, index) => {
          const hasStringDates = 
            typeof slot.startTime === 'string' ||
            typeof slot.endTime === 'string' ||
            typeof slot.createdAt === 'string' ||
            typeof slot.updatedAt === 'string';
            
          if (hasStringDates) {
            corruptedSlots++;
            issues.push({
              id: slot._id,
              startTimeType: typeof slot.startTime,
              endTimeType: typeof slot.endTime,
              createdAtType: typeof slot.createdAt,
              updatedAtType: typeof slot.updatedAt
            });
          } else {
            healthySlots++;
          }
        });
        
        console.log(`   ✅ Healthy slots: ${healthySlots}`);
        console.log(`   ❌ Corrupted slots: ${corruptedSlots}`);
        
        if (corruptedSlots > 0) {
          console.log('\n   🚨 CORRUPTION DETECTED:');
          issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. Slot ${issue.id}:`);
            console.log(`      startTime: ${issue.startTimeType}`);
            console.log(`      endTime: ${issue.endTimeType}`);
            console.log(`      createdAt: ${issue.createdAtType}`);
            console.log(`      updatedAt: ${issue.updatedAtType}`);
          });
        }
        
        // Test Prisma compatibility
        try {
          const testSlot = await prisma.mentorTimeSlot.findFirst();
          if (testSlot) {
            console.log(`   ✅ Prisma queries working`);
          }
        } catch (error) {
          console.log(`   ❌ Prisma queries failing: ${error.message}`);
        }
      }
    }
    
    // 2. Check SessionBooking consistency
    console.log('\n📋 SessionBooking Health Check:');
    
    const sessionCount = await prisma.sessionBooking.count();
    console.log(`   Total sessions: ${sessionCount}`);
    
    if (sessionCount > 0) {
      // Check for string dates
      const rawSessions = await prisma.$runCommandRaw({
        find: 'sessionBooking',
        filter: {}
      });
      
      if (rawSessions.cursor && rawSessions.cursor.firstBatch) {
        let healthySessions = 0;
        let corruptedSessions = 0;
        
        rawSessions.cursor.firstBatch.forEach((session) => {
          const hasStringDates = 
            typeof session.createdAt === 'string' ||
            typeof session.updatedAt === 'string' ||
            typeof session.scheduledAt === 'string' ||
            typeof session.manualStartTime === 'string' ||
            typeof session.actualEndTime === 'string';
            
          if (hasStringDates) {
            corruptedSessions++;
          } else {
            healthySessions++;
          }
        });
        
        console.log(`   ✅ Healthy sessions: ${healthySessions}`);
        console.log(`   ❌ Corrupted sessions: ${corruptedSessions}`);
        
        // Test session ID resolution
        const testSession = rawSessions.cursor.firstBatch[0];
        if (testSession) {
          const resolvedId = testSession.id || testSession._id;
          console.log(`   Session ID resolution: ${resolvedId ? '✅ Working' : '❌ Failed'}`);
        }
      }
    }
    
    // 3. Overall health score
    console.log('\n📊 OVERALL HEALTH SCORE:');
    
    let score = 100;
    let issues = [];
    
    // Check if any Prisma operations fail
    try {
      await prisma.mentorTimeSlot.count();
      await prisma.sessionBooking.count();
    } catch (error) {
      score -= 50;
      issues.push('Prisma operations failing');
    }
    
    // Check for corrupted data
    const allSlotsRaw = await prisma.$runCommandRaw({
      find: 'mentorTimeSlot',
      filter: {}
    });
    
    if (allSlotsRaw.cursor && allSlotsRaw.cursor.firstBatch) {
      const corruptedCount = allSlotsRaw.cursor.firstBatch.filter(slot => 
        typeof slot.startTime === 'string' ||
        typeof slot.endTime === 'string'
      ).length;
      
      if (corruptedCount > 0) {
        score -= (corruptedCount * 20);
        issues.push(`${corruptedCount} corrupted timeslots`);
      }
    }
    
    if (score >= 90) {
      console.log(`   🟢 EXCELLENT (${score}/100)`);
    } else if (score >= 70) {
      console.log(`   🟡 GOOD (${score}/100)`);
    } else if (score >= 50) {
      console.log(`   🟠 NEEDS ATTENTION (${score}/100)`);
    } else {
      console.log(`   🔴 CRITICAL (${score}/100)`);
    }
    
    if (issues.length > 0) {
      console.log('   Issues found:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
    console.log('\n💡 RECOMMENDATIONS:');
    if (score === 100) {
      console.log('   ✅ Database is healthy - no action needed');
    } else {
      console.log('   🔧 Run database cleanup scripts if corruption detected');
      console.log('   📝 Always use Prisma client for data operations');
      console.log('   ⚠️ Avoid raw MongoDB operations for date fields');
    }
    
  } catch (error) {
    console.error('❌ Health check failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

monitorDatabaseHealth();