/**
 * PostHog Query API Helper
 *
 * Provides functions to query PostHog analytics data programmatically
 * Uses HogQL queries to fetch insights directly from PostHog
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';
const POSTHOG_PROJECT_ID = import.meta.env.VITE_POSTHOG_PROJECT_ID || '88656';

// For development/testing - In production, this should come from env vars
// IMPORTANT: Create a Personal API Key in PostHog: Settings → Personal API Keys
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_PERSONAL_KEY;

interface PostHogQueryResponse {
  results: any[];
  columns?: string[];
  types?: string[];
  hasMore?: boolean;
  error?: string;
}

/**
 * Execute a HogQL query against PostHog
 */
async function executeHogQLQuery(query: string): Promise<PostHogQueryResponse> {
  if (!POSTHOG_API_KEY) {
    console.warn('[PostHog API] No API key configured. Set VITE_POSTHOG_API_KEY in .env');
    return { results: [], error: 'No API key configured' };
  }

  try {
    const response = await fetch(
      `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/query`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${POSTHOG_API_KEY}`,
        },
        body: JSON.stringify({
          query: {
            kind: 'HogQLQuery',
            query: query,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PostHog API] Query failed:', response.status, errorText);
      throw new Error(`PostHog API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[PostHog API] Error executing query:', error);
    throw error;
  }
}

// ============================================================================
// CATALOG VIEWS QUERIES
// ============================================================================

export interface CatalogViewsStats {
  totalViews: number;
  uniqueVisitors: number;
  viewsPerVisitor: number;
  storeId?: string;
  storeName?: string;
}

/**
 * Get catalog views statistics for a specific store
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 30)
 */
export async function getCatalogViewsByStore(
  storeId: string,
  days: number = 30
): Promise<CatalogViewsStats> {
  const query = `
    SELECT
      count(*) as total_views,
      count(DISTINCT person_id) as unique_visitors,
      round(count(*) * 1.0 / count(DISTINCT person_id), 2) as views_per_visitor
    FROM events
    WHERE event = 'catalog_page_view'
      AND properties.store_id = '${storeId}'
      AND timestamp >= now() - INTERVAL ${days} DAY
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results || response.results.length === 0) {
    return {
      totalViews: 0,
      uniqueVisitors: 0,
      viewsPerVisitor: 0,
      storeId,
    };
  }

  const result = response.results[0];

  return {
    totalViews: result[0] || 0,
    uniqueVisitors: result[1] || 0,
    viewsPerVisitor: result[2] || 0,
    storeId,
  };
}

/**
 * Get daily catalog views trend for a store
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 30)
 */
export interface DailyViewsData {
  date: string;
  views: number;
}

export async function getCatalogViewsTrend(
  storeId: string,
  days: number = 30
): Promise<DailyViewsData[]> {
  const query = `
    SELECT
      toDate(timestamp) as date,
      count(*) as views
    FROM events
    WHERE event = 'catalog_page_view'
      AND properties.store_id = '${storeId}'
      AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY date
    ORDER BY date ASC
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results) {
    return [];
  }

  return response.results.map((row) => ({
    date: row[0],
    views: row[1] || 0,
  }));
}

/**
 * Get all stores with catalog views (for platform admin)
 * @param days - Number of days to look back (default: 30)
 */
export interface StoreViewsData {
  storeId: string;
  storeName: string;
  totalViews: number;
  uniqueVisitors: number;
}

export async function getAllCatalogViews(days: number = 30): Promise<StoreViewsData[]> {
  const query = `
    SELECT
      properties.store_id as store_id,
      properties.store_name as store_name,
      count(*) as total_views,
      count(DISTINCT person_id) as unique_visitors
    FROM events
    WHERE event = 'catalog_page_view'
      AND timestamp >= now() - INTERVAL ${days} DAY
    GROUP BY store_id, store_name
    ORDER BY total_views DESC
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results) {
    return [];
  }

  return response.results.map((row) => ({
    storeId: row[0] || '',
    storeName: row[1] || 'Unknown',
    totalViews: row[2] || 0,
    uniqueVisitors: row[3] || 0,
  }));
}

// ============================================================================
// ABANDONED CART QUERIES
// ============================================================================

export interface AbandonedCartStats {
  totalAbandoned: number;
  totalValue: number;
  averageCartValue: number;
  recoveryRate: number;
}

/**
 * Get abandoned cart statistics for a store
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 30)
 */
export async function getAbandonedCartStats(
  storeId: string,
  days: number = 30
): Promise<AbandonedCartStats> {
  // Query for carts that were started but not completed
  const query = `
    WITH cart_events AS (
      SELECT
        person_id,
        properties.cart_value as cart_value,
        timestamp
      FROM events
      WHERE event = 'product_added_to_cart'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
    ),
    completed_orders AS (
      SELECT DISTINCT
        person_id,
        timestamp
      FROM events
      WHERE event = 'order_placed'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
    )
    SELECT
      count(DISTINCT c.person_id) as total_abandoned,
      sum(toFloat(c.cart_value)) as total_value,
      avg(toFloat(c.cart_value)) as avg_cart_value,
      count(DISTINCT o.person_id) * 100.0 / count(DISTINCT c.person_id) as recovery_rate
    FROM cart_events c
    LEFT JOIN completed_orders o ON c.person_id = o.person_id
      AND o.timestamp > c.timestamp
      AND o.timestamp <= c.timestamp + INTERVAL 24 HOUR
    WHERE o.person_id IS NULL
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results || response.results.length === 0) {
    return {
      totalAbandoned: 0,
      totalValue: 0,
      averageCartValue: 0,
      recoveryRate: 0,
    };
  }

  const result = response.results[0];

  return {
    totalAbandoned: result[0] || 0,
    totalValue: result[1] || 0,
    averageCartValue: result[2] || 0,
    recoveryRate: result[3] || 0,
  };
}

/**
 * Get abandoned cart details (list of abandoned carts)
 * @param storeId - UUID of the store
 * @param days - Number of days to look back (default: 7)
 * @param limit - Maximum number of results (default: 20)
 */
export interface AbandonedCartDetail {
  personId: string;
  cartValue: number;
  timestamp: string;
  pageUrl?: string;
}

export async function getAbandonedCartDetails(
  storeId: string,
  days: number = 7,
  limit: number = 20
): Promise<AbandonedCartDetail[]> {
  const query = `
    WITH last_cart_events AS (
      SELECT
        person_id,
        max(timestamp) as last_cart_time,
        argMax(properties.cart_value, timestamp) as cart_value,
        argMax(properties.page_url, timestamp) as page_url
      FROM events
      WHERE event = 'product_added_to_cart'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
      GROUP BY person_id
    ),
    completed_orders AS (
      SELECT DISTINCT person_id
      FROM events
      WHERE event = 'order_placed'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
    )
    SELECT
      c.person_id,
      c.cart_value,
      c.last_cart_time,
      c.page_url
    FROM last_cart_events c
    LEFT JOIN completed_orders o ON c.person_id = o.person_id
    WHERE o.person_id IS NULL
      AND c.cart_value > 0
    ORDER BY c.last_cart_time DESC
    LIMIT ${limit}
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results) {
    return [];
  }

  return response.results.map((row) => ({
    personId: row[0] || '',
    cartValue: row[1] || 0,
    timestamp: row[2] || '',
    pageUrl: row[3] || '',
  }));
}

// ============================================================================
// CONVERSION FUNNEL QUERIES
// ============================================================================

export interface ConversionFunnelData {
  step: string;
  count: number;
  conversionRate: number;
}

/**
 * Get conversion funnel for a store
 * Steps: catalog_page_view → product_added_to_cart → checkout_started → order_placed
 */
export async function getConversionFunnel(
  storeId: string,
  days: number = 30
): Promise<ConversionFunnelData[]> {
  const query = `
    WITH step_counts AS (
      SELECT
        'Catalog View' as step,
        1 as step_order,
        count(DISTINCT person_id) as count
      FROM events
      WHERE event = 'catalog_page_view'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY

      UNION ALL

      SELECT
        'Add to Cart' as step,
        2 as step_order,
        count(DISTINCT person_id) as count
      FROM events
      WHERE event = 'product_added_to_cart'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY

      UNION ALL

      SELECT
        'Checkout Started' as step,
        3 as step_order,
        count(DISTINCT person_id) as count
      FROM events
      WHERE event = 'checkout_started'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY

      UNION ALL

      SELECT
        'Order Completed' as step,
        4 as step_order,
        count(DISTINCT person_id) as count
      FROM events
      WHERE event = 'order_placed'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
    )
    SELECT
      step,
      count,
      count * 100.0 / (SELECT count FROM step_counts WHERE step_order = 1) as conversion_rate
    FROM step_counts
    ORDER BY step_order
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results) {
    return [];
  }

  return response.results.map((row) => ({
    step: row[0] || '',
    count: row[1] || 0,
    conversionRate: row[2] || 0,
  }));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if PostHog API is configured
 */
export function isPostHogAPIConfigured(): boolean {
  return !!POSTHOG_API_KEY && POSTHOG_API_KEY.length > 0;
}

/**
 * Get configuration instructions for PostHog API
 */
export function getPostHogAPIConfigInstructions(): string {
  return `
To enable PostHog Query API integration:

1. Go to PostHog: https://us.i.posthog.com
2. Navigate to: Settings → Personal API Keys
3. Click "Create personal API key"
4. Copy the key
5. Add to your .env file:
   VITE_POSTHOG_API_KEY=your_api_key_here
6. Restart your dev server

Note: The API key will be included in your frontend bundle.
For production, consider using a backend proxy to keep the key secure.
  `.trim();
}

// ============================================================================
// DASHBOARD METRICS QUERIES
// ============================================================================

export interface DashboardMetrics {
  pageViews: number;
  uniqueVisitors: number;
  conversionRate: number;
  avgSessionDuration: string;
  whatsappClicks: number;
  pricingSectionViews: number;
  planSelections: number;
  scrollDepth75Plus: number;
}

/**
 * Get real dashboard metrics from PostHog
 * @param days - Number of days to look back (default: 30)
 * @param storeId - Optional store ID to filter by (for multi-tenant). If null, returns global metrics.
 */
export async function getDashboardMetrics(days: number = 30, storeId?: string | null): Promise<DashboardMetrics> {
  if (!POSTHOG_API_KEY) {
    console.warn('[PostHog API] No API key configured for dashboard metrics');
    return {
      pageViews: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      avgSessionDuration: '0:00',
      whatsappClicks: 0,
      pricingSectionViews: 0,
      planSelections: 0,
      scrollDepth75Plus: 0,
    };
  }

  // Build WHERE clause with optional store filter
  const storeFilter = storeId ? `AND properties.store_id = '${storeId}'` : '';

  const query = `
    SELECT
      countIf(event = '$pageview' OR event = 'catalog_page_view') as page_views,
      count(DISTINCT person_id) as unique_visitors,
      countIf(event = 'whatsapp_widget_clicked') as whatsapp_clicks,
      countIf(event = 'pricing_section_viewed') as pricing_views,
      countIf(event = 'pricing_plan_clicked') as plan_selections,
      countIf(event = 'scroll_depth_75' OR event = 'scroll_depth_100') as scroll_depth_75_plus,
      avg(toFloat(properties.$session_duration)) as avg_session_duration
    FROM events
    WHERE timestamp >= now() - INTERVAL ${days} DAY
    ${storeFilter}
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results || response.results.length === 0) {
    return {
      pageViews: 0,
      uniqueVisitors: 0,
      conversionRate: 0,
      avgSessionDuration: '0:00',
      whatsappClicks: 0,
      pricingSectionViews: 0,
      planSelections: 0,
      scrollDepth75Plus: 0,
    };
  }

  const result = response.results[0];
  const pageViews = result[0] || 0;
  const uniqueVisitors = result[1] || 0;
  const whatsappClicks = result[2] || 0;
  const pricingSectionViews = result[3] || 0;
  const planSelections = result[4] || 0;
  const scrollDepth75Plus = result[5] || 0;
  const avgDuration = result[6] || 0;

  // Calculate conversion rate
  const conversionRate = uniqueVisitors > 0
    ? parseFloat(((planSelections / uniqueVisitors) * 100).toFixed(1))
    : 0;

  // Format session duration
  const minutes = Math.floor(avgDuration / 60);
  const seconds = Math.floor(avgDuration % 60);
  const avgSessionDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  return {
    pageViews,
    uniqueVisitors,
    conversionRate,
    avgSessionDuration,
    whatsappClicks,
    pricingSectionViews,
    planSelections,
    scrollDepth75Plus,
  };
}

export interface TopEvent {
  event: string;
  count: number;
}

/**
 * Get top events from PostHog
 * @param days - Number of days to look back (default: 30)
 * @param limit - Maximum number of events to return (default: 10)
 * @param storeId - Optional store ID to filter by (for multi-tenant). If null, returns global events.
 */
export async function getTopEvents(days: number = 30, limit: number = 10, storeId?: string | null): Promise<TopEvent[]> {
  if (!POSTHOG_API_KEY) {
    console.warn('[PostHog API] No API key configured for top events');
    return [];
  }

  // Build WHERE clause with optional store filter
  const storeFilter = storeId ? `AND properties.store_id = '${storeId}'` : '';

  const query = `
    SELECT
      event,
      count(*) as event_count
    FROM events
    WHERE timestamp >= now() - INTERVAL ${days} DAY
      AND event NOT LIKE '$%'
      ${storeFilter}
    GROUP BY event
    ORDER BY event_count DESC
    LIMIT ${limit}
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results) {
    return [];
  }

  return response.results.map((row) => ({
    event: row[0] || '',
    count: row[1] || 0,
  }));
}

export interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropOff?: number;
}

/**
 * Get landing page conversion funnel data from PostHog
 * @param days - Number of days to look back (default: 30)
 * @param storeId - Optional store ID to filter by (for multi-tenant). If null, returns global funnel.
 */
export async function getLandingConversionFunnel(days: number = 30, storeId?: string | null): Promise<FunnelStep[]> {
  if (!POSTHOG_API_KEY) {
    console.warn('[PostHog API] No API key configured for conversion funnel');
    return [];
  }

  // Build WHERE clause with optional store filter
  const storeFilter = storeId ? `AND properties.store_id = '${storeId}'` : '';

  const query = `
    SELECT
      countIf(event = 'landing_page_viewed' OR event = '$pageview' OR event = 'catalog_page_view') as landing_views,
      countIf(event = 'pricing_section_viewed' OR event = 'product_added_to_cart') as pricing_views,
      countIf(event = 'hero_cta_clicked' OR event = 'pricing_plan_clicked' OR event = 'checkout_started') as cta_clicks,
      countIf(event = 'signup_started') as signup_started,
      countIf(event = 'pricing_plan_clicked' OR event = 'order_placed') as signup_completed
    FROM events
    WHERE timestamp >= now() - INTERVAL ${days} DAY
    ${storeFilter}
  `;

  const response = await executeHogQLQuery(query);

  if (response.error || !response.results || response.results.length === 0) {
    return [];
  }

  const result = response.results[0];
  const landingViews = result[0] || 0;
  const pricingViews = result[1] || 0;
  const ctaClicks = result[2] || 0;
  const signupStarted = result[3] || 0;
  const signupCompleted = result[4] || 0;

  if (landingViews === 0) {
    return [];
  }

  const steps = [
    {
      name: 'Landing Page Viewed',
      count: landingViews,
      percentage: 100,
      dropOff: 0,
    },
    {
      name: 'Scrolled to Pricing',
      count: pricingViews,
      percentage: (pricingViews / landingViews) * 100,
      dropOff: 0,
    },
    {
      name: 'CTA Clicked',
      count: ctaClicks,
      percentage: (ctaClicks / landingViews) * 100,
      dropOff: 0,
    },
    {
      name: 'Signup Started',
      count: signupStarted,
      percentage: (signupStarted / landingViews) * 100,
      dropOff: 0,
    },
    {
      name: 'Signup Completed',
      count: signupCompleted,
      percentage: (signupCompleted / landingViews) * 100,
    },
  ];

  // Calculate drop-offs
  for (let i = 0; i < steps.length - 1; i++) {
    steps[i].dropOff = steps[i].percentage - steps[i + 1].percentage;
  }

  return steps;
}
