import { useQuery } from '@tanstack/react-query';
import {
  getDashboardMetrics,
  getTopEvents,
  getLandingConversionFunnel,
  isPostHogAPIConfigured,
  type DashboardMetrics,
  type TopEvent,
  type FunnelStep,
} from '@/lib/posthog-api';

export interface PostHogMetrics {
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgSessionDuration: string;
  whatsappClicks: number;
  pricingSectionViews: number;
  planSelections: number;
  scrollDepth75Plus: number;
}

export interface ConversionFunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropOff?: number;
}

export interface PostHogDashboardData {
  metrics: PostHogMetrics;
  funnelSteps: ConversionFunnelStep[];
  topEvents: TopEvent[];
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch real PostHog metrics using the Query API
 * This replaces the old sessionStorage-based approach with real data from PostHog
 * @param days - Number of days to look back (default: 30)
 * @param storeId - Optional store ID to filter by (for multi-tenant). If null, returns global metrics.
 */
export const usePostHogMetrics = (days: number = 30, storeId?: string | null): PostHogDashboardData => {
  // Check if PostHog API is configured
  const isConfigured = isPostHogAPIConfigured();

  // Fetch dashboard metrics
  const {
    data: metricsData,
    isLoading: metricsLoading,
    error: metricsError,
  } = useQuery<DashboardMetrics>({
    queryKey: ['posthog-dashboard-metrics', days, storeId],
    queryFn: () => getDashboardMetrics(days, storeId),
    enabled: isConfigured,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 2,
  });

  // Fetch top events
  const {
    data: eventsData,
    isLoading: eventsLoading,
    error: eventsError,
  } = useQuery<TopEvent[]>({
    queryKey: ['posthog-top-events', days, storeId],
    queryFn: () => getTopEvents(days, 10, storeId),
    enabled: isConfigured,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });

  // Fetch conversion funnel
  const {
    data: funnelData,
    isLoading: funnelLoading,
    error: funnelError,
  } = useQuery<FunnelStep[]>({
    queryKey: ['posthog-conversion-funnel', days, storeId],
    queryFn: () => getLandingConversionFunnel(days, storeId),
    enabled: isConfigured,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    retry: 2,
  });

  // Combine loading states
  const isLoading = metricsLoading || eventsLoading || funnelLoading;

  // Combine errors
  const error = metricsError || eventsError || funnelError;

  // Default metrics if not configured or loading
  const defaultMetrics: PostHogMetrics = {
    pageViews: 0,
    uniqueVisitors: 0,
    conversionRate: 0,
    avgSessionDuration: '0:00',
    whatsappClicks: 0,
    pricingSectionViews: 0,
    planSelections: 0,
    scrollDepth75Plus: 0,
  };

  // Convert FunnelStep[] to ConversionFunnelStep[]
  const funnelSteps: ConversionFunnelStep[] = funnelData?.map(step => ({
    name: step.name,
    count: step.count,
    percentage: step.percentage,
    dropOff: step.dropOff,
  })) || [];

  return {
    metrics: metricsData || defaultMetrics,
    funnelSteps,
    topEvents: eventsData || [],
    isLoading,
    error: error ? (error instanceof Error ? error.message : 'Error desconocido') : null,
  };
};
