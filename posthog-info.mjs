#!/usr/bin/env node

/**
 * PostHog Information Display Script
 * Muestra información y análisis de PostHog sin interacción
 */

// Configuración desde .env
const POSTHOG_API_KEY = process.env.VITE_POSTHOG_API_KEY || process.env.VITE_POSTHOG_PERSONAL_KEY;
const POSTHOG_HOST = process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';
const PROJECT_ID = '88656'; // Obtenido del código

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

async function fetchPostHog(endpoint, options = {}) {
  const url = `${POSTHOG_HOST}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${POSTHOG_API_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function executeQuery(query) {
  return fetchPostHog(`/api/projects/${PROJECT_ID}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query: query,
      },
    }),
  });
}

async function main() {
  console.clear();
  log.title('🚀 PostHog Analytics - PideAI');

  if (!POSTHOG_API_KEY) {
    log.error('No se encontró la API key de PostHog');
    log.info('Configura VITE_POSTHOG_API_KEY en tu archivo .env');
    process.exit(1);
  }

  try {
    // 1. Información del proyecto
    log.title('📊 Información del Proyecto');
    const project = await fetchPostHog(`/api/projects/${PROJECT_ID}/`);
    console.log(`
${colors.bright}Nombre:${colors.reset} ${project.name}
${colors.bright}ID:${colors.reset} ${project.id}
${colors.bright}Team:${colors.reset} ${project.team_name || 'N/A'}
${colors.bright}Timezone:${colors.reset} ${project.timezone || 'UTC'}
${colors.bright}URL:${colors.reset} ${POSTHOG_HOST}/project/${project.id}
    `);

    // 2. Análisis de eventos (últimos 7 días)
    log.title('🔍 Eventos Capturados (últimos 7 días)');
    const eventsQuery = `
      SELECT
        event,
        count(*) as event_count,
        count(DISTINCT person_id) as unique_users
      FROM events
      WHERE timestamp >= now() - INTERVAL 7 DAY
      GROUP BY event
      ORDER BY event_count DESC
      LIMIT 20
    `;

    const eventsResult = await executeQuery(eventsQuery);

    if (eventsResult.results && eventsResult.results.length > 0) {
      console.log('┌─────────────────────────────────────┬──────────────┬─────────────────┐');
      console.log('│ Evento                              │ Total        │ Usuarios Únicos │');
      console.log('├─────────────────────────────────────┼──────────────┼─────────────────┤');

      eventsResult.results.forEach((row) => {
        const event = String(row[0]).slice(0, 35).padEnd(35);
        const count = String(row[1]).padStart(12);
        const users = String(row[2]).padStart(15);
        console.log(`│ ${event} │ ${count} │ ${users} │`);
      });

      console.log('└─────────────────────────────────────┴──────────────┴─────────────────┘');
    } else {
      log.warning('No hay eventos en los últimos 7 días');
    }

    // 3. Análisis por tienda (últimos 30 días)
    log.title('🏪 Rendimiento por Tienda (últimos 30 días)');
    const storesQuery = `
      SELECT
        properties.store_name as store,
        countIf(event = 'catalog_page_view') as views,
        countIf(event = 'product_added_to_cart') as cart_adds,
        countIf(event = 'order_placed') as orders,
        sumIf(toFloat(properties.total), event = 'order_placed') as revenue,
        round((countIf(event = 'order_placed') * 100.0 / countIf(event = 'catalog_page_view')), 2) as conversion_rate
      FROM events
      WHERE timestamp >= now() - INTERVAL 30 DAY
        AND properties.store_name IS NOT NULL
      GROUP BY store
      ORDER BY orders DESC
      LIMIT 10
    `;

    const storesResult = await executeQuery(storesQuery);

    if (storesResult.results && storesResult.results.length > 0) {
      console.log('┌──────────────────┬────────┬───────────┬─────────┬───────────┬────────────┐');
      console.log('│ Tienda           │ Vistas │ Al Carri. │ Órdenes │ Ingresos  │ Conv. (%)  │');
      console.log('├──────────────────┼────────┼───────────┼─────────┼───────────┼────────────┤');

      storesResult.results.forEach((row) => {
        const store = String(row[0] || 'Unknown').slice(0, 16).padEnd(16);
        const views = String(row[1] || 0).padStart(6);
        const carts = String(row[2] || 0).padStart(9);
        const orders = String(row[3] || 0).padStart(7);
        const revenue = `$${(row[4] || 0).toFixed(2)}`.padStart(9);
        const conversion = String((row[5] || 0).toFixed(2)).padStart(10);
        console.log(`│ ${store} │ ${views} │ ${carts} │ ${orders} │ ${revenue} │ ${conversion} │`);
      });

      console.log('└──────────────────┴────────┴───────────┴─────────┴───────────┴────────────┘');
    } else {
      log.warning('No hay datos de tiendas en los últimos 30 días');
    }

    // 4. Top productos (últimos 30 días)
    log.title('🛍️ Top 10 Productos Más Agregados al Carrito');
    const productsQuery = `
      SELECT
        properties.product_name as producto,
        count(*) as veces_agregado,
        avg(toFloat(properties.price)) as precio_promedio
      FROM events
      WHERE event = 'product_added_to_cart'
        AND timestamp >= now() - INTERVAL 30 DAY
        AND properties.product_name IS NOT NULL
      GROUP BY producto
      ORDER BY veces_agregado DESC
      LIMIT 10
    `;

    const productsResult = await executeQuery(productsQuery);

    if (productsResult.results && productsResult.results.length > 0) {
      console.log('┌──────────────────────────────────────┬───────────────┬────────────────┐');
      console.log('│ Producto                             │ Veces Agregado│ Precio Promedio│');
      console.log('├──────────────────────────────────────┼───────────────┼────────────────┤');

      productsResult.results.forEach((row) => {
        const product = String(row[0]).slice(0, 36).padEnd(36);
        const count = String(row[1]).padStart(13);
        const price = `$${(row[2] || 0).toFixed(2)}`.padStart(14);
        console.log(`│ ${product} │ ${count} │ ${price} │`);
      });

      console.log('└──────────────────────────────────────┴───────────────┴────────────────┘');
    } else {
      log.warning('No hay datos de productos');
    }

    // 5. Estadísticas generales
    log.title('📈 Estadísticas Generales (últimos 30 días)');
    const statsQuery = `
      SELECT
        countIf(event = 'catalog_page_view') as total_views,
        count(DISTINCT CASE WHEN event = 'catalog_page_view' THEN person_id END) as unique_visitors,
        countIf(event = 'order_placed') as total_orders,
        sumIf(toFloat(properties.total), event = 'order_placed') as total_revenue,
        avgIf(toFloat(properties.total), event = 'order_placed') as avg_order_value,
        round((countIf(event = 'order_placed') * 100.0 / countIf(event = 'catalog_page_view')), 2) as conversion_rate
      FROM events
      WHERE timestamp >= now() - INTERVAL 30 DAY
    `;

    const statsResult = await executeQuery(statsQuery);

    if (statsResult.results && statsResult.results.length > 0) {
      const stats = statsResult.results[0];
      console.log(`
${colors.bright}Total de Vistas al Catálogo:${colors.reset} ${stats[0] || 0}
${colors.bright}Visitantes Únicos:${colors.reset} ${stats[1] || 0}
${colors.bright}Total de Órdenes:${colors.reset} ${stats[2] || 0}
${colors.bright}Ingresos Totales:${colors.reset} $${(stats[3] || 0).toFixed(2)}
${colors.bright}Valor Promedio de Orden:${colors.reset} $${(stats[4] || 0).toFixed(2)}
${colors.bright}Tasa de Conversión:${colors.reset} ${(stats[5] || 0).toFixed(2)}%
      `);
    }

    // 6. Recursos útiles
    log.title('📚 Recursos y Enlaces Útiles');
    console.log(`
${colors.cyan}Dashboard Principal:${colors.reset}
  ${POSTHOG_HOST}/project/${PROJECT_ID}

${colors.cyan}SQL Insights:${colors.reset}
  ${POSTHOG_HOST}/project/${PROJECT_ID}/insights/new

${colors.cyan}Live Events:${colors.reset}
  ${POSTHOG_HOST}/project/${PROJECT_ID}/events

${colors.cyan}Dashboards:${colors.reset}
  ${POSTHOG_HOST}/project/${PROJECT_ID}/dashboard

${colors.cyan}Feature Flags:${colors.reset}
  ${POSTHOG_HOST}/project/${PROJECT_ID}/feature_flags

${colors.cyan}Session Recordings:${colors.reset}
  ${POSTHOG_HOST}/project/${PROJECT_ID}/replay/recent
    `);

    log.title('💡 Próximos Pasos');
    console.log(`
${colors.green}1.${colors.reset} Revisa el archivo ${colors.bright}POSTHOG_SETUP.md${colors.reset} para guías detalladas
${colors.green}2.${colors.reset} Crea dashboards personalizados según las recomendaciones
${colors.green}3.${colors.reset} Configura alertas para métricas críticas
${colors.green}4.${colors.reset} Implementa feature flags para experimentos A/B
${colors.green}5.${colors.reset} Revisa las Session Recordings para mejorar UX
    `);

    log.success('Setup completado! 🎉\n');
  } catch (error) {
    log.error(`Error: ${error.message}`);
    if (error.stack && process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
