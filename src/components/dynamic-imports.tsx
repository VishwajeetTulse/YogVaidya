/**
 * Dynamic imports for code splitting
 * Phase 4: Lazy loading heavy components
 */

import dynamic from "next/dynamic";

// TipTap Editor - Heavy (~200KB uncompressed)
export const DietPlanEditor = dynamic(
  () => import("@/components/editor/DietPlanEditor").then(mod => ({ default: mod.DietPlanEditor })),
  {
    loading: () => (
      <div className="border rounded-lg p-8 bg-gray-50">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-300 rounded w-full" />
          <div className="h-4 bg-gray-300 rounded w-3/4" />
          <div className="h-4 bg-gray-300 rounded w-1/2" />
          <div className="h-64 bg-gray-300 rounded w-full" />
        </div>
      </div>
    ),
    ssr: false, // TipTap requires browser APIs
  }
);

// TipTap Viewer - Also uses TipTap
export const DietPlanViewer = dynamic(
  () => import("@/components/dashboard/user/DietPlanViewer").then(mod => ({ default: mod.DietPlanViewer })),
  {
    loading: () => (
      <div className="border rounded-lg p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-5/6" />
          <div className="h-4 bg-gray-200 rounded w-4/6" />
        </div>
      </div>
    ),
    ssr: false,
  }
);

// Swagger UI - Very heavy (~500KB uncompressed)
export const SwaggerUIComponent = dynamic(
  () => import("swagger-ui-react"),
  {
    loading: () => (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Loading API Documentation...</p>
      </div>
    ),
    ssr: false,
  }
);

/**
 * Best Practices for Adding More Dynamic Imports:
 * 
 * 1. Use for heavy components (>50KB):
 *    - Rich text editors
 *    - Chart libraries
 *    - PDF viewers
 *    - Video players
 *    - Calendar libraries
 * 
 * 2. Always provide loading states
 * 3. Disable SSR for browser-only APIs (ssr: false)
 * 4. Preload on user interaction when possible
 */

/**
 * Preload functions for critical components
 * Call before user needs the component
 */
export const preloadComponents = {
  editor: () => import("@/components/editor/DietPlanEditor"),
  viewer: () => import("@/components/dashboard/user/DietPlanViewer"),
  swagger: () => import("swagger-ui-react"),
};
