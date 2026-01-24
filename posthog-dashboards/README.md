# PostHog Dashboards - Guía de Implementación

Este directorio contiene las configuraciones para crear dashboards en PostHog para visualizar métricas de toda la plataforma PideAI.

## Estructura de Archivos

```
posthog-dashboards/
├── README.md                           # Esta guía
├── events-to-track.md                  # Lista completa de eventos a implementar
├── dashboard-configs/                  # Configuraciones JSON para importar
│   ├── 01-platform-overview.json
│   ├── 02-stores-analysis.json
│   ├── 03-orders-deep-dive.json
│   ├── 04-products-catalog.json
│   ├── 05-customers-lifecycle.json
│   ├── 06-subscriptions-revenue.json
│   ├── 07-modules-features.json
│   ├── 08-technical-performance.json
│   └── 09-marketing-acquisition.json
└── insights/                           # Insights individuales
    ├── platform/
    ├── stores/
    ├── orders/
    └── ...
```

## Cómo Usar Este Directorio

### Opción 1: Importar Dashboards (Recomendado)

1. Ve a PostHog → Dashboards → New Dashboard
2. Click en "Import dashboard"
3. Copia el contenido de los archivos JSON en `dashboard-configs/`
4. Pega y confirma la importación

### Opción 2: Crear Manualmente

1. Revisa el archivo de configuración JSON
2. Crea un nuevo dashboard en PostHog
3. Agrega los insights uno por uno según las especificaciones

### Opción 3: Usar API de PostHog

```bash
# Ejemplo de cómo crear un dashboard vía API
curl -X POST https://app.posthog.com/api/projects/{project_id}/dashboards/ \
  -H "Authorization: Bearer {api_key}" \
  -H "Content-Type: application/json" \
  -d @dashboard-configs/01-platform-overview.json
```

## Prioridad de Implementación

### Fase 1 - Crítico (Implementar primero)
1. Dashboard General de Plataforma
2. Dashboard de Pedidos
3. Dashboard de Tiendas

### Fase 2 - Alta Prioridad
4. Dashboard de Suscripciones y Revenue
5. Dashboard de Clientes

### Fase 3 - Media Prioridad
6. Dashboard de Productos
7. Dashboard de Módulos
8. Dashboard de Performance Técnico
9. Dashboard de Marketing

## Eventos Requeridos

Antes de crear los dashboards, asegúrate de que estos eventos estén siendo trackeados en tu aplicación:

### Eventos Core
- `$pageview` (automático con PostHog)
- `$identify` (automático con PostHog)

### Eventos de Pedidos
- `order_created`
- `order_confirmed`
- `order_preparing`
- `order_out_for_delivery`
- `order_delivered`
- `order_cancelled`
- `payment_completed`
- `payment_failed`

### Eventos de Productos
- `product_viewed`
- `product_added_to_cart`
- `product_removed_from_cart`
- `category_viewed`
- `product_search`

### Eventos de Usuarios
- `user_signup`
- `first_order`
- `repeat_order`

### Eventos de Suscripciones
- `subscription_created`
- `subscription_upgraded`
- `subscription_downgraded`
- `subscription_cancelled`
- `trial_started`
- `trial_converted`

### Eventos de Módulos
- `whatsapp_message_sent`
- `delivery_assigned`
- `driver_location_updated`

Ver `events-to-track.md` para la lista completa con properties.

## Propiedades Importantes

Asegúrate de incluir estas propiedades en tus eventos:

```javascript
// Propiedades de Tienda
{
  store_id: "uuid",
  store_name: "string",
  store_subdomain: "string",
  subscription_plan: "trial|starter|professional|enterprise",
  subscription_status: "trial|active|cancelled|suspended",
  modules_enabled: ["whatsapp", "delivery"],
  operating_mode: "delivery|pickup|digital_menu"
}

// Propiedades de Usuario
{
  user_id: "uuid",
  user_type: "customer|store_owner|admin",
  customer_type: "new|returning"
}

// Propiedades de Pedido
{
  order_id: "uuid",
  order_type: "delivery|pickup",
  order_status: "string",
  payment_method: "string",
  total_amount: number,
  items_count: number,
  delivery_zone: "string"
}
```

## Configuración Global

Aplica estos filtros globales en todos los dashboards:

1. **Date Range**: Últimos 30 días (ajustable)
2. **Store Filter**: Permite filtrar por tienda específica
3. **Plan Filter**: Permite filtrar por plan de suscripción
4. **Status Filter**: Permite filtrar por estado de suscripción

## Alertas Recomendadas

Configura estas alertas críticas:

1. **Churn Rate > 10%** - Alert diario
2. **Error Rate > 5%** - Alert en tiempo real
3. **Payment Failures > 3** - Alert cada hora
4. **No orders in 1 hour** (durante horas pico) - Alert inmediato
5. **Trial Conversions < 20%** - Alert semanal

## Exports Automáticos

Configura exports semanales/mensuales de:

1. MRR y ARR
2. Churn Rate
3. Top 10 tiendas por volumen
4. Customer Lifetime Value

## Troubleshooting

### Los eventos no aparecen en PostHog

1. Verifica que PostHog esté inicializado correctamente
2. Revisa la consola del navegador para errores
3. Usa PostHog Toolbar para ver eventos en tiempo real
4. Verifica que las propiedades estén correctamente formateadas

### Los números no coinciden

1. Revisa los filtros aplicados
2. Verifica el rango de fechas
3. Asegúrate de que no haya duplicación de eventos
4. Revisa la zona horaria configurada

## Recursos Adicionales

- [PostHog Docs](https://posthog.com/docs)
- [PostHog API](https://posthog.com/docs/api)
- [Dashboard Templates](https://posthog.com/templates)
- [Best Practices](https://posthog.com/docs/user-guides/dashboards)

## Soporte

Para preguntas o problemas:
1. Revisa `DANILO_POSTHOG_DASHBOARDS.md` para especificaciones detalladas
2. Consulta la documentación de PostHog
3. Contacta al equipo de desarrollo
