// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupExperienceField() {
  console.log('🧹 Starting experience field cleanup...');
  
  try {
    // Use raw MongoDB queries to bypass Prisma type checking
    console.log('📊 Fetching all mentor applications using raw query...');
    
    const applications = await prisma.$runCommandRaw({
      find: 'mentor_application',
      filter: {}
    });
    
    console.log(`📊 Found ${applications.cursor.firstBatch.length} mentor applications to process`);
    
    let updated = 0;
    let deleted = 0;
    
    for (const app of applications.cursor.firstBatch) {
      const experienceValue = app.experience;
      const appId = app._id.$oid;
      
      console.log(`\n📝 Processing: ${app.name} (${app.email})`);
      console.log(`   Current experience: ${JSON.stringify(experienceValue)} (type: ${typeof experienceValue})`);
      
      let finalExperience = null;
      
      // Handle different types of experience values
      if (typeof experienceValue === 'number') {
        // Already a number - check if valid
        if (experienceValue >= 0 && experienceValue <= 50) {
          console.log(`   ✅ Already valid number: ${experienceValue}`);
          updated++;
          continue;
        } else {
          console.log(`   ❌ Invalid number: ${experienceValue} (out of range 0-50)`);
        }
      } else if (typeof experienceValue === 'string') {
        // Try to extract number from string
        const numberMatch = experienceValue.match(/(\d+)/);
        if (numberMatch) {
          const extractedNumber = parseInt(numberMatch[1], 10);
          if (extractedNumber >= 0 && extractedNumber <= 50) {
            finalExperience = extractedNumber;
            console.log(`   ✅ Extracted valid number: "${experienceValue}" -> ${finalExperience}`);
          } else {
            console.log(`   ❌ Extracted invalid number: "${experienceValue}" -> ${extractedNumber} (out of range)`);
          }
        } else {
          console.log(`   ❌ Cannot extract number from: "${experienceValue}"`);
        }
      } else {
        console.log(`   ❌ Unknown type: ${typeof experienceValue}`);
      }
      
      if (finalExperience !== null) {
        // Update with valid number
        try {
          await prisma.$runCommandRaw({
            update: 'mentor_application',
            updates: [
              {
                q: { _id: { $oid: appId } },
                u: { $set: { experience: finalExperience } }
              }
            ]
          });
          console.log(`   ✅ Updated to: ${finalExperience}`);
          updated++;
        } catch (updateError) {
          console.log(`   ⚠️ Update failed: ${updateError.message}`);
          console.log(`   ❌ Deleting instead...`);
          await prisma.$runCommandRaw({
            delete: 'mentor_application',
            deletes: [
              { q: { _id: { $oid: appId } }, limit: 1 }
            ]
          });
          deleted++;
        }
      } else {
        // Delete invalid records
        console.log(`   ❌ Deleting invalid record...`);
        await prisma.$runCommandRaw({
          delete: 'mentor_application',
          deletes: [
            { q: { _id: { $oid: appId } }, limit: 1 }
          ]
        });
        deleted++;
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Updated: ${updated} applications`);
    console.log(`❌ Deleted: ${deleted} applications`);
    console.log(`📝 Total processed: ${applications.cursor.firstBatch.length} applications`);
    
  } catch (error) {
    console.error('💥 Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupExperienceField()
  .then(() => {
    console.log('🏁 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
