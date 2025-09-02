// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearAllTickets() {
  console.log('🎫 Starting ticket cleanup process...');
  
  try {
    // Get count of tickets before deletion
    const ticketCount = await prisma.ticket.count();
    console.log(`📊 Found ${ticketCount} tickets in database`);
    
    if (ticketCount === 0) {
      console.log('✅ No tickets to clear');
      return;
    }

    // Confirm deletion
    console.log('⚠️  This will permanently delete ALL tickets from the database');
    console.log('🔄 Proceeding with deletion...');
    
    // Delete all tickets using Prisma
    const deleteResult = await prisma.ticket.deleteMany({});
    
    console.log(`✅ Successfully deleted ${deleteResult.count} tickets`);
    console.log('🧹 Ticket database cleared successfully');
    
    // Verify deletion
    const remainingCount = await prisma.ticket.count();
    console.log(`📋 Remaining tickets: ${remainingCount}`);
    
    if (remainingCount === 0) {
      console.log('🎉 All tickets successfully removed from database');
    } else {
      console.log('⚠️  Some tickets may still remain');
    }
    
  } catch (error) {
    console.error('💥 Error during ticket cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the script
if (require.main === module) {
  clearAllTickets()
    .then(() => {
      console.log('🏁 Ticket cleanup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Ticket cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = clearAllTickets;
