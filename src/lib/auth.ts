import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
import { nextCookies } from "better-auth/next-js";
import { sendEmail } from "@/lib/email";
import { NextRequest } from "next/server";

const prisma = new PrismaClient();

// Helper to get rememberMe from the request body (for sign-in route)
async function getRememberMeFromRequest(req: NextRequest): Promise<boolean> {
  try {
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.json();
        return !!body.rememberMe;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "mongodb", 
    }),
    emailAndPassword: {
        enabled: true,
        sendResetPassword: async ({ user, url }) => {
          await sendEmail({
            to: user.email,
            subject: "Reset your password",
            text: `Click the link to reset your password: ${url}`,
          });
        },
    },    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            signIn: {
                enabled: true,
                createUserIfNotExists: false,
            },
        },
    },  
    cookies: {
      getCookieOptions: async (ctx: { req: NextRequest }) => {
        let rememberMe = false;
        if (ctx.req) {
          rememberMe = await getRememberMeFromRequest(ctx.req);
        }
        return rememberMe
          ? { maxAge: 60 * 60 * 24 * 30 } // 30 days
          : {};
      },
    },
    plugins: [
      nextCookies(),
    ],
    user: {
        additionalFields: {            
          phone: {
                type: "string",
                required: false,  // Changed to false since it's not provided by Google
                defaultValue: "",
                input: true,
            },            
            role: {
                type: "string",
                required: true,
                defaultValue: "USER",
                input: true,  // Changed to true so the role can be specified during signup
            },
            mentorType: {
                type: "string",
                required: false,
                defaultValue: "",
                input: false,
            },
        },
    },
});