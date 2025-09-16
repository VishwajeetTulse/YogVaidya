// Critical Security Test - Payment History Leakage Investigation
// This script tests if payment history is being leaked between users

const { getBillingHistoryAction } = require('./src/lib/actions/billing-actions');

async function testPaymentLeakage() {
  console.log('🚨 CRITICAL SECURITY TEST - Payment History Leakage');
  console.log('='.repeat(60));
  
  // Test scenarios that could cause payment leakage
  const testCases = [
    { name: 'Empty string', email: '' },
    { name: 'Null value', email: null },
    { name: 'Undefined', email: undefined },
    { name: 'Whitespace only', email: '   ' },
    { name: 'Valid trial user', email: 'trial@example.com' },
    { name: 'Valid paid user', email: 'paid@example.com' },
    { name: 'Non-existent user', email: 'nonexistent@example.com' }
  ];

  for (const testCase of testCases) {
    console.log(`\n📧 Testing: ${testCase.name} (${testCase.email})`);
    console.log('-'.repeat(40));
    
    try {
      const result = await getBillingHistoryAction(testCase.email);
      
      console.log('✅ Result:');
      console.log(`   Success: ${result.success}`);
      console.log(`   History Count: ${result.history?.length || 0}`);
      console.log(`   Error: ${result.error || 'None'}`);
      
      // 🚨 SECURITY ALERT: If ANY user gets payment history when they shouldn't
      if (result.success && result.history && result.history.length > 0) {
        console.log('🚨 POTENTIAL SECURITY ISSUE: User received payment history!');
        console.log('   First payment preview:', {
          id: result.history[0].id?.substring(0, 10) + '...',
          amount: result.history[0].amount,
          email: result.history[0].email || 'No email in payment record'
        });
      }
      
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }

  console.log('\n🔍 ANALYSIS:');
  console.log('If any test case above shows payment history for invalid/trial users,');
  console.log('there is a CRITICAL SECURITY VULNERABILITY - user payment data is being leaked!');
}

// Test function to specifically check email filtering
async function testEmailFiltering() {
  console.log('\n🔍 EMAIL FILTERING TEST');
  console.log('='.repeat(40));
  
  // This should only work if we have a specific implementation to test
  console.log('This test requires manual verification:');
  console.log('1. Check if trial users see payment history');
  console.log('2. Check if different users see the same payments');
  console.log('3. Verify email matching logic in Razorpay service');
}

async function runSecurityAudit() {
  console.log('🛡️  PAYMENT HISTORY SECURITY AUDIT');
  console.log('=' .repeat(60));
  console.log('Date:', new Date().toISOString());
  console.log('Testing for payment history data leakage...\n');
  
  await testPaymentLeakage();
  await testEmailFiltering();
  
  console.log('\n🚨 IMMEDIATE ACTION REQUIRED:');
  console.log('1. Fix the userEmail validation in razorpay-service.ts');
  console.log('2. Add strict email verification');
  console.log('3. Ensure NO payments are returned for invalid emails');
  console.log('4. Test with actual user accounts');
}

// Export for manual testing
module.exports = { 
  testPaymentLeakage, 
  testEmailFiltering, 
  runSecurityAudit 
};

// Uncomment to run the audit
// runSecurityAudit().catch(console.error);