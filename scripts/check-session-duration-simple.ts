#!/usr/bin/env tsx

/**
 * Simple script to check sessionBooking collection data using MongoDB native query
 */

import { config } from 'dotenv';
import { MongoClient } from 'mongodb';

// Load environment variables
config({ path: '.env.local' });

async function checkSessionDurationSimple() {
  const client = new MongoClient(process.env.DATABASE_URL!);
  
  try {
    console.log('🔍 Checking sessionBooking collection for duration storage...');
    
    await client.connect();
    const db = client.db();
    const collection = db.collection('sessionBooking');
    
    // Get recent sessions
    const sessions = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    console.log(`📋 Found ${sessions.length} sessionBooking entries:`);
    console.log('');

    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session._id}`);
      console.log(`   Duration: ${session.duration ?? 'NULL'} minutes`);
      console.log(`   Type: ${session.sessionType}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   TimeSlot ID: ${session.timeSlotId ?? 'NULL'}`);
      console.log(`   Schedule ID: ${session.scheduleId ?? 'NULL'}`);
      console.log(`   Scheduled: ${session.scheduledAt ?? 'NULL'}`);
      console.log(`   Created: ${session.createdAt ?? 'NULL'}`);
      console.log('---');
    });

    // Count sessions without duration
    const sessionsWithoutDuration = sessions.filter(s => s.duration === null || s.duration === undefined);
    console.log(`\n⚠️  Sessions without duration: ${sessionsWithoutDuration.length}/${sessions.length}`);

    if (sessionsWithoutDuration.length > 0) {
      console.log('Sessions missing duration:');
      sessionsWithoutDuration.forEach(session => {
        console.log(`  - ${session._id} (${session.sessionType}, timeSlotId: ${session.timeSlotId ?? 'NULL'}, scheduleId: ${session.scheduleId ?? 'NULL'})`);
      });
    }

    // Check sessions with timeSlotId but no duration
    const sessionsWithTimeSlotButNoDuration = sessions.filter(s => 
      s.timeSlotId && (s.duration === null || s.duration === undefined)
    );
    
    if (sessionsWithTimeSlotButNoDuration.length > 0) {
      console.log(`\n🔧 Sessions with timeSlot but no duration: ${sessionsWithTimeSlotButNoDuration.length}`);
      console.log('These should have duration populated from the timeSlot.');
    }

    // Check sessions with scheduleId but no duration
    const sessionsWithScheduleButNoDuration = sessions.filter(s => 
      s.scheduleId && (s.duration === null || s.duration === undefined)
    );
    
    if (sessionsWithScheduleButNoDuration.length > 0) {
      console.log(`\n🔧 Sessions with schedule but no duration: ${sessionsWithScheduleButNoDuration.length}`);
      console.log('These should have duration populated from the schedule.');
    }

    // Summary
    console.log(`\n📊 Summary:`);
    console.log(`   Total sessions: ${sessions.length}`);
    console.log(`   Sessions with duration: ${sessions.length - sessionsWithoutDuration.length}`);
    console.log(`   Sessions without duration: ${sessionsWithoutDuration.length}`);
    console.log(`   Sessions linked to timeSlots: ${sessions.filter(s => s.timeSlotId).length}`);
    console.log(`   Sessions linked to schedules: ${sessions.filter(s => s.scheduleId).length}`);

  } catch (error) {
    console.error('❌ Error checking session duration:', error);
  } finally {
    await client.close();
  }
}

// Run the check
checkSessionDurationSimple();