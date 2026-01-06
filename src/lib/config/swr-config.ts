/**
 * SWR Configuration for Client-Side Caching
 * Phase 4: Advanced Optimizations
 */

import { SWRConfiguration } from "swr";

// Default SWR configuration
export const swrConfig: SWRConfiguration = {
  // Cache data for 2 minutes before revalidating
  dedupingInterval: 2000,
  
  // Revalidate on focus by default (good for user experience)
  revalidateOnFocus: true,
  
  // Revalidate on reconnect (if user was offline)
  revalidateOnReconnect: true,
  
  // Don't revalidate on mount if data is fresh
  revalidateIfStale: false,
  
  // Keep previous data while fetching new data
  keepPreviousData: true,
  
  // Error retry configuration
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Loading timeout
  loadingTimeout: 3000,
  
  // Default fetcher for API routes
  fetcher: async (url: string) => {
    const res = await fetch(url);
    
    if (!res.ok) {
      const error: any = new Error("An error occurred while fetching the data.");
      error.info = await res.json().catch(() => ({}));
      error.status = res.status;
      throw error;
    }
    
    return res.json();
  },
};

// Specific configurations for different data types
export const swrConfigs = {
  // Static data: Long cache, infrequent revalidation
  static: {
    ...swrConfig,
    dedupingInterval: 300000, // 5 minutes
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  } as SWRConfiguration,
  
  // Dashboard data: Medium cache, revalidate on focus
  dashboard: {
    ...swrConfig,
    dedupingInterval: 60000, // 1 minute
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
  } as SWRConfiguration,
  
  // Real-time data: Short cache, frequent revalidation
  realtime: {
    ...swrConfig,
    dedupingInterval: 10000, // 10 seconds
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    refreshInterval: 30000, // Auto-refresh every 30 seconds
  } as SWRConfiguration,
  
  // List data: Medium cache, optimistic updates
  list: {
    ...swrConfig,
    dedupingInterval: 120000, // 2 minutes
    revalidateOnFocus: false,
  } as SWRConfiguration,
};

// Helper function to create SWR key for consistent cache management
export const createSWRKey = {
  // User dashboard data
  userDashboard: (userId: string) => `/api/dashboard/user/${userId}`,
  userSessions: (userId: string) => `/api/user/sessions/${userId}`,
  userMentors: (userId: string) => `/api/user/mentors/${userId}`,
  
  // Mentor dashboard data
  mentorDashboard: (mentorId: string) => `/api/dashboard/mentor/${mentorId}`,
  mentorSessions: (mentorId: string) => `/api/mentor/sessions/${mentorId}`,
  mentorStudents: (mentorId: string) => `/api/mentor/students/${mentorId}`,
  
  // Public data
  mentorList: () => "/api/mentor/get-approved-mentors",
  pricingPlans: () => "/api/pricing",
  
  // Support
  tickets: (filters?: Record<string, string>) => {
    const params = new URLSearchParams(filters || {});
    return `/api/tickets?${params.toString()}`;
  },
  
  // Diet plans
  dietPlans: (userId: string) => `/api/mentor/diet-plans?userId=${userId}`,
  
  // Subscription sessions
  subscriptionSessions: (mentorId: string) => `/api/mentor/subscription-sessions?mentorId=${mentorId}`,
};
