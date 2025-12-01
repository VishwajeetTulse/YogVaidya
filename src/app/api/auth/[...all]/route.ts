import { auth } from "@/lib/config/auth"; // path to your auth file
import { toNextJsHandler } from "better-auth/next-js";

// Debug log on server startup
console.warn("[Auth Debug] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.warn("[Auth Debug] Expected callback:", `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`);
console.warn("[Auth Debug] GOOGLE_CLIENT_ID set:", !!process.env.GOOGLE_CLIENT_ID);

export const { GET, POST } = toNextJsHandler(auth);
