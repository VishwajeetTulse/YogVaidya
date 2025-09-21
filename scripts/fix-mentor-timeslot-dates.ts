/**
 * Fix MentorTimeSlot Collection Date Fields
 * Converts string dates to Date objects for all date fields
 */

import { MongoClient } from 'mongodb';

async function fixMentorTimeSlotDates() {
  const uri = process.env.DATABASE_URL || 'mongodb+srv://shinderohann02:yoga-vaidya-db@yogavaidyadb.0gkejay.mongodb.net/yogavaidyadb?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const timeSlotCollection = db.collection('mentorTimeSlot');

    // Date fields to fix
    const dateFields = ['createdAt', 'updatedAt', 'startTime', 'endTime'];

    for (const field of dateFields) {
      console.log(`\n🔧 Fixing ${field} field...`);

      // Find all documents where the field is a string
      const documentsWithStringDates = await timeSlotCollection.find({
        [field]: { $type: 'string' }
      }).toArray();

      console.log(`📊 Found ${documentsWithStringDates.length} documents with string ${field} values`);

      let fixedCount = 0;
      for (const doc of documentsWithStringDates) {
        try {
          const stringDate = doc[field];
          const dateObject = new Date(stringDate);

          if (!isNaN(dateObject.getTime())) {
            await timeSlotCollection.updateOne(
              { _id: doc._id },
              { $set: { [field]: dateObject } }
            );
            fixedCount++;
          } else {
            console.warn(`⚠️ Invalid date string for document ${doc._id}: "${stringDate}"`);
          }
        } catch (error) {
          console.error(`❌ Error fixing document ${doc._id}:`, error);
        }
      }

      console.log(`✅ Fixed ${fixedCount} ${field} fields`);
    }

    // Verify the fixes
    const remainingStringDates = await timeSlotCollection.countDocuments({
      $or: [
        { createdAt: { $type: 'string' } },
        { updatedAt: { $type: 'string' } },
        { startTime: { $type: 'string' } },
        { endTime: { $type: 'string' } }
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
fixMentorTimeSlotDates().catch(console.error);