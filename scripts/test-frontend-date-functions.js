// Test the frontend date formatting functions
const { PrismaClient } = require('@prisma/client');

// Mock the date formatting functions from MentorTimeSlotBrowser
function formatDateTime(dateInput) {
  let date;
  
  if (typeof dateInput === 'string') {
    date = new Date(dateInput);
  } else if (dateInput && typeof dateInput === 'object' && dateInput.$date) {
    // Handle MongoDB Extended JSON format
    date = new Date(dateInput.$date);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    console.error('Invalid date input:', dateInput);
    return 'Invalid Date';
  }
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date created from:', dateInput);
    return 'Invalid Date';
  }
  
  return date.toLocaleString('en-IN', {
    weekday: 'short',
    year: 'numeric', 
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

function getDuration(startInput, endInput) {
  let startDate, endDate;
  
  // Handle different date formats for start time
  if (typeof startInput === 'string') {
    startDate = new Date(startInput);
  } else if (startInput && typeof startInput === 'object' && startInput.$date) {
    startDate = new Date(startInput.$date);
  } else if (startInput instanceof Date) {
    startDate = startInput;
  } else {
    return 'Invalid Duration';
  }
  
  // Handle different date formats for end time  
  if (typeof endInput === 'string') {
    endDate = new Date(endInput);
  } else if (endInput && typeof endInput === 'object' && endInput.$date) {
    endDate = new Date(endInput.$date);
  } else if (endInput instanceof Date) {
    endDate = endInput;
  } else {
    return 'Invalid Duration';
  }
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Invalid Duration';
  }
  
  const diffMs = endDate - startDate;
  const diffMins = Math.round(diffMs / (1000 * 60));
  
  if (diffMins < 60) {
    return `${diffMins} mins`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}

async function testFrontendFunctions() {
  console.log('🧪 Testing Frontend Date Functions');
  
  const prisma = new PrismaClient();
  
  try {
    // Get raw timeslot data to test with
    const rawSlots = await prisma.$runCommandRaw({
      find: 'MentorTimeSlot',
      filter: {},
      limit: 2
    });
    
    console.log('\n1. Testing with raw MongoDB Extended JSON format:');
    rawSlots.cursor.firstBatch.forEach((slot, index) => {
      console.log(`\n   Slot ${index + 1}:`);
      console.log(`     Raw startTime:`, slot.startTime);
      console.log(`     Raw endTime:`, slot.endTime);
      
      const formattedStart = formatDateTime(slot.startTime);
      const formattedEnd = formatDateTime(slot.endTime);
      const duration = getDuration(slot.startTime, slot.endTime);
      
      console.log(`     Formatted start: ${formattedStart}`);
      console.log(`     Formatted end: ${formattedEnd}`);
      console.log(`     Duration: ${duration}`);
    });
    
    console.log('\n2. Testing with ISO string format:');
    rawSlots.cursor.firstBatch.forEach((slot, index) => {
      console.log(`\n   Slot ${index + 1} (converted to strings):`);
      const startString = slot.startTime.$date;
      const endString = slot.endTime.$date;
      
      console.log(`     String startTime: ${startString}`);
      console.log(`     String endTime: ${endString}`);
      
      const formattedStart = formatDateTime(startString);
      const formattedEnd = formatDateTime(endString);
      const duration = getDuration(startString, endString);
      
      console.log(`     Formatted start: ${formattedStart}`);
      console.log(`     Formatted end: ${formattedEnd}`);
      console.log(`     Duration: ${duration}`);
    });
    
    console.log('\n3. Testing with Date objects:');
    rawSlots.cursor.firstBatch.forEach((slot, index) => {
      console.log(`\n   Slot ${index + 1} (Date objects):`);
      const startDate = new Date(slot.startTime.$date);
      const endDate = new Date(slot.endTime.$date);
      
      console.log(`     Date startTime:`, startDate);
      console.log(`     Date endTime:`, endDate);
      
      const formattedStart = formatDateTime(startDate);
      const formattedEnd = formatDateTime(endDate);
      const duration = getDuration(startDate, endDate);
      
      console.log(`     Formatted start: ${formattedStart}`);
      console.log(`     Formatted end: ${formattedEnd}`);
      console.log(`     Duration: ${duration}`);
    });
    
  } catch (error) {
    console.error('Error testing frontend functions:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFrontendFunctions();