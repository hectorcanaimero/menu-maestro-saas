# PostHog Dashboard - Quick Start Guide

## 🚀 Inicio Rápido (10 minutos)

Esta guía te lleva de cero a tener insights básicos funcionando en PostHog.

---

## Paso 1: Acceder a PostHog (1 min)

1. Ir a: **https://us.i.posthog.com**
2. Login con tus credenciales
3. Verificar que estás en el proyecto correcto (Project ID: 185811)

---

## Paso 2: Verificar Eventos Existentes (2 min)

1. Click en **"Events"** en el menú izquierdo
2. Buscar estos eventos:
   - `product_added_to_cart` ✅
   - `checkout_started` ✅
   - `order_placed` ✅

3. Click en cualquier evento para ver sus propiedades
4. Verificar que `store_id` está presente

**Si ves eventos:** ¡Perfecto! PostHog está funcionando.
**Si NO ves eventos:** Verifica que la app esté corriendo y genera tráfico.

---

## Paso 3: Crear Tu Primer Insight (3 min)

### Insight: Órdenes por Día

1. Click en **"Insights"** → **"New insight"**
2. Seleccionar tipo: **"Trends"**
3. Configurar:
   - **Event:** `order_placed`
   - **Math:** Total count
   - **Interval:** Daily
   - **Date range:** Last 30 days
4. Click en **"Save"**
5. Nombrar: "Total Orders - Last 30 Days"

**Resultado:** Verás un gráfico de línea con órdenes por día.

---

## Paso 4: Crear Tu Primer Funnel (4 min)

### Funnel: Cart → Checkout → Order

1. Click en **"Insights"** → **"New insight"**
2. Seleccionar tipo: **"Funnel"**
3. Agregar pasos:
   - **Step 1:** `product_added_to_cart`
   - **Step 2:** `checkout_started`
   - **Step 3:** `order_placed`
4. Configurar:
   - **Time to convert:** 14 days
   - **Breakdown:** `order_type` (optional)
5. Click en **"Save"**
6. Nombrar: "Cart to Order Conversion"

**Resultado:** Verás % de conversión en cada paso.

---

## 🎯 Insights Esenciales (Top 5)

### 1. Total Revenue

**Tipo:** Trends
**Evento:** `order_placed`
**Property:** `order_total`
**Math:** Sum
**Intervalo:** Last 30 days

---

### 2. Average Order Value (AOV)

**Tipo:** Trends
**Evento:** `order_placed`
**Property:** `order_total`
**Math:** Average
**Breakdown:** `order_type`

---

### 3. Conversion Rate

**Tipo:** Formula
**Serie A:** `product_added_to_cart` (count)
**Serie B:** `order_placed` (count)
**Formula:** `(B / A) * 100`

---

### 4. Top Products

**Tipo:** Trends
**Evento:** `product_added_to_cart`
**Math:** Total count
**Breakdown:** `product_name`
**Limit:** Top 10

---

### 5. Orders by Hour

**Tipo:** Trends
**Evento:** `order_placed`
**Math:** Total count
**Breakdown:** Hour of day

---

## 📊 Crear Dashboard Básico (5 min)

1. Click en **"Dashboards"** → **"New dashboard"**
2. Nombre: "Menu Maestro - Overview"
3. Click en **"Add insight"**
4. Seleccionar los 5 insights que creaste arriba
5. Arreglar layout arrastrando insights
6. **Save**

---

## 🔍 Filtrar por Tienda Específica

### Opción 1: En el Insight

1. Abrir cualquier insight
2. Click en **"Add filter"**
3. Seleccionar: `store_id`
4. Operator: `equals`
5. Value: UUID de la tienda (ej: `abc-123-def`)

### Opción 2: En el Dashboard (Global)

1. Abrir dashboard
2. Click en **"Add filter"** (arriba a la derecha)
3. Seleccionar: `store_id`
4. Aplicar a todos los insights

---

## 🛠️ Queries HogQL Rápidos

### Query 1: Revenue por Tienda

```sql
SELECT
  properties.store_name as store,
  sum(toFloat(properties.order_total)) as revenue
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store
ORDER BY revenue DESC
```

**Cómo usar:**
1. Ir a **"SQL"** en el menú
2. Pegar query
3. Click en **"Run"**

---

### Query 2: Conversión por Tienda

```sql
WITH
  cart AS (
    SELECT properties.store_id, count(DISTINCT person_id) as users
    FROM events
    WHERE event = 'product_added_to_cart'
      AND timestamp >= now() - INTERVAL 7 DAY
    GROUP BY properties.store_id
  ),
  orders AS (
    SELECT properties.store_id, count(DISTINCT person_id) as users
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 7 DAY
    GROUP BY properties.store_id
  )
SELECT
  c.store_id,
  c.users as added_to_cart,
  o.users as placed_order,
  round((o.users * 100.0 / c.users), 2) as conversion_rate
FROM cart c
LEFT JOIN orders o ON c.store_id = o.store_id
ORDER BY conversion_rate DESC
```

---

## 📱 PostHog Toolbar (Debug en Dev)

### Activar Toolbar

1. En tu app (development), presionar **Cmd+K** (Mac) o **Ctrl+K** (Windows)
2. Se abre el toolbar de PostHog
3. Click en **"Events"** para ver eventos en tiempo real

### Verificar Tracking

1. Navega por tu app
2. Agrega producto al carrito
3. Ve al checkout
4. En el toolbar, verás eventos aparecer en vivo

---

## 🎯 Checklist de Verificación

### ✅ PostHog Funcionando

- [ ] Puedo acceder a PostHog UI
- [ ] Veo eventos recientes (últimas 24h)
- [ ] `store_id` está presente en todos los eventos
- [ ] User identification funciona (veo `email` en propiedades)

### ✅ Insights Básicos Creados

- [ ] Total Orders (trend)
- [ ] Revenue (sum)
- [ ] Conversion Funnel (cart → order)
- [ ] Dashboard básico con 3-5 insights

### ✅ Filtros Funcionando

- [ ] Puedo filtrar por `store_id`
- [ ] Puedo filtrar por `order_type`
- [ ] Breakdowns funcionan correctamente

---

## 🚨 Troubleshooting

### No veo eventos en PostHog

**Posible causa:** App no está enviando eventos

**Solución:**
1. Verificar que `VITE_POSTHOG_KEY` está en `.env`
2. Check console en browser (debería ver `[PostHog] Initialized`)
3. Generar tráfico (agregar productos, hacer checkout)
4. Esperar 1-2 minutos (PostHog batch events)

---

### Eventos no tienen `store_id`

**Posible causa:** Usuario no cargó tienda correctamente

**Solución:**
1. Verificar que `StoreContext` está cargando
2. Check `localStorage.getItem("dev_subdomain")` en development
3. En producción, verificar subdomain en URL

---

### No puedo filtrar por tienda

**Posible causa:** Property name incorrecto

**Solución:**
1. En PostHog, click en evento
2. Ver exactamente cómo se llama la property (`store_id` vs `storeId`)
3. Usar el nombre exacto en filtros

---

## 📚 Siguiente Nivel

Una vez que tengas lo básico funcionando:

1. **Leer:** `POSTHOG_IMPLEMENTATION_GUIDE.md` para 28 insights avanzados
2. **Implementar:** Eventos adicionales en `POSTHOG_MISSING_EVENTS.md`
3. **Crear:** Cohorts y segmentos de usuarios
4. **Configurar:** Alertas para anomalías

---

## 🎓 Recursos Útiles

### Documentación Interna
- **Overview:** `POSTHOG_DASHBOARD.md`
- **Guía Completa:** `POSTHOG_IMPLEMENTATION_GUIDE.md`
- **Eventos Faltantes:** `POSTHOG_MISSING_EVENTS.md`
- **Resumen:** `POSTHOG_SUMMARY.md`

### PostHog Docs
- **Getting Started:** https://posthog.com/docs/getting-started
- **Insights:** https://posthog.com/docs/product-analytics/insights
- **Funnels:** https://posthog.com/docs/product-analytics/funnels
- **HogQL Tutorial:** https://posthog.com/docs/product-analytics/sql

---

## ⏱️ Tiempo Total

- **Paso 1-4:** 10 minutos
- **Insights esenciales:** +15 minutos
- **Dashboard básico:** +5 minutos
- **Queries HogQL:** +10 minutos

**Total:** ~40 minutos para setup básico completo

---

**¡Listo! Ahora tienes PostHog funcionando con insights básicos.**

**Próximo paso:** Implementar el dashboard completo con `POSTHOG_IMPLEMENTATION_GUIDE.md`

---

**Autor:** Claude Code
**Fecha:** 2025-11-30
**Versión:** 1.0.0
