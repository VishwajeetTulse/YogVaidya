import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Optimized Prisma client with connection pooling
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Connection pool optimization for serverless
    datasourceUrl: process.env.DATABASE_URL,
    // Enable query logging in development for optimization
    errorFormat: "minimal",
  });

// Configure connection pool limits
// MongoDB connection string should include these params:
// ?retryWrites=true&w=majority&maxPoolSize=10&minPoolSize=2&maxIdleTimeMS=30000

// Ensure single instance in development
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Graceful shutdown handling
if (process.env.NODE_ENV === "production") {
  process.on("beforeExit", async () => {
    await prisma.$disconnect();
  });
}

export default prisma;
