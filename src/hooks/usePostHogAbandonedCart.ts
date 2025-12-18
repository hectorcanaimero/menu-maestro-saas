import { useQuery } from '@tanstack/react-query';
import {
  getAbandonedCartStats,
  getAbandonedCartDetails,
  isPostHogAPIConfigured,
  type AbandonedCartStats,
  type AbandonedCartDetail,
} from '@/lib/posthog-api';

/**
 * Hook to get abandoned cart statistics from PostHog for a specific store
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 30)
 * @param enabled - Whether to enable the query (default: true)
 */
export function usePostHogAbandonedCartStats(
  storeId: string | undefined,
  days: number = 30,
  enabled: boolean = true
) {
  return useQuery<AbandonedCartStats>({
    queryKey: ['posthog-abandoned-cart-stats', storeId, days],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      if (!isPostHogAPIConfigured()) {
        console.warn('[usePostHogAbandonedCartStats] PostHog API not configured');
        return {
          totalAbandoned: 0,
          totalValue: 0,
          averageCartValue: 0,
          recoveryRate: 0,
        };
      }

      return await getAbandonedCartStats(storeId, days);
    },
    enabled: !!storeId && enabled,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get abandoned cart details (list of abandoned carts)
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 7)
 * @param limit - Maximum number of results (default: 20)
 * @param enabled - Whether to enable the query (default: true)
 */
export function usePostHogAbandonedCartDetails(
  storeId: string | undefined,
  days: number = 7,
  limit: number = 20,
  enabled: boolean = true
) {
  return useQuery<AbandonedCartDetail[]>({
    queryKey: ['posthog-abandoned-cart-details', storeId, days, limit],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      if (!isPostHogAPIConfigured()) {
        console.warn('[usePostHogAbandonedCartDetails] PostHog API not configured');
        return [];
      }

      return await getAbandonedCartDetails(storeId, days, limit);
    },
    enabled: !!storeId && enabled,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
}
