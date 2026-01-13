import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wdpexjymbiyjqwdttqhz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcGV4anltYml5anF3ZHR0cWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzc3MzksImV4cCI6MjA3OTMxMzczOX0.eIeDRNLcdTKx8QidcrKSKJRqG1NtkLDKNXZFX_tGjv4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPlans() {
  try {
    const { data: plans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('name');

    if (error) throw error;

    console.log('=== PLANES DE SUSCRIPCIÓN ===\n');

    if (plans.length === 0) {
      console.log('❌ NO HAY PLANES CREADOS\n');
      return;
    }

    plans.forEach(plan => {
      console.log(`Plan: ${plan.name}`);
      console.log(`  Display Name: ${plan.display_name}`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Price: $${plan.price_monthly}/month`);
      console.log(`  Active: ${plan.is_active ? '✅' : '❌'}`);
      console.log('');
    });

    console.log(`\n📊 Total planes: ${plans.length}`);

    // Check specifically for 'free' plan
    const freePlan = plans.find(p => p.name === 'free');
    if (freePlan) {
      console.log(`✅ Plan 'free' encontrado: ${freePlan.id}`);
    } else {
      console.log(`❌ Plan 'free' NO encontrado`);
    }

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPlans();
