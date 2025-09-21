/**
 * Comprehensive database cleanup script to fix all date conversion issues
 * Converts string dates to proper Date objects in MongoDB
 */

require('dotenv').config({ path: './.env.local' });
const { MongoClient } = require('mongodb');

async function fixAllDateFields() {
  console.log('🔧 Starting database cleanup...');
  console.log('📍 Database URL:', process.env.DATABASE_URL ? 'Found' : 'Not found');

  const client = new MongoClient(process.env.DATABASE_URL || 'mongodb://localhost:27017/yogvaidya');

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Collections that may have date fields
    const collections = ['schedule', 'sessionBooking', 'user'];

    for (const collectionName of collections) {
      console.log(`🔧 Processing collection: ${collectionName}`);

      const collection = db.collection(collectionName);

      // Find all documents with string dates
      const documents = await collection.find({
        $or: [
          { scheduledTime: { $type: 'string' } },
          { scheduledAt: { $type: 'string' } },
          { createdAt: { $type: 'string' } },
          { updatedAt: { $type: 'string' } },
          { startTime: { $type: 'string' } },
          { endTime: { $type: 'string' } }
        ]
      }).toArray();

      console.log(`📊 Found ${documents.length} documents with string dates in ${collectionName}`);

      for (const doc of documents) {
        const updateFields = {};

        // Convert string dates to Date objects
        if (typeof doc.scheduledTime === 'string') {
          updateFields.scheduledTime = new Date(doc.scheduledTime);
        }
        if (typeof doc.scheduledAt === 'string') {
          updateFields.scheduledAt = new Date(doc.scheduledAt);
        }
        if (typeof doc.createdAt === 'string') {
          updateFields.createdAt = new Date(doc.createdAt);
        }
        if (typeof doc.updatedAt === 'string') {
          updateFields.updatedAt = new Date(doc.updatedAt);
        }
        if (typeof doc.startTime === 'string') {
          updateFields.startTime = new Date(doc.startTime);
        }
        if (typeof doc.endTime === 'string') {
          updateFields.endTime = new Date(doc.endTime);
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
          console.log(`✅ Fixed document ${doc._id} in ${collectionName}`);
        }
      }
    }

    console.log('🎉 Database cleanup completed successfully!');

  } catch (error) {
    console.error('❌ Error during database cleanup:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the cleanup
fixAllDateFields().catch(console.error);