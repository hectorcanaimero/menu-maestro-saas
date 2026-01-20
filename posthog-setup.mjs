#!/usr/bin/env node

/**
 * PostHog Setup Script for PideAI
 *
 * Este script automatiza la configuración completa de PostHog:
 * - Verifica la conexión
 * - Obtiene información del proyecto
 * - Crea dashboards recomendados
 * - Configura actions y cohorts
 * - Muestra queries útiles
 */

import * as readline from 'readline';

// Configuración desde .env
const POSTHOG_API_KEY = process.env.VITE_POSTHOG_API_KEY || process.env.VITE_POSTHOG_PERSONAL_KEY;
const POSTHOG_HOST = process.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Helper para imprimir con colores
const log = {
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.cyan}${msg}${colors.reset}\n`),
};

// Interface para readline
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// ============================================================================
// FUNCIONES DE API
// ============================================================================

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
    throw new Error(`API Error: ${response.status} ${response.statusText}\n${errorText}`);
  }

  return response.json();
}

async function getProjects() {
  return fetchPostHog('/api/projects/');
}

async function getProjectDetails(projectId) {
  return fetchPostHog(`/api/projects/${projectId}/`);
}

async function executeQuery(projectId, query) {
  return fetchPostHog(`/api/projects/${projectId}/query`, {
    method: 'POST',
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query: query,
      },
    }),
  });
}

async function createDashboard(projectId, name, description) {
  return fetchPostHog(`/api/projects/${projectId}/dashboards/`, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      pinned: true,
    }),
  });
}

async function createInsight(projectId, dashboardId, insightData) {
  return fetchPostHog(`/api/projects/${projectId}/insights/`, {
    method: 'POST',
    body: JSON.stringify({
      ...insightData,
      dashboards: [dashboardId],
    }),
  });
}

// ============================================================================
// FUNCIONES DE VERIFICACIÓN
// ============================================================================

async function verifyConnection() {
  log.title('🔌 Verificando conexión con PostHog...');

  if (!POSTHOG_API_KEY) {
    log.error('No se encontró VITE_POSTHOG_API_KEY o VITE_POSTHOG_PERSONAL_KEY en las variables de entorno');
    log.info('Por favor, configura tu API key en el archivo .env');
    return false;
  }

  try {
    const projects = await getProjects();
    log.success(`Conectado exitosamente a PostHog`);
    log.info(`Proyectos encontrados: ${projects.results?.length || 0}`);
    return projects;
  } catch (error) {
    log.error(`Error al conectar con PostHog: ${error.message}`);
    return false;
  }
}

async function getProjectInfo(projectId) {
  log.title('📊 Información del Proyecto');

  try {
    const project = await getProjectDetails(projectId);
    console.log(`
${colors.bright}Nombre:${colors.reset} ${project.name}
${colors.bright}ID:${colors.reset} ${project.id}
${colors.bright}Team:${colors.reset} ${project.team_name || 'N/A'}
${colors.bright}Timezone:${colors.reset} ${project.timezone || 'UTC'}
    `);
    return project;
  } catch (error) {
    log.error(`Error al obtener información del proyecto: ${error.message}`);
    return null;
  }
}

// ============================================================================
// ANÁLISIS DE EVENTOS
// ============================================================================

async function analyzeEvents(projectId) {
  log.title('🔍 Analizando eventos capturados (últimos 7 días)...');

  const query = `
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

  try {
    const result = await executeQuery(projectId, query);

    if (result.results && result.results.length > 0) {
      console.log('\n┌─────────────────────────────────────┬──────────────┬─────────────────┐');
      console.log('│ Evento                              │ Total        │ Usuarios Únicos │');
      console.log('├─────────────────────────────────────┼──────────────┼─────────────────┤');

      result.results.forEach((row) => {
        const event = String(row[0]).padEnd(35);
        const count = String(row[1]).padStart(12);
        const users = String(row[2]).padStart(15);
        console.log(`│ ${event} │ ${count} │ ${users} │`);
      });

      console.log('└─────────────────────────────────────┴──────────────┴─────────────────┘\n');
    } else {
      log.warning('No se encontraron eventos en los últimos 7 días');
    }
  } catch (error) {
    log.error(`Error al analizar eventos: ${error.message}`);
  }
}

async function analyzeStores(projectId) {
  log.title('🏪 Analizando tiendas (últimos 30 días)...');

  const query = `
    SELECT
      properties.store_name as store,
      countIf(event = 'catalog_page_view') as views,
      countIf(event = 'product_added_to_cart') as cart_adds,
      countIf(event = 'order_placed') as orders,
      sumIf(toFloat(properties.total), event = 'order_placed') as revenue
    FROM events
    WHERE timestamp >= now() - INTERVAL 30 DAY
      AND properties.store_name IS NOT NULL
    GROUP BY store
    ORDER BY orders DESC
    LIMIT 10
  `;

  try {
    const result = await executeQuery(projectId, query);

    if (result.results && result.results.length > 0) {
      console.log('\n┌──────────────────┬────────┬───────────┬─────────┬───────────┐');
      console.log('│ Tienda           │ Vistas │ Al Carri. │ Órdenes │ Ingresos  │');
      console.log('├──────────────────┼────────┼───────────┼─────────┼───────────┤');

      result.results.forEach((row) => {
        const store = String(row[0] || 'Unknown').slice(0, 16).padEnd(16);
        const views = String(row[1] || 0).padStart(6);
        const carts = String(row[2] || 0).padStart(9);
        const orders = String(row[3] || 0).padStart(7);
        const revenue = `$${(row[4] || 0).toFixed(2)}`.padStart(9);
        console.log(`│ ${store} │ ${views} │ ${carts} │ ${orders} │ ${revenue} │`);
      });

      console.log('└──────────────────┴────────┴───────────┴─────────┴───────────┘\n');
    } else {
      log.warning('No se encontraron datos de tiendas');
    }
  } catch (error) {
    log.error(`Error al analizar tiendas: ${error.message}`);
  }
}

// ============================================================================
// QUERIES ÚTILES
// ============================================================================

function showUsefulQueries(projectId) {
  log.title('📝 Queries HogQL Útiles');

  const queries = [
    {
      name: 'Top Productos Más Agregados al Carrito',
      query: `
SELECT
  properties.product_name as producto,
  count(*) as veces_agregado,
  avg(toFloat(properties.price)) as precio_promedio
FROM events
WHERE event = 'product_added_to_cart'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY producto
ORDER BY veces_agregado DESC
LIMIT 10
      `.trim(),
    },
    {
      name: 'Tasa de Conversión por Día',
      query: `
SELECT
  toDate(timestamp) as fecha,
  countIf(event = 'catalog_page_view') as vistas,
  countIf(event = 'order_placed') as ordenes,
  round((ordenes * 100.0 / vistas), 2) as tasa_conversion
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY fecha
ORDER BY fecha DESC
      `.trim(),
    },
    {
      name: 'Carritos Abandonados (últimos 7 días)',
      query: `
SELECT
  properties.product_name as producto,
  count(DISTINCT person_id) as carritos_abandonados
FROM events
WHERE event = 'product_added_to_cart'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND person_id NOT IN (
    SELECT DISTINCT person_id
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 7 DAY
  )
GROUP BY producto
ORDER BY carritos_abandonados DESC
LIMIT 15
      `.trim(),
    },
  ];

  queries.forEach((q, i) => {
    console.log(`${colors.bright}${i + 1}. ${q.name}${colors.reset}`);
    console.log(`${colors.cyan}${q.query}${colors.reset}\n`);
  });

  log.info('Puedes ejecutar estas queries en PostHog → SQL Insights → New SQL query');
}

// ============================================================================
// DASHBOARD CREATION
// ============================================================================

async function createExecutiveDashboard(projectId) {
  log.title('📈 Creando Dashboard: Resumen Ejecutivo');

  try {
    const dashboard = await createDashboard(
      projectId,
      '📈 Resumen Ejecutivo',
      'Métricas clave de negocio: vistas, órdenes, ingresos y conversión'
    );

    log.success(`Dashboard creado: ${dashboard.id}`);

    // Crear insights básicos
    const insights = [
      {
        name: 'Total de Vistas al Catálogo',
        description: 'Vistas totales al catálogo por tienda',
        query: {
          kind: 'TrendsQuery',
          series: [{
            event: 'catalog_page_view',
            kind: 'EventsNode',
          }],
          breakdownFilter: {
            breakdown: 'store_name',
            breakdown_type: 'event',
          },
          interval: 'day',
          dateRange: {
            date_from: '-30d',
          },
        },
      },
      {
        name: 'Órdenes Completadas',
        description: 'Total de órdenes por tienda',
        query: {
          kind: 'TrendsQuery',
          series: [{
            event: 'order_placed',
            kind: 'EventsNode',
          }],
          breakdownFilter: {
            breakdown: 'store_name',
            breakdown_type: 'event',
          },
          interval: 'day',
          dateRange: {
            date_from: '-30d',
          },
        },
      },
    ];

    for (const insight of insights) {
      try {
        await createInsight(projectId, dashboard.id, insight);
        log.success(`  ✓ Insight creado: ${insight.name}`);
      } catch (err) {
        log.warning(`  ⚠ No se pudo crear insight "${insight.name}": ${err.message}`);
      }
    }

    log.info(`\nDashboard disponible en: ${POSTHOG_HOST}/project/${projectId}/dashboard/${dashboard.id}`);
    return dashboard;
  } catch (error) {
    log.error(`Error al crear dashboard: ${error.message}`);
    return null;
  }
}

// ============================================================================
// MENÚ PRINCIPAL
// ============================================================================

async function showMenu(projectId) {
  console.log(`
${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}
${colors.bright}  PostHog Setup - PideAI${colors.reset}
${colors.bright}═══════════════════════════════════════════════════════════${colors.reset}

${colors.cyan}1.${colors.reset} Ver información del proyecto
${colors.cyan}2.${colors.reset} Analizar eventos capturados
${colors.cyan}3.${colors.reset} Analizar rendimiento por tienda
${colors.cyan}4.${colors.reset} Ver queries HogQL útiles
${colors.cyan}5.${colors.reset} Crear Dashboard "Resumen Ejecutivo"
${colors.cyan}6.${colors.reset} Abrir PostHog en el navegador
${colors.cyan}0.${colors.reset} Salir

  `);

  const option = await question('Selecciona una opción: ');

  switch (option.trim()) {
    case '1':
      await getProjectInfo(projectId);
      await question('\nPresiona Enter para continuar...');
      await showMenu(projectId);
      break;
    case '2':
      await analyzeEvents(projectId);
      await question('\nPresiona Enter para continuar...');
      await showMenu(projectId);
      break;
    case '3':
      await analyzeStores(projectId);
      await question('\nPresiona Enter para continuar...');
      await showMenu(projectId);
      break;
    case '4':
      showUsefulQueries(projectId);
      await question('\nPresiona Enter para continuar...');
      await showMenu(projectId);
      break;
    case '5':
      await createExecutiveDashboard(projectId);
      await question('\nPresiona Enter para continuar...');
      await showMenu(projectId);
      break;
    case '6':
      const url = `${POSTHOG_HOST}/project/${projectId}`;
      log.info(`Abriendo: ${url}`);
      await import('child_process').then((cp) => {
        cp.exec(`open "${url}"`);
      });
      await question('\nPresiona Enter para continuar...');
      await showMenu(projectId);
      break;
    case '0':
      log.success('¡Hasta luego! 👋');
      rl.close();
      process.exit(0);
      break;
    default:
      log.warning('Opción no válida');
      await showMenu(projectId);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.clear();
  log.title('🚀 PostHog Setup para PideAI');

  // 1. Verificar conexión
  const projects = await verifyConnection();
  if (!projects) {
    rl.close();
    process.exit(1);
  }

  // 2. Seleccionar proyecto
  if (projects.results && projects.results.length > 0) {
    console.log('\n' + colors.bright + 'Proyectos disponibles:' + colors.reset);
    projects.results.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.name} (ID: ${p.id})`);
    });

    let projectIndex = 0;
    if (projects.results.length > 1) {
      const answer = await question('\nSelecciona un proyecto (1): ');
      projectIndex = parseInt(answer.trim() || '1') - 1;
    }

    const selectedProject = projects.results[projectIndex];
    if (!selectedProject) {
      log.error('Proyecto no válido');
      rl.close();
      process.exit(1);
    }

    log.success(`Proyecto seleccionado: ${selectedProject.name}`);

    // 3. Mostrar menú principal
    await showMenu(selectedProject.id);
  } else {
    log.error('No se encontraron proyectos');
    rl.close();
    process.exit(1);
  }
}

// Ejecutar
main().catch((error) => {
  log.error(`Error fatal: ${error.message}`);
  rl.close();
  process.exit(1);
});
