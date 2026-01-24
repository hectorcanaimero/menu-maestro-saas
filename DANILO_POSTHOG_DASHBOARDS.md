# Solicitud: Dashboards PostHog para Vista Empresa

**Para:** Danilo
**De:** Hector (via Claude)
**Fecha:** 2026-01-24
**Prioridad:** Alta

## Objetivo

Crear dashboards completos en PostHog para visualizar métricas y eventos de **todas las tiendas** desde una perspectiva de dueño de empresa/plataforma. Necesitamos visibilidad completa del negocio agregado y por tienda.

## Contexto de la Plataforma

PideAI es una plataforma multi-tenant de pedidos para restaurantes donde:
- Cada tienda tiene su propio subdominio (ej: `tienda1.pideai.com`)
- Las tiendas pueden operar en 3 modos: `delivery`, `pickup`, `digital_menu`
- Tenemos sistema de suscripciones con planes (trial, starter, professional, enterprise)
- Módulos adicionales: WhatsApp, Delivery Avanzado (GPS tracking)
- Gestión completa de pedidos, productos, categorías, clientes

## Dashboards Requeridos

### 1. **Dashboard General de Plataforma (Overview)**
**Objetivo:** Vista panorámica del estado de la plataforma completa

**Métricas clave:**
- Total de tiendas activas vs inactivas
- Total de pedidos del día/semana/mes
- Ingresos totales procesados (GMV - Gross Merchandise Value)
- Usuarios activos (clientes únicos realizando pedidos)
- Tasa de conversión global (visitas → pedidos)
- Pedidos por estado (pendiente, confirmado, en preparación, enviado, entregado, cancelado)
- Crecimiento de tiendas (nuevas tiendas por mes)
- Retención de clientes (clientes que regresan)

**Gráficos sugeridos:**
- Serie temporal de pedidos diarios
- Distribución de pedidos por estado (pie chart)
- Embudo de conversión (visitas → agregar al carrito → checkout → pedido confirmado)
- Tabla de top 10 tiendas por volumen de pedidos
- Mapa de calor de horas pico de pedidos

### 2. **Dashboard de Tiendas**
**Objetivo:** Análisis del comportamiento y rendimiento de las tiendas

**Métricas por tienda:**
- Estado de suscripción (trial, active, cancelled, etc.)
- Plan actual (trial, starter, professional, enterprise)
- Módulos habilitados (WhatsApp, Delivery)
- Total de pedidos
- Ticket promedio
- Productos activos / límite del plan
- Categorías activas / límite del plan
- Tasa de cancelación de pedidos
- Tiempo promedio de preparación
- Calificación promedio (si aplicable)

**Filtros necesarios:**
- Por tienda individual
- Por plan de suscripción
- Por estado de suscripción
- Por módulos habilitados
- Por rango de fechas

**Gráficos sugeridos:**
- Tabla con todas las tiendas y sus KPIs principales
- Distribución de tiendas por plan
- Tendencia de adopción de módulos
- Comparativa de rendimiento entre tiendas del mismo plan
- Análisis de churn (tiendas que cancelan)

### 3. **Dashboard de Pedidos (Orders)**
**Objetivo:** Deep dive en el flujo completo de pedidos

**Métricas:**
- Pedidos por tipo (delivery, pickup)
- Tiempo promedio desde creación hasta entrega
- Tiempo promedio por estado (pendiente → confirmado → preparando → enviado → entregado)
- Tasa de cancelación (por tienda, por motivo)
- Pedidos fallidos vs exitosos
- Métodos de pago utilizados
- Zonas de delivery más populares

**Eventos clave a trackear:**
- `order_created`
- `order_confirmed`
- `order_preparing`
- `order_out_for_delivery`
- `order_delivered`
- `order_cancelled`
- `payment_completed`
- `payment_failed`

**Gráficos sugeridos:**
- Funnel de estados de pedido (desde creado hasta entregado)
- Serie temporal de pedidos por hora del día
- Distribución geográfica de pedidos (por zona de delivery)
- Análisis de motivos de cancelación
- Tiempo promedio en cada estado (sankey diagram)

### 4. **Dashboard de Productos y Catálogo**
**Objetivo:** Análisis del catálogo y productos más vendidos

**Métricas:**
- Productos más vendidos (global y por tienda)
- Categorías más populares
- Productos sin ventas (dead stock)
- Productos con más agregados al carrito pero no comprados
- Precio promedio de productos
- Productos con extras vs sin extras
- Análisis de búsquedas sin resultados

**Eventos clave:**
- `product_viewed`
- `product_added_to_cart`
- `product_removed_from_cart`
- `product_search`
- `category_viewed`

**Gráficos sugeridos:**
- Top 20 productos más vendidos
- Categorías por volumen de ventas
- Productos con mayor tasa de abandono en carrito
- Análisis de búsquedas (términos más buscados, búsquedas sin resultados)

### 5. **Dashboard de Clientes (Customers)**
**Objetivo:** Entender el comportamiento y lifecycle de los clientes

**Métricas:**
- Nuevos clientes vs recurrentes
- Lifetime Value (LTV) promedio
- Frecuencia de compra (pedidos por cliente)
- Ticket promedio por cliente
- Cohortes de retención (clientes que regresan semana/mes tras mes)
- Tasa de churn de clientes
- Clientes por tienda

**Eventos clave:**
- `user_signup`
- `first_order`
- `repeat_order`
- `customer_return`

**Gráficos sugeridos:**
- Análisis de cohortes (retención por mes de primera compra)
- Distribución de frecuencia de pedidos
- Segmentación RFM (Recency, Frequency, Monetary)
- Clientes VIP (top spenders)

### 6. **Dashboard de Suscripciones y Revenue**
**Objetivo:** Análisis financiero y de suscripciones

**Métricas:**
- MRR (Monthly Recurring Revenue)
- ARR (Annual Recurring Revenue)
- Churn Rate de suscripciones
- Expansión Revenue (upgrades)
- Contracción Revenue (downgrades/cancellaciones)
- Trial to Paid conversion rate
- Días promedio en trial
- Distribución de revenue por plan
- Lifetime Value por plan

**Eventos clave:**
- `subscription_created`
- `subscription_upgraded`
- `subscription_downgraded`
- `subscription_cancelled`
- `trial_started`
- `trial_converted`
- `trial_expired`
- `payment_succeeded`
- `payment_failed`

**Gráficos sugeridos:**
- MRR growth over time
- Churn analysis por plan
- Revenue breakdown por plan
- Trial conversion funnel
- Waterfall de revenue (nuevo, expansión, contracción, churn)

### 7. **Dashboard de Módulos y Features**
**Objetivo:** Análisis de adopción y uso de módulos premium

**Métricas para módulo WhatsApp:**
- Tiendas con módulo habilitado
- Mensajes enviados (por tipo: confirmación, actualización, etc.)
- Tasa de apertura/respuesta
- Conversiones desde WhatsApp

**Métricas para módulo Delivery:**
- Tiendas con delivery habilitado
- Pedidos con GPS tracking
- Tiempo promedio de entrega
- Distancia promedio de delivery
- Motoristas activos
- Entregas completadas vs fallidas

**Eventos clave:**
- `whatsapp_message_sent`
- `whatsapp_message_delivered`
- `delivery_assigned`
- `driver_location_updated`
- `delivery_photo_uploaded`
- `delivery_signature_captured`

### 8. **Dashboard de Performance Técnico**
**Objetivo:** Monitorear salud técnica de la plataforma

**Métricas:**
- Page load times
- API response times
- Errores de JavaScript (Sentry integration)
- Tasa de error por endpoint
- Uptime
- Sesiones por dispositivo (mobile vs desktop)
- Navegadores más usados
- Rage clicks / dead clicks
- Abandono de formularios

**Eventos clave:**
- `page_view`
- `api_error`
- `payment_error`
- `checkout_abandoned`
- `form_abandoned`

### 9. **Dashboard de Marketing y Adquisición**
**Objetivo:** Análisis de cómo llegan nuevas tiendas y clientes

**Métricas:**
- Fuentes de tráfico (organic, paid, referral, direct)
- Landing page conversions
- Sign-up funnel (visits → sign-up → store created)
- Costo de adquisición por tienda (si hay data)
- Campañas más efectivas
- Palabras clave que generan conversiones

**Eventos clave:**
- `landing_page_viewed`
- `signup_started`
- `signup_completed`
- `store_created`
- `onboarding_completed`

## Propiedades Importantes a Capturar

Asegúrate de que estos properties estén disponibles en PostHog:

**Por Tienda:**
- `store_id`
- `store_name`
- `store_subdomain`
- `subscription_plan` (trial, starter, professional, enterprise)
- `subscription_status` (trial, active, cancelled, suspended)
- `modules_enabled` (whatsapp, delivery)
- `operating_mode` (delivery, pickup, digital_menu)

**Por Usuario:**
- `user_id`
- `user_type` (customer, store_owner, admin)
- `customer_type` (new, returning)

**Por Pedido:**
- `order_id`
- `order_type` (delivery, pickup)
- `order_status`
- `payment_method`
- `total_amount`
- `items_count`
- `has_extras`
- `delivery_zone`

## Configuración Recomendada

1. **Insights Guardados:** Crea insights individuales para cada métrica clave
2. **Dashboards:** Agrupa los insights en los dashboards mencionados
3. **Filtros Globales:** Habilita filtros de fecha y tienda en todos los dashboards
4. **Alerts:** Configura alertas para métricas críticas (ej: churn rate > 10%, error rate > 5%)
5. **Exports:** Habilita exports automáticos semanales/mensuales
6. **Sharing:** Configura permisos para compartir con stakeholders

## Prioridad de Implementación

**Fase 1 (Crítico):**
1. Dashboard General de Plataforma
2. Dashboard de Pedidos
3. Dashboard de Tiendas

**Fase 2 (Alta):**
4. Dashboard de Suscripciones y Revenue
5. Dashboard de Clientes

**Fase 3 (Media):**
6. Dashboard de Productos
7. Dashboard de Módulos
8. Dashboard de Performance Técnico
9. Dashboard de Marketing

## Recursos

- **Documentación PostHog:** https://posthog.com/docs
- **PostHog API:** Puedes usar el MCP de PostHog para crear dashboards programáticamente
- **Eventos actuales:** Revisa los eventos que ya estamos trackeando en el código

## Notas Adicionales

- Todos los dashboards deben tener capacidad de drill-down (hacer click para ver detalles)
- Incluir tooltips explicando cada métrica
- Usar colores consistentes (verde = positivo, rojo = negativo, azul = neutral)
- Todas las series temporales deben permitir comparación con período anterior
- Incluir benchmarks cuando sea posible (ej: "Industry average: X%")

## Preguntas o Dudas

Si tienes alguna pregunta sobre:
- Qué eventos específicos están disponibles
- Estructura de datos en PostHog
- Prioridades de negocio
- Métricas adicionales que debería incluir

Por favor házmelo saber.

---

**Entregables Esperados:**
1. Screenshots de los dashboards creados
2. Lista de insights creados con sus queries
3. Documentación de cómo interpretar cada dashboard
4. Alertas configuradas (si aplica)

**Deadline:** Por definir según tu disponibilidad

¡Gracias Danilo!
