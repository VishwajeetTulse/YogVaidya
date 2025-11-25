const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Attempting to connect to database...");
  try {
    await prisma.$connect();
    console.log("✅ Connected successfully to the database!");
    // Try a simple query to be sure
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful. User count: ${userCount}`);
  } catch (e) {
    console.error("❌ Connection failed:");
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
