import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";

// Use environment variable or default to current origin for client-side
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.BETTER_AUTH_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  plugins: [
    inferAdditionalFields({
      user: {
        phone: {
          type: "string",
          required: true,
        },
        role: {
          type: "string",
          required: true,
        },
        mentorType: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});

export const { useSession, signIn, signUp, signOut, getSession } = authClient;
