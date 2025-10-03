#!/usr/bin/env tsx

/**
 * Script to update existing sessionBooking records with duration field
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables  
config({ path: '.env.local' });

async function updateSessionDurations() {
  const client = new MongoClient(process.env.DATABASE_URL!);
  
  try {
    console.log('🔧 Updating sessionBooking records with duration...');
    
    await client.connect();
    const db = client.db();
    const sessionBookingCollection = db.collection('sessionBooking');
    const mentorTimeSlotCollection = db.collection('mentorTimeSlot');
    const scheduleCollection = db.collection('schedule');
    
    // Get all sessionBooking records without duration
    const sessions = await sessionBookingCollection
      .find({ duration: { $exists: false } })
      .toArray();

    console.log(`📋 Found ${sessions.length} sessions without duration`);

    let updatedCount = 0;
    
    for (const session of sessions) {
      let duration = null;
      
      // Try to get duration from timeSlot
      if (session.timeSlotId) {
        const timeSlot = await mentorTimeSlotCollection.findOne({ 
          _id: session.timeSlotId 
        });
        
        if (timeSlot && timeSlot.startTime && timeSlot.endTime) {
          duration = Math.round(
            (new Date(timeSlot.endTime).getTime() - new Date(timeSlot.startTime).getTime()) / (1000 * 60)
          );
          console.log(`⏱️  Session ${session._id}: calculated ${duration} minutes from timeSlot`);
        }
      }
      
      // Try to get duration from schedule
      else if (session.scheduleId) {
        const schedule = await scheduleCollection.findOne({ 
          _id: session.scheduleId 
        });
        
        if (schedule && schedule.duration) {
          duration = schedule.duration;
          console.log(`⏱️  Session ${session._id}: got ${duration} minutes from schedule`);
        }
      }
      
      // Set default duration for sessions without timeSlot or schedule
      if (duration === null) {
        duration = 60; // Default 1 hour
        console.log(`⏱️  Session ${session._id}: using default ${duration} minutes`);
      }
      
      // Update the session with duration
      await sessionBookingCollection.updateOne(
        { _id: session._id },
        { $set: { duration: duration } }
      );
      
      updatedCount++;
    }

    console.log(`\n✅ Successfully updated ${updatedCount} sessions with duration`);

    // Verify the updates
    const updatedSessions = await sessionBookingCollection
      .find({ duration: { $exists: true } })
      .limit(5)
      .toArray();

    console.log('\n📋 Sample updated sessions:');
    updatedSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session._id}: ${session.duration} minutes (${session.sessionType})`);
    });

  } catch (error) {
    console.error('❌ Error updating session durations:', error);
  } finally {
    await client.close();
  }
}

// Run the update
updateSessionDurations();