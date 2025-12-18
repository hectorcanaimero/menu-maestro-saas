import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getCatalogViewsByStore } from '@/lib/posthog-api';

export interface ViewLimitStatus {
  exceeded: boolean;
  softLimitExceeded: boolean;
  hardBlocked: boolean;
  currentViews: number;
  limit: number | null;
  softLimit: number | null;
  percentage: number;
  isUnlimited: boolean;
}

/**
 * Hook to get the current catalog view limit status for a store
 * Uses PostHog for actual view counts and Supabase for plan limits
 *
 * This is more accurate than the Supabase-only approach because:
 * - PostHog tracks all views reliably with their analytics
 * - Supabase only provides the limit from the subscription plan
 */
export function usePostHogViewLimitStatus(
  storeId: string | undefined,
  enabled: boolean = true
) {
  return useQuery({
    queryKey: ['posthog-view-limit-status', storeId],
    queryFn: async (): Promise<ViewLimitStatus> => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      // Get current month views from PostHog (last 30 days)
      const posthogData = await getCatalogViewsByStore(storeId, 30);
      const currentViews = posthogData.totalViews;

      // Get plan limits from Supabase
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select(`
          id,
          subscriptions!inner (
            status,
            subscription_plans!inner (
              catalog_view_limit
            )
          )
        `)
        .eq('id', storeId)
        .eq('subscriptions.status', 'active')
        .single();

      if (storeError) {
        console.error('[usePostHogViewLimitStatus] Error fetching plan:', storeError);
      }

      // Extract the limit from the nested structure
      const limit = storeData?.subscriptions?.subscription_plans?.catalog_view_limit;
      const isUnlimited = limit === null || limit === -1;

      // Calculate soft limit (limit + 100 grace views)
      const softLimit = limit !== null && limit !== -1 ? limit + 100 : null;

      // Calculate percentage
      let percentage = 0;
      if (!isUnlimited && limit !== null) {
        percentage = (currentViews / limit) * 100;
      }

      // Determine status
      const softLimitExceeded = !isUnlimited && softLimit !== null && currentViews >= softLimit;
      const exceeded = !isUnlimited && limit !== null && currentViews >= limit;

      // Hard block happens after soft limit is exceeded
      const hardBlocked = softLimitExceeded;

      return {
        exceeded,
        softLimitExceeded,
        hardBlocked,
        currentViews,
        limit,
        softLimit,
        percentage,
        isUnlimited,
      };
    },
    enabled: !!storeId && enabled,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes (same as PostHog data)
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
}
