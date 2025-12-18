# PostHog Integration Setup Guide

Esta guía te ayudará a configurar la integración completa de PostHog con dashboards en la UI de PostHog y métricas en tiempo real en el admin panel de tu aplicación.

## 📋 Tabla de Contenidos

1. [Configuración de API Key](#configuración-de-api-key)
2. [Eventos Rastreados](#eventos-rastreados)
3. [Dashboards en PostHog UI](#dashboards-en-posthog-ui)
4. [Métricas en Admin Panel](#métricas-en-admin-panel)
5. [Queries HogQL Útiles](#queries-hogql-útiles)
6. [Troubleshooting](#troubleshooting)

---

## 🔑 Configuración de API Key

### Paso 1: Crear Personal API Key en PostHog

1. Ve a PostHog: https://us.i.posthog.com
2. Click en tu perfil (esquina superior derecha) → **Settings**
3. En el menú lateral, selecciona **Personal API Keys**
4. Click en **Create personal API key**
5. Configuración recomendada:
   - **Label**: `PideAI Production API`
   - **Scopes**: Selecciona **Query** (leer datos)
   - **Expiration**: Sin expiración o 1 año
6. Click **Create key**
7. **¡IMPORTANTE!** Copia la key inmediatamente (solo se muestra una vez)

### Paso 2: Agregar API Key a tu Proyecto

**Archivo**: `.env` (o `.env.local` para desarrollo)

```bash
# PostHog Configuration
VITE_POSTHOG_KEY=phc_tu_project_api_key_aqui
VITE_POSTHOG_API_KEY=phx_tu_personal_api_key_aqui
```

**Nota de Seguridad**:
- `VITE_POSTHOG_KEY`: Public API key (para tracking de eventos) - ✅ Seguro en frontend
- `VITE_POSTHOG_API_KEY`: Personal API key (para queries) - ⚠️ Expuesto en frontend

**Para Producción**: Se recomienda crear un backend proxy para queries sensibles.

### Paso 3: Verificar Configuración

Reinicia tu servidor de desarrollo:

```bash
npm run dev
```

Visita `/admin` y verifica que las cards de PostHog muestren datos (o mensaje de configuración).

---

## 📊 Eventos Rastreados

### 1. `catalog_page_view`

**Descripción**: Se dispara cada vez que un usuario visita el catálogo en modo catálogo

**Propiedades**:
```javascript
{
  store_id: "uuid-de-la-tienda",
  store_name: "Nombre de la Tienda",
  catalog_mode: true,
  page_url: "https://tienda.pideai.com/",
  timestamp: "2025-12-17T10:30:00.000Z"
}
```

**Ubicación en código**: `/src/pages/Index.tsx` (líneas 37-57)

**Uso**:
- Tracking de vistas para límites de plan gratuito
- Analytics de tráfico por tienda
- Análisis de engagement

### 2. `add_to_cart` (Próximamente)

**Descripción**: Usuario agrega producto al carrito

**Propiedades**:
```javascript
{
  store_id: "uuid",
  store_name: "Nombre",
  product_id: "uuid-producto",
  product_name: "Nombre Producto",
  cart_value: 25.99,
  quantity: 2
}
```

**Nota**: Actualmente este evento necesita ser implementado. Ver [TODO](#próximos-pasos).

### 3. `checkout_started` (Próximamente)

**Descripción**: Usuario inicia proceso de checkout

### 4. `order_completed` (Próximamente)

**Descripción**: Pedido completado exitosamente

---

## 🎨 Dashboards en PostHog UI

### Dashboard Recomendado: "Catalog & Cart Analytics"

#### Paso 1: Crear Dashboard

1. En PostHog, ve a **Dashboards** → **New dashboard**
2. Nombre: **Catalog & Cart Analytics**
3. Descripción: **Analytics completo de catálogos y carritos abandonados**
4. Tags: `catalog`, `carts`, `analytics`

#### Paso 2: Agregar Insights

##### Insight 1: Total Catalog Views (Last 30 Days)

**Tipo**: Trends → Number

**Configuración**:
- **Event**: `catalog_page_view`
- **Math**: Total count
- **Date range**: Last 30 days
- **Visualization**: Number (big number card)

**Query HogQL**:
```sql
SELECT count(*) as total_views
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 30 DAY
```

---

##### Insight 2: Catalog Views by Store

**Tipo**: Trends → Bar Chart

**Configuración**:
- **Event**: `catalog_page_view`
- **Math**: Total count
- **Breakdown**: `store_name`
- **Sort**: Descending
- **Limit**: Top 10
- **Visualization**: Horizontal bar chart

**Query HogQL**:
```sql
SELECT
  properties.store_name as store,
  count(*) as total_views
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store
ORDER BY total_views DESC
LIMIT 10
```

---

##### Insight 3: Daily Catalog Views Trend

**Tipo**: Trends → Line Chart

**Configuración**:
- **Event**: `catalog_page_view`
- **Math**: Total count
- **Interval**: Daily
- **Date range**: Last 90 days
- **Visualization**: Line chart
- **Smoothing**: 7-day moving average (opcional)

**Query HogQL**:
```sql
SELECT
  toDate(timestamp) as date,
  count(*) as views
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 90 DAY
GROUP BY date
ORDER BY date ASC
```

---

##### Insight 4: Unique Visitors vs Total Views

**Tipo**: Trends → Line Chart (multi-series)

**Configuración**:
- **Series 1**:
  - Event: `catalog_page_view`
  - Math: Total count
  - Label: "Total Views"
- **Series 2**:
  - Event: `catalog_page_view`
  - Math: Unique users
  - Label: "Unique Visitors"
- **Interval**: Daily
- **Date range**: Last 30 days

**Query HogQL**:
```sql
SELECT
  toDate(timestamp) as date,
  count(*) as total_views,
  count(DISTINCT person_id) as unique_visitors
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY date
ORDER BY date ASC
```

---

##### Insight 5: Views by Hour of Day

**Tipo**: Trends → Bar Chart

**Configuración**:
- **Event**: `catalog_page_view`
- **Math**: Total count
- **Breakdown**: `toHour(timestamp)`
- **Date range**: Last 7 days
- **Visualization**: Vertical bar chart

**Query HogQL**:
```sql
SELECT
  toHour(timestamp) as hour,
  count(*) as views
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY hour
ORDER BY hour ASC
```

**Insight**: Identifica las horas pico de tráfico.

---

##### Insight 6: Abandoned Carts (Cuando se implemente)

**Tipo**: Trends → Number

**Query HogQL**:
```sql
WITH cart_events AS (
  SELECT
    person_id,
    properties.cart_value as cart_value,
    timestamp
  FROM events
  WHERE event = 'add_to_cart'
    AND timestamp >= now() - INTERVAL 30 DAY
),
completed_orders AS (
  SELECT DISTINCT person_id
  FROM events
  WHERE event = 'order_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
)
SELECT
  count(DISTINCT c.person_id) as total_abandoned
FROM cart_events c
LEFT JOIN completed_orders o ON c.person_id = o.person_id
WHERE o.person_id IS NULL
```

---

##### Insight 7: Conversion Funnel

**Tipo**: Funnel

**Steps**:
1. `catalog_page_view` (Catalog Visit)
2. `add_to_cart` (Add to Cart)
3. `checkout_started` (Checkout)
4. `order_completed` (Order Complete)

**Configuración**:
- **Date range**: Last 30 days
- **Conversion window**: 24 hours

---

#### Paso 3: Organizar Dashboard

**Layout recomendado**:

```
┌─────────────────────────────────────────────┐
│  [1] Total Views    [2] Unique Visitors     │
├─────────────────────────────────────────────┤
│  [3] Daily Trend (Line Chart - full width)  │
├──────────────────────┬──────────────────────┤
│  [4] Views by Store  │  [5] Views by Hour   │
├──────────────────────┴──────────────────────┤
│  [6] Conversion Funnel (full width)         │
└─────────────────────────────────────────────┘
```

---

## 💻 Métricas en Admin Panel

Tu aplicación ya tiene 2 componentes integrados que muestran datos de PostHog en tiempo real:

### 1. PostHogCatalogViewsCard

**Ubicación**: Visible en `/admin` cuando catalog mode está activo

**Métricas mostradas**:
- **Total de Vistas**: Últimos 30 días
- **Visitantes Únicos**: Personas diferentes
- **Vistas por Visitante**: Promedio de engagement

**Características**:
- ✅ Auto-refresh cada 5 minutos
- ✅ Botón de refresh manual
- ✅ Link directo a PostHog
- ✅ Indicador de conexión en tiempo real

**Archivo**: `/src/components/admin/PostHogCatalogViewsCard.tsx`

---

### 2. AbandonedCartCard

**Ubicación**: Visible en `/admin`

**Métricas mostradas**:
- **Carritos Abandonados**: Cantidad total
- **Valor Perdido**: Monto en carritos no completados
- **Valor Promedio**: Por carrito abandonado
- **Tasa de Recuperación**: % de carritos recuperados

**Características**:
- ✅ Auto-refresh cada 5 minutos
- ✅ Insights accionables
- ✅ Link a configuración de WhatsApp
- ✅ Recomendaciones para recuperación

**Archivo**: `/src/components/admin/AbandonedCartCard.tsx`

---

## 🔍 Queries HogQL Útiles

### Query 1: Top Performing Stores

```sql
SELECT
  properties.store_name as store,
  properties.store_id as store_id,
  count(*) as total_views,
  count(DISTINCT person_id) as unique_visitors,
  round(count(*) * 1.0 / count(DISTINCT person_id), 2) as views_per_visitor
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store, store_id
HAVING total_views > 10
ORDER BY total_views DESC
LIMIT 20
```

**Uso**: Identifica tiendas con mejor tráfico.

---

### Query 2: Growth Week over Week

```sql
WITH current_week AS (
  SELECT count(*) as views
  FROM events
  WHERE event = 'catalog_page_view'
    AND timestamp >= now() - INTERVAL 7 DAY
),
previous_week AS (
  SELECT count(*) as views
  FROM events
  WHERE event = 'catalog_page_view'
    AND timestamp >= now() - INTERVAL 14 DAY
    AND timestamp < now() - INTERVAL 7 DAY
)
SELECT
  c.views as current_week_views,
  p.views as previous_week_views,
  round((c.views - p.views) * 100.0 / p.views, 2) as growth_percentage
FROM current_week c, previous_week p
```

**Uso**: Mide crecimiento semanal.

---

### Query 3: Views by Page URL

```sql
SELECT
  properties.page_url as url,
  count(*) as views,
  count(DISTINCT person_id) as unique_visitors
FROM events
WHERE event = 'catalog_page_view'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY url
ORDER BY views DESC
LIMIT 20
```

**Uso**: Encuentra las páginas más visitadas.

---

### Query 4: Abandoned Cart Value by Store

```sql
WITH cart_events AS (
  SELECT
    properties.store_id as store_id,
    properties.store_name as store_name,
    person_id,
    max(properties.cart_value) as max_cart_value
  FROM events
  WHERE event = 'add_to_cart'
    AND timestamp >= now() - INTERVAL 30 DAY
  GROUP BY store_id, store_name, person_id
),
completed_orders AS (
  SELECT DISTINCT person_id
  FROM events
  WHERE event = 'order_completed'
    AND timestamp >= now() - INTERVAL 30 DAY
)
SELECT
  c.store_name,
  count(DISTINCT c.person_id) as abandoned_carts,
  sum(c.max_cart_value) as total_abandoned_value,
  round(avg(c.max_cart_value), 2) as avg_cart_value
FROM cart_events c
LEFT JOIN completed_orders o ON c.person_id = o.person_id
WHERE o.person_id IS NULL
GROUP BY c.store_name
ORDER BY total_abandoned_value DESC
```

**Uso**: Prioriza tiendas para recovery campaigns.

---

## 🐛 Troubleshooting

### Problema 1: No veo datos en PostHog

**Síntomas**:
- Dashboards vacíos
- "No results" en queries

**Soluciones**:
1. **Verificar que los eventos se están enviando**:
   - Abre DevTools → Console
   - Busca: `[PostHog] Catalog page view tracked`
   - Si no aparece, verifica que `catalog_mode` esté en `true`

2. **Verificar en Activity tab**:
   - Ve a PostHog → Activity
   - Busca `catalog_page_view` en tiempo real
   - Si no aparece después de 2-3 minutos, hay un problema de conexión

3. **Verificar API Key**:
   - En PostHog → Settings → Project API Key
   - Debe coincidir con `VITE_POSTHOG_KEY` en tu `.env`

---

### Problema 2: "PostHog API no configurada" en Admin Panel

**Síntomas**:
- Cards muestran mensaje de configuración
- No se cargan métricas

**Solución**:
1. Verifica que `VITE_POSTHOG_API_KEY` esté en `.env`
2. Reinicia el servidor dev: `npm run dev`
3. Verifica que la key sea una **Personal API Key** (no Project API Key)
4. Verifica que la key tenga el scope **Query** habilitado

---

### Problema 3: Error "401 Unauthorized" en queries

**Causa**: API key inválida o expirada

**Solución**:
1. Ve a PostHog → Settings → Personal API Keys
2. Verifica el status de tu key
3. Si está expirada, crea una nueva
4. Actualiza `.env` con la nueva key
5. Reinicia el servidor

---

### Problema 4: Datos desactualizados en Admin Panel

**Causa**: Cache de React Query

**Solución**:
1. Click en el botón de **Refresh** en la card
2. O espera 5 minutos (auto-refresh automático)
3. Si persiste, limpia el cache del navegador

---

## 📈 Próximos Pasos

### 1. Implementar Eventos Faltantes

**Eventos a agregar**:
- ✅ `catalog_page_view` (Completado)
- ⏳ `add_to_cart`
- ⏳ `remove_from_cart`
- ⏳ `checkout_started`
- ⏳ `checkout_completed`
- ⏳ `order_completed`

**Ubicaciones**:
- `add_to_cart`: `/src/contexts/CartContext.tsx` → función `addItem()`
- `checkout_started`: `/src/pages/Checkout.tsx` → `useEffect` al montar
- `order_completed`: `/src/pages/ConfirmOrder.tsx` → después de crear orden

**Ejemplo de implementación**:
```typescript
// En CartContext.tsx
import posthog from 'posthog-js';

const addItem = (product, extras) => {
  // ... código existente ...

  // Track add to cart
  posthog.capture('add_to_cart', {
    store_id: store.id,
    store_name: store.name,
    product_id: product.id,
    product_name: product.name,
    quantity: 1,
    price: product.price,
    cart_value: calculateCartTotal(),
  });
};
```

---

### 2. Configurar Alertas en PostHog

**Alertas recomendadas**:
1. **Cero vistas en 24h**: Posible problema técnico
2. **Spike de carritos abandonados**: Problema en checkout
3. **Caída en conversion rate**: Problema de UX

**Configuración**:
- PostHog → Insights → (Selecciona un insight) → **Subscribe**
- Configura threshold y frecuencia

---

### 3. Session Recordings

**Beneficio**: Ver cómo usuarios navegan el catálogo

**Habilitación**:
1. PostHog → Settings → Session Recording
2. Toggle **Enable session recordings**
3. Configurar sampling rate (ej: 10% de sesiones)

**Uso**: Identifica problemas de UX y flujos de navegación.

---

### 4. Feature Flags para A/B Testing

**Ejemplo de uso**:
```typescript
// Testear diferentes layouts de catálogo
const showNewLayout = posthog.isFeatureEnabled('new-catalog-layout');

if (showNewLayout) {
  return <NewCatalogLayout />;
} else {
  return <OldCatalogLayout />;
}
```

---

## 📚 Recursos

### Documentación Oficial
- [PostHog Docs](https://posthog.com/docs)
- [HogQL Reference](https://posthog.com/docs/hogql)
- [JavaScript SDK](https://posthog.com/docs/libraries/js)

### Tu Documentación Interna
- `/docs/POSTHOG_IMPLEMENTATION_GUIDE.md` - Guía completa de implementación
- `/docs/POSTHOG_DASHBOARD.md` - Dashboard overview
- `/docs/POSTHOG_QUICKSTART.md` - Quick start guide

### Archivos de Código
- `/src/lib/posthog-api.ts` - Helper para Query API
- `/src/hooks/usePostHogCatalogViews.ts` - Hook para catalog views
- `/src/hooks/usePostHogAbandonedCart.ts` - Hook para carritos
- `/src/components/admin/PostHogCatalogViewsCard.tsx` - Card de métricas
- `/src/components/admin/AbandonedCartCard.tsx` - Card de carritos

---

## ✅ Checklist de Setup

- [ ] API Key creada en PostHog
- [ ] `VITE_POSTHOG_API_KEY` agregada a `.env`
- [ ] Servidor reiniciado
- [ ] Eventos visibles en PostHog Activity tab
- [ ] Dashboard "Catalog & Cart Analytics" creado
- [ ] Insights agregados al dashboard
- [ ] Cards visibles en `/admin`
- [ ] Métricas cargando correctamente
- [ ] Botón de refresh funciona
- [ ] Link a PostHog funciona

---

**Última actualización**: 2025-12-17
**Versión**: 1.0.0
