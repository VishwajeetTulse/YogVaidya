/**
 * Comprehensive Database Date Validation Script
 * Checks all collections for string dates that should be Date objects
 */

import { MongoClient } from 'mongodb';

async function validateDatabaseDates() {
  const uri = process.env.DATABASE_URL || 'mongodb+srv://shinderohann02:yoga-vaidya-db@yogavaidyadb.0gkejay.mongodb.net/yogavaidyadb?retryWrites=true&w=majority';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();

    // Collections to check
    const collections = ['schedule', 'sessionBooking', 'mentorTimeSlot', 'user'];

    for (const collectionName of collections) {
      console.log(`\n🔍 Checking collection: ${collectionName}`);

      const collection = db.collection(collectionName);

      // Check for string dates in common date fields
      const dateFields = ['createdAt', 'updatedAt', 'scheduledAt', 'scheduledTime', 'startTime', 'endTime'];

      for (const field of dateFields) {
        const count = await collection.countDocuments({
          [field]: { $type: 'string' }
        });

        if (count > 0) {
          console.log(`⚠️  Found ${count} documents with string values in ${field} field`);

          // Show a sample
          const sample = await collection.find({
            [field]: { $type: 'string' }
          }).limit(1).toArray();

          if (sample.length > 0) {
            console.log(`   Sample: ${field} = "${sample[0][field]}" in document ${sample[0]._id}`);
          }
        } else {
          console.log(`✅ ${field}: All values are proper Date objects`);
        }
      }
    }

    console.log('\n🎯 Date validation complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the validation
validateDatabaseDates().catch(console.error);