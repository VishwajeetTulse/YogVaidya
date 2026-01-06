/**
 * Custom hook for fetching dashboard data with SWR
 * Phase 4: Client-side caching optimization
 */

import useSWR from "swr";
import { swrConfigs } from "@/lib/config/swr-config";

// Import server actions
import { getUserDashboardData } from "@/lib/actions/dashboard-data";
import { getUserSessions } from "@/lib/server/user-sessions-server";
import { getUserMentor } from "@/lib/server/user-mentor-server";
import { getMentorOverviewData } from "@/lib/server/mentor-overview-server";
import { getMentorSessions } from "@/lib/server/mentor-sessions-server";

/**
 * Hook to fetch user dashboard overview with SWR caching
 */
export function useUserDashboard(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `user-dashboard-${userId}` : null,
    async () => {
      const result = await getUserDashboardData();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    swrConfigs.dashboard
  );

  return {
    dashboard: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Hook to fetch user sessions with SWR caching
 */
export function useUserSessions(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `user-sessions-${userId}` : null,
    async () => {
      const result = await getUserSessions();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    swrConfigs.dashboard
  );

  return {
    sessions: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Hook to fetch user mentors with SWR caching
 */
export function useUserMentors(userId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `user-mentors-${userId}` : null,
    async () => {
      const result = await getUserMentor();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    swrConfigs.list
  );

  return {
    mentors: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Hook for mentor dashboard overview
 */
export function useMentorDashboard(mentorId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    mentorId ? `mentor-dashboard-${mentorId}` : null,
    async () => {
      const result = await getMentorOverviewData();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    swrConfigs.dashboard
  );

  return {
    dashboard: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}

/**
 * Hook for mentor sessions with real-time updates
 */
export function useMentorSessions(mentorId?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    mentorId ? `mentor-sessions-${mentorId}` : null,
    async () => {
      const result = await getMentorSessions();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    swrConfigs.realtime
  );

  return {
    sessions: data,
    isLoading,
    isError: error,
    refresh: mutate,
  };
}
