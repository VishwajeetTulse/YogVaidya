import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ApplicationRecord {
  id: string;
  experience: string | number; // Handle both types during migration
  name: string;
  email: string;
}

async function cleanupExperienceField(): Promise<void> {
  console.log('🧹 Starting experience field cleanup...');
  
  try {
    // First, get all mentor applications
    const applications = await prisma.mentorApplication.findMany({
      select: {
        id: true,
        experience: true,
        name: true,
        email: true
      }
    }) as unknown as ApplicationRecord[];
    
    console.log(`📊 Found ${applications.length} mentor applications to process`);
    
    let updated = 0;
    let deleted = 0;
    
    for (const app of applications) {
      const experienceStr = String(app.experience); // Convert to string for processing
      
      // Skip if already a number and valid
      if (typeof app.experience === 'number' && app.experience >= 0 && app.experience <= 50) {
        console.log(`✅ Already valid: ${app.name} (${app.email}): ${app.experience} years`);
        updated++;
        continue;
      }
      
      // Try to extract a number from the experience string
      const numberMatch = experienceStr.match(/(\d+)/);
      
      if (numberMatch) {
        const experienceNumber = parseInt(numberMatch[1], 10);
        
        // Only keep reasonable experience values (0-50 years)
        if (experienceNumber >= 0 && experienceNumber <= 50) {
          console.log(`✅ Updating ${app.name} (${app.email}): "${experienceStr}" -> ${experienceNumber}`);
          
          try {
            // Update with the numeric value using raw MongoDB query
            await prisma.$runCommandRaw({
              update: 'mentor_application',
              updates: [
                {
                  q: { _id: { $oid: app.id } },
                  u: { $set: { experience: experienceNumber } }
                }
              ]
            });
            updated++;
          } catch (updateError) {
            console.error(`⚠️ Failed to update ${app.name}: ${updateError}`);
            // If update fails, delete the record
            await prisma.mentorApplication.delete({
              where: { id: app.id }
            });
            deleted++;
          }
        } else {
          console.log(`❌ Deleting ${app.name} (${app.email}): Invalid experience value "${experienceStr}"`);
          
          // Delete records with unreasonable experience values
          await prisma.mentorApplication.delete({
            where: { id: app.id }
          });
          deleted++;
        }
      } else {
        console.log(`❌ Deleting ${app.name} (${app.email}): Cannot extract number from "${experienceStr}"`);
        
        // Delete records where we can't extract a number
        await prisma.mentorApplication.delete({
          where: { id: app.id }
        });
        deleted++;
      }
    }
    
    console.log(`\n🎉 Cleanup completed!`);
    console.log(`✅ Updated: ${updated} applications`);
    console.log(`❌ Deleted: ${deleted} applications`);
    console.log(`📝 Total processed: ${applications.length} applications`);
    
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
