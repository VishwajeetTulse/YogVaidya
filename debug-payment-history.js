// Debug script to test payment history functionality AND security
// This script helps diagnose issues with payment history fetching and tests for data leakage

const { getBillingHistoryAction } = require('./src/lib/actions/billing-actions');

async function debugPaymentHistory() {
  console.log('=== Payment History Debug Script ===');
  
  // Test with a sample email - replace with actual user email for testing
  const testEmail = 'test@example.com'; 
  
  console.log(`Testing payment history for: ${testEmail}`);
  console.log('Environment check:');
  console.log('RAZORPAY_KEY_ID exists:', !!process.env.RAZORPAY_KEY_ID);
  console.log('RAZORPAY_KEY_SECRET exists:', !!process.env.RAZORPAY_KEY_SECRET);
  
  try {
    console.log('\nCalling getBillingHistoryAction...');
    const result = await getBillingHistoryAction(testEmail);
    
    console.log('\nResult:', {
      success: result.success,
      historyLength: result.history?.length || 0,
      error: result.error || 'No error'
    });
    
    if (result.success && result.history && result.history.length > 0) {
      console.log('\n🚨 SECURITY ALERT: User received payment history!');
      console.log('Sample payment record:');
      console.log(JSON.stringify(result.history[0], null, 2));
    } else {
      console.log('✅ No payment history returned (expected for trial users)');
    }
    
  } catch (error) {
    console.error('\nUnhandled error:', error);
  }
}

// Test security vulnerabilities
async function testSecurityVulnerabilities() {
  console.log('\n🚨 SECURITY VULNERABILITY TESTS');
  console.log('='.repeat(50));
  
  const dangerousInputs = [
    { name: 'Empty string', value: '' },
    { name: 'Null', value: null },
    { name: 'Undefined', value: undefined },
    { name: 'Whitespace', value: '   ' },
    { name: 'Invalid email', value: 'not-an-email' },
    { name: 'Trial user email', value: 'trial-user@example.com' }
  ];

  for (const test of dangerousInputs) {
    console.log(`\n📧 Testing: ${test.name} (${test.value})`);
    try {
      const result = await getBillingHistoryAction(test.value);
      
      if (result.success && result.history && result.history.length > 0) {
        console.log('🚨 CRITICAL SECURITY VULNERABILITY!');
        console.log(`   Payment history returned for invalid input: ${test.value}`);
        console.log(`   History count: ${result.history.length}`);
      } else {
        console.log(`✅ Properly blocked: ${result.error}`);
      }
    } catch (error) {
      console.log(`✅ Exception thrown: ${error.message}`);
    }
  }
}

// Instructions for running this script:
console.log('\n📋 INSTRUCTIONS:');
console.log('1. Replace testEmail with actual user email for normal testing');
console.log('2. Ensure environment variables are set');
console.log('3. Run: node debug-payment-history.js');
console.log('4. Check security test results carefully!');
console.log('');

// Uncomment the lines below to run the tests
// debugPaymentHistory();
// testSecurityVulnerabilities();

module.exports = { debugPaymentHistory, testSecurityVulnerabilities };