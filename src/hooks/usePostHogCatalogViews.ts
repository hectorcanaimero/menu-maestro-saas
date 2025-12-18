import { useQuery } from '@tanstack/react-query';
import {
  getCatalogViewsByStore,
  getCatalogViewsTrend,
  isPostHogAPIConfigured,
  type CatalogViewsStats,
  type DailyViewsData,
} from '@/lib/posthog-api';

/**
 * Hook to get catalog views statistics from PostHog for a specific store
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 30)
 * @param enabled - Whether to enable the query (default: true)
 */
export function usePostHogCatalogViews(
  storeId: string | undefined,
  days: number = 30,
  enabled: boolean = true
) {
  return useQuery<CatalogViewsStats>({
    queryKey: ['posthog-catalog-views', storeId, days],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      if (!isPostHogAPIConfigured()) {
        console.warn('[usePostHogCatalogViews] PostHog API not configured');
        return {
          totalViews: 0,
          uniqueVisitors: 0,
          viewsPerVisitor: 0,
          storeId,
        };
      }

      return await getCatalogViewsByStore(storeId, days);
    },
    enabled: !!storeId && enabled,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
}

/**
 * Hook to get daily catalog views trend from PostHog
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 30)
 * @param enabled - Whether to enable the query (default: true)
 */
export function usePostHogCatalogViewsTrend(
  storeId: string | undefined,
  days: number = 30,
  enabled: boolean = true
) {
  return useQuery<DailyViewsData[]>({
    queryKey: ['posthog-catalog-views-trend', storeId, days],
    queryFn: async () => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      if (!isPostHogAPIConfigured()) {
        console.warn('[usePostHogCatalogViewsTrend] PostHog API not configured');
        return [];
      }

      return await getCatalogViewsTrend(storeId, days);
    },
    enabled: !!storeId && enabled,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });
}
