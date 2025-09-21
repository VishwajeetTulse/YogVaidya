const { MongoClient } = require('mongodb');

async function fixCorruptedDatetimeData() {
  console.log('🔧 Fixing corrupted datetime data in Schedule collection using MongoDB driver...');

  const uri = process.env.DATABASE_URL || "mongodb+srv://shinderohann02:yoga-vaidya-db@yogavaidyadb.0gkejay.mongodb.net/yogavaidyadb?retryWrites=true&w=majority";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db('yogavaidyadb');
    const schedulesCollection = db.collection('schedule');

    // Find all documents with corrupted datetime fields
    const corruptedSchedules = await schedulesCollection.find({
      $or: [
        { updatedAt: { $type: 'string' } },
        { createdAt: { $type: 'string' } }
      ]
    }).toArray();

    console.log(`📊 Found ${corruptedSchedules.length} schedules with corrupted datetime data`);

    let fixedCount = 0;

    for (const schedule of corruptedSchedules) {
      const updateData = {};

      // Fix updatedAt if it's a string
      if (typeof schedule.updatedAt === 'string') {
        updateData.updatedAt = new Date(schedule.updatedAt);
        console.log(`🔧 Fixing updatedAt for schedule ${schedule._id}: ${schedule.updatedAt} -> ${updateData.updatedAt}`);
      }

      // Fix createdAt if it's a string
      if (typeof schedule.createdAt === 'string') {
        updateData.createdAt = new Date(schedule.createdAt);
        console.log(`🔧 Fixing createdAt for schedule ${schedule._id}: ${schedule.createdAt} -> ${updateData.createdAt}`);
      }

      // Update the document
      if (Object.keys(updateData).length > 0) {
        await schedulesCollection.updateOne(
          { _id: schedule._id },
          { $set: updateData }
        );
        fixedCount++;
        console.log(`✅ Fixed schedule ${schedule._id}`);
      }
    }

    console.log(`🎉 Fixed ${fixedCount} corrupted datetime records`);

    // Verify the fix
    console.log('\n🔍 Verifying fix...');
    const testSchedule = await schedulesCollection.findOne({});
    if (testSchedule) {
      console.log('✅ Test document found');
      console.log(`   Schedule ID: ${testSchedule._id}`);
      console.log(`   Created At: ${testSchedule.createdAt} (${typeof testSchedule.createdAt})`);
      console.log(`   Updated At: ${testSchedule.updatedAt} (${typeof testSchedule.updatedAt})`);
    }

  } catch (error) {
    console.error('❌ Error fixing corrupted data:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixCorruptedDatetimeData()
  .then(() => {
    console.log('\n✅ Datetime data fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });