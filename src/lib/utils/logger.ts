import { type Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import crypto from "crypto";

type LogParams = {
  userId?: string;
  action: string;
  category:
    | "AUTHENTICATION"
    | "SYSTEM"
    | "USER"
    | "SUBSCRIPTION"
    | "PAYMENT"
    | "MENTOR"
    | "MODERATOR"
    | "ADMIN";
  details?: string;
  level: "INFO" | "WARNING" | "ERROR";
  metadata?: Prisma.JsonValue;
  ipAddress?: string;
  userAgent?: string;
};

/**
 * Creates a new system log entry
 *
 * @param logParams Log parameters
 * @returns The created log entry
 */
export async function createLogEntry(logParams: LogParams) {
  try {
    const log = await prisma.systemLog.create({
      data: {
        id: crypto.randomUUID(),
        userId: logParams.userId,
        action: logParams.action,
        category: logParams.category,
        details: logParams.details,
        level: logParams.level,
        metadata: logParams.metadata,
        ipAddress: logParams.ipAddress,
        userAgent: logParams.userAgent,
        timestamp: new Date(),
      },
    });

    return log;
  } catch (error) {
    console.error("Error creating log entry:", error);
    return null;
  }
}

/**
 * Creates a system INFO log entry
 */
export function logInfo(
  action: string,
  category: LogParams["category"],
  details?: string,
  userId?: string,
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category,
    details,
    userId,
    level: "INFO",
    metadata,
  });
}

/**
 * Creates a system WARNING log entry
 */
export function logWarning(
  action: string,
  category: LogParams["category"],
  details?: string,
  userId?: string,
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category,
    details,
    userId,
    level: "WARNING",
    metadata,
  });
}

/**
 * Creates a system ERROR log entry
 */
export function logError(
  action: string,
  category: LogParams["category"],
  details?: string,
  userId?: string,
  metadata?: Prisma.JsonValue,
  error?: Error
) {
  // If an error object is provided, add it to metadata
  const logMetadata = error ? { metadata, error: error.message, stack: error.stack } : metadata;

  return createLogEntry({
    action,
    category,
    details,
    userId,
    level: "ERROR",
    metadata: logMetadata,
  });
}

/**
 * Creates an authentication event log
 */
export function logAuthEvent(
  action: string,
  userId?: string,
  details?: string,
  level: LogParams["level"] = "INFO",
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category: "AUTHENTICATION",
    details,
    userId,
    level,
    metadata,
  });
}

/**
 * Creates a subscription event log
 */
export function logSubscriptionEvent(
  action: string,
  userId: string,
  details?: string,
  level: LogParams["level"] = "INFO",
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category: "SUBSCRIPTION",
    details,
    userId,
    level,
    metadata,
  });
}

/**
 * Creates a user action log
 */
export function logUserAction(
  action: string,
  userId: string,
  details?: string,
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category: "USER",
    details,
    userId,
    level: "INFO",
    metadata,
  });
}

/**
 * Creates a payment event log
 */
export function logPaymentEvent(
  action: string,
  userId: string,
  details?: string,
  level: LogParams["level"] = "INFO",
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category: "PAYMENT",
    details,
    userId,
    level,
    metadata,
  });
}

/**
 * Creates a system event log
 */
export function logSystemEvent(
  action: string,
  details?: string,
  level: LogParams["level"] = "INFO",
  metadata?: Prisma.JsonValue
) {
  return createLogEntry({
    action,
    category: "SYSTEM",
    details,
    level,
    metadata,
  });
}
