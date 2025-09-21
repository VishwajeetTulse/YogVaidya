/**
 * Proactive Date Fixer Script
 * Monitors and fixes any string dates that appear in session collections
 */

import { MongoClient } from 'mongodb';

async function fixAllStringDates() {
  const uri = process.env.DATABASE_URL || 'mongodb+srv://shinderohann02:yoga-vaidya-db@yogavaidyadb.0gkejay.mongodb.net/yogavaidyadb?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Collections and their date fields to monitor
    const collections = [
      { name: 'sessionBooking', dateFields: ['createdAt', 'updatedAt', 'scheduledAt', 'manualStartTime', 'actualEndTime'] },
      { name: 'schedule', dateFields: ['createdAt', 'updatedAt', 'scheduledTime'] },
      { name: 'mentorTimeSlot', dateFields: ['createdAt', 'updatedAt', 'startTime', 'endTime'] }
    ];

    for (const collectionInfo of collections) {
      const { name, dateFields } = collectionInfo;
      console.log(`\n🔍 Checking collection: ${name}`);

      const collection = db.collection(name);

      for (const field of dateFields) {
        // Find documents where the field is a string
        const stringDates = await collection.find({
          [field]: { $type: 'string' }
        }).toArray();

        if (stringDates.length > 0) {
          console.log(`⚠️ Found ${stringDates.length} documents with string values in ${field}`);

          let fixedCount = 0;
          for (const doc of stringDates) {
            try {
              const stringDate = doc[field];
              const dateObject = new Date(stringDate);

              if (!isNaN(dateObject.getTime())) {
                await collection.updateOne(
                  { _id: doc._id },
                  { $set: { [field]: dateObject } }
                );
                fixedCount++;
                console.log(`✅ Fixed ${field} for document ${doc._id}`);
              } else {
                console.warn(`⚠️ Invalid date string for document ${doc._id}: "${stringDate}"`);
              }
            } catch (error) {
              console.error(`❌ Error fixing document ${doc._id}:`, error);
            }
          }

          console.log(`✅ Fixed ${fixedCount} ${field} fields`);
        } else {
          console.log(`✅ ${field}: All values are proper Date objects`);
        }
      }
    }

    console.log('\n🎯 Proactive date fixing complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the proactive fixer
fixAllStringDates().catch(console.error);