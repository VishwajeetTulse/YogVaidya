#!/usr/bin/env tsx

/**
 * Test script to create a session booking with duration field
 */

import { config } from 'dotenv';
import { prisma } from '../src/lib/config/prisma';

// Load environment variables
config({ path: '.env.local' });

async function testDurationBooking() {
  try {
    console.log('🧪 Testing sessionBooking creation with duration field...');

    // Create a test booking to verify duration field works
    const testBooking = await prisma.sessionBooking.create({
      data: {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: 'test_user_id',
        mentorId: 'test_mentor_id',
        sessionType: 'YOGA',
        scheduledAt: new Date(),
        duration: 60, // This should work now
        status: 'SCHEDULED',
        paymentStatus: 'PENDING'
      }
    });

    console.log('✅ Successfully created test booking with duration:', testBooking.id);
    console.log('Duration:', testBooking.duration, 'minutes');

    // Clean up - delete the test booking
    await prisma.sessionBooking.delete({
      where: { id: testBooking.id }
    });

    console.log('✅ Test booking cleaned up successfully');

  } catch (error) {
    console.error('❌ Error testing duration field:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testDurationBooking();