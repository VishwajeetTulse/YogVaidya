import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { createAuthMiddleware } from "better-auth/api";
import { sendEmail } from "@/lib/services/email";
import { welcomeEmailTemplate } from "@/lib/services/email-templates";
import { prisma } from "./prisma";

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
    },
  },
  trustedOrigins: [
    "https://yog-vaidya.vercel.app",
    "http://localhost:3000",
  ],
  plugins: [nextCookies()],
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
