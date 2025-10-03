#!/usr/bin/env tsx

/**
 * Script to check if sessionBooking collection is properly storing duration
 */

import { config } from 'dotenv';
import { prisma } from '../src/lib/config/prisma';

// Load environment variables
config({ path: '.env.local' });

async function checkSessionDuration() {
  try {
    console.log('🔍 Checking sessionBooking collection for duration storage...');

    // Get recent sessionBooking entries with raw query to avoid TypeScript issues
    const sessions = await prisma.sessionBooking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        timeSlot: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            sessionType: true
          }
        },
        schedule: {
          select: {
            id: true,
            scheduledTime: true,
            duration: true,
            sessionType: true
          }
        }
      }
    });

    console.log(`📋 Found ${sessions.length} sessionBooking entries:`);
    console.log('');

    sessions.forEach((session, index) => {
      console.log(`${index + 1}. Session ID: ${session.id}`);
      console.log(`   Duration: ${session.duration ?? 'NULL'} minutes`);
      console.log(`   Type: ${session.sessionType}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   TimeSlot ID: ${session.timeSlotId ?? 'NULL'}`);
      console.log(`   Schedule ID: ${session.scheduleId ?? 'NULL'}`);
      console.log(`   Scheduled: ${session.scheduledAt?.toISOString() ?? 'NULL'}`);
      console.log(`   Created: ${session.createdAt.toISOString()}`);
      
      if (session.timeSlot) {
        console.log(`   TimeSlot Info:`);
        console.log(`     Start: ${session.timeSlot.startTime?.toISOString() ?? 'NULL'}`);
        console.log(`     End: ${session.timeSlot.endTime?.toISOString() ?? 'NULL'}`);
        console.log(`     Type: ${session.timeSlot.sessionType}`);
        
        // Calculate duration from timeSlot if available
        if (session.timeSlot.startTime && session.timeSlot.endTime) {
          const calculatedDuration = Math.round(
            (session.timeSlot.endTime.getTime() - session.timeSlot.startTime.getTime()) / (1000 * 60)
          );
          console.log(`     Calculated Duration: ${calculatedDuration} minutes`);
        }
      }

      if (session.schedule) {
        console.log(`   Schedule Info:`);
        console.log(`     Scheduled Time: ${session.schedule.scheduledTime?.toISOString() ?? 'NULL'}`);
        console.log(`     Schedule Duration: ${session.schedule.duration ?? 'NULL'} minutes`);
        console.log(`     Type: ${session.schedule.sessionType}`);
      }
      
      console.log('---');
    });

    // Check for sessions missing duration
    const sessionsWithoutDuration = sessions.filter(s => s.duration === null || s.duration === undefined);
    console.log(`\n⚠️  Sessions without duration: ${sessionsWithoutDuration.length}/${sessions.length}`);

    if (sessionsWithoutDuration.length > 0) {
      console.log('Sessions missing duration:');
      sessionsWithoutDuration.forEach(session => {
        console.log(`  - ${session.id} (${session.sessionType}, created: ${session.createdAt.toISOString()})`);
      });
    }

    // Check for sessions with timeSlots but no duration
    const sessionsWithTimeSlotButNoDuration = sessions.filter(s => 
      s.timeSlotId && (s.duration === null || s.duration === undefined)
    );
    
    if (sessionsWithTimeSlotButNoDuration.length > 0) {
      console.log(`\n🔧 Sessions with timeSlot but no duration: ${sessionsWithTimeSlotButNoDuration.length}`);
      console.log('These should have duration populated from the timeSlot.');
    }

    // Check for sessions with schedules but no duration
    const sessionsWithScheduleButNoDuration = sessions.filter(s => 
      s.scheduleId && (s.duration === null || s.duration === undefined)
    );
    
    if (sessionsWithScheduleButNoDuration.length > 0) {
      console.log(`\n🔧 Sessions with schedule but no duration: ${sessionsWithScheduleButNoDuration.length}`);
      console.log('These should have duration populated from the schedule.');
    }

  } catch (error) {
    console.error('❌ Error checking session duration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the check
checkSessionDuration();