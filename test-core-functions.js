/**
 * Quick Unit Test for Recurring Slots Generator Functions
 * This tests the core logic without needing authentication
 */

import { generateRecurringTimeSlots, maintainRecurringSlots } from '../src/lib/recurring-slots-generator.js';

async function testCoreFunctions() {
  console.log('🧪 Testing Core Recurring Slots Functions');
  console.log('==========================================');
  
  try {
    // Test 1: Generate recurring slots for next 7 days
    console.log('\n1️⃣ Testing generateRecurringTimeSlots...');
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0); // 10:00 AM
    
    const endTime = new Date(tomorrow);
    endTime.setHours(11, 0, 0, 0); // 11:00 AM
    
    const testConfig = {
      mentorId: "test-mentor-id-12345", 
      sessionType: "YOGA",
      startTime: tomorrow.toISOString(),
      endTime: endTime.toISOString(),
      sessionLink: "https://zoom.us/test-session",
      recurringDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
      maxStudents: 1,
      price: 500,
      generateForDays: 7,
      notes: "Test recurring yoga session"
    };
    
    console.log(`📅 Generating slots for: ${testConfig.recurringDays.join(', ')}`);
    console.log(`⏰ Time: ${tomorrow.toLocaleTimeString()} - ${endTime.toLocaleTimeString()}`);
    console.log(`📊 Window: Next 7 days`);
    
    const result = await generateRecurringTimeSlots(testConfig);
    
    if (result.success) {
      console.log(`✅ Generated ${result.slotsCreated} slots successfully!`);
      console.log(`📋 Details: ${result.recurringDays.join(', ')} @ ${result.timeRange}`);
      
      if (result.slotsCreated > 0) {
        console.log('✅ Core generation function works correctly');
      } else {
        console.log('⚠️  No slots created - check if target days exist in next 7 days');
      }
    } else {
      console.log(`❌ Generation failed: ${result.error}`);
      return false;
    }
    
    // Test 2: Test maintenance function
    console.log('\n2️⃣ Testing maintainRecurringSlots...');
    
    const maintenanceResult = await maintainRecurringSlots();
    
    if (maintenanceResult.success) {
      console.log(`✅ Maintenance completed successfully!`);
      console.log(`🗑️  Deleted: ${maintenanceResult.slotsDeleted} old slots`);
      console.log(`➕ Generated: ${maintenanceResult.slotsGenerated} new slots`);
      console.log('✅ Maintenance function works correctly');
    } else {
      console.log(`❌ Maintenance failed: ${maintenanceResult.error}`);
      return false;
    }
    
    console.log('\n🎉 All core functions passed!');
    return true;
    
  } catch (error) {
    console.error('💥 Core function test failed:', error);
    return false;
  }
}

// Run the test
testCoreFunctions()
  .then(success => {
    if (success) {
      console.log('\n✅ CORE FUNCTIONS TEST: PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ CORE FUNCTIONS TEST: FAILED');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💀 Test crashed:', error);
    process.exit(1);
  });