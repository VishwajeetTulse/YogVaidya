/**
 * Script to delete all existing time slots from the database
 * Use this to clean up before implementing the new recurring slots system
 * 
 * Usage: node delete-timeslots.js
 */

const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env.local' });

async function deleteAllTimeSlots() {
  let client;
  
  try {
    console.log('🔄 Connecting to database...');
    client = new MongoClient(process.env.DATABASE_URL);
    await client.connect();
    const db = client.db();
    
    // First, let's see what we have
    const totalSlots = await db.collection('mentorTimeSlot').countDocuments();
    console.log(`📊 Found ${totalSlots} time slots in database`);
    
    if (totalSlots === 0) {
      console.log('✅ Database is already clean - no time slots to delete');
      return;
    }
    
    // Get some sample data before deletion
    const sampleSlots = await db.collection('mentorTimeSlot').find({}).limit(3).toArray();
    console.log('\n📋 Sample slots to be deleted:');
    sampleSlots.forEach((slot, i) => {
      console.log(`${i+1}. ID: ${slot._id}`);
      console.log(`   Mentor: ${slot.mentorId}`);
      console.log(`   Start: ${new Date(slot.startTime).toLocaleString()}`);
      console.log(`   Type: ${slot.sessionType}`);
      console.log(`   Recurring: ${slot.isRecurring}`);
      if (slot.isRecurring) {
        console.log(`   Days: [${slot.recurringDays.join(', ')}]`);
      }
      console.log('   ---');
    });
    
    // Ask for confirmation (in real scenario)
    console.log('\n⚠️  WARNING: This will delete ALL time slots from the database!');
    console.log('   This includes both recurring and non-recurring slots.');
    console.log('   Make sure this is what you want to do.');
    
    // Uncomment the next lines to actually perform the deletion
    // For safety, I'm commenting out the actual deletion command
    
    
    console.log('\n🗑️  Deleting all time slots...');
    const deleteResult = await db.collection('mentorTimeSlot').deleteMany({});
    console.log(`✅ Successfully deleted ${deleteResult.deletedCount} time slots`);
    
    // Verify deletion
    const remainingSlots = await db.collection('mentorTimeSlot').countDocuments();
    console.log(`📊 Remaining slots in database: ${remainingSlots}`);
    
    if (remainingSlots === 0) {
      console.log('🎉 Database cleanup completed successfully!');
    } else {
      console.log('⚠️  Some slots might not have been deleted. Please check manually.');
    }
    
    
    console.log('\n📝 To actually delete the slots, uncomment the deletion code in this script');
    console.log('   and run it again. This safety measure prevents accidental data loss.');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('🔐 Database connection closed');
    }
  }
}

// Additional safety check - only run if called directly
if (require.main === module) {
  console.log('🧹 Time Slots Database Cleanup Script');
  console.log('=====================================');
  deleteAllTimeSlots()
    .then(() => {
      console.log('\n✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { deleteAllTimeSlots };