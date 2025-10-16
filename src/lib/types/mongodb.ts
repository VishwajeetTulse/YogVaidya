/**
 * MongoDB-specific types for raw database operations
 * Use these for $runCommandRaw, aggregations, and MongoDB-native queries
 */

// BSON Date format from MongoDB
export interface MongoDate {
  $date: string | number;
}

// MongoDB ObjectId format
export interface MongoObjectId {
  $oid: string;
}

// Base MongoDB document (all MongoDB docs have _id)
export interface MongoDocument {
  _id: string | MongoObjectId;
  [key: string]: unknown;
}

// MongoDB command result wrapper (for $runCommandRaw)
export interface MongoCommandResult<T = MongoDocument> {
  cursor?: {
    firstBatch: T[];
    id: number | { $numberLong: string };
    ns: string;
  };
  ok: number;
  n?: number;
  nModified?: number;
}

// Type guard to check if value is MongoDate
export function isMongoDate(value: unknown): value is MongoDate {
  return typeof value === "object" && value !== null && "$date" in value;
}

// Type guard to check if value is MongoObjectId
export function isMongoObjectId(value: unknown): value is MongoObjectId {
  return typeof value === "object" && value !== null && "$oid" in value;
}

// Helper type for date values that could be string, Date, or MongoDate
export type DateValue = string | Date | MongoDate | null | undefined;

// MongoDB filter/query condition type
export type MongoFilter<T = unknown> = {
  [K in keyof T]?:
    | T[K]
    | {
        $eq?: T[K];
        $ne?: T[K];
        $gt?: T[K];
        $gte?: T[K];
        $lt?: T[K];
        $lte?: T[K];
        $in?: T[K][];
        $nin?: T[K][];
        $exists?: boolean;
      };
} & {
  $and?: MongoFilter<T>[];
  $or?: MongoFilter<T>[];
  $nor?: MongoFilter<T>[];
  [key: string]: unknown;
};
