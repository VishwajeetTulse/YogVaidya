/**
 * API Endpoint Tests for 7-Day Recurring Time Slots
 * Tests the actual API endpoints without needing direct function imports
 */

// Test configuration
const BASE_URL = 'http://localhost:3000';

// Simple test data
const RECURRING_SLOT_TEST = {
  startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow 
  endTime: new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString(), // Tomorrow + 1 hour
  sessionType: "YOGA",
  maxStudents: 1,
  isRecurring: true,
  recurringDays: ["MONDAY", "WEDNESDAY", "FRIDAY"],
  sessionLink: "https://zoom.us/test-recurring-session",
  notes: "Test 7-day recurring yoga session - API test",
};

const SINGLE_SLOT_TEST = {
  startTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
  endTime: new Date(Date.now() + 49 * 60 * 60 * 1000).toISOString(), // Day after tomorrow + 1 hour
  sessionType: "MEDITATION", 
  maxStudents: 1,
  isRecurring: false,
  recurringDays: [],
  sessionLink: "https://zoom.us/test-single-session",
  notes: "Test single meditation session - API test",
};

async function makeRequest(url, options = {}) {
  try {
    console.log(`🌐 Making request to: ${url}`);
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📋 Response data:`, JSON.stringify(data, null, 2));
    
    return { status: response.status, data, success: response.ok };
  } catch (error) {
    console.error(`❌ Request failed:`, error.message);
    return { status: 0, data: { error: error.message }, success: false };
  }
}

async function testWithoutAuth() {
  console.log('🧪 API Endpoint Tests (Without Authentication)');
  console.log('==============================================');
  console.log(`🕐 Started at: ${new Date().toISOString()}`);
  
  // Note: These tests will fail due to authentication, but we can see if the endpoints exist
  // and get structured error responses
  
  console.log('\n1️⃣ Testing Single Slot Creation (Expected: Auth Error)...');
  const singleResult = await makeRequest(`${BASE_URL}/api/mentor/timeslots`, {
    method: 'POST',
    body: JSON.stringify(SINGLE_SLOT_TEST)
  });
  
  console.log('\n2️⃣ Testing Recurring Slot Creation (Expected: Auth Error)...');
  const recurringResult = await makeRequest(`${BASE_URL}/api/mentor/timeslots`, {
    method: 'POST', 
    body: JSON.stringify(RECURRING_SLOT_TEST)
  });
  
  console.log('\n3️⃣ Testing Maintenance Status Check (Expected: Auth Error)...');
  const statusResult = await makeRequest(`${BASE_URL}/api/admin/maintain-recurring-slots`);
  
  console.log('\n4️⃣ Testing Manual Maintenance Trigger (Expected: Auth Error)...');
  const maintenanceResult = await makeRequest(`${BASE_URL}/api/admin/maintain-recurring-slots`, {
    method: 'POST'
  });
  
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  // Check if endpoints exist (status should be 401/403 for auth errors, not 404)
  const endpointsWorking = [
    { name: 'Single Slot API', working: singleResult.status !== 404 },
    { name: 'Recurring Slot API', working: recurringResult.status !== 404 },
    { name: 'Maintenance Status API', working: statusResult.status !== 404 },
    { name: 'Maintenance Trigger API', working: maintenanceResult.status !== 404 }
  ];
  
  endpointsWorking.forEach(endpoint => {
    console.log(`${endpoint.working ? '✅' : '❌'} ${endpoint.name}: ${endpoint.working ? 'FOUND' : 'NOT FOUND'}`);
  });
  
  const workingEndpoints = endpointsWorking.filter(e => e.working).length;
  console.log(`\n🎯 Endpoints Found: ${workingEndpoints}/4`);
  
  if (workingEndpoints === 4) {
    console.log('✅ All API endpoints are accessible (authentication required for testing)');
    console.log('\n💡 Next Steps:');
    console.log('   1. Login as a mentor in browser');
    console.log('   2. Copy session cookie from browser dev tools');
    console.log('   3. Run authenticated tests using test-7day-recurring.js');
  } else {
    console.log('❌ Some endpoints are missing or not working');
  }
  
  console.log(`\n🕐 Completed at: ${new Date().toISOString()}`);
}

// Run the test
testWithoutAuth()
  .then(() => {
    console.log('\n🎉 API accessibility test completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💀 Test crashed:', error);
    process.exit(1);
  });