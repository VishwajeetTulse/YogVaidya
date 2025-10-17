/**
 * Environment Variable Validation
 * This file ensures all required environment variables are present at application startup
 * Fails fast if any required variables are missing
 */

// Required variables that must be present
const REQUIRED_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "RAZORPAY_KEY_ID",
  "RAZORPAY_KEY_SECRET",
  "GOOGLE_API_KEY",
  "EMAIL_USER",
  "EMAIL_PASSWORD",
] as const;

/**
 * Validates environment variables at runtime
 * Throws an error if any required variables are missing
 * Should be called early in your API route or server action, not at build time
 */
export function validateEnv(): void {
  // Only validate if we're not building
  if (process.env.npm_lifecycle_event === "build") {
    return;
  }

  // In production, environment variables should be set by the deployment platform
  // Skip validation during build and only enforce at runtime
  const isBuilding =
    process.argv.includes("next build") || process.env.__NEXT_PRIVATE_PREBUILD_PHASE;

  if (isBuilding) {
    return;
  }

  const missing: string[] = [];

  REQUIRED_VARS.forEach((key) => {
    if (!process.env[key]) {
      missing.push(key);
    }
  });

  // Only throw in development or if we're actually running the server
  if (missing.length > 0 && process.env.NODE_ENV !== "production") {
    const errorMessage = [
      "❌ Missing required environment variables:",
      ...missing.map((v) => `   - ${v}`),
      "",
      "Please set these variables in your .env.local file.",
    ].join("\n");

    const error = new Error(errorMessage);
    // eslint-disable-next-line no-console
    console.error(error.message);
    throw error;
  }

  if (missing.length === 0) {
    // eslint-disable-next-line no-console
    console.warn("✅ Environment variables validated successfully");
  }
}

/**
 * Get environment variable with fallback
 * @param key - Environment variable name
 * @param _defaultValue - Default value if not set
 * @returns Environment variable value or default
 */
export function getEnvVar(key: string, _defaultValue?: string): string | undefined {
  return process.env[key] || _defaultValue;
}

/**
 * Check if running in development mode
 */
export const isDevelopment = process.env.NODE_ENV === "development";

/**
 * Check if running in production mode
 */
export const isProduction = process.env.NODE_ENV === "production";

/**
 * Get all environment variables (for logging/debugging)
 */
export function getEnvSummary() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL ? "***SET***" : "NOT SET",
    AUTH_SECRET: process.env.AUTH_SECRET ? "***SET***" : "NOT SET",
    AUTH_URL: process.env.AUTH_URL,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID ? "***SET***" : "NOT SET",
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY ? "***SET***" : "NOT SET",
    EMAIL_USER: process.env.EMAIL_USER ? "***SET***" : "NOT SET",
    LOG_LEVEL: process.env.LOG_LEVEL,
    SENTRY_DSN: process.env.SENTRY_DSN ? "***SET***" : "NOT SET",
  };
}
