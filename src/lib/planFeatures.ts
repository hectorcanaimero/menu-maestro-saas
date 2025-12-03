/**
 * Plan Features Catalog
 *
 * Defines all available features that can be assigned to subscription plans
 */

export interface Feature {
  key: string;
  label: string;
  description: string;
  category: FeatureCategory;
}

export type FeatureCategory =
  | 'core' // Core product features
  | 'analytics' // Analytics and reporting
  | 'marketing' // Marketing and promotions
  | 'operations' // Operations and management
  | 'support' // Support features
  | 'advanced'; // Advanced/Enterprise features

// ============================================================================
// AVAILABLE FEATURES CATALOG
// ============================================================================

export const AVAILABLE_FEATURES: Feature[] = [
  // -------------------------------------------------------------------------
  // CORE FEATURES
  // -------------------------------------------------------------------------
  {
    key: 'basic_catalog',
    label: 'Catálogo Básico',
    description: 'Catálogo de productos con imágenes y descripciones',
    category: 'core',
  },
  {
    key: 'product_extras',
    label: 'Extras de Productos',
    description: 'Agregar extras personalizables a los productos (ej: queso extra, salsa)',
    category: 'core',
  },
  {
    key: 'categories',
    label: 'Categorías',
    description: 'Organizar productos en categorías',
    category: 'core',
  },
  {
    key: 'order_management',
    label: 'Gestión de Órdenes',
    description: 'Sistema completo de gestión de órdenes',
    category: 'core',
  },
  {
    key: 'customer_database',
    label: 'Base de Datos de Clientes',
    description: 'Guardar información de clientes para órdenes futuras',
    category: 'core',
  },

  // -------------------------------------------------------------------------
  // ANALYTICS & REPORTING
  // -------------------------------------------------------------------------
  {
    key: 'analytics',
    label: 'Panel de Analíticas',
    description: 'Dashboard con métricas de ventas y desempeño',
    category: 'analytics',
  },
  {
    key: 'basic_reports',
    label: 'Reportes Básicos',
    description: 'Reportes de ventas, productos más vendidos, ingresos',
    category: 'analytics',
  },
  {
    key: 'advanced_reports',
    label: 'Reportes Avanzados',
    description: 'Reportes personalizados, exportación, análisis detallado',
    category: 'analytics',
  },
  {
    key: 'revenue_tracking',
    label: 'Seguimiento de Ingresos',
    description: 'Análisis detallado de ingresos por período',
    category: 'analytics',
  },
  {
    key: 'customer_insights',
    label: 'Insights de Clientes',
    description: 'Análisis de comportamiento de clientes y segmentación',
    category: 'analytics',
  },

  // -------------------------------------------------------------------------
  // MARKETING & PROMOTIONS
  // -------------------------------------------------------------------------
  {
    key: 'promotions',
    label: 'Promociones',
    description: 'Crear y gestionar promociones de productos',
    category: 'marketing',
  },
  {
    key: 'coupons',
    label: 'Cupones de Descuento',
    description: 'Sistema de cupones con códigos y porcentajes/montos fijos',
    category: 'marketing',
  },
  {
    key: 'bulk_promotions',
    label: 'Promociones por Lotes',
    description: 'Aplicar promociones a múltiples productos a la vez',
    category: 'marketing',
  },
  {
    key: 'email_marketing',
    label: 'Email Marketing',
    description: 'Enviar campañas de email a clientes',
    category: 'marketing',
  },
  {
    key: 'loyalty_program',
    label: 'Programa de Lealtad',
    description: 'Sistema de puntos y recompensas para clientes frecuentes',
    category: 'marketing',
  },

  // -------------------------------------------------------------------------
  // OPERATIONS
  // -------------------------------------------------------------------------
  {
    key: 'kitchen_display',
    label: 'Pantalla de Cocina',
    description: 'Vista optimizada para cocina con órdenes en tiempo real',
    category: 'operations',
  },
  {
    key: 'multi_store',
    label: 'Múltiples Tiendas',
    description: 'Gestionar varias tiendas desde una cuenta',
    category: 'operations',
  },
  {
    key: 'inventory_management',
    label: 'Gestión de Inventario',
    description: 'Control de stock y alertas de inventario bajo',
    category: 'operations',
  },
  {
    key: 'staff_management',
    label: 'Gestión de Personal',
    description: 'Múltiples usuarios con roles y permisos',
    category: 'operations',
  },
  {
    key: 'delivery_zones',
    label: 'Zonas de Entrega',
    description: 'Definir zonas de entrega con precios personalizados',
    category: 'operations',
  },
  {
    key: 'business_hours',
    label: 'Horarios de Operación',
    description: 'Configurar horarios y días de atención',
    category: 'operations',
  },

  // -------------------------------------------------------------------------
  // SUPPORT
  // -------------------------------------------------------------------------
  {
    key: 'email_support',
    label: 'Soporte por Email',
    description: 'Soporte técnico por email (respuesta en 48hrs)',
    category: 'support',
  },
  {
    key: 'priority_support',
    label: 'Soporte Prioritario',
    description: 'Soporte técnico prioritario (respuesta en 24hrs)',
    category: 'support',
  },
  {
    key: 'phone_support',
    label: 'Soporte Telefónico',
    description: 'Soporte por teléfono en horario laboral',
    category: 'support',
  },
  {
    key: 'dedicated_account_manager',
    label: 'Account Manager Dedicado',
    description: 'Gestor de cuenta dedicado para tu negocio',
    category: 'support',
  },
  {
    key: 'onboarding_assistance',
    label: 'Asistencia de Onboarding',
    description: 'Ayuda personalizada para configurar tu tienda',
    category: 'support',
  },

  // -------------------------------------------------------------------------
  // ADVANCED FEATURES
  // -------------------------------------------------------------------------
  {
    key: 'custom_branding',
    label: 'Marca Personalizada',
    description: 'Colores, logo y dominio personalizado',
    category: 'advanced',
  },
  {
    key: 'custom_domain',
    label: 'Dominio Propio',
    description: 'Usar tu propio dominio (ej: pedidos.turestaurante.com)',
    category: 'advanced',
  },
  {
    key: 'api_access',
    label: 'Acceso API',
    description: 'API REST para integraciones personalizadas',
    category: 'advanced',
  },
  {
    key: 'webhooks',
    label: 'Webhooks',
    description: 'Notificaciones automáticas de eventos a sistemas externos',
    category: 'advanced',
  },
  {
    key: 'white_label',
    label: 'White Label',
    description: 'Remover completamente la marca PideAI',
    category: 'advanced',
  },
  {
    key: 'sla_guarantee',
    label: 'Garantía SLA',
    description: 'Acuerdo de nivel de servicio con uptime garantizado 99.9%',
    category: 'advanced',
  },
  {
    key: 'ai_menu_enhancement',
    label: 'IA para Mejora de Menú',
    description: 'Sugerencias automáticas con IA para descripciones y precios',
    category: 'advanced',
  },
  {
    key: 'ai_chatbot',
    label: 'Chatbot con IA',
    description: 'Asistente virtual para atender consultas de clientes',
    category: 'advanced',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get all features by category
 */
export function getFeaturesByCategory(category: FeatureCategory): Feature[] {
  return AVAILABLE_FEATURES.filter((f) => f.category === category);
}

/**
 * Get feature by key
 */
export function getFeatureByKey(key: string): Feature | undefined {
  return AVAILABLE_FEATURES.find((f) => f.key === key);
}

/**
 * Get all unique categories
 */
export function getAllCategories(): FeatureCategory[] {
  return ['core', 'analytics', 'marketing', 'operations', 'support', 'advanced'];
}

/**
 * Get category label in Spanish
 */
export function getCategoryLabel(category: FeatureCategory): string {
  const labels: Record<FeatureCategory, string> = {
    core: 'Funcionalidades Básicas',
    analytics: 'Analíticas y Reportes',
    marketing: 'Marketing y Promociones',
    operations: 'Operaciones y Gestión',
    support: 'Soporte y Asistencia',
    advanced: 'Funciones Avanzadas',
  };
  return labels[category];
}

/**
 * Validate that all feature keys in array exist
 */
export function validateFeatures(featureKeys: string[]): {
  valid: boolean;
  invalid: string[];
} {
  const validKeys = AVAILABLE_FEATURES.map((f) => f.key);
  const invalid = featureKeys.filter((key) => !validKeys.includes(key));

  return {
    valid: invalid.length === 0,
    invalid,
  };
}
