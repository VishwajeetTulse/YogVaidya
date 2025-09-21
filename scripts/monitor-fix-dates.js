/**
 * Continuous database monitoring and cleanup script
 * Monitors for string dates and fixes them automatically
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient } = require('mongodb');

async function monitorAndFixDates() {
  const client = new MongoClient(process.env.DATABASE_URL);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB for monitoring');

    const db = client.db();

    // Monitor these collections
    const collections = ['schedule', 'sessionBooking', 'user'];

    while (true) {
      console.log(`🔍 Checking for string dates at ${new Date().toISOString()}`);

      for (const collectionName of collections) {
        const collection = db.collection(collectionName);

        // Find all documents with string dates
        const documents = await collection.find({
          $or: [
            { scheduledTime: { $type: 'string' } },
            { scheduledAt: { $type: 'string' } },
            { createdAt: { $type: 'string' } },
            { updatedAt: { $type: 'string' } },
            { startTime: { $type: 'string' } },
            { endTime: { $type: 'string' } },
            { manualStartTime: { $type: 'string' } },
            { actualEndTime: { $type: 'string' } }
          ]
        }).toArray();

        if (documents.length > 0) {
          console.log(`🚨 Found ${documents.length} documents with string dates in ${collectionName}`);

          for (const doc of documents) {
            const updateFields = {};

            // Convert string dates to Date objects
            const dateFields = ['scheduledTime', 'scheduledAt', 'createdAt', 'updatedAt', 'startTime', 'endTime', 'manualStartTime', 'actualEndTime'];

            for (const field of dateFields) {
              if (typeof doc[field] === 'string') {
                updateFields[field] = new Date(doc[field]);
                console.log(`   🔧 Converting ${field}: "${doc[field]}" -> ${updateFields[field].toISOString()}`);
              }
            }

            // Handle nested timeSlot objects
            if (doc.timeSlot && typeof doc.timeSlot === 'object') {
              const timeSlotUpdates = {};
              if (typeof doc.timeSlot.startTime === 'string') {
                timeSlotUpdates.startTime = new Date(doc.timeSlot.startTime);
              }
              if (typeof doc.timeSlot.endTime === 'string') {
                timeSlotUpdates.endTime = new Date(doc.timeSlot.endTime);
              }
              if (Object.keys(timeSlotUpdates).length > 0) {
                updateFields['timeSlot'] = { ...doc.timeSlot, ...timeSlotUpdates };
              }
            }

            if (Object.keys(updateFields).length > 0) {
              await collection.updateOne(
                { _id: doc._id },
                { $set: updateFields }
              );
              console.log(`   ✅ Fixed document ${doc._id} in ${collectionName}`);
            }
          }
        } else {
          console.log(`   ✅ No string dates found in ${collectionName}`);
        }
      }

      // Wait 30 seconds before next check
      console.log('⏳ Waiting 30 seconds before next check...\n');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }

  } catch (error) {
    console.error('❌ Error in monitoring script:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the monitoring script
monitorAndFixDates().catch(console.error);