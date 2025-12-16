import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
 * Calls the check_catalog_view_limit RPC function
 */
export function useViewLimitStatus(storeId: string | undefined, enabled: boolean = true) {
  return useQuery({
    queryKey: ['view-limit-status', storeId],
    queryFn: async (): Promise<ViewLimitStatus> => {
      if (!storeId) {
        throw new Error('Store ID is required');
      }

      const { data, error } = await supabase.rpc('check_catalog_view_limit', {
        p_store_id: storeId,
      });

      if (error) {
        console.error('[useViewLimitStatus] Error checking view limit:', error);
        throw error;
      }

      // Parse the JSON response
      const result = data as any;

      return {
        exceeded: result.exceeded || false,
        softLimitExceeded: result.soft_limit_exceeded || false,
        hardBlocked: result.hard_blocked || false,
        currentViews: result.current_views || 0,
        limit: result.limit,
        softLimit: result.soft_limit,
        percentage: result.percentage || 0,
        isUnlimited: result.is_unlimited || false,
      };
    },
    enabled: !!storeId && enabled,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });
}
