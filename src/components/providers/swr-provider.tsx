/**
 * SWR Provider Component
 * Wraps the app to provide SWR caching configuration
 */

"use client";

import { SWRConfig } from "swr";
import { swrConfig } from "@/lib/config/swr-config";

export function SWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={swrConfig}>{children}</SWRConfig>;
}
