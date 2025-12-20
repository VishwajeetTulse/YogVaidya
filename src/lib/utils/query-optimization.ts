/**
 * Query Optimization Utilities
 * Reusable patterns for efficient database queries
 */

import { prisma } from "@/lib/config/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Batch fetch users by IDs in a single query
 * Avoids N+1 problem
 */
export async function batchFetchUsers(userIds: string[]) {
  const users = await prisma.user.findMany({
    where: {
      id: {
        in: userIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      mentorType: true,
      phone: true,
    },
  });

  // Create a map for O(1) lookup
  const userMap = new Map(users.map((user) => [user.id, user]));
  
  return userMap;
}

/**
 * Batch fetch mentors with their applications in one query
 */
export async function batchFetchMentorsWithApplications(mentorIds: string[]) {
  const users = await prisma.user.findMany({
    where: {
      id: { in: mentorIds },
      role: "MENTOR",
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      phone: true,
      mentorType: true,
      isAvailable: true,
      sessionPrice: true,
    },
  });

  const emails = users.map((u) => u.email);
  const applicationsData = await prisma.mentorApplication.findMany({
    where: { email: { in: emails } },
  });

  const appMap = new Map(applicationsData.map((app) => [app.email, app]));

  return users.map((user) => ({
    ...user,
    application: appMap.get(user.email),
  }));
}

/**
 * Optimized mentor list query with minimal data
 */
export async function getOptimizedMentorsList() {
  return prisma.user.findMany({
    where: {
      role: "MENTOR",
      isAvailable: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      mentorType: true,
      sessionPrice: true,
      isAvailable: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Paginated query helper
 */
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export async function paginatedQuery<T>(
  model: keyof typeof prisma,
  where: unknown,
  { page, limit }: PaginationParams,
  orderBy?: unknown,
  select?: unknown
): Promise<PaginatedResult<T>> {
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma[model] as any).findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select,
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma[model] as any).count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasMore: page < totalPages,
    },
  };
}

/**
 * Efficient session booking query with all relations
 */
export async function getSessionBookingsWithDetails(userId: string, status?: string[]) {
  return prisma.sessionBooking.findMany({
    where: {
      userId,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(status && { status: { in: status as any } }),
      paymentStatus: "COMPLETED",
    },
    select: {
      id: true,
      scheduledAt: true,
      status: true,
      sessionType: true,
      duration: true,
      amount: true,
      mentor: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          mentorType: true,
        },
      },
      timeSlot: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          sessionLink: true,
        },
      },
    },
    orderBy: {
      scheduledAt: "asc",
    },
  });
}

/**
 * Efficient dashboard stats query using aggregation
 */
export async function getDashboardStats(userId: string, role: string) {
  if (role === "USER") {
    const [totalSessions, upcomingSessions, completedSessions] = await Promise.all([
      prisma.sessionBooking.count({
        where: { userId, paymentStatus: "COMPLETED" },
      }),
      prisma.sessionBooking.count({
        where: {
          userId,
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
          paymentStatus: "COMPLETED",
        },
      }),
      prisma.sessionBooking.count({
        where: { userId, status: "COMPLETED" },
      }),
    ]);

    return { totalSessions, upcomingSessions, completedSessions };
  }

  if (role === "MENTOR") {
    const [totalStudents, upcomingSessions, completedSessions] = await Promise.all([
      prisma.sessionBooking.findMany({
        where: { mentorId: userId, paymentStatus: "COMPLETED" },
        select: { userId: true },
        distinct: ["userId"],
      }).then((sessions) => sessions.length),
      prisma.sessionBooking.count({
        where: {
          mentorId: userId,
          status: "SCHEDULED",
          scheduledAt: { gte: new Date() },
        },
      }),
      prisma.sessionBooking.count({
        where: { mentorId: userId, status: "COMPLETED" },
      }),
    ]);

    return { totalStudents, upcomingSessions, completedSessions };
  }

  return null;
}

/**
 * Query builder for complex filters
 */
export class QueryBuilder {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private where: Record<string, any> = {};

  addFilter(field: string, value: unknown, operator: "equals" | "in" | "contains" | "gte" | "lte" = "equals") {
    if (value === undefined || value === null || value === "") return this;

    switch (operator) {
      case "equals":
        this.where[field] = value;
        break;
      case "in":
        this.where[field] = { in: value };
        break;
      case "contains":
        this.where[field] = { contains: value, mode: "insensitive" };
        break;
      case "gte":
        this.where[field] = { ...this.where[field], gte: value };
        break;
      case "lte":
        this.where[field] = { ...this.where[field], lte: value };
        break;
    }

    return this;
  }

  addDateRange(field: string, start?: Date, end?: Date) {
    if (start || end) {
      this.where[field] = {};
      if (start) this.where[field].gte = start;
      if (end) this.where[field].lte = end;
    }
    return this;
  }

  build() {
    return this.where;
  }
}

/**
 * Bulk operations helper
 */
export async function bulkUpdateUsers(
  userIds: string[],
  data: Prisma.UserUpdateInput
) {
  return prisma.user.updateMany({
    where: { id: { in: userIds } },
    data,
  });
}

/**
 * Transaction helper for complex operations
 */
export async function executeTransaction<T>(
  operations: (tx: Prisma.TransactionClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(operations, {
    maxWait: 5000, // 5 seconds
    timeout: 10000, // 10 seconds
  });
}
