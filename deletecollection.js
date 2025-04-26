// deletecollection.js
// Script to delete all documents from all collections in your MongoDB database

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function main() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const collections = await db.collections();
    for (const collection of collections) {
      const name = collection.collectionName;
      const result = await collection.deleteMany({});
      console.log(`Deleted ${result.deletedCount} documents from ${name}`);
    }
    console.log('All collections wiped.');
  } catch (err) {
    console.error('Error wiping collections:', err);
  } finally {
    await client.close();
  }
}

main();
