/**
 * Fix Schedule Collection Date Fields
 * Converts string dates to Date objects for updatedAt field
 */

import { MongoClient } from 'mongodb';

async function fixScheduleDates() {
  const uri = process.env.DATABASE_URL || 'mongodb+srv://shinderohann02:yoga-vaidya-db@yogavaidyadb.0gkejay.mongodb.net/yogavaidyadb?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const scheduleCollection = db.collection('schedule');

    // Find all documents where updatedAt is a string
    const documentsWithStringDates = await scheduleCollection.find({
      updatedAt: { $type: 'string' }
    }).toArray();

    console.log(`📊 Found ${documentsWithStringDates.length} documents with string updatedAt values`);

    if (documentsWithStringDates.length === 0) {
      console.log('✅ No documents need fixing');
      return;
    }

    // Update each document
    let fixedCount = 0;
    for (const doc of documentsWithStringDates) {
      try {
        const stringDate = doc.updatedAt;
        const dateObject = new Date(stringDate);

        if (!isNaN(dateObject.getTime())) {
          await scheduleCollection.updateOne(
            { _id: doc._id },
            {
              $set: {
                updatedAt: dateObject,
                // Also fix createdAt if it's a string
                ...(typeof doc.createdAt === 'string' ? { createdAt: new Date(doc.createdAt) } : {})
              }
            }
          );
          fixedCount++;
          console.log(`✅ Fixed document ${doc._id}: "${stringDate}" -> ${dateObject.toISOString()}`);
        } else {
          console.warn(`⚠️ Invalid date string for document ${doc._id}: "${stringDate}"`);
        }
      } catch (error) {
        console.error(`❌ Error fixing document ${doc._id}:`, error);
      }
    }

    console.log(`✅ Fixed ${fixedCount} documents`);

    // Also check for scheduledTime issues
    const documentsWithStringScheduledTime = await scheduleCollection.find({
      scheduledTime: { $type: 'string' }
    }).toArray();

    console.log(`📊 Found ${documentsWithStringScheduledTime.length} documents with string scheduledTime values`);

    let fixedScheduledTimeCount = 0;
    for (const doc of documentsWithStringScheduledTime) {
      try {
        const stringDate = doc.scheduledTime;
        const dateObject = new Date(stringDate);

        if (!isNaN(dateObject.getTime())) {
          await scheduleCollection.updateOne(
            { _id: doc._id },
            { $set: { scheduledTime: dateObject } }
          );
          fixedScheduledTimeCount++;
          console.log(`✅ Fixed scheduledTime for document ${doc._id}: "${stringDate}" -> ${dateObject.toISOString()}`);
        } else {
          console.warn(`⚠️ Invalid scheduledTime string for document ${doc._id}: "${stringDate}"`);
        }
      } catch (error) {
        console.error(`❌ Error fixing scheduledTime for document ${doc._id}:`, error);
      }
    }

    console.log(`✅ Fixed ${fixedScheduledTimeCount} scheduledTime fields`);

    // Verify the fixes
    const remainingStringDates = await scheduleCollection.countDocuments({
      $or: [
        { updatedAt: { $type: 'string' } },
        { createdAt: { $type: 'string' } },
        { scheduledTime: { $type: 'string' } }
      ]
    });

    console.log(`📊 Remaining documents with string dates: ${remainingStringDates}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the fix
fixScheduleDates().catch(console.error);