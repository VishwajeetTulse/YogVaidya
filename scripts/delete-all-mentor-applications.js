// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllMentorApplications() {
  console.log('🗑️ Deleting all mentor applications due to data type conflicts...');
  
  try {
    // Use raw MongoDB command to delete all mentor applications
    const result = await prisma.$runCommandRaw({
      delete: 'mentor_application',
      deletes: [
        { q: {}, limit: 0 } // Delete all documents
      ]
    });
    
    console.log(`✅ Deleted all mentor applications`);
    console.log(`📝 Result:`, result);
    
    console.log('\n📋 This allows users to resubmit applications with the new number format.');
    
  } catch (error) {
    console.error('💥 Error during deletion:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deletion
deleteAllMentorApplications()
  .then(() => {
    console.log('🏁 All mentor applications deleted successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Deletion failed:', error);
    process.exit(1);
  });
