# PostHog Analytics Dashboard - Menu Maestro

## Resumen Ejecutivo

Este documento describe el dashboard de analytics de PostHog para Menu Maestro, una plataforma multi-tenant de pedidos de comida. El dashboard está diseñado para proporcionar insights críticos sobre el comportamiento de usuarios, conversión de pedidos y performance por tienda.

**PostHog Instance:** https://us.i.posthog.com
**Project ID:** 185811

**Dashboard URL:** [Pendiente de creación - Ver guía de implementación]

### Documentación Relacionada

- **[Guía de Implementación](/Users/al3jandro/project/pideai/app/docs/POSTHOG_IMPLEMENTATION_GUIDE.md)** - Instrucciones paso a paso para crear dashboards, insights y queries en PostHog
- **[Eventos Faltantes](/Users/al3jandro/project/pideai/app/docs/POSTHOG_MISSING_EVENTS.md)** - Código para implementar eventos adicionales (product_viewed, admin events, etc.)

### Estado del Proyecto

**✅ Eventos Implementados:** 6/15 eventos principales
- `product_added_to_cart` ✅
- `product_removed_from_cart` ✅
- `cart_viewed` ✅
- `checkout_started` ✅
- `checkout_step_completed` ✅
- `order_placed` ✅

**⏳ Eventos Pendientes:** 9 eventos recomendados
- `product_viewed` (ALTA PRIORIDAD)
- `admin_menu_item_created` (ALTA PRIORIDAD)
- `admin_settings_updated` (ALTA PRIORIDAD)
- `category_viewed` (MEDIA PRIORIDAD)
- `product_extras_selected` (MEDIA PRIORIDAD)
- Y 4 más (ver POSTHOG_MISSING_EVENTS.md)

**📊 Dashboard Status:** Por implementar
- 25+ insights especificados
- 5 secciones definidas
- Queries HogQL documentados
- Filtros multi-tenant configurados

---

## Eventos Implementados

### User Identification

**Ubicación:** `src/contexts/StoreContext.tsx` (líneas 185-224)

**Propiedades de Usuario:**
- `user_id`: UUID de Supabase Auth
- `email`: Email del usuario
- `store_id`: UUID de la tienda actual
- `store_name`: Nombre de la tienda
- `store_subdomain`: Subdominio (ej: "totus")
- `is_store_owner`: boolean - indica si es dueño de tienda
- `role`: 'owner' | 'customer'

**Propiedades Anónimas (super properties):**
- `store_id`: Para usuarios no autenticados
- `store_name`: Para usuarios no autenticados
- `store_subdomain`: Para usuarios no autenticados

---

### Eventos de Carrito

#### 1. `product_added_to_cart`

**Ubicación:** `src/contexts/CartContext.tsx` (línea 83)

**Propiedades:**
```typescript
{
  store_id: string,
  product_id: string,
  product_name: string,
  product_price: number,
  extras_count: number,
  extras_price: number,
  total_price: number,
  category_id: string | null,
  has_extras: boolean,
  quantity: number,
  cart_value: number,           // Valor total del carrito después de agregar
  items_in_cart: number         // Total de items únicos en el carrito
}
```

**Caso de Uso:**
- Trackea cada vez que un usuario agrega un producto al carrito
- Incluye información sobre extras seleccionados
- Permite analizar qué productos son más populares
- Calcula el valor total del carrito en tiempo real

---

#### 2. `product_removed_from_cart`

**Ubicación:** `src/contexts/CartContext.tsx` (línea 122)

**Propiedades:**
```typescript
{
  store_id: string,
  product_id: string,
  product_name: string,
  product_price: number,
  quantity: number,
  extras_count: number,
  extras_price: number,
  total_price: number,
  category_id: string | null
}
```

**Caso de Uso:**
- Identifica productos que usuarios agregan pero luego remueven
- Puede indicar indecisión o problemas con el producto
- Útil para análisis de productos problemáticos

---

#### 3. `cart_viewed`

**Ubicación:** `src/components/cart/CartSheet.tsx` (línea 23)

**Propiedades:**
```typescript
{
  store_id: string,
  items_count: number,          // Número de productos únicos
  total_items: number,          // Cantidad total (suma de quantities)
  cart_value: number,           // Valor total del carrito
  has_items: boolean            // Si hay items o carrito vacío
}
```

**Caso de Uso:**
- Trackea cuando usuario abre el carrito desde el header
- Permite calcular tasa de conversión cart_viewed → checkout
- Identifica usuarios que revisan carrito pero no proceden

---

### Eventos de Checkout

#### 4. `checkout_started`

**Ubicación:** `src/pages/Checkout.tsx` (línea 167)

**Propiedades:**
```typescript
{
  store_id: string,
  items_count: number,
  total_items: number,
  cart_value: number,
  order_type: 'delivery' | 'pickup' | 'digital_menu'
}
```

**Caso de Uso:**
- Marca el inicio del proceso de checkout
- Primer paso del embudo de conversión
- Permite analizar drop-off entre cart y checkout

---

#### 5. `checkout_step_completed`

**Ubicación:** `src/pages/Checkout.tsx` (línea 292)

**Propiedades:**
```typescript
{
  store_id: string,
  step: 1 | 2 | 3,              // Número de paso completado
  order_type: 'delivery' | 'pickup' | 'digital_menu',
  items_count: number,
  cart_value: number
}
```

**Steps:**
- **Step 1:** Información del cliente (nombre, email, teléfono)
- **Step 2:** Información de entrega/pickup/mesa
  - Delivery: dirección, barrio, código postal
  - Pickup: confirmar recoger en tienda
  - Digital Menu: número de mesa
- **Step 3:** Método de pago y notas

**Caso de Uso:**
- Analiza en qué paso del checkout los usuarios abandonan
- Permite optimizar el step más problemático
- Identifica diferencias de conversión por order_type

---

#### 6. `order_placed`

**Ubicación:** `src/pages/ConfirmOrder.tsx` (línea 110)

**Propiedades:**
```typescript
{
  store_id: string,
  order_id: string,             // UUID de la orden
  order_number: number,         // Número de orden secuencial
  order_type: 'delivery' | 'pickup' | 'digital_menu',
  order_total: number,          // Total final (con delivery y cupones)
  items_count: number,          // Número de productos únicos
  total_items: number,          // Cantidad total
  delivery_price: number,       // Costo de delivery (0 si no aplica)
  coupon_discount: number,      // Descuento por cupón (0 si no hay)
  coupon_code: string | null,   // Código del cupón usado
  payment_method: string | null,
  customer_email: string,
  timestamp: number             // Date.now()
}
```

**Caso de Uso:**
- Evento más importante - indica conversión exitosa
- Permite calcular revenue total
- Analiza efectividad de cupones
- Compara performance por payment_method y order_type

---

## Arquitectura Multi-Tenant

### Filtrado por Tienda

**CRÍTICO:** Todos los eventos incluyen `store_id` para permitir filtrado por tienda.

**Cómo filtrar en PostHog:**
```
Property: store_id
Operator: equals
Value: <UUID de la tienda>
```

**Uso común:**
- Tienda específica: `store_id = "abc-123-def"`
- Todas las tiendas: No aplicar filtro
- Comparar tiendas: Usar breakdown por `store_id`

---

## Embudo de Conversión Principal

### Flujo Completo

```
1. product_added_to_cart (100%)
   ↓
2. cart_viewed (?)
   ↓
3. checkout_started (?)
   ↓
4. checkout_step_completed (step=1) (?)
   ↓
5. checkout_step_completed (step=2) (?)
   ↓
6. checkout_step_completed (step=3) (?)
   ↓
7. order_placed (CONVERSIÓN ✓)
```

**Meta Benchmark:**
- Cart → Checkout: 70-80%
- Checkout Started → Order Placed: 60-70%
- Overall (Cart → Order): 50-60%

---

## Métricas Clave del Dashboard

### A. Métricas Generales de Tienda

1. **Visitantes Únicos (por tienda)**
   - Tipo: Unique Users
   - Filtro: `store_id`
   - Breakdown: Por día/semana

2. **Sesiones Totales**
   - Tipo: Total Sessions
   - Filtro: `store_id`

3. **Tasa de Conversión General**
   - Fórmula: `(order_placed / product_added_to_cart) * 100`
   - Meta: >50%

4. **Revenue Total**
   - Suma de: `order_placed.order_total`
   - Filtro: `store_id`
   - Breakdown: Por order_type

---

### B. Análisis de Pedidos

1. **Órdenes por Día/Semana**
   - Evento: `order_placed`
   - Visualización: Line chart
   - Breakdown: order_type

2. **Valor Promedio de Orden (AOV)**
   - Fórmula: `AVG(order_placed.order_total)`
   - Meta: Varía por tienda

3. **Modo de Operación Más Usado**
   - Evento: `order_placed`
   - Property: `order_type`
   - Visualización: Pie chart

4. **Distribución de Órdenes por Hora**
   - Evento: `order_placed`
   - Breakdown: Por hora del día
   - Útil para: Staffing, horarios pico

---

### C. Análisis de Productos

1. **Productos Más Vendidos**
   - Evento: `product_added_to_cart`
   - Group by: `product_name`
   - Filtro: Solo los que resultaron en `order_placed`

2. **Categorías Más Populares**
   - Evento: `product_added_to_cart`
   - Group by: `category_id`
   - Visualización: Bar chart

3. **Productos en Carrito (No Comprados)**
   - Eventos: `product_added_to_cart` pero NO seguido de `order_placed`
   - Útil para: Identificar productos problemáticos

4. **Productos con Extras**
   - Evento: `product_added_to_cart`
   - Filtro: `has_extras = true`
   - Análisis: `extras_price` vs conversión

---

### D. Análisis de Usuarios

1. **Clientes Nuevos vs Recurrentes**
   - User property: First order date
   - Segmentación: Por número de órdenes

2. **Tasa de Retención**
   - Cohort Analysis
   - Evento inicial: `order_placed`
   - Evento retorno: `order_placed` again
   - Ventana: 7, 14, 30 días

3. **Segmentación: Owners vs Customers**
   - User property: `role`
   - Comparar: Comportamiento diferente

4. **Dispositivos Más Usados**
   - Breakdown: `$device_type`
   - Importante: 80%+ tráfico mobile
   - Optimizar experiencia mobile

---

### E. Embudo de Conversión Detallado

**Pasos:**
1. product_added_to_cart
2. cart_viewed
3. checkout_started
4. checkout_step_completed (step=1)
5. checkout_step_completed (step=2)
6. checkout_step_completed (step=3)
7. order_placed

**Conversión por Step:**
- Identificar mayor drop-off
- Breakdown por: order_type, device_type, store_id

**Time to convert:**
- 14 días (permite retargeting)

---

## Insights Recomendados para el Dashboard

### Estado Actual

**Dashboard:** Por implementar
**Insights especificados:** 25+ insights detallados en POSTHOG_IMPLEMENTATION_GUIDE.md

### Cómo Implementar

Sigue la guía paso a paso en:
- **[POSTHOG_IMPLEMENTATION_GUIDE.md](/Users/al3jandro/project/pideai/app/docs/POSTHOG_IMPLEMENTATION_GUIDE.md)**

La guía incluye:
- Configuración exacta de cada insight (eventos, propiedades, breakdowns)
- Queries HogQL listos para copiar/pegar
- Instrucciones para crear funnels de conversión
- Configuración de filtros multi-tenant
- Organización del dashboard por secciones

### Resumen de Insights

**Sección 1: General Store Metrics (4 insights)**
- Total Orders by Store
- Revenue by Store
- Active Users (DAU/WAU/MAU)
- Conversion Rate (Overall)

**Sección 2: Order Analysis (6 insights)**
- Orders by Day/Week
- Average Order Value (AOV)
- Order Type Distribution
- Orders by Hour of Day
- Orders with Coupons
- Revenue by Payment Method

**Sección 3: Product Performance (6 insights)**
- Top 10 Products Added to Cart
- Top Products by Revenue
- Top Categories
- Products with Extras Performance
- Abandoned Cart Products
- Cart Value Distribution

**Sección 4: User Behavior (6 insights)**
- New vs Returning Customers
- Customer Retention Cohorts
- Device Breakdown
- Browser Breakdown
- Customer Role Analysis
- Average Items per Cart

**Sección 5: Conversion Funnel (6 insights)**
- Main Conversion Funnel (7 steps)
- Cart Abandonment Rate
- Checkout Drop-off by Step
- Time to Purchase
- Conversion Rate by Device
- Conversion Rate by Order Type

**Total: 28 insights especificados con configuración completa**

---

## Eventos Pendientes (No Implementados)

### Eventos Faltantes Importantes

#### 1. `product_viewed`

**Ubicación sugerida:** `src/pages/ProductDetail.tsx` o similar

**Propiedades sugeridas:**
```typescript
{
  store_id: string,
  product_id: string,
  product_name: string,
  product_price: number,
  category_id: string | null,
  has_promotion: boolean,
  source: 'catalog' | 'search' | 'category' // De dónde vino
}
```

**Por qué es importante:**
- Analiza qué productos ven pero no agregan al carrito
- Identifica problemas de descripción/precio/imagen
- Mide efectividad de promociones

**Código de ejemplo:**
```typescript
// En el componente de producto
useEffect(() => {
  if (product && store?.id) {
    posthog.capture('product_viewed', {
      store_id: store.id,
      product_id: product.id,
      product_name: product.name,
      product_price: product.price,
      category_id: product.category_id,
      has_promotion: product.is_on_sale || false,
    });
  }
}, [product, store]);
```

---

#### 2. `category_viewed`

**Ubicación sugerida:** `src/components/catalog/CategoriesSection.tsx`

**Propiedades sugeridas:**
```typescript
{
  store_id: string,
  category_id: string,
  category_name: string,
  products_count: number
}
```

**Por qué es importante:**
- Identifica categorías más exploradas
- Optimiza orden de categorías en el menú

---

#### 3. `search_performed`

**Ubicación sugerida:** Componente de búsqueda (si existe)

**Propiedades sugeridas:**
```typescript
{
  store_id: string,
  search_query: string,
  results_count: number,
  has_results: boolean
}
```

---

### Eventos Admin (Owner Analytics)

#### 4. `admin_menu_item_created`

**Ubicación sugerida:** `src/components/admin/MenuItemsManager.tsx`

**Propiedades sugeridas:**
```typescript
{
  store_id: string,
  product_id: string,
  product_name: string,
  category_id: string,
  has_image: boolean,
  has_extras: boolean
}
```

**Por qué es importante:**
- Mide engagement de store owners
- Analiza actividad en admin panel
- Identifica tiendas activas vs inactivas

---

#### 5. `admin_settings_updated`

**Ubicación sugerida:** Tabs de configuración en admin

**Propiedades sugeridas:**
```typescript
{
  store_id: string,
  setting_type: 'business_hours' | 'payment' | 'delivery' | 'orders' | 'advanced',
  changes: object // Snapshot de cambios
}
```

---

#### 6. `admin_order_status_changed`

**Ubicación sugerida:** `src/components/admin/OrdersManager.tsx`

**Propiedades sugeridas:**
```typescript
{
  store_id: string,
  order_id: string,
  old_status: string,
  new_status: string,
  time_to_action: number // Segundos desde que se creó
}
```

**Por qué es importante:**
- Analiza velocidad de respuesta de owners
- Identifica tiendas rápidas vs lentas
- Optimiza workflow de manejo de órdenes

---

## Segmentos Útiles en PostHog

### 1. High-Value Customers
- Filtro: `order_placed.order_total > $X` (definir threshold)
- Uso: Retargeting, loyalty programs

### 2. Cart Abandoners
- Filtro: `product_added_to_cart` pero NO `order_placed` en últimos 7 días
- Uso: Email recovery campaigns

### 3. Mobile Users
- Filtro: `$device_type = 'Mobile'`
- Uso: Optimización mobile-first

### 4. Active Store Owners
- Filtro: `role = 'owner'` AND `admin_*` events en últimos 30 días
- Uso: Feature adoption, soporte proactivo

---

## Dashboards Recomendados

### 1. Executive Overview (para Product Team)
- Total orders, revenue, conversión
- Breakdown por tienda
- Tendencias semana/mes

### 2. Store Owner Dashboard (para cada tienda)
- Filtrado por `store_id` específico
- Órdenes del día, semana, mes
- Productos top, horas pico
- Revenue y AOV

### 3. Conversion Optimization (para Growth Team)
- Embudo completo con drop-offs
- A/B test results (si aplica)
- Device/browser breakdowns
- Session recordings de drop-offs

### 4. Product Analytics (para Product Team)
- Productos más vistos vs comprados
- Efectividad de extras
- Categorías performance
- Promociones impact

---

## Cómo Usar el Dashboard

### Filtrar por Tienda Específica

1. Abrir el dashboard en PostHog
2. Agregar filtro global: `store_id equals <UUID>`
3. Todos los insights se actualizarán automáticamente

**Shortcut:** Crear dashboard template y duplicarlo por tienda

---

### Comparar Tiendas

1. En cualquier insight, agregar breakdown: `store_id`
2. Ver performance relativa
3. Identificar best practices de tiendas top

---

### Analizar por Modo de Operación

1. Filtro: `order_type equals 'delivery'` (o pickup/digital_menu)
2. Comparar conversión entre modos
3. Optimizar el modo con menor conversión

---

### Identificar Problemas de Conversión

1. Ver embudo completo
2. Identificar step con mayor drop-off
3. Ver session recordings de usuarios que abandonan en ese step
4. Implementar mejoras
5. Medir impacto

---

## Benchmarks de Industria

### E-commerce / Food Ordering

- **Cart Abandonment Rate:** 60-80% (normal)
- **Checkout → Order Conversion:** 60-70% (bueno)
- **Overall Conversion (Visit → Order):** 2-5% (promedio)
- **Average Order Value (AOV):** Varía por mercado
- **Mobile vs Desktop Conversion:** Mobile suele ser 50-60% de desktop

### Metas para Menu Maestro

- **Cart → Order:** >50% (actualmente se mide)
- **Checkout Step Completion:** >85% por step
- **Mobile Conversion:** >40% (dado que es mobile-first)
- **Time to Order (Cart → Order):** <10 minutos (median)

---

## Próximos Pasos

### Inmediato (Esta Tarea)
1. ✅ Documentar eventos existentes
2. ⏳ Crear dashboard en PostHog con MCP
3. ⏳ Configurar insights y visualizaciones
4. ⏳ Agregar filtros por tienda

### Corto Plazo (1-2 semanas)
1. Implementar `product_viewed` event
2. Agregar eventos de admin panel
3. Configurar alertas para anomalías
4. Crear dashboard template por tienda

### Mediano Plazo (1 mes)
1. Session recordings para debug
2. Heatmaps en checkout
3. A/B testing con feature flags
4. Cohort analysis profundo

### Largo Plazo (3+ meses)
1. Predictive analytics (usuarios en riesgo de churn)
2. Personalization basada en behavior
3. Automated insights con AI
4. Customer lifetime value (CLTV) tracking

---

## Soporte y Recursos

### PostHog Resources
- **Documentation:** https://posthog.com/docs
- **API Reference:** https://posthog.com/docs/api
- **Community:** https://posthog.com/questions

### Contacto
- **Analytics Lead:** [TBD]
- **Product Team:** [TBD]
- **PostHog Support:** support@posthog.com

---

**Última actualización:** 2025-11-30
**Versión:** 1.0.0
**Autor:** Claude Code (PostHog Agent)
