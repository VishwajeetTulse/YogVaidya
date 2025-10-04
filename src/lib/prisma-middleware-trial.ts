// import { Prisma } from "@prisma/client";
// import { startAutoTrialForNewUser } from "@/lib/subscriptions";
// import { prisma } from "@/lib/config/prisma";

// prisma.$use(async (params: Prisma.MiddlewareParams, next: (params: Prisma.MiddlewareParams) => Promise<unknown>) => {
//   if (params.model === "User" && params.action === "create") {
//     const result = await next(params);
//     try {
//       // result is unknown, so we need to type guard or cast
//       const user = result as { id: string };
//       await startAutoTrialForNewUser(user.id);
//     } catch (error) {
//       console.error("Failed to start trial for new user (middleware):", error);
//     }
//     return result;
//   }
//   return next(params);
// });
