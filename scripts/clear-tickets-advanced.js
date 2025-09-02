// Advanced ticket cleanup script with filtering options
require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Ticket status enum
const TicketStatus = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_USER: 'WAITING_FOR_USER',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED'
};

// Log bulk delete operation
async function logBulkDelete(deletedCount, criteria, userId = 'system') {
  try {
    await prisma.systemLog.create({
      data: {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36),
        userId: userId,
        action: 'TICKETS_BULK_DELETED',
        category: 'TICKET',
        level: 'WARNING',
        details: `Bulk deleted ${deletedCount} tickets with criteria: ${criteria}`,
        metadata: {
          deletedCount,
          deletionCriteria: criteria,
          deletedBy: userId,
          scriptExecution: true,
          timestamp: new Date().toISOString()
        },
        timestamp: new Date()
      }
    });
    console.log('📝 Logged bulk delete operation to system logs');
  } catch (logError) {
    console.warn(`⚠️  Failed to log bulk delete operation: ${logError.message}`);
  }
}

async function clearTickets(options = {}) {
  const {
    status = null,           // Filter by status
    olderThan = null,        // Delete tickets older than X days
    category = null,         // Filter by category
    unassignedOnly = false,  // Only delete unassigned tickets
    dryRun = false          // Preview what would be deleted
  } = options;
  
  console.log('🎫 Starting advanced ticket cleanup...');
  
  try {
    // Build filter conditions
    const where = {};
    
    if (status) {
      where.status = status;
      console.log(`🔍 Filtering by status: ${status}`);
    }
    
    if (olderThan) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThan);
      where.createdAt = { lt: cutoffDate };
      console.log(`📅 Filtering tickets older than: ${cutoffDate.toISOString()}`);
    }
    
    if (category) {
      where.category = category;
      console.log(`📂 Filtering by category: ${category}`);
    }
    
    if (unassignedOnly) {
      where.assignedToId = null;
      console.log('👤 Filtering unassigned tickets only');
    }
    
    // Get tickets that match criteria
    const ticketsToDelete = await prisma.ticket.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        category: true,
        createdAt: true,
        assignedToId: true,
        title: true
      }
    });
    
    console.log(`📊 Found ${ticketsToDelete.length} tickets matching criteria`);
    
    if (ticketsToDelete.length === 0) {
      console.log('✅ No tickets match the specified criteria');
      return { deleted: 0, tickets: [] };
    }
    
    // Show preview of what will be deleted
    console.log('\n📋 Tickets to be deleted:');
    ticketsToDelete.forEach((ticket, index) => {
      console.log(`${index + 1}. #${ticket.ticketNumber} - ${ticket.title} (${ticket.status}) - ${ticket.createdAt.toISOString()}`);
    });
    
    if (dryRun) {
      console.log('\n🔍 DRY RUN: No tickets were actually deleted');
      return { deleted: 0, tickets: ticketsToDelete };
    }
    
    console.log('\n⚠️  Proceeding with deletion...');
    
    // Delete tickets
    const deleteResult = await prisma.ticket.deleteMany({ where });
    
    console.log(`✅ Successfully deleted ${deleteResult.count} tickets`);
    
    // Log the bulk delete operation
    const criteriaDescription = Object.entries(where)
      .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
      .join(', ') || 'all tickets';
    
    await logBulkDelete(deleteResult.count, criteriaDescription);
    
    return { deleted: deleteResult.count, tickets: ticketsToDelete };
    
  } catch (error) {
    console.error('💥 Error during ticket cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Predefined cleanup functions
async function clearAllTickets() {
  console.log('🧹 Clearing ALL tickets...');
  return await clearTickets();
}

async function clearResolvedTickets() {
  console.log('✅ Clearing resolved tickets...');
  return await clearTickets({ status: TicketStatus.RESOLVED });
}

async function clearClosedTickets() {
  console.log('🔒 Clearing closed tickets...');
  return await clearTickets({ status: TicketStatus.CLOSED });
}

async function clearOldTickets(days = 30) {
  console.log(`📅 Clearing tickets older than ${days} days...`);
  return await clearTickets({ olderThan: days });
}

async function clearUnassignedTickets() {
  console.log('👤 Clearing unassigned tickets...');
  return await clearTickets({ unassignedOnly: true });
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🎫 YogVaidya Ticket Cleanup Utility');
  console.log('===================================\n');
  
  try {
    let result;
    
    switch (command) {
      case 'all':
        result = await clearAllTickets();
        break;
        
      case 'resolved':
        result = await clearResolvedTickets();
        break;
        
      case 'closed':
        result = await clearClosedTickets();
        break;
        
      case 'old':
        const days = parseInt(args[1]) || 30;
        result = await clearOldTickets(days);
        break;
        
      case 'unassigned':
        result = await clearUnassignedTickets();
        break;
        
      case 'preview':
        // Dry run to show what would be deleted
        const previewOptions = {};
        if (args[1]) previewOptions.status = args[1];
        result = await clearTickets({ ...previewOptions, dryRun: true });
        break;
        
      default:
        console.log('📖 Usage:');
        console.log('  node clear-tickets-advanced.js all           - Clear all tickets');
        console.log('  node clear-tickets-advanced.js resolved      - Clear resolved tickets');
        console.log('  node clear-tickets-advanced.js closed        - Clear closed tickets');
        console.log('  node clear-tickets-advanced.js old [days]    - Clear tickets older than X days (default: 30)');
        console.log('  node clear-tickets-advanced.js unassigned    - Clear unassigned tickets');
        console.log('  node clear-tickets-advanced.js preview [status] - Preview what would be deleted');
        console.log('\n📝 Examples:');
        console.log('  node clear-tickets-advanced.js old 7         - Clear tickets older than 7 days');
        console.log('  node clear-tickets-advanced.js preview RESOLVED - Preview resolved tickets');
        return;
    }
    
    console.log(`\n🏁 Cleanup completed. Deleted ${result.deleted} tickets.`);
    
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    process.exit(1);
  }
}

// Export functions for use in other scripts
module.exports = {
  clearTickets,
  clearAllTickets,
  clearResolvedTickets,
  clearClosedTickets,
  clearOldTickets,
  clearUnassignedTickets
};

// Run if called directly
if (require.main === module) {
  main();
}
