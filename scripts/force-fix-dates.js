const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function forceFix() {
  console.log('🔧 Force fixing the remaining string date...\n');
  
  try {
    // Get the exact session details first
    const sessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (sessions && 
        typeof sessions === 'object' && 
        'cursor' in sessions &&
        sessions.cursor &&
        typeof sessions.cursor === 'object' &&
        'firstBatch' in sessions.cursor &&
        Array.isArray(sessions.cursor.firstBatch)) {
      
      for (const session of sessions.cursor.firstBatch) {
        console.log('Fixing session:', session._id);
        
        // Convert the string date to proper Date
        const stringDate = session.updatedAt;
        const properDate = new Date(stringDate);
        
        console.log(`Converting "${stringDate}" to Date object: ${properDate}`);
        
        // Use direct update with the date object
        const result = await prisma.$runCommandRaw({
          update: 'sessionBooking',
          updates: [{
            q: { _id: session._id },
            u: {
              $set: {
                updatedAt: properDate
              }
            }
          }]
        });
        
        console.log('Update result:', result);
      }
    }
    
    // Verify the fix
    console.log('\n🔍 Verification...');
    const verification = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { updatedAt: { $type: "string" } }
    });
    
    if (verification && 
        typeof verification === 'object' && 
        'cursor' in verification &&
        verification.cursor &&
        typeof verification.cursor === 'object' &&
        'firstBatch' in verification.cursor &&
        Array.isArray(verification.cursor.firstBatch)) {
      
      console.log(`Found ${verification.cursor.firstBatch.length} sessions with string updatedAt after fix`);
    }
    
  } catch (error) {
    console.error('Error in force fix:', error);
  } finally {
    await prisma.$disconnect();
  }
}

forceFix();