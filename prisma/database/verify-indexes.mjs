/**
 * Verify Database Indexes
 * Check which indexes exist and their efficiency
 * 
 * Usage: node prisma/verify-indexes.mjs
 */

import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;
const dbName = MONGODB_URI.split('/').pop()?.split('?')[0] || 'yogavaidyadb';

const client = new MongoClient(MONGODB_URI);

async function verifyIndexes() {
  try {
    await client.connect();
    console.log('🔗 Connected to MongoDB\n');

    const db = client.db(dbName);

    const collections = [
      'user',
      'session',
      'mentor_application',
      'mentorTimeSlot',
      'sessionBooking',
      'systemLog',
      'ticket',
      'dietPlan',
      'schedule'
    ];

    for (const collectionName of collections) {
      console.log(`📊 ${collectionName}:`);
      const indexes = await db.collection(collectionName).indexes();
      console.log(`  Total indexes: ${indexes.length}`);
      
      indexes.forEach((index, i) => {
        const keys = Object.keys(index.key).map(k => `${k}:${index.key[k]}`).join(', ');
        console.log(`  ${i + 1}. ${index.name} (${keys})`);
      });
      console.log('');
    }

    console.log('✅ Index verification complete!\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

verifyIndexes();
