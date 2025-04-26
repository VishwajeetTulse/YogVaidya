import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
 
const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb", 
    }),
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        },
    },  
    plugins: [nextCookies()],
    user: {
        additionalFields: {
            phone: {
                type: "string",
                required: true,
                defaultValue: "",
                input: true,
            },
            role: {
                type: "string",
                required: true,
                defaultValue: "USER",
                input: false,
            },
        },
    },
});