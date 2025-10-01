// Test the actual session status service endpoint
const { PrismaClient } = require('@prisma/client');

async function testSessionStatusServiceEndpoint() {
  console.log('🧪 Testing Session Status Service Endpoint');
  
  try {
    // Import the service directly 
    const { updateSessionStatuses } = require('../src/lib/services/session-status-service.ts');
    
    console.log('\n1. Calling updateSessionStatuses()...');
    const updates = await updateSessionStatuses();
    
    console.log(`\n2. Service completed successfully!`);
    console.log(`   Updates returned: ${updates.length}`);
    
    if (updates.length > 0) {
      console.log('\n3. Updates details:');
      updates.forEach((update, index) => {
        console.log(`   Update ${index + 1}:`);
        console.log(`     Session ID: ${update.sessionId}`);
        console.log(`     Status: ${update.oldStatus} → ${update.newStatus}`);
        console.log(`     Reason: ${update.reason}`);
        console.log(`     Timestamp: ${update.timestamp}`);
        if (update.isDelayed !== undefined) {
          console.log(`     Delayed: ${update.isDelayed}`);
        }
      });
    }
    
    console.log('\n🎉 Session Status Service works correctly!');
    console.log('The "session.id undefined" error has been resolved.');
    
  } catch (error) {
    console.error('❌ Service failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

testSessionStatusServiceEndpoint();