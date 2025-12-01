import { auth } from "@/lib/config/auth";
import { toNextJsHandler } from "better-auth/next-js";
import type { NextRequest } from "next/server";

// Debug log on server startup
console.warn("[Auth Debug] BETTER_AUTH_URL:", process.env.BETTER_AUTH_URL);
console.warn("[Auth Debug] GOOGLE_CLIENT_ID set:", !!process.env.GOOGLE_CLIENT_ID);

const { GET: originalGET, POST: originalPOST } = toNextJsHandler(auth);

// Wrap GET to add debugging
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // Log OAuth-related requests
  if (pathname.includes("callback") || pathname.includes("google")) {
    console.warn("[Auth Debug] GET request to:", pathname);
    console.warn("[Auth Debug] Query params:", Object.fromEntries(url.searchParams));
    console.warn("[Auth Debug] Cookies:", request.cookies.getAll().map(c => ({ name: c.name, valueLength: c.value?.length })));
  }
  
  try {
    const response = await originalGET(request);
    
    if (pathname.includes("callback") || pathname.includes("google")) {
      console.warn("[Auth Debug] Response status:", response.status);
      // Log set-cookie headers
      const setCookies = response.headers.getSetCookie?.() || [];
      console.warn("[Auth Debug] Set-Cookie headers count:", setCookies.length);
    }
    
    return response;
  } catch (error) {
    console.error("[Auth Debug] Error in GET:", error);
    throw error;
  }
}

// Wrap POST to add debugging
export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  if (pathname.includes("sign-in") || pathname.includes("google")) {
    console.warn("[Auth Debug] POST request to:", pathname);
    console.warn("[Auth Debug] Cookies:", request.cookies.getAll().map(c => ({ name: c.name, valueLength: c.value?.length })));
  }
  
  try {
    const response = await originalPOST(request);
    
    if (pathname.includes("sign-in") || pathname.includes("google")) {
      console.warn("[Auth Debug] Response status:", response.status);
      const setCookies = response.headers.getSetCookie?.() || [];
      console.warn("[Auth Debug] Set-Cookie headers count:", setCookies.length);
      if (setCookies.length > 0) {
        console.warn("[Auth Debug] Set-Cookie names:", setCookies.map(c => c.split("=")[0]));
      }
    }
    
    return response;
  } catch (error) {
    console.error("[Auth Debug] Error in POST:", error);
    throw error;
  }
}
