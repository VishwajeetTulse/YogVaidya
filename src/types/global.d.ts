/**
 * Global Type Declarations for YogVaidya
 * Consolidated type definitions for external libraries and global extensions
 */

// ============================================
// Razorpay Payment Gateway (CDN-loaded)
// ============================================

// Response interface available for use if needed
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface RazorpayPaymentResponse {
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  [key: string]: unknown;
}

interface RazorpayInstance {
  open: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on: (event: string, callback: (response: any) => void) => void;
  close: () => void;
}

interface RazorpayOptions {
  key?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  subscription_id?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler?: (response: any) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    animation?: boolean;
  };
  [key: string]: unknown;
}

interface RazorpayConstructor {
  new (options: RazorpayOptions): RazorpayInstance;
}

// ============================================
// Swagger UI React
// ============================================

declare module "swagger-ui-react" {
  interface SwaggerUIProps {
    spec?: Record<string, unknown>;
    url?: string;
    urls?: Array<{ url: string; name: string }>;
    persistAuthorization?: boolean;
    defaultModelsExpandDepth?: number;
    onComplete?: (system: unknown) => void;
    onFailure?: (error: unknown) => void;
    presets?: unknown[];
    plugins?: unknown[];
    layout?: string;
    [key: string]: unknown;
  }

  const SwaggerUI: React.FC<SwaggerUIProps>;
  export default SwaggerUI;
}

declare module "swagger-ui-react/swagger-ui.css" {
  const content: string;
  export default content;
}

// ============================================
// Module Declarations (CSS handled in css.d.ts)
// ============================================

// Side-effect module imports
declare module "@/lib/prisma-middleware-trial";

// ============================================
// Global Window Extensions
// ============================================

declare global {
  interface Window {
    Razorpay: RazorpayConstructor;
  }
}

export {};
