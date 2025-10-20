/**
 * Structured Logging and Error Tracking
 * Comprehensive error monitoring with logging integration
 */

type ContextData = Record<string, unknown>;

/**
 * Custom logger for structured logging
 * Logs errors, warnings, info, and debug messages with context
 */
export class StructuredLogger {
  private context: ContextData = {};
  private service: string;

  constructor(service: string) {
    this.service = service;
    this.context = { service };
  }

  setContext(context: ContextData) {
    this.context = { ...this.context, ...context };
  }

  info(message: string, data?: ContextData) {
    const log = {
      timestamp: new Date().toISOString(),
      level: "INFO",
      service: this.service,
      message,
      ...this.context,
      ...data,
    };
    console.error(JSON.stringify(log));
  }

  warn(message: string, data?: ContextData) {
    const log = {
      timestamp: new Date().toISOString(),
      level: "WARN",
      service: this.service,
      message,
      ...this.context,
      ...data,
    };
    console.warn(JSON.stringify(log));
  }

  error(message: string, error?: Error, data?: ContextData) {
    const log = {
      timestamp: new Date().toISOString(),
      level: "ERROR",
      service: this.service,
      message,
      errorMessage: error?.message,
      errorStack: error?.stack,
      ...this.context,
      ...data,
    };
    console.error(JSON.stringify(log));
  }

  debug(message: string, data?: ContextData) {
    if (process.env.NODE_ENV === "development") {
      const log = {
        timestamp: new Date().toISOString(),
        level: "DEBUG",
        service: this.service,
        message,
        ...this.context,
        ...data,
      };
      console.error(JSON.stringify(log));
    }
  }
}

/**
 * Error metrics collection
 * Tracks error types and frequencies
 */
export class ErrorMetrics {
  private errorCounts: Record<string, number> = {};
  private errorTimestamps: Record<string, number[]> = {};

  recordError(errorType: string, _message: string) {
    this.errorCounts[errorType] = (this.errorCounts[errorType] || 0) + 1;

    if (!this.errorTimestamps[errorType]) {
      this.errorTimestamps[errorType] = [];
    }

    this.errorTimestamps[errorType].push(Date.now());

    // Keep only last 1000 errors per type
    if (this.errorTimestamps[errorType].length > 1000) {
      this.errorTimestamps[errorType].shift();
    }
  }

  getMetrics() {
    return {
      errorCounts: this.errorCounts,
      totalErrors: Object.values(this.errorCounts).reduce((a, b) => a + b, 0),
      timestamp: new Date().toISOString(),
    };
  }

  getErrorRate(errorType: string, windowMs: number = 60000) {
    const now = Date.now();
    const timestamps = this.errorTimestamps[errorType] || [];
    const recentErrors = timestamps.filter((ts) => now - ts < windowMs);
    return recentErrors.length / (windowMs / 1000); // errors per second
  }
}

// Global instances
export const logger = new StructuredLogger("app");
export const metrics = new ErrorMetrics();
