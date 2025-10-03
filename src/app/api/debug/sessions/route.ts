import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/config/prisma";
import { convertMongoDate, mongoDateToISOString } from "@/lib/utils/datetime-utils";

/**
 * GET /api/debug/sessions
 * Debug sessions to understand the "Session not found" error
 */
export async function GET() {
  try {
    console.log('🔍 Deep debugging session data structure...');

    // 1. Check sessionBooking collection
    const recentSessions = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      sort: { createdAt: -1 },
      limit: 5
    });

    let sessionsData: any[] = [];
    if (recentSessions && 
        typeof recentSessions === 'object' && 
        'cursor' in recentSessions &&
        recentSessions.cursor &&
        typeof recentSessions.cursor === 'object' &&
        'firstBatch' in recentSessions.cursor &&
        Array.isArray(recentSessions.cursor.firstBatch)) {
      sessionsData = recentSessions.cursor.firstBatch;
    }

    // 2. Check schedule collection
    const scheduleEntries = await prisma.$runCommandRaw({
      find: 'schedule',
      sort: { createdAt: -1 },
      limit: 5
    });

    let scheduleData: any[] = [];
    if (scheduleEntries && 
        typeof scheduleEntries === 'object' && 
        'cursor' in scheduleEntries &&
        scheduleEntries.cursor &&
        typeof scheduleEntries.cursor === 'object' &&
        'firstBatch' in scheduleEntries.cursor &&
        Array.isArray(scheduleEntries.cursor.firstBatch)) {
      scheduleData = scheduleEntries.cursor.firstBatch;
    }

    // 3. Test specific session lookups with detailed logging
    let testResults = [];
    
    // Test a known failing session ID
    const failingSessionId = 'schedule_1758358728740_egnbxikyh';
    console.log(`🔍 Testing failing session ID: ${failingSessionId}`);
    
    // Test in sessionBooking collection
    const sessionBookingTest = await prisma.$runCommandRaw({
      find: 'sessionBooking',
      filter: { _id: failingSessionId }
    });
    
    const sessionBookingFound = sessionBookingTest && 
        typeof sessionBookingTest === 'object' && 
        'cursor' in sessionBookingTest &&
        sessionBookingTest.cursor &&
        typeof sessionBookingTest.cursor === 'object' &&
        'firstBatch' in sessionBookingTest.cursor &&
        Array.isArray(sessionBookingTest.cursor.firstBatch) &&
        sessionBookingTest.cursor.firstBatch.length > 0;
        
    testResults.push({
      collection: 'sessionBooking',
      sessionId: failingSessionId,
      found: sessionBookingFound,
      rawResult: sessionBookingTest
    });

    // Test in schedule collection
    const scheduleTest = await prisma.$runCommandRaw({
      find: 'schedule',
      filter: { _id: failingSessionId }
    });
    
    const scheduleFound = scheduleTest && 
        typeof scheduleTest === 'object' && 
        'cursor' in scheduleTest &&
        scheduleTest.cursor &&
        typeof scheduleTest.cursor === 'object' &&
        'firstBatch' in scheduleTest.cursor &&
        Array.isArray(scheduleTest.cursor.firstBatch) &&
        scheduleTest.cursor.firstBatch.length > 0;
        
    testResults.push({
      collection: 'schedule',
      sessionId: failingSessionId,
      found: scheduleFound,
      rawResult: scheduleTest,
      foundData: scheduleFound && scheduleTest && typeof scheduleTest === 'object' && 'cursor' in scheduleTest && scheduleTest.cursor && typeof scheduleTest.cursor === 'object' && 'firstBatch' in scheduleTest.cursor && Array.isArray(scheduleTest.cursor.firstBatch) ? scheduleTest.cursor.firstBatch[0] : null
    });

    // 4. Test ObjectId conversion approaches
    let objectIdTests = [];
    if (scheduleData.length > 0) {
      const testSession = scheduleData[0];
      const sessionId = testSession._id;
      
      // Test raw string lookup
      const stringTest = await prisma.$runCommandRaw({
        find: 'schedule',
        filter: { _id: sessionId }
      });
      
      const stringFound = stringTest && typeof stringTest === 'object' && 'cursor' in stringTest && stringTest.cursor && typeof stringTest.cursor === 'object' && 'firstBatch' in stringTest.cursor && Array.isArray(stringTest.cursor.firstBatch) && stringTest.cursor.firstBatch.length > 0;
      
      objectIdTests.push({
        method: 'string',
        sessionId: sessionId,
        found: stringFound
      });

      // Test ObjectId conversion if possible
      try {
        const { ObjectId } = require('mongodb');
        const objectIdTest = await prisma.$runCommandRaw({
          find: 'schedule',
          filter: { _id: new ObjectId(sessionId) }
        });
        
        const objectIdFound = objectIdTest && typeof objectIdTest === 'object' && 'cursor' in objectIdTest && objectIdTest.cursor && typeof objectIdTest.cursor === 'object' && 'firstBatch' in objectIdTest.cursor && Array.isArray(objectIdTest.cursor.firstBatch) && objectIdTest.cursor.firstBatch.length > 0;
        
        objectIdTests.push({
          method: 'ObjectId',
          sessionId: sessionId,
          found: objectIdFound
        });
      } catch (err) {
        objectIdTests.push({
          method: 'ObjectId',
          sessionId: sessionId,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      debug: {
        totalRecentSessions: sessionsData.length,
        totalScheduleEntries: scheduleData.length,
        recentSessions: sessionsData.map((s: any) => ({
          id: s._id,
          status: s.status,
          type: s.sessionType,
          scheduled: mongoDateToISOString(s.scheduledAt),
          created: mongoDateToISOString(s.createdAt),
          timeSlotId: s.timeSlotId,
          duration: s.duration,
          amount: s.amount,
          paymentStatus: s.paymentStatus
        })),
        scheduleEntries: scheduleData.map((s: any) => ({
          id: s._id,
          status: s.status,
          type: s.sessionType,
          scheduled: mongoDateToISOString(s.scheduledTime || s.scheduledAt),
          title: s.title,
          mentorId: s.mentorId
        })),
        sessionLookupTests: testResults,
        objectIdTests: objectIdTests
      }
    });

  } catch (error) {
    console.error("Error debugging sessions:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}