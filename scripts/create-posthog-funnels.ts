/**
 * Script to create PostHog Funnels and Insights for Landing Page Analytics
 *
 * This script uses the PostHog REST API to create:
 * 1. Three funnels for landing page conversion tracking
 * 2. Three insights for event analytics
 *
 * Run with: npx tsx scripts/create-posthog-funnels.ts
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';
const POSTHOG_PROJECT_ID = '185811';
const POSTHOG_API_KEY = process.env.VITE_POSTHOG_API_KEY || process.env.VITE_POSTHOG_PERSONAL_KEY || '';

if (!POSTHOG_API_KEY) {
  process.exit(1);
}

interface PostHogInsight {
  name: string;
  filters: any;
  description?: string;
}

/**
 * Create an insight in PostHog
 */
async function createInsight(insight: PostHogInsight): Promise<any> {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/insights/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify(insight),
    });

    if (!response.ok) {
      const errorText = await response.text();

      return null;
    }

    const data = await response.json();

    return data;
  } catch (error) {
    return null;
  }
}

/**
 * Funnel 1: Landing → Registro Completo
 * - Evento 1: landing_page_viewed
 * - Evento 2: landing_cta_clicked (filtrado por cta_type = hero_crear_tienda OR final_crear_tienda)
 * - Evento 3: $pageview con current_url contiene /create-store
 */
async function createFunnel1() {
  const insight: PostHogInsight = {
    name: 'Landing Page Conversion - Full Flow',
    description: 'Tracks users from landing page view to CTA click to store creation page',
    filters: {
      insight: 'FUNNELS',
      interval: 'day',
      date_from: '-30d',
      funnel_viz_type: 'steps',
      funnel_window_interval: 14,
      funnel_window_interval_unit: 'day',
      events: [
        {
          id: 'landing_page_viewed',
          name: 'landing_page_viewed',
          type: 'events',
          order: 0,
        },
        {
          id: 'landing_cta_clicked',
          name: 'landing_cta_clicked',
          type: 'events',
          order: 1,
          properties: [
            {
              key: 'cta_type',
              type: 'event',
              value: ['hero_crear_tienda', 'final_crear_tienda'],
              operator: 'exact',
            },
          ],
        },
        {
          id: '$pageview',
          name: '$pageview',
          type: 'events',
          order: 2,
          properties: [
            {
              key: '$current_url',
              type: 'event',
              value: '/create-store',
              operator: 'icontains',
            },
          ],
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Funnel 2a: Hero CTA Flow
 * - landing_page_viewed → landing_cta_clicked (hero_crear_tienda) → $pageview /create-store
 */
async function createFunnel2Hero() {
  const insight: PostHogInsight = {
    name: 'Hero vs Final CTA - Hero Flow',
    description: 'Conversion funnel for Hero CTA button',
    filters: {
      insight: 'FUNNELS',
      interval: 'day',
      date_from: '-30d',
      funnel_viz_type: 'steps',
      funnel_window_interval: 14,
      funnel_window_interval_unit: 'day',
      events: [
        {
          id: 'landing_page_viewed',
          name: 'landing_page_viewed',
          type: 'events',
          order: 0,
        },
        {
          id: 'landing_cta_clicked',
          name: 'landing_cta_clicked',
          type: 'events',
          order: 1,
          properties: [
            {
              key: 'cta_type',
              type: 'event',
              value: 'hero_crear_tienda',
              operator: 'exact',
            },
          ],
        },
        {
          id: '$pageview',
          name: '$pageview',
          type: 'events',
          order: 2,
          properties: [
            {
              key: '$current_url',
              type: 'event',
              value: '/create-store',
              operator: 'icontains',
            },
          ],
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Funnel 2b: Final CTA Flow
 * - landing_section_viewed (features) → landing_cta_clicked (final_crear_tienda) → $pageview /create-store
 */
async function createFunnel2Final() {
  const insight: PostHogInsight = {
    name: 'Hero vs Final CTA - Final Flow',
    description: 'Conversion funnel for Final CTA button (after features section)',
    filters: {
      insight: 'FUNNELS',
      interval: 'day',
      date_from: '-30d',
      funnel_viz_type: 'steps',
      funnel_window_interval: 14,
      funnel_window_interval_unit: 'day',
      events: [
        {
          id: 'landing_section_viewed',
          name: 'landing_section_viewed',
          type: 'events',
          order: 0,
          properties: [
            {
              key: 'section',
              type: 'event',
              value: 'features',
              operator: 'exact',
            },
          ],
        },
        {
          id: 'landing_cta_clicked',
          name: 'landing_cta_clicked',
          type: 'events',
          order: 1,
          properties: [
            {
              key: 'cta_type',
              type: 'event',
              value: 'final_crear_tienda',
              operator: 'exact',
            },
          ],
        },
        {
          id: '$pageview',
          name: '$pageview',
          type: 'events',
          order: 2,
          properties: [
            {
              key: '$current_url',
              type: 'event',
              value: '/create-store',
              operator: 'icontains',
            },
          ],
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Funnel 3: Feature Engagement
 * - landing_page_viewed → feature_card_hovered → landing_cta_clicked
 */
async function createFunnel3() {
  const insight: PostHogInsight = {
    name: 'Feature Engagement to Conversion',
    description: 'Tracks users who hover over feature cards and then click CTA',
    filters: {
      insight: 'FUNNELS',
      interval: 'day',
      date_from: '-30d',
      funnel_viz_type: 'steps',
      funnel_window_interval: 14,
      funnel_window_interval_unit: 'day',
      events: [
        {
          id: 'landing_page_viewed',
          name: 'landing_page_viewed',
          type: 'events',
          order: 0,
        },
        {
          id: 'feature_card_hovered',
          name: 'feature_card_hovered',
          type: 'events',
          order: 1,
        },
        {
          id: 'landing_cta_clicked',
          name: 'landing_cta_clicked',
          type: 'events',
          order: 2,
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Insight 1: Landing Page Views (Line Chart)
 * Total de landing_page_viewed en los últimos 7 días
 */
async function createInsight1() {
  const insight: PostHogInsight = {
    name: 'Landing Page Views - Last 7 Days',
    description: 'Line chart showing total landing page views over the last 7 days',
    filters: {
      insight: 'TRENDS',
      interval: 'day',
      date_from: '-7d',
      display: 'ActionsLineGraph',
      events: [
        {
          id: 'landing_page_viewed',
          name: 'landing_page_viewed',
          type: 'events',
          order: 0,
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Insight 2: CTA Clicks by Type (Bar Chart)
 * Breakdown de landing_cta_clicked por cta_type
 */
async function createInsight2() {
  const insight: PostHogInsight = {
    name: 'CTA Clicks by Type',
    description: 'Bar chart showing landing_cta_clicked breakdown by cta_type',
    filters: {
      insight: 'TRENDS',
      interval: 'day',
      date_from: '-30d',
      display: 'ActionsBar',
      breakdown_type: 'event',
      breakdown: 'cta_type',
      events: [
        {
          id: 'landing_cta_clicked',
          name: 'landing_cta_clicked',
          type: 'events',
          order: 0,
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Insight 3: Feature Card Hovers by Title (Bar Chart)
 * Breakdown de feature_card_hovered por feature_title
 */
async function createInsight3() {
  const insight: PostHogInsight = {
    name: 'Feature Card Hovers by Title',
    description: 'Bar chart showing feature_card_hovered breakdown by feature_title',
    filters: {
      insight: 'TRENDS',
      interval: 'day',
      date_from: '-30d',
      display: 'ActionsBar',
      breakdown_type: 'event',
      breakdown: 'feature_title',
      events: [
        {
          id: 'feature_card_hovered',
          name: 'feature_card_hovered',
          type: 'events',
          order: 0,
        },
      ],
    },
  };

  return await createInsight(insight);
}

/**
 * Main function to create all funnels and insights
 */
async function main() {
  const results = {
    funnels: [] as any[],
    insights: [] as any[],
  };

  // Create Funnels

  const funnel1 = await createFunnel1();
  if (funnel1) results.funnels.push(funnel1);

  const funnel2Hero = await createFunnel2Hero();
  if (funnel2Hero) results.funnels.push(funnel2Hero);

  const funnel2Final = await createFunnel2Final();
  if (funnel2Final) results.funnels.push(funnel2Final);

  const funnel3 = await createFunnel3();
  if (funnel3) results.funnels.push(funnel3);

  // Create Insights

  const insight1 = await createInsight1();
  if (insight1) results.insights.push(insight1);

  const insight2 = await createInsight2();
  if (insight2) results.insights.push(insight2);

  const insight3 = await createInsight3();
  if (insight3) results.insights.push(insight3);

  if (results.funnels.length > 0) {
    results.funnels.forEach((f, i) => {});
  }

  if (results.insights.length > 0) {
    results.insights.forEach((ins, i) => {});
  }
}

// Run the script
main().catch((error) => {
  process.exit(1);
});
