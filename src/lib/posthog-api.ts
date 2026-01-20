/**
 * PostHog Query API Helper
 *
 * Provides functions to query PostHog analytics data programmatically
 * Uses HogQL queries to fetch insights directly from PostHog
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';
const POSTHOG_PROJECT_ID = '88656';

// For development/testing - In production, this should come from env vars
// IMPORTANT: Create a Personal API Key in PostHog: Settings → Personal API Keys
const POSTHOG_API_KEY = import.meta.env.VITE_POSTHOG_API_KEY || import.meta.env.VITE_POSTHOG_PERSONAL_KEY;

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
      WHERE event = 'add_to_cart'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
    ),
    completed_orders AS (
      SELECT DISTINCT
        person_id,
        timestamp
      FROM events
      WHERE event = 'order_completed'
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
      WHERE event = 'add_to_cart'
        AND properties.store_id = '${storeId}'
        AND timestamp >= now() - INTERVAL ${days} DAY
      GROUP BY person_id
    ),
    completed_orders AS (
      SELECT DISTINCT person_id
      FROM events
      WHERE event = 'order_completed'
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
 * Steps: catalog_view → add_to_cart → checkout_started → order_completed
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
      WHERE event = 'add_to_cart'
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
      WHERE event = 'order_completed'
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
