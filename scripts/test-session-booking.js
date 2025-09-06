// Test script to check session booking creation
const { MongoClient } = require('mongodb');

async function checkSessionBookings() {
  const client = new MongoClient('mongodb://localhost:27017');
  
  try {
    await client.connect();
    const db = client.db('yogvaidya');
    
    console.log('🔍 Checking session bookings...');
    
    // Check session bookings
    const sessionBookings = await db.collection('sessionBooking').find({}).toArray();
    console.log(`📊 Found ${sessionBookings.length} session bookings total`);
    
    // Filter by mentor
    const mentorId = 'p27belqfkUe1sppnuFpG4nSupFZj8Fme';
    const mentorBookings = sessionBookings.filter(booking => booking.mentorId === mentorId);
    console.log(`👨‍🏫 Found ${mentorBookings.length} bookings for mentor ${mentorId}`);
    
    // Show recent bookings
    const recentBookings = sessionBookings
      .filter(booking => booking.createdAt && new Date(booking.createdAt) > new Date('2025-09-06'))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
    console.log(`📅 Recent bookings (today): ${recentBookings.length}`);
    
    if (recentBookings.length > 0) {
      console.log('\n📋 Recent booking details:');
      recentBookings.forEach(booking => {
        console.log(`- ID: ${booking._id}`);
        console.log(`- User: ${booking.userId}`);
        console.log(`- Mentor: ${booking.mentorId}`);
        console.log(`- TimeSlot: ${booking.timeSlotId || 'N/A'}`);
        console.log(`- Status: ${booking.status}`);
        console.log(`- Payment Status: ${booking.paymentStatus || 'N/A'}`);
        console.log(`- Created: ${booking.createdAt}`);
        console.log('---');
      });
    }
    
    // Check time slots
    const timeSlots = await db.collection('mentorTimeSlot').find({ mentorId }).toArray();
    console.log(`\n🕐 Found ${timeSlots.length} time slots for mentor`);
    
    if (timeSlots.length > 0) {
      console.log('\n📅 Time slot details:');
      timeSlots.forEach(slot => {
        console.log(`- ID: ${slot._id}`);
        console.log(`- Start: ${slot.startTime}`);
        console.log(`- Students: ${slot.currentStudents}/${slot.maxStudents}`);
        console.log(`- Active: ${slot.isActive}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSessionBookings();
