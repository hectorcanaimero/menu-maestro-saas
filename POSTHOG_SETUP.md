# PostHog Setup Guide - PideAI

Esta guía te ayudará a recrear toda la configuración de PostHog desde cero.

## 📋 Eventos Personalizados Capturados

La aplicación captura los siguientes eventos:

### Eventos del Catálogo y Carrito
- **`catalog_page_view`** - Cuando un usuario ve el catálogo
  - Propiedades: `store_id`, `store_name`, `subdomain`, `pathname`, `url`

- **`product_added_to_cart`** - Cuando se agrega un producto al carrito
  - Propiedades: `product_id`, `product_name`, `quantity`, `price`, `store_id`, `cart_total`

- **`product_removed_from_cart`** - Cuando se remueve un producto del carrito
  - Propiedades: `product_id`, `product_name`, `store_id`

- **`cart_viewed`** - Cuando el usuario abre el carrito
  - Propiedades: `item_count`, `cart_total`, `store_id`

- **`floating_cart_clicked`** - Cuando se hace click en el botón flotante del carrito
  - Propiedades: `item_count`, `cart_total`, `store_id`

### Eventos de Checkout y Órdenes
- **`checkout_started`** - Cuando el usuario inicia el proceso de checkout
  - Propiedades: `cart_total`, `items_count`, `store_id`, `order_type`, `has_delivery_address`, `payment_method`

- **`checkout_step_completed`** - Cuando se completa un paso del checkout
  - Propiedades: `step`, `cart_total`, `store_id`

- **`order_placed`** - Cuando se confirma una orden exitosamente
  - Propiedades: `order_id`, `total`, `items_count`, `store_id`, `order_type`, `payment_method`

### Eventos Admin
- **`admin_order_created`** - Cuando un admin crea una orden manualmente
  - Propiedades: `order_id`, `total`, `store_id`, `admin_user_id`

- **`admin_order_edited`** - Cuando un admin edita una orden
  - Propiedades: `order_id`, `changes_made`, `store_id`

### Eventos de Landing Page
- **`landing_page_viewed`** - Vista de la página de bienvenida
- **`landing_section_viewed`** - Vista de sección específica
  - Propiedades: `section_name`
- **`landing_cta_clicked`** - Click en call-to-action
  - Propiedades: `cta_label`, `cta_href`
- **`feature_card_hovered`** - Hover sobre tarjeta de característica
  - Propiedades: `feature_title`

### Eventos de Experimentos
- **`experiment_viewed`** - Cuando se muestra un experimento A/B
  - Propiedades: `experiment_id`, `variant`, `feature_flag`

---

## 📊 Dashboards Recomendados

### 1. **Dashboard Principal - Resumen Ejecutivo**

Crea un dashboard llamado "📈 Resumen Ejecutivo" con los siguientes insights:

#### Métricas Clave (Insights tipo "Trends"):
1. **Total de Vistas al Catálogo**
   - Evento: `catalog_page_view`
   - Tipo: Total count
   - Período: Últimos 30 días
   - Breakdown: Por `store_name`

2. **Productos Agregados al Carrito**
   - Evento: `product_added_to_cart`
   - Tipo: Total count
   - Período: Últimos 30 días
   - Breakdown: Por `store_id`

3. **Órdenes Completadas**
   - Evento: `order_placed`
   - Tipo: Total count
   - Período: Últimos 30 días
   - Breakdown: Por `store_name`

4. **Ingresos Totales**
   - Evento: `order_placed`
   - Tipo: Sum de propiedad `total`
   - Período: Últimos 30 días
   - Breakdown: Por `store_name`

5. **Ticket Promedio**
   - Evento: `order_placed`
   - Tipo: Average de propiedad `total`
   - Período: Últimos 30 días

---

### 2. **Dashboard de Conversión**

Crea un dashboard llamado "🎯 Conversión y Funnel" con:

#### Funnel Principal:
1. **Funnel de Conversión de Ventas**
   - Tipo: Funnel
   - Pasos:
     1. `catalog_page_view` (Vista Catálogo)
     2. `product_added_to_cart` (Agregó al Carrito)
     3. `checkout_started` (Inició Checkout)
     4. `order_placed` (Orden Completada)
   - Breakdown: Por `store_name`
   - Período: Últimos 30 días

2. **Tasa de Conversión por Tienda**
   - Tipo: Trends
   - Fórmula: `(order_placed / catalog_page_view) * 100`
   - Breakdown: Por `store_name`

3. **Abandono de Carrito**
   - Eventos: `product_added_to_cart` que NO tienen `order_placed` en 24h
   - Tipo: Trends
   - Mostrar usuarios únicos

---

### 3. **Dashboard de Productos**

Crea un dashboard llamado "🛍️ Análisis de Productos" con:

1. **Top 10 Productos Más Agregados**
   - Evento: `product_added_to_cart`
   - Tipo: Trends
   - Breakdown: Por `product_name`
   - Ordenar: Por total descendente
   - Límite: 10 resultados

2. **Productos Removidos del Carrito**
   - Evento: `product_removed_from_cart`
   - Tipo: Trends
   - Breakdown: Por `product_name`

3. **Ratio Agregado/Removido por Producto**
   - Eventos: Comparación de `product_added_to_cart` vs `product_removed_from_cart`
   - Breakdown: Por `product_name`

---

### 4. **Dashboard de Tiendas**

Crea un dashboard llamado "🏪 Rendimiento por Tienda" con:

1. **Vistas por Tienda**
   - Evento: `catalog_page_view`
   - Breakdown: Por `store_name`
   - Vista: Bar chart

2. **Órdenes por Tienda**
   - Evento: `order_placed`
   - Breakdown: Por `store_name`
   - Vista: Table con suma de `total`

3. **Tipo de Orden por Tienda**
   - Evento: `order_placed`
   - Breakdown: Por `order_type` (delivery/pickup)
   - Filtro: Por `store_name`

4. **Métodos de Pago Preferidos**
   - Evento: `checkout_started`
   - Breakdown: Por `payment_method`
   - Filtro: Por `store_name`

---

### 5. **Dashboard de Comportamiento de Usuario**

Crea un dashboard llamado "👤 Comportamiento de Usuarios" con:

1. **Usuarios Únicos por Día**
   - Evento: `$pageview`
   - Tipo: Unique users
   - Período: Últimos 30 días

2. **Sesiones Promedio**
   - Tipo: Session duration
   - Breakdown: Por landing page

3. **Tasa de Rebote**
   - Sesiones con solo 1 pageview
   - Período: Últimos 7 días

4. **Path Analysis**
   - Tipo: User Paths
   - Desde: `catalog_page_view`
   - Hasta: `order_placed`

---

## 🎨 Actions Recomendadas

Crea las siguientes **Actions** en PostHog para análisis más fácil:

### Action 1: Orden Completada Exitosamente
- Nombre: "✅ Orden Completada"
- Evento: `order_placed`
- Descripción: Una orden fue completada exitosamente

### Action 2: Carrito Abandonado
- Nombre: "🛒 Carrito Abandonado"
- Eventos:
  1. `product_added_to_cart`
  2. NO seguido por `order_placed` en 24 horas

### Action 3: Checkout Iniciado
- Nombre: "💳 Checkout Iniciado"
- Evento: `checkout_started`

### Action 4: Alta Intención de Compra
- Nombre: "🔥 Alta Intención"
- Eventos:
  1. `cart_viewed` (al menos 2 veces)
  2. `checkout_started`
  3. NO completó `order_placed`

---

## 🔔 Alertas Recomendadas

Configura las siguientes alertas en PostHog:

### Alerta 1: Caída en Órdenes
- Métrica: `order_placed`
- Condición: Disminución de 30% comparado con semana anterior
- Frecuencia: Diaria
- Destinatarios: Admin/Owner

### Alerta 2: Spike en Carritos Abandonados
- Métrica: Ratio de `product_added_to_cart` sin `order_placed`
- Condición: Mayor al 80%
- Frecuencia: Cada 6 horas

### Alerta 3: Tienda Sin Vistas
- Métrica: `catalog_page_view` por tienda
- Condición: Cero vistas en 24 horas
- Frecuencia: Diaria

---

## 🧪 Feature Flags y Experimentos

### Feature Flags Existentes
La app ya tiene soporte para feature flags. Puedes crear:

1. **`enable-whatsapp-checkout`**
   - Para habilitar/deshabilitar checkout por WhatsApp
   - Tipo: Boolean

2. **`show-promotions-banner`**
   - Para mostrar/ocultar banner de promociones
   - Tipo: Boolean

3. **`enable-catalog-mode`**
   - Para modo catálogo sin compra
   - Tipo: Boolean

### Experimentos A/B Sugeridos

1. **Botón de Checkout**
   - Variante A: "Proceder al Pago"
   - Variante B: "Confirmar Orden"
   - Métrica: Tasa de conversión en `checkout_started`

2. **Layout de Catálogo**
   - Variante A: Grid de 2 columnas
   - Variante B: Grid de 3 columnas
   - Métrica: `product_added_to_cart` rate

---

## 📝 Cohorts Útiles

Crea los siguientes cohorts para segmentación:

### Cohort 1: Compradores Frecuentes
- Usuarios con más de 3 eventos `order_placed` en los últimos 30 días

### Cohort 2: Usuarios con Carrito Abandonado
- Usuarios que hicieron `product_added_to_cart` pero no `order_placed` en 7 días

### Cohort 3: Nuevos Visitantes
- Usuarios que vieron `catalog_page_view` por primera vez en los últimos 7 días

### Cohort 4: Compradores de Alto Valor
- Usuarios donde suma de `total` en `order_placed` > $500

---

## 🔍 Queries HogQL Personalizadas

### Query 1: Top Tiendas por Ingresos
```sql
SELECT
  properties.store_name as store,
  count() as total_orders,
  sum(toFloat(properties.total)) as revenue,
  avg(toFloat(properties.total)) as avg_order_value
FROM events
WHERE event = 'order_placed'
  AND timestamp >= now() - INTERVAL 30 DAY
GROUP BY store
ORDER BY revenue DESC
LIMIT 10
```

### Query 2: Tasa de Conversión por Día
```sql
SELECT
  toDate(timestamp) as date,
  countIf(event = 'catalog_page_view') as views,
  countIf(event = 'order_placed') as orders,
  (orders * 100.0 / views) as conversion_rate
FROM events
WHERE timestamp >= now() - INTERVAL 30 DAY
GROUP BY date
ORDER BY date
```

### Query 3: Productos en Carritos Abandonados
```sql
SELECT
  properties.product_name as product,
  count(DISTINCT person_id) as abandoned_count,
  avg(toFloat(properties.price)) as avg_price
FROM events
WHERE event = 'product_added_to_cart'
  AND person_id NOT IN (
    SELECT DISTINCT person_id
    FROM events
    WHERE event = 'order_placed'
      AND timestamp >= now() - INTERVAL 7 DAY
  )
  AND timestamp >= now() - INTERVAL 7 DAY
GROUP BY product
ORDER BY abandoned_count DESC
LIMIT 20
```

---

## ⚙️ Configuración Adicional

### Session Recording
1. Ve a **Settings → Recordings**
2. Activa "Record user sessions"
3. Configura:
   - Mask all text inputs: ✅
   - Mask sensitive elements: ✅
   - Sample rate: 100% (dev), 20% (prod)
   - Console logs: Capture

### Autocapture
1. Ve a **Settings → Autocapture**
2. Activa "Enable autocapture"
3. Configurar elementos a ignorar:
   - `.sensitive-data`
   - `[data-private]`

### Correlación de Usuarios
1. Ve a **Settings → Project**
2. Configura "Person properties":
   - `email` (si está disponible)
   - `user_id` (de Supabase)
   - `store_owner` (boolean)

---

## 🚀 Pasos para Implementar

1. **Crear nuevo proyecto en PostHog**
   - Nombre: "PideAI Production"
   - URL: https://us.posthog.com

2. **Actualizar credenciales en `.env`**
   ```env
   VITE_POSTHOG_KEY=phc_XXXXX
   VITE_POSTHOG_HOST=https://us.i.posthog.com
   VITE_POSTHOG_API_KEY=phx_XXXXX
   ```

3. **Actualizar Project ID en `src/lib/posthog-api.ts`**
   ```typescript
   const POSTHOG_PROJECT_ID = 'TU_NUEVO_PROJECT_ID';
   ```

4. **Crear dashboards** siguiendo las guías de arriba

5. **Configurar alertas** para monitoreo proactivo

6. **Crear feature flags** para experimentos

7. **Verificar eventos** ejecutando la app en dev y revisando "Live Events" en PostHog

---

## ✅ Checklist de Verificación

- [ ] Proyecto creado en PostHog
- [ ] Credenciales actualizadas en `.env`
- [ ] Project ID actualizado en `posthog-api.ts`
- [ ] Dashboard "Resumen Ejecutivo" creado
- [ ] Dashboard "Conversión y Funnel" creado
- [ ] Dashboard "Análisis de Productos" creado
- [ ] Dashboard "Rendimiento por Tienda" creado
- [ ] Dashboard "Comportamiento de Usuarios" creado
- [ ] Actions configuradas
- [ ] Alertas configuradas
- [ ] Session Recording activado
- [ ] Eventos verificados en "Live Events"

---

## 📚 Recursos

- [PostHog Documentation](https://posthog.com/docs)
- [HogQL Reference](https://posthog.com/docs/hogql)
- [Dashboard Templates](https://posthog.com/templates)
- [Feature Flags Guide](https://posthog.com/docs/feature-flags)
