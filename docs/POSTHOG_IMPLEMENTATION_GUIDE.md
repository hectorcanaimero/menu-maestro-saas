# PostHog Dashboard Implementation Guide

## Información del Proyecto

**PostHog Instance:** https://us.i.posthog.com
**Project ID:** 185811
**API Host:** https://us.i.posthog.com

---

## Resumen de Eventos Existentes

### ✅ Eventos Ya Implementados

| Evento | Ubicación | Properties Clave | Estado |
|--------|-----------|------------------|---------|
| `product_added_to_cart` | CartContext.tsx:83 | store_id, product_id, cart_value, items_in_cart | ✅ Completo |
| `product_removed_from_cart` | CartContext.tsx:122 | store_id, product_id, total_price | ✅ Completo |
| `cart_viewed` | CartSheet.tsx:23 | store_id, items_count, cart_value | ✅ Completo |
| `checkout_started` | Checkout.tsx:167 | store_id, cart_value, order_type | ✅ Completo |
| `checkout_step_completed` | Checkout.tsx:292 | store_id, step (1-3), order_type | ✅ Completo |
| `order_placed` | ConfirmOrder.tsx:110 | store_id, order_id, order_total, revenue | ✅ Completo |

### 📊 User Identification

- **Authenticated Users:** `posthog.identify(user_id, properties)`
- **Anonymous Users:** Super properties registradas con `store_id`

**User Properties:**
- `email`
- `store_id`
- `store_name`
- `store_subdomain`
- `is_store_owner`
- `role` ('owner' | 'customer')

---

## Dashboard Structure

### Dashboard Maestro: "Menu Maestro Analytics"

**Descripción:** Dashboard principal con todas las métricas clave del negocio multi-tenant.

**Secciones:**
1. General Store Metrics
2. Order Analysis
3. Product Performance
4. User Behavior
5. Conversion Funnel

---

## Insights a Crear

### Sección 1: General Store Metrics

#### Insight 1.1: Total Orders by Store

**Tipo:** Trends
**Evento:** `order_placed`
**Serie:** Unique values
**Math:** Total count
**Filtros:** Ninguno (mostrar todas las tiendas)
**Breakdown:** `store_id` o `store_name`
**Intervalo:** Last 30 days, por día

**Visualización:** Line chart o Bar chart

**PostHog Query (HogQL):**
```sql
SELECT
  properties.store_name as store,
  count(*) as total_orders
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store
ORDER BY total_orders DESC
```

---

#### Insight 1.2: Revenue by Store

**Tipo:** Trends
**Evento:** `order_placed`
**Property:** `order_total`
**Math:** Sum
**Filtros:** Ninguno
**Breakdown:** `store_id`
**Intervalo:** Last 30 days

**Visualización:** Line chart

**PostHog Query (HogQL):**
```sql
SELECT
  properties.store_name as store,
  sum(toFloat(properties.order_total)) as total_revenue
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store
ORDER BY total_revenue DESC
```

---

#### Insight 1.3: Active Users (Daily/Weekly/Monthly)

**Tipo:** Trends
**Serie:** Active users (DAU/WAU/MAU)
**Filtros:** `store_id` (puede ser filtro global)
**Intervalo:** Last 90 days

**Visualización:** Line chart con 3 series

---

#### Insight 1.4: Conversion Rate (Overall)

**Tipo:** Formula
**Fórmula:** `(B / A) * 100`

**Serie A:** Total `product_added_to_cart` events
**Serie B:** Total `order_placed` events

**Filtros:** `store_id` (optional)
**Intervalo:** Last 30 days

**Visualización:** Number con trend

**Meta:** >50% conversión

---

### Sección 2: Order Analysis

#### Insight 2.1: Orders by Day/Week

**Tipo:** Trends
**Evento:** `order_placed`
**Math:** Total count
**Filtros:** `store_id` (filtro global)
**Breakdown:** `order_type` (delivery, pickup, digital_menu)
**Intervalo:** Last 30 days, por día

**Visualización:** Stacked bar chart

---

#### Insight 2.2: Average Order Value (AOV)

**Tipo:** Trends
**Evento:** `order_placed`
**Property:** `order_total`
**Math:** Average
**Filtros:** `store_id`
**Breakdown:** `order_type`
**Intervalo:** Last 30 days

**Visualización:** Line chart

**PostHog Query (HogQL):**
```sql
SELECT
  properties.order_type as type,
  avg(toFloat(properties.order_total)) as aov,
  count(*) as total_orders
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
  AND properties.store_id = '<STORE_ID>'
GROUP BY type
```

---

#### Insight 2.3: Order Type Distribution

**Tipo:** Trends
**Evento:** `order_placed`
**Math:** Total count
**Filtros:** `store_id`
**Breakdown:** `order_type`
**Intervalo:** Last 30 days

**Visualización:** Pie chart

---

#### Insight 2.4: Orders by Hour of Day

**Tipo:** Trends
**Evento:** `order_placed`
**Math:** Total count
**Filtros:** `store_id`
**Breakdown:** Hour of day (PostHog built-in)
**Intervalo:** Last 7 days

**Visualización:** Bar chart

**Útil para:** Identificar horas pico para staffing

---

#### Insight 2.5: Orders with Coupons

**Tipo:** Trends
**Evento:** `order_placed`
**Filtros:**
  - `store_id`
  - `coupon_code` is set (not null)
**Math:** Total count
**Property:** `coupon_discount` (sum)
**Intervalo:** Last 30 days

**Visualización:** Line chart con 2 series:
1. Number of orders with coupons
2. Total discount amount

---

#### Insight 2.6: Revenue by Payment Method

**Tipo:** Trends
**Evento:** `order_placed`
**Property:** `order_total` (sum)
**Filtros:** `store_id`
**Breakdown:** `payment_method`
**Intervalo:** Last 30 days

**Visualización:** Pie chart o Bar chart

---

### Sección 3: Product Performance

#### Insight 3.1: Top 10 Products Added to Cart

**Tipo:** Trends
**Evento:** `product_added_to_cart`
**Math:** Total count
**Filtros:** `store_id`
**Breakdown:** `product_name`
**Límite:** Top 10
**Intervalo:** Last 30 days

**Visualización:** Horizontal bar chart

---

#### Insight 3.2: Top Products by Revenue

**Tipo:** Funnel o Custom Insight
**Método:**
1. Filtrar `product_added_to_cart` que resultan en `order_placed`
2. Sumar `total_price * quantity` por producto

**Filtros:** `store_id`
**Breakdown:** `product_name`
**Intervalo:** Last 30 days

**PostHog Query (HogQL):**
```sql
SELECT
  properties.product_name as product,
  sum(toFloat(properties.total_price) * toFloat(properties.quantity)) as revenue,
  count(*) as times_sold
FROM events
WHERE event = 'product_added_to_cart'
  AND timestamp >= now() - INTERVAL 30 DAY
  AND properties.store_id = '<STORE_ID>'
  AND person_id IN (
    SELECT DISTINCT person_id
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 30 DAY
  )
GROUP BY product
ORDER BY revenue DESC
LIMIT 10
```

---

#### Insight 3.3: Top Categories

**Tipo:** Trends
**Evento:** `product_added_to_cart`
**Math:** Total count
**Filtros:** `store_id`
**Breakdown:** `category_id`
**Intervalo:** Last 30 days

**Visualización:** Pie chart

---

#### Insight 3.4: Products with Extras Performance

**Tipo:** Trends
**Evento:** `product_added_to_cart`
**Math:** Total count
**Filtros:**
  - `store_id`
  - `has_extras = true`
**Breakdown:** `product_name`
**Intervalo:** Last 30 days

**Visualización:** Bar chart

**Insight adicional:** Comparar conversión entre productos con extras vs sin extras

---

#### Insight 3.5: Abandoned Cart Products

**Tipo:** Funnel (inverted)
**Paso 1:** `product_added_to_cart`
**Paso 2:** `order_placed` (NOT completed)

**Filtros:** `store_id`
**Breakdown:** `product_name`
**Time to convert:** 24 hours

**Visualización:** Bar chart de productos más abandonados

**PostHog Query (HogQL):**
```sql
SELECT
  properties.product_name as product,
  count(DISTINCT person_id) as abandoned_count
FROM events
WHERE event = 'product_added_to_cart'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND properties.store_id = '<STORE_ID>'
  AND person_id NOT IN (
    SELECT DISTINCT person_id
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 7 DAY
  )
GROUP BY product
ORDER BY abandoned_count DESC
LIMIT 10
```

---

#### Insight 3.6: Cart Value Distribution

**Tipo:** Trends
**Evento:** `product_added_to_cart`
**Property:** `cart_value`
**Math:** Distribution (buckets: 0-20, 20-50, 50-100, 100+)
**Filtros:** `store_id`
**Intervalo:** Last 30 days

**Visualización:** Bar chart

---

### Sección 4: User Behavior

#### Insight 4.1: New vs Returning Customers

**Tipo:** Trends
**Serie:** Unique users
**Filtros:** `store_id`
**Breakdown:** First time vs Returning (basado en # de `order_placed` previos)
**Intervalo:** Last 30 days

**Visualización:** Stacked area chart

---

#### Insight 4.2: Customer Retention Cohorts

**Tipo:** Retention
**Starting event:** `order_placed` (primera vez)
**Return event:** `order_placed` (segunda vez)
**Cohort size:** Weekly
**Filtros:** `store_id`
**Retention period:** 12 weeks

**Visualización:** Retention matrix

**Meta:** >20% retención a 4 semanas

---

#### Insight 4.3: Device Breakdown

**Tipo:** Trends
**Evento:** `order_placed`
**Math:** Total count
**Filtros:** `store_id`
**Breakdown:** `$device_type` (Mobile, Desktop, Tablet)
**Intervalo:** Last 30 days

**Visualización:** Pie chart

**Importante:** Esperamos 70-80% mobile

---

#### Insight 4.4: Browser Breakdown

**Tipo:** Trends
**Evento:** `order_placed`
**Math:** Total count
**Filtros:** `store_id`
**Breakdown:** `$browser`
**Intervalo:** Last 30 days

**Visualización:** Bar chart

---

#### Insight 4.5: Customer Role Analysis

**Tipo:** Trends
**Evento:** Cualquier evento
**Math:** Unique users
**Filtros:** `store_id`
**Breakdown:** `role` (owner vs customer)
**Intervalo:** Last 30 days

**Visualización:** Pie chart

---

#### Insight 4.6: Average Items per Cart

**Tipo:** Trends
**Evento:** `cart_viewed`
**Property:** `total_items`
**Math:** Average
**Filtros:** `store_id`, `has_items = true`
**Intervalo:** Last 30 days

**Visualización:** Line chart

---

### Sección 5: Conversion Funnel

#### Insight 5.1: Main Conversion Funnel

**Tipo:** Funnel
**Steps:**
1. `product_added_to_cart`
2. `cart_viewed`
3. `checkout_started`
4. `checkout_step_completed` (step = 1)
5. `checkout_step_completed` (step = 2)
6. `checkout_step_completed` (step = 3)
7. `order_placed`

**Filtros:** `store_id`
**Breakdown:** `order_type`
**Time to convert:** 14 days
**Exclusion steps:** None

**Visualización:** Funnel chart con dropoff %

**Configuración en PostHog:**
```json
{
  "insight": "FUNNELS",
  "events": [
    {
      "id": "product_added_to_cart",
      "type": "events",
      "order": 0
    },
    {
      "id": "cart_viewed",
      "type": "events",
      "order": 1
    },
    {
      "id": "checkout_started",
      "type": "events",
      "order": 2
    },
    {
      "id": "checkout_step_completed",
      "type": "events",
      "order": 3,
      "properties": [{
        "key": "step",
        "value": 1,
        "operator": "exact"
      }]
    },
    {
      "id": "checkout_step_completed",
      "type": "events",
      "order": 4,
      "properties": [{
        "key": "step",
        "value": 2,
        "operator": "exact"
      }]
    },
    {
      "id": "checkout_step_completed",
      "type": "events",
      "order": 5,
      "properties": [{
        "key": "step",
        "value": 3,
        "operator": "exact"
      }]
    },
    {
      "id": "order_placed",
      "type": "events",
      "order": 6
    }
  ],
  "funnel_window_interval": 14,
  "funnel_window_interval_unit": "day",
  "breakdown": "order_type",
  "breakdown_type": "event"
}
```

---

#### Insight 5.2: Cart Abandonment Rate

**Tipo:** Formula
**Fórmula:** `((A - B) / A) * 100`

**Serie A:** Total `product_added_to_cart` events
**Serie B:** Total `order_placed` events

**Filtros:** `store_id`
**Intervalo:** Last 30 days

**Visualización:** Number con trend

**Meta:** <30% abandono

---

#### Insight 5.3: Checkout Drop-off by Step

**Tipo:** Funnel (simplified)
**Steps:**
1. `checkout_started`
2. `checkout_step_completed` (step = 1)
3. `checkout_step_completed` (step = 2)
4. `checkout_step_completed` (step = 3)
5. `order_placed`

**Filtros:** `store_id`
**Breakdown:** `order_type`
**Time to convert:** 1 hour

**Visualización:** Funnel con % en cada step

**Objetivo:** Identificar el step más problemático

---

#### Insight 5.4: Time to Purchase

**Tipo:** Paths o Time Analysis
**Evento inicial:** `product_added_to_cart`
**Evento final:** `order_placed`

**Filtros:** `store_id`
**Métrica:** Median time, p90, p95
**Intervalo:** Last 30 days

**Visualización:** Histogram

**Meta:** <10 minutos (median)

---

#### Insight 5.5: Conversion Rate by Device

**Tipo:** Funnel
**Same as 5.1 pero con breakdown por `$device_type`**

**Comparación esperada:**
- Desktop: 60-70% conversión
- Mobile: 40-50% conversión
- Tablet: 50-60% conversión

---

#### Insight 5.6: Conversion Rate by Order Type

**Tipo:** Funnel
**Same as 5.1 pero filtrado por `order_type`**

**Crear 3 insights separados:**
1. Delivery Funnel
2. Pickup Funnel
3. Digital Menu Funnel

**Comparar:** ¿Cuál convierte mejor?

---

## Dashboards Adicionales Recomendados

### Dashboard 2: "Store Owner Dashboard" (Template)

**Descripción:** Dashboard específico para cada store owner ver su tienda.

**Filtro Global:** `store_id = <SPECIFIC_STORE_ID>`

**Secciones:**
1. Today's Summary (orders today, revenue today)
2. Weekly Performance (orders, revenue, AOV)
3. Top Products
4. Peak Hours
5. Customer Insights

**Nota:** Este dashboard puede duplicarse por tienda cambiando solo el filtro de `store_id`.

---

### Dashboard 3: "Multi-Tenant Performance"

**Descripción:** Comparación entre tiendas para el equipo de producto.

**Sin filtros globales**

**Secciones:**
1. Store Rankings (by revenue, by orders, by conversion)
2. Best Practices Identification
3. Underperforming Stores
4. Growth Trends per Store

---

### Dashboard 4: "Mobile Experience"

**Descripción:** Análisis específico de mobile UX.

**Filtro Global:** `$device_type = 'Mobile'`

**Secciones:**
1. Mobile Conversion Funnel
2. Mobile vs Desktop Comparison
3. Mobile Browser Breakdown
4. Mobile-specific Issues

---

## Configuración Manual en PostHog UI

### Paso 1: Acceder a PostHog

1. Ir a: https://us.i.posthog.com
2. Login con credenciales
3. Seleccionar proyecto (Project ID: 185811)

---

### Paso 2: Crear el Dashboard Principal

1. Click en "Dashboards" en el menú izquierdo
2. Click en "New dashboard"
3. Nombre: "Menu Maestro - Analytics Dashboard"
4. Descripción: "Main analytics dashboard for multi-tenant food ordering platform"
5. Tags: `production`, `analytics`, `multi-tenant`

---

### Paso 3: Agregar Insights al Dashboard

Para cada insight de la lista arriba:

1. Click en "Add insight" en el dashboard
2. Seleccionar tipo (Trend, Funnel, etc.)
3. Configurar eventos y propiedades según especificación
4. Agregar filtros necesarios
5. Configurar breakdown si aplica
6. Seleccionar visualización
7. Nombrar el insight
8. Click en "Save & add to dashboard"

---

### Paso 4: Organizar el Layout

1. Arrastrar insights para organizarlos por sección
2. Ajustar tamaños (algunos insights como números pueden ser más pequeños)
3. Agregar text tiles para separar secciones:
   - "📊 General Metrics"
   - "🛍️ Order Analysis"
   - "📦 Product Performance"
   - "👥 User Behavior"
   - "🎯 Conversion Funnel"

---

### Paso 5: Configurar Filtros Globales

1. En el dashboard, click en "Add filter"
2. Agregar: `store_id` (para poder filtrar por tienda)
3. Agregar: `order_type` (opcional, para filtrar por tipo)
4. Estos filtros aplicarán a todos los insights del dashboard

---

### Paso 6: Compartir el Dashboard

1. Click en "Share" en el dashboard
2. Generar link público (opcional)
3. Agregar a team members con permisos apropiados

---

## Queries Útiles (HogQL)

### Query 1: Top Stores by Revenue (Last 30 Days)

```sql
SELECT
  properties.store_name as store,
  properties.store_id as store_id,
  count(*) as total_orders,
  sum(toFloat(properties.order_total)) as total_revenue,
  avg(toFloat(properties.order_total)) as aov
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store, store_id
ORDER BY total_revenue DESC
```

---

### Query 2: Conversion Funnel Analysis (Per Store)

```sql
WITH
  added_to_cart AS (
    SELECT
      properties.store_id,
      count(DISTINCT person_id) as users
    FROM events
    WHERE event = 'product_added_to_cart'
      AND timestamp >= now() - INTERVAL 7 DAY
    GROUP BY properties.store_id
  ),
  placed_order AS (
    SELECT
      properties.store_id,
      count(DISTINCT person_id) as users
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 7 DAY
    GROUP BY properties.store_id
  )
SELECT
  a.store_id,
  a.users as added_to_cart,
  o.users as placed_order,
  round((o.users * 100.0 / a.users), 2) as conversion_rate
FROM added_to_cart a
LEFT JOIN placed_order o ON a.store_id = o.store_id
ORDER BY conversion_rate DESC
```

---

### Query 3: Abandoned Products (Last 7 Days)

```sql
SELECT
  properties.product_name as product,
  properties.category_id as category,
  count(DISTINCT person_id) as abandoned_users,
  sum(toFloat(properties.total_price)) as abandoned_value
FROM events
WHERE event = 'product_added_to_cart'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND properties.store_id = '<STORE_ID>'
  AND person_id NOT IN (
    SELECT DISTINCT person_id
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 7 DAY
  )
GROUP BY product, category
ORDER BY abandoned_value DESC
LIMIT 20
```

---

### Query 4: Peak Hours Analysis

```sql
SELECT
  toHour(timestamp) as hour,
  count(*) as total_orders,
  sum(toFloat(properties.order_total)) as revenue
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 7 DAY
  AND properties.store_id = '<STORE_ID>'
GROUP BY hour
ORDER BY hour
```

---

### Query 5: Coupon Effectiveness

```sql
SELECT
  properties.coupon_code as coupon,
  count(*) as times_used,
  sum(toFloat(properties.coupon_discount)) as total_discount,
  sum(toFloat(properties.order_total)) as total_revenue,
  avg(toFloat(properties.order_total)) as avg_order_value
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
  AND properties.coupon_code IS NOT NULL
  AND properties.store_id = '<STORE_ID>'
GROUP BY coupon
ORDER BY times_used DESC
```

---

## Alertas y Notificaciones

### Alert 1: Conversion Rate Drop

**Condición:** Conversion rate (cart → order) cae por debajo de 40%
**Ventana:** Last 24 hours
**Notificación:** Slack/Email
**Acción:** Investigar drop-off en funnel

---

### Alert 2: Zero Orders in Peak Hours

**Condición:** 0 orders entre 12pm-2pm o 7pm-9pm
**Ventana:** Real-time
**Notificación:** Slack
**Acción:** Verificar si tienda está operativa

---

### Alert 3: High Cart Abandonment

**Condición:** >20 carts abandonados en última hora
**Ventana:** Last 1 hour
**Notificación:** Email
**Acción:** Revisar experiencia de checkout

---

## Segmentos (Cohorts) Útiles

### Cohort 1: High-Value Customers

**Definición:**
- Han realizado `order_placed`
- `order_total > $50` (ajustar según mercado)
- En últimos 90 días

**Uso:**
- Retargeting campaigns
- Loyalty programs
- VIP treatment

---

### Cohort 2: Cart Abandoners (Recoverable)

**Definición:**
- `product_added_to_cart` en últimos 7 días
- NO `order_placed` en últimos 7 días
- `cart_value > $10`

**Uso:**
- Email recovery campaigns
- Push notifications
- Coupon incentives

---

### Cohort 3: Mobile-First Users

**Definición:**
- >80% de sus eventos vienen de `$device_type = 'Mobile'`
- Activos en últimos 30 días

**Uso:**
- Test mobile features
- Mobile app promotion
- Mobile-specific UX improvements

---

### Cohort 4: Repeat Customers

**Definición:**
- >= 2 `order_placed` events
- En últimos 90 días

**Uso:**
- Retention analysis
- Referral programs
- Cross-sell/up-sell

---

### Cohort 5: Inactive Store Owners

**Definición:**
- `role = 'owner'`
- NO eventos `admin_*` en últimos 30 días (cuando se implementen)
- NO `order_placed` en su tienda en últimos 30 días

**Uso:**
- Re-engagement campaigns
- Churn prevention
- Support outreach

---

## Próximos Pasos

### 1. Implementar Dashboard (Esta Tarea)

- [ ] Crear dashboard en PostHog
- [ ] Agregar todos los insights listados arriba
- [ ] Configurar filtros globales
- [ ] Organizar layout por secciones
- [ ] Documentar URL del dashboard

### 2. Agregar Eventos Faltantes (Próxima Tarea)

- [ ] `product_viewed`
- [ ] `category_viewed`
- [ ] `search_performed` (si aplica)
- [ ] Eventos admin

### 3. Configurar Alertas

- [ ] Conversion drop alert
- [ ] Zero orders alert
- [ ] High abandonment alert

### 4. Crear Cohorts

- [ ] High-value customers
- [ ] Cart abandoners
- [ ] Mobile-first users
- [ ] Repeat customers

### 5. Session Recordings

- [ ] Enable recordings (upgrade plan si es necesario)
- [ ] Configure privacy settings
- [ ] Create playlists for specific scenarios

---

## Recursos

### PostHog Documentation

- **Insights:** https://posthog.com/docs/product-analytics/insights
- **Dashboards:** https://posthog.com/docs/product-analytics/dashboards
- **Funnels:** https://posthog.com/docs/product-analytics/funnels
- **HogQL:** https://posthog.com/docs/product-analytics/sql
- **API:** https://posthog.com/docs/api

### Menu Maestro Documentation

- **Main Docs:** `/docs/POSTHOG_DASHBOARD.md`
- **Events Guide:** `/docs/POSTHOG_DASHBOARD.md#eventos-implementados`
- **Architecture:** `/CLAUDE.md`

---

**Creado:** 2025-11-30
**Autor:** Claude Code (Orchestrator Agent)
**Versión:** 1.0.0
