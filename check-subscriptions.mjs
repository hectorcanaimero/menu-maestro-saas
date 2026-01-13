import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdpexjymbiyjqwdttqhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcGV4anltYml5anF3ZHR0cWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzc3MzksImV4cCI6MjA3OTMxMzczOX0.eIeDRNLcdTKx8QidcrKSKJRqG1NtkLDKNXZFX_tGjv4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSubscriptions() {
  try {
    // Get all stores with their subscriptions
    const { data: stores, error } = await supabase
      .from('stores')
      .select(`
        id,
        name,
        subdomain,
        subscriptions (
          status,
          trial_ends_at,
          current_period_end,
          subscription_plans (
            name,
            display_name
          )
        )
      `)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;

    console.log('=== TIENDAS Y SUS SUSCRIPCIONES ===\n');
    stores.forEach(store => {
      const sub = store.subscriptions?.[0];
      const plan = sub?.subscription_plans;
      console.log(`Tienda: ${store.name}`);
      console.log(`  Subdomain: ${store.subdomain}`);
      console.log(`  Plan: ${plan?.name || '❌ SIN SUSCRIPCIÓN'} ${plan?.display_name ? `(${plan.display_name})` : ''}`);
      console.log(`  Estado: ${sub?.status || 'N/A'}`);
      if (sub?.trial_ends_at) {
        console.log(`  Trial ends: ${new Date(sub.trial_ends_at).toLocaleDateString('es-ES')}`);
      }
      if (sub?.current_period_end) {
        console.log(`  Period end: ${new Date(sub.current_period_end).toLocaleDateString('es-ES')}`);
      }
      console.log('');
    });

    // Count stores without subscriptions
    const withoutSub = stores.filter(s => !s.subscriptions || s.subscriptions.length === 0);
    console.log(`\n📊 Resumen:`);
    console.log(`  Total tiendas activas: ${stores.length}`);
    console.log(`  Sin suscripción: ${withoutSub.length}`);

    if (withoutSub.length > 0) {
      console.log(`\n⚠️  Tiendas sin suscripción:`);
      withoutSub.forEach(s => console.log(`    - ${s.name} (${s.subdomain})`));
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkSubscriptions();
