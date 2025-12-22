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
  console.error('❌ Error: POSTHOG_API_KEY is not set');
  console.error('Set VITE_POSTHOG_API_KEY or VITE_POSTHOG_PERSONAL_KEY in your environment');
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

  console.log(`\n📊 Creating insight: ${insight.name}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify(insight),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to create insight: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Created insight: ${insight.name}`);
    console.log(`   ID: ${data.id}`);
    console.log(`   Short ID: ${data.short_id}`);
    console.log(`   URL: ${POSTHOG_HOST}/project/${POSTHOG_PROJECT_ID}/insights/${data.short_id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error creating insight:`, error);
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
  console.log('🚀 PostHog Funnel & Insight Creator');
  console.log('=====================================\n');
  console.log(`Project ID: ${POSTHOG_PROJECT_ID}`);
  console.log(`API Host: ${POSTHOG_HOST}`);

  const results = {
    funnels: [] as any[],
    insights: [] as any[],
  };

  // Create Funnels
  console.log('\n\n📈 CREATING FUNNELS');
  console.log('===================');

  const funnel1 = await createFunnel1();
  if (funnel1) results.funnels.push(funnel1);

  const funnel2Hero = await createFunnel2Hero();
  if (funnel2Hero) results.funnels.push(funnel2Hero);

  const funnel2Final = await createFunnel2Final();
  if (funnel2Final) results.funnels.push(funnel2Final);

  const funnel3 = await createFunnel3();
  if (funnel3) results.funnels.push(funnel3);

  // Create Insights
  console.log('\n\n📊 CREATING INSIGHTS');
  console.log('====================');

  const insight1 = await createInsight1();
  if (insight1) results.insights.push(insight1);

  const insight2 = await createInsight2();
  if (insight2) results.insights.push(insight2);

  const insight3 = await createInsight3();
  if (insight3) results.insights.push(insight3);

  // Summary
  console.log('\n\n✨ SUMMARY');
  console.log('==========');
  console.log(`✅ Created ${results.funnels.length} funnels`);
  console.log(`✅ Created ${results.insights.length} insights`);
  console.log(`\n🔗 View in PostHog: ${POSTHOG_HOST}/project/${POSTHOG_PROJECT_ID}/insights`);

  console.log('\n\n📋 CREATED ITEMS:');
  console.log('=================');

  if (results.funnels.length > 0) {
    console.log('\nFunnels:');
    results.funnels.forEach((f, i) => {
      console.log(`${i + 1}. ${f.name}`);
      console.log(`   URL: ${POSTHOG_HOST}/project/${POSTHOG_PROJECT_ID}/insights/${f.short_id}`);
    });
  }

  if (results.insights.length > 0) {
    console.log('\nInsights:');
    results.insights.forEach((ins, i) => {
      console.log(`${i + 1}. ${ins.name}`);
      console.log(`   URL: ${POSTHOG_HOST}/project/${POSTHOG_PROJECT_ID}/insights/${ins.short_id}`);
    });
  }
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
