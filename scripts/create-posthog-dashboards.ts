/**
 * Script para crear dashboards de PostHog vía API
 *
 * Uso:
 *   npx tsx scripts/create-posthog-dashboards.ts
 *
 * Requisitos:
 *   - npm install -D tsx
 *   - Variables de entorno configuradas en .env
 */

import { config } from 'dotenv';

// Cargar variables de entorno desde .env
config();

const POSTHOG_API_KEY = process.env.VITE_POSTHOG_PERSONAL_KEY || process.env.VITE_POSTHOG_API_KEY;
const POSTHOG_HOST = 'https://us.posthog.com';
const PROJECT_ID = '88656'; // ID del proyecto PideAi en PostHog

if (!POSTHOG_API_KEY) {
  console.error('❌ VITE_POSTHOG_PERSONAL_KEY no encontrado en .env');
  process.exit(1);
}

interface InsightConfig {
  name: string;
  filters: {
    events?: Array<{
      id: string;
      name: string;
      type: string;
      math?: string;
      math_property?: string;
    }>;
    insight: string;
    date_from?: string;
    interval?: string;
    display?: string;
    breakdown_type?: string;
    breakdown?: string;
  };
  description?: string;
}

interface DashboardConfig {
  name: string;
  description: string;
  tags: string[];
  insights: InsightConfig[];
}

// Dashboard 1: Platform Overview
const platformOverviewDashboard: DashboardConfig = {
  name: '📊 Platform Overview',
  description: 'Vista general de toda la plataforma PideAI - Métricas clave de todas las tiendas',
  tags: ['platform', 'overview', 'executive'],
  insights: [
    // Insight 1: Total Tiendas Activas
    {
      name: 'Total Tiendas Activas',
      description: 'Tiendas únicas con al menos 1 pedido en los últimos 30 días',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_created',
          name: 'order_created',
          type: 'events',
          math: 'dau', // Unique values
          math_property: 'store_id'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    },

    // Insight 2: Total Pedidos
    {
      name: 'Total Pedidos',
      description: 'Pedidos totales en los últimos 30 días',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },

    // Insight 3: GMV Total (Gross Merchandise Value)
    {
      name: 'GMV Total',
      description: 'Ingresos totales procesados en la plataforma',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'sum',
          math_property: 'total'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    },

    // Insight 4: Usuarios Activos
    {
      name: 'Clientes Únicos',
      description: 'Clientes únicos que realizaron pedidos',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'dau',
          math_property: 'customer_id'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    },

    // Insight 5: Pedidos por Estado
    {
      name: 'Distribución de Pedidos por Estado',
      description: 'Pedidos distribuidos por su estado actual',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-7d',
        display: 'ActionsPie',
        breakdown_type: 'event',
        breakdown: 'order_status'
      }
    },

    // Insight 6: Top 10 Tiendas por Volumen
    {
      name: 'Top 10 Tiendas por Pedidos',
      description: 'Tiendas con mayor volumen de pedidos',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsTable',
        breakdown_type: 'event',
        breakdown: 'store_name'
      }
    }
  ]
};

// Dashboard 2: Conversión y Ventas
const conversionDashboard: DashboardConfig = {
  name: '🎯 Conversión y Ventas',
  description: 'Análisis de funnel de conversión y métricas de ventas',
  tags: ['conversion', 'sales', 'funnel'],
  insights: [
    // Funnel de Conversión
    {
      name: 'Funnel de Conversión Principal',
      description: 'Desde vista de catálogo hasta orden completada',
      filters: {
        insight: 'FUNNELS',
        events: [
          {
            id: 'catalog_page_view',
            name: 'catalog_page_view',
            type: 'events'
          },
          {
            id: 'product_added_to_cart',
            name: 'product_added_to_cart',
            type: 'events'
          },
          {
            id: 'checkout_started',
            name: 'checkout_started',
            type: 'events'
          },
          {
            id: 'order_placed',
            name: 'order_placed',
            type: 'events'
          }
        ],
        date_from: '-30d'
      }
    },

    // Productos más agregados al carrito
    {
      name: 'Productos Más Agregados al Carrito',
      description: 'Top 10 productos por cantidad agregada',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'product_added_to_cart',
          name: 'product_added_to_cart',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsBar',
        breakdown_type: 'event',
        breakdown: 'product_name'
      }
    }
  ]
};

// Dashboard 3: Stores Analysis
const storesDashboard: DashboardConfig = {
  name: '🏪 Stores Analysis',
  description: 'Rendimiento y métricas por tienda individual',
  tags: ['stores', 'performance'],
  insights: [
    {
      name: 'Vistas de Catálogo por Tienda',
      description: 'Tráfico total por tienda',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'catalog_page_view',
          name: 'catalog_page_view',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsBar',
        breakdown_type: 'event',
        breakdown: 'store_name'
      }
    },
    {
      name: 'Revenue por Tienda',
      description: 'Ingresos generados por cada tienda',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'sum',
          math_property: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsTable',
        breakdown_type: 'event',
        breakdown: 'store_name'
      }
    },
    {
      name: 'Tasa de Conversión por Tienda',
      description: 'Porcentaje de visitas que se convierten en órdenes',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsTable',
        breakdown_type: 'event',
        breakdown: 'store_name'
      }
    }
  ]
};

// Dashboard 4: Orders Deep Dive
const ordersDeepDiveDashboard: DashboardConfig = {
  name: '📦 Orders Deep Dive',
  description: 'Análisis detallado del flujo de órdenes y estados',
  tags: ['orders', 'operations', 'fulfillment'],
  insights: [
    {
      name: 'Órdenes por Estado',
      description: 'Distribución de órdenes según su estado actual',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-7d',
        display: 'ActionsPie',
        breakdown_type: 'event',
        breakdown: 'order_status'
      }
    },
    {
      name: 'Tiempo Promedio de Preparación',
      description: 'Tiempo entre orden confirmada y lista',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_preparing',
          name: 'order_preparing',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Órdenes por Tipo',
      description: 'Delivery vs Pickup',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsBar',
        breakdown_type: 'event',
        breakdown: 'order_type'
      }
    },
    {
      name: 'Órdenes Canceladas',
      description: 'Tracking de órdenes canceladas y razones',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_cancelled',
          name: 'order_cancelled',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    }
  ]
};

// Dashboard 5: Products & Catalog
const productsCatalogDashboard: DashboardConfig = {
  name: '🛍️ Products & Catalog',
  description: 'Análisis de rendimiento de productos y categorías',
  tags: ['products', 'catalog', 'sales'],
  insights: [
    {
      name: 'Top 20 Productos Más Vendidos',
      description: 'Productos ordenados por cantidad de veces agregados al carrito',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'product_added_to_cart',
          name: 'product_added_to_cart',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsTable',
        breakdown_type: 'event',
        breakdown: 'product_name'
      }
    },
    {
      name: 'Productos Más Vistos',
      description: 'Productos con mayor número de visualizaciones',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'product_viewed',
          name: 'product_viewed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsBar',
        breakdown_type: 'event',
        breakdown: 'product_name'
      }
    },
    {
      name: 'Categorías Más Populares',
      description: 'Distribución de vistas por categoría',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'category_viewed',
          name: 'category_viewed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsPie',
        breakdown_type: 'event',
        breakdown: 'category_name'
      }
    },
    {
      name: 'Productos Removidos del Carrito',
      description: 'Productos más removidos - posibles problemas',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'product_removed_from_cart',
          name: 'product_removed_from_cart',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'ActionsTable',
        breakdown_type: 'event',
        breakdown: 'product_name'
      }
    }
  ]
};

// Dashboard 6: Customers Lifecycle
const customersLifecycleDashboard: DashboardConfig = {
  name: '👥 Customers Lifecycle',
  description: 'Análisis del ciclo de vida y comportamiento de clientes',
  tags: ['customers', 'retention', 'engagement'],
  insights: [
    {
      name: 'Nuevos Clientes vs Recurrentes',
      description: 'Clientes que hacen su primera orden vs órdenes repetidas',
      filters: {
        insight: 'TRENDS',
        events: [
          {
            id: 'first_order',
            name: 'first_order',
            type: 'events',
            math: 'total'
          },
          {
            id: 'repeat_order',
            name: 'repeat_order',
            type: 'events',
            math: 'total'
          }
        ],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Clientes Activos Mensuales',
      description: 'Unique customers que realizaron al menos 1 pedido',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'order_placed',
          name: 'order_placed',
          type: 'events',
          math: 'dau',
          math_property: 'customer_id'
        }],
        date_from: '-90d',
        interval: 'month',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Customer Return Rate',
      description: 'Porcentaje de clientes que regresan a hacer otra orden',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'customer_return',
          name: 'customer_return',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    }
  ]
};

// Dashboard 7: Subscriptions & Revenue
const subscriptionsRevenueDashboard: DashboardConfig = {
  name: '💰 Subscriptions & Revenue',
  description: 'MRR, ARR, Churn y métricas de suscripciones',
  tags: ['subscriptions', 'revenue', 'saas', 'mrr'],
  insights: [
    {
      name: 'Nuevas Suscripciones',
      description: 'Suscripciones creadas en el período',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'subscription_created',
          name: 'subscription_created',
          type: 'events',
          math: 'total'
        }],
        date_from: '-90d',
        interval: 'week',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Suscripciones Canceladas',
      description: 'Churn tracking - suscripciones canceladas',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'subscription_cancelled',
          name: 'subscription_cancelled',
          type: 'events',
          math: 'total'
        }],
        date_from: '-90d',
        interval: 'week',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Upgrades vs Downgrades',
      description: 'Movimiento entre planes',
      filters: {
        insight: 'TRENDS',
        events: [
          {
            id: 'subscription_upgraded',
            name: 'subscription_upgraded',
            type: 'events',
            math: 'total'
          },
          {
            id: 'subscription_downgraded',
            name: 'subscription_downgraded',
            type: 'events',
            math: 'total'
          }
        ],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Trial Conversion Rate',
      description: 'Trials que se convierten en suscripciones pagadas',
      filters: {
        insight: 'FUNNELS',
        events: [
          {
            id: 'trial_started',
            name: 'trial_started',
            type: 'events'
          },
          {
            id: 'trial_converted',
            name: 'trial_converted',
            type: 'events'
          }
        ],
        date_from: '-90d'
      }
    }
  ]
};

// Dashboard 8: Modules & Features
const modulesFeaturesDashboard: DashboardConfig = {
  name: '🔧 Modules & Features',
  description: 'Adopción y uso de módulos como WhatsApp y Delivery',
  tags: ['modules', 'features', 'adoption'],
  insights: [
    {
      name: 'Mensajes WhatsApp Enviados',
      description: 'Total de mensajes enviados por WhatsApp',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'whatsapp_message_sent',
          name: 'whatsapp_message_sent',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Deliveries Asignados',
      description: 'Deliveries asignados a drivers',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'delivery_assigned',
          name: 'delivery_assigned',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Fotos de Entrega Subidas',
      description: 'Prueba de entrega con foto',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'delivery_photo_uploaded',
          name: 'delivery_photo_uploaded',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    },
    {
      name: 'Tiendas con WhatsApp Activo',
      description: 'Tiendas usando el módulo de WhatsApp',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'whatsapp_message_sent',
          name: 'whatsapp_message_sent',
          type: 'events',
          math: 'dau',
          math_property: 'store_id'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    }
  ]
};

// Dashboard 9: Technical Performance
const technicalPerformanceDashboard: DashboardConfig = {
  name: '⚡ Technical Performance',
  description: 'Errores, rendimiento y salud técnica de la plataforma',
  tags: ['performance', 'errors', 'technical'],
  insights: [
    {
      name: 'API Errors',
      description: 'Errores de API reportados',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'api_error',
          name: 'api_error',
          type: 'events',
          math: 'total'
        }],
        date_from: '-7d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Páginas con Carga Lenta',
      description: 'Páginas que tardan más de 3 segundos en cargar',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'page_load_slow',
          name: 'page_load_slow',
          type: 'events',
          math: 'total'
        }],
        date_from: '-7d',
        display: 'ActionsTable',
        breakdown_type: 'event',
        breakdown: 'page_name'
      }
    },
    {
      name: 'Checkout Abandonado',
      description: 'Usuarios que iniciaron checkout pero no completaron',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'checkout_abandoned',
          name: 'checkout_abandoned',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    }
  ]
};

// Dashboard 10: Marketing & Acquisition
const marketingAcquisitionDashboard: DashboardConfig = {
  name: '📈 Marketing & Acquisition',
  description: 'Canales de adquisición, conversión de landing page y crecimiento',
  tags: ['marketing', 'acquisition', 'growth'],
  insights: [
    {
      name: 'Landing Page Views',
      description: 'Vistas totales de la landing page',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'landing_page_viewed',
          name: 'landing_page_viewed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        interval: 'day',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Signup Funnel',
      description: 'Conversión de visitante a usuario registrado',
      filters: {
        insight: 'FUNNELS',
        events: [
          {
            id: 'landing_page_viewed',
            name: 'landing_page_viewed',
            type: 'events'
          },
          {
            id: 'signup_started',
            name: 'signup_started',
            type: 'events'
          },
          {
            id: 'signup_completed',
            name: 'signup_completed',
            type: 'events'
          }
        ],
        date_from: '-30d'
      }
    },
    {
      name: 'Nuevas Tiendas Creadas',
      description: 'Tiendas creadas en el período',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'store_created',
          name: 'store_created',
          type: 'events',
          math: 'total'
        }],
        date_from: '-90d',
        interval: 'week',
        display: 'ActionsLineGraph'
      }
    },
    {
      name: 'Onboarding Completado',
      description: 'Tiendas que completaron el onboarding',
      filters: {
        insight: 'TRENDS',
        events: [{
          id: 'onboarding_completed',
          name: 'onboarding_completed',
          type: 'events',
          math: 'total'
        }],
        date_from: '-30d',
        display: 'BoldNumber'
      }
    }
  ]
};

async function createDashboard(config: DashboardConfig): Promise<any> {
  console.log(`\n📊 Creando dashboard: ${config.name}...`);

  try {
    // Crear el dashboard
    const dashboardResponse = await fetch(
      `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/dashboards/`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${POSTHOG_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: config.name,
          description: config.description,
          tags: config.tags,
        }),
      }
    );

    if (!dashboardResponse.ok) {
      const error = await dashboardResponse.text();
      throw new Error(`Failed to create dashboard: ${dashboardResponse.status} - ${error}`);
    }

    const dashboard = await dashboardResponse.json();
    console.log(`✅ Dashboard creado: ${dashboard.id}`);

    // Crear insights para este dashboard
    for (let i = 0; i < config.insights.length; i++) {
      const insight = config.insights[i];
      console.log(`  📈 Creando insight ${i + 1}/${config.insights.length}: ${insight.name}...`);

      try {
        const insightResponse = await fetch(
          `${POSTHOG_HOST}/api/projects/${PROJECT_ID}/insights/`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${POSTHOG_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: insight.name,
              description: insight.description,
              filters: insight.filters,
              dashboards: [dashboard.id],
            }),
          }
        );

        if (!insightResponse.ok) {
          const error = await insightResponse.text();
          console.warn(`  ⚠️  Error creando insight "${insight.name}": ${error}`);
        } else {
          const createdInsight = await insightResponse.json();
          console.log(`  ✅ Insight creado: ${createdInsight.id}`);
        }
      } catch (error) {
        console.warn(`  ⚠️  Error creando insight "${insight.name}":`, error);
      }

      // Pequeña pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return dashboard;
  } catch (error) {
    console.error(`❌ Error creando dashboard "${config.name}":`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Iniciando creación de dashboards en PostHog...\n');
  console.log(`📍 Host: ${POSTHOG_HOST}`);
  console.log(`📍 Project ID: ${PROJECT_ID}`);
  console.log(`📍 API Key: ${POSTHOG_API_KEY.substring(0, 10)}...`);

  const dashboards = [
    platformOverviewDashboard,
    conversionDashboard,
    storesDashboard,
    ordersDeepDiveDashboard,
    productsCatalogDashboard,
    customersLifecycleDashboard,
    subscriptionsRevenueDashboard,
    modulesFeaturesDashboard,
    technicalPerformanceDashboard,
    marketingAcquisitionDashboard,
  ];

  const results = {
    success: [] as string[],
    failed: [] as string[],
  };

  for (const dashboardConfig of dashboards) {
    try {
      await createDashboard(dashboardConfig);
      results.success.push(dashboardConfig.name);
    } catch (error) {
      results.failed.push(dashboardConfig.name);
      console.error(`\n❌ Failed to create dashboard: ${dashboardConfig.name}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN');
  console.log('='.repeat(60));
  console.log(`✅ Dashboards creados exitosamente: ${results.success.length}`);
  results.success.forEach(name => console.log(`   - ${name}`));

  if (results.failed.length > 0) {
    console.log(`\n❌ Dashboards que fallaron: ${results.failed.length}`);
    results.failed.forEach(name => console.log(`   - ${name}`));
  }

  console.log('\n🎉 Proceso completado!');
  console.log(`\n📱 Accede a tus dashboards en:`);
  console.log(`   ${POSTHOG_HOST}/project/${PROJECT_ID}/dashboard`);
}

main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
