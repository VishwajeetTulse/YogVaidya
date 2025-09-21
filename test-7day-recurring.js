/**
 * Test Script for 7-Day Recurring Time Slots Implementation
 * 
 * This script tests the new recurring slot functionality:
 * 1. Tests single slot creation
 * 2. Tests recurring slot creation (7 days)
 * 3. Tests availability filtering
 * 4. Tests manual maintenance trigger
 * 
 * Usage: node test-7day-recurring.js
 */

require('dotenv').config({ path: '.env.local' });

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  // You'll need to get a valid session cookie from your browser's dev tools
  // Login as a mentor and copy the session cookie here
  SESSION_COOKIE: 'session=your_mentor_session_cookie_here', 
  
  // Test data for recurring slot
  RECURRING_SLOT: {
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
    endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
    sessionType: "YOGA",
    maxStudents: 1,
    isRecurring: true,
    recurringDays: ["MONDAY", "WEDNESDAY", "FRIDAY"], // Test with MWF schedule
    sessionLink: "https://zoom.us/test-recurring-7day-session",
    notes: "Test 7-day recurring yoga session - MWF schedule",
  },

  // Test data for single slot
  SINGLE_SLOT: {
    startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
    endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(), // Day after tomorrow + 1 hour
    sessionType: "MEDITATION",
    maxStudents: 1,
    isRecurring: false,
    recurringDays: [],
    sessionLink: "https://zoom.us/test-single-session",
    notes: "Test single meditation session",
  }
};

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'Cookie': TEST_CONFIG.SESSION_COOKIE,
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    return { status: response.status, data, success: response.ok };
  } catch (error) {
    return { status: 0, data: { error: error.message }, success: false };
  }
}

async function testSingleSlotCreation() {
  console.log('\\n1️⃣ Testing Single Slot Creation...');
  console.log('=====================================');
  
  const response = await makeRequest(`${BASE_URL}/api/mentor/timeslots`, {
    method: 'POST',
    body: JSON.stringify(TEST_CONFIG.SINGLE_SLOT)
  });
  
  if (response.success) {
    console.log('✅ Single slot created successfully');
    console.log(`📋 Response:`, response.data);
  } else {
    console.log('❌ Single slot creation failed');
    console.log(`📋 Error:`, response.data);
  }
  
  return response.success;
}

async function testRecurringSlotCreation() {
  console.log('\\n2️⃣ Testing 7-Day Recurring Slot Creation...');
  console.log('==============================================');
  
  const response = await makeRequest(`${BASE_URL}/api/mentor/timeslots`, {
    method: 'POST',
    body: JSON.stringify(TEST_CONFIG.RECURRING_SLOT)
  });
  
  if (response.success) {
    console.log('✅ Recurring slots created successfully');
    console.log(`📊 Created ${response.data.slotsCreated} slots`);
    console.log(`📅 Days: ${response.data.recurringDays.join(', ')}`);
    console.log(`⏰ Time: ${response.data.timeRange}`);
    console.log(`📋 Full response:`, response.data);
    
    return { success: true, slotsCreated: response.data.slotsCreated };
  } else {
    console.log('❌ Recurring slot creation failed');
    console.log(`📋 Error:`, response.data);
    
    return { success: false, slotsCreated: 0 };
  }
}

async function testAvailabilityFiltering() {
  console.log('\\n3️⃣ Testing Availability Filtering...');
  console.log('====================================');
  
  // Test general availability
  const availResponse = await makeRequest(`${BASE_URL}/api/mentor/timeslots?available=true`);
  
  if (availResponse.success) {
    const recurringSlots = availResponse.data.data.filter(slot => slot.isRecurring);
    const singleSlots = availResponse.data.data.filter(slot => !slot.isRecurring);
    
    console.log('✅ Availability filtering works');
    console.log(`📊 Total available slots: ${availResponse.data.data.length}`);
    console.log(`🔄 Recurring slots: ${recurringSlots.length}`);
    console.log(`📅 Single slots: ${singleSlots.length}`);
    
    if (recurringSlots.length > 0) {
      console.log('\\n📋 Sample recurring slots:');
      recurringSlots.slice(0, 3).forEach((slot, i) => {
        console.log(`   ${i+1}. ${slot.sessionType} - ${new Date(slot.startTime).toLocaleString()}`);
        console.log(`      Days: [${slot.recurringDays.join(', ')}]`);
        console.log(`      Available: ${slot.maxStudents - slot.currentStudents}/${slot.maxStudents}`);
      });
    }
    
    return true;
  } else {
    console.log('❌ Availability filtering failed');
    console.log(`📋 Error:`, availResponse.data);
    return false;
  }
}

async function testMaintenanceTrigger() {
  console.log('\\n4️⃣ Testing Manual Maintenance Trigger...');
  console.log('==========================================');
  
  // First, check current status
  const statusResponse = await makeRequest(`${BASE_URL}/api/admin/maintain-recurring-slots`);
  
  if (statusResponse.success) {
    console.log('✅ Maintenance status check works');
    console.log(`📊 Current stats:`, statusResponse.data.data.recurringSlots);
  }
  
  // Then trigger maintenance
  const maintenanceResponse = await makeRequest(`${BASE_URL}/api/admin/maintain-recurring-slots`, {
    method: 'POST'
  });
  
  if (maintenanceResponse.success) {
    console.log('✅ Manual maintenance trigger works');
    console.log(`📊 Maintenance results:`, maintenanceResponse.data.data);
    return true;
  } else {
    console.log('❌ Manual maintenance trigger failed');
    console.log(`📋 Error:`, maintenanceResponse.data);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 7-Day Recurring Time Slots - Full Test Suite');
  console.log('================================================');
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  
  // Check if session cookie is configured
  if (TEST_CONFIG.SESSION_COOKIE === 'session=your_mentor_session_cookie_here') {
    console.log('\\n⚠️  WARNING: Please configure your session cookie in TEST_CONFIG');
    console.log('   1. Login as a mentor in your browser');
    console.log('   2. Open browser dev tools (F12)');
    console.log('   3. Go to Application/Storage > Cookies');
    console.log('   4. Copy the "session" cookie value');
    console.log('   5. Update TEST_CONFIG.SESSION_COOKIE in this script');
    console.log('\\n❌ Skipping tests due to missing session cookie');
    return;
  }
  
  const results = {
    singleSlot: false,
    recurringSlot: false,
    availability: false,
    maintenance: false
  };
  
  try {
    // Run all tests
    results.singleSlot = await testSingleSlotCreation();
    const recurringResult = await testRecurringSlotCreation();
    results.recurringSlot = recurringResult.success;
    results.availability = await testAvailabilityFiltering();
    results.maintenance = await testMaintenanceTrigger();
    
    // Summary
    console.log('\\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Single Slot Creation: ${results.singleSlot ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Recurring Slot Creation: ${results.recurringSlot ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Availability Filtering: ${results.availability ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Maintenance Trigger: ${results.maintenance ? 'PASSED' : 'FAILED'}`);
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 ALL TESTS PASSED! 7-day recurring slots are working correctly.');
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
  }
  
  console.log(`\\n🕐 Completed at: ${new Date().toISOString()}`);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Test suite crashed:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests, TEST_CONFIG };