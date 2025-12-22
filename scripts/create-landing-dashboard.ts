/**
 * Script to create a PostHog Dashboard for Landing Page Analytics
 *
 * This script creates a dashboard and adds all the created funnels and insights
 *
 * Run with: npx tsx scripts/create-landing-dashboard.ts
 */

const POSTHOG_HOST = 'https://us.i.posthog.com';
const POSTHOG_PROJECT_ID = '185811';
const POSTHOG_API_KEY = process.env.VITE_POSTHOG_API_KEY || process.env.VITE_POSTHOG_PERSONAL_KEY || '';

if (!POSTHOG_API_KEY) {
  console.error('❌ Error: POSTHOG_API_KEY is not set');
  console.error('Set VITE_POSTHOG_API_KEY or VITE_POSTHOG_PERSONAL_KEY in your environment');
  process.exit(1);
}

// Short IDs from the created insights
const INSIGHT_SHORT_IDS = {
  funnel1: 'fRiCT4GE',
  funnel2Hero: 'heDAxNDb',
  funnel2Final: 'TxnXP8Ky',
  funnel3: 'SX0yv9Xq',
  insight1: 'ozJJ0eAY',
  insight2: 'W64OOoNP',
  insight3: 'o7PyBsWB',
};

/**
 * Create a dashboard in PostHog
 */
async function createDashboard() {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/dashboards/`;

  console.log('\n📊 Creating Landing Page Analytics Dashboard');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        name: 'Landing Page Analytics',
        description: 'Comprehensive analytics for the PideAI landing page, including conversion funnels and engagement metrics',
        pinned: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to create dashboard: ${response.status} ${response.statusText}`);
      console.error('Error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Created dashboard: ${data.name}`);
    console.log(`   ID: ${data.id}`);
    console.log(`   URL: ${POSTHOG_HOST}/project/${POSTHOG_PROJECT_ID}/dashboard/${data.id}`);
    return data;
  } catch (error) {
    console.error(`❌ Error creating dashboard:`, error);
    return null;
  }
}

/**
 * Add an insight to a dashboard
 */
async function addInsightToDashboard(dashboardId: number, insightShortId: string, layouts?: any) {
  const url = `${POSTHOG_HOST}/api/projects/${POSTHOG_PROJECT_ID}/dashboards/${dashboardId}/tiles/`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      },
      body: JSON.stringify({
        insight: insightShortId,
        layouts: layouts || {},
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Failed to add insight ${insightShortId}: ${response.status}`);
      console.error('Error details:', errorText);
      return null;
    }

    const data = await response.json();
    console.log(`✅ Added insight ${insightShortId} to dashboard`);
    return data;
  } catch (error) {
    console.error(`❌ Error adding insight ${insightShortId}:`, error);
    return null;
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 PostHog Landing Page Dashboard Creator');
  console.log('==========================================\n');

  // Create dashboard
  const dashboard = await createDashboard();
  if (!dashboard) {
    console.error('Failed to create dashboard. Exiting.');
    return;
  }

  console.log('\n📌 Adding insights to dashboard...\n');

  // Add funnels (full width)
  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.funnel1, {
    sm: { x: 0, y: 0, w: 12, h: 5 },
  });

  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.funnel2Hero, {
    sm: { x: 0, y: 5, w: 6, h: 5 },
  });

  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.funnel2Final, {
    sm: { x: 6, y: 5, w: 6, h: 5 },
  });

  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.funnel3, {
    sm: { x: 0, y: 10, w: 12, h: 5 },
  });

  // Add insights (3 columns)
  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.insight1, {
    sm: { x: 0, y: 15, w: 12, h: 5 },
  });

  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.insight2, {
    sm: { x: 0, y: 20, w: 6, h: 5 },
  });

  await addInsightToDashboard(dashboard.id, INSIGHT_SHORT_IDS.insight3, {
    sm: { x: 6, y: 20, w: 6, h: 5 },
  });

  console.log('\n\n✨ DASHBOARD CREATED SUCCESSFULLY!');
  console.log('=================================');
  console.log(`\n🔗 View Dashboard: ${POSTHOG_HOST}/project/${POSTHOG_PROJECT_ID}/dashboard/${dashboard.id}`);
  console.log('\n📊 Dashboard includes:');
  console.log('   - 4 Conversion Funnels');
  console.log('   - 3 Engagement Insights');
  console.log('\n✅ All insights have been added to the dashboard');
}

// Run the script
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});
