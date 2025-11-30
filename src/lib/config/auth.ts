import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { sendEmail } from "@/lib/services/email";
import { welcomeEmailTemplate } from "@/lib/services/email-templates";
import type { NextRequest } from "next/server";
import { prisma } from "./prisma";

// Helper to get rememberMe from the request body (for sign-in route)
async function getRememberMeFromRequest(req: NextRequest): Promise<boolean> {
  try {
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = await req.clone().json();
        return !!body.rememberMe;
      }
    }
  } catch {
    // ignore
  }
  return false;
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
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
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      signIn: {
        enabled: true,
        createUserIfNotExists: true,
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
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // Send welcome email on new user registration
      if (ctx.path.startsWith("/sign-up")) {
        const newSession = ctx.context.newSession;
        if (newSession?.user) {
          try {
            const { subject, html } = welcomeEmailTemplate(newSession.user.name || "there");
            await sendEmail({
              to: newSession.user.email,
              subject,
              text: html,
              html: true,
            });
          } catch (error) {
            console.error("Failed to send welcome email:", error);
            // Don't throw - user is still registered successfully
          }
        }
      }
    }),
  },
  plugins: [nextCookies()],
  user: {
    additionalFields: {
      phone: {
        type: "string",
        required: false, // Changed to false since it's not provided by Google
        defaultValue: "",
        input: true,
      },
      role: {
        type: "string",
        required: true,
        defaultValue: "USER",
        input: true, // Changed to true so the role can be specified during signup
      },
      mentorType: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});
