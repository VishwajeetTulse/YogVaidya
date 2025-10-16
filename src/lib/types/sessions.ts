/**
 * Session, TimeSlot, and Schedule MongoDB document types
 * These represent the raw MongoDB documents (with _id, not id)
 * Use Prisma types from @prisma/client for application logic
 */

import type { SessionType, ScheduleStatus } from "@prisma/client";
import type { MongoDocument, MongoDate } from "./mongodb";

// SessionBooking MongoDB document (raw from DB)
export interface SessionBookingDocument extends MongoDocument {
  _id: string;
  userId: string;
  mentorId: string;
  mentorApplicationId?: string;
  timeSlotId?: string;
  scheduleId?: string;
  sessionType: SessionType;
  scheduledAt: Date | string | MongoDate;
  status: ScheduleStatus;
  duration?: number;
  notes?: string;
  paymentDetails?: Record<string, unknown>;
  amount?: number;
  paymentStatus?: string;
  manualStartTime?: Date | string | MongoDate | null;
  createdAt: Date | string | MongoDate;
  updatedAt: Date | string | MongoDate;
}

// Schedule MongoDB document (raw from DB)
export interface ScheduleDocument extends MongoDocument {
  _id: string;
  title: string;
  scheduledTime: Date | string | MongoDate;
  link: string;
  duration: number;
  sessionType: SessionType;
  status: ScheduleStatus;
  mentorId: string;
  manualStartTime?: Date | string | MongoDate | null;
  createdAt: Date | string | MongoDate;
  updatedAt: Date | string | MongoDate;
}

// MentorTimeSlot MongoDB document (raw from DB)
export interface TimeSlotDocument extends MongoDocument {
  _id: string;
  mentorId: string;
  mentorApplicationId?: string;
  startTime: Date | string | MongoDate;
  endTime: Date | string | MongoDate;
  isBooked: boolean;
  bookedBy?: string;
  sessionType: SessionType;
  maxStudents: number;
  currentStudents: number;
  isRecurring: boolean;
  recurringDays: string[];
  price?: number;
  sessionLink?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date | string | MongoDate;
  updatedAt: Date | string | MongoDate;
}

// Session with mentor details (joined query result)
export interface SessionWithMentor extends SessionBookingDocument {
  mentor?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
  schedule?: ScheduleDocument;
}

// TimeSlot with mentor details (joined query result)
export interface TimeSlotWithMentor extends TimeSlotDocument {
  mentor?: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
    expertise?: string[];
  };
  pendingBookings?: SessionBookingDocument[];
}

// Schedule with bookings (joined query result)
export interface ScheduleWithBookings extends ScheduleDocument {
  sessionBookings?: SessionBookingDocument[];
}
