# Dashboard 1: Platform Overview - Queries de PostHog

Este archivo contiene las queries específicas para crear cada insight del Dashboard de Vista General de Plataforma.

## Insight 1: Total de Tiendas Activas

**Tipo**: Number (Big Number)
**Descripción**: Muestra el número total de tiendas con al menos 1 pedido en los últimos 30 días

### Configuración PostHog:

```
Serie: Unique stores
Event: order_created
Math: Unique values
Property to aggregate: store_id
Filters: None
Date range: Last 30 days
```

### Query SQL equivalente (para referencia):
```sql
SELECT COUNT(DISTINCT store_id)
FROM orders
WHERE created_at >= NOW() - INTERVAL '30 days'
```

---

## Insight 2: Total de Pedidos Hoy

**Tipo**: Trend Line
**Descripción**: Serie temporal de pedidos por día

### Configuración PostHog:

```
Series:
  - Event: order_created
  - Math: Total count

Display: Line chart
Interval: Day
Date range: Last 30 days
```

### Breakdown (opcional):
```
Property: order_status
Values: pending, confirmed, delivered, cancelled
```

---

## Insight 3: Ingresos Totales (GMV)

**Tipo**: Number con trend
**Descripción**: Gross Merchandise Value total procesado

### Configuración PostHog:

```
Event: payment_completed
Math: Sum
Property to sum: amount
Display: Big number with comparison
Compare to: Previous period
Date range: Last 30 days
```

---

## Insight 4: Usuarios Activos (Clientes Únicos)

**Tipo**: Number
**Descripción**: Clientes únicos que hicieron pedidos

### Configuración PostHog:

```
Event: order_created
Math: Unique values
Property: customer_id
Date range: Last 30 days
```

---

## Insight 5: Tasa de Conversión Global

**Tipo**: Funnel
**Descripción**: % de visitantes que completan un pedido

### Configuración PostHog:

```
Funnel Steps:
  1. $pageview (any page)
  2. product_added_to_cart
  3. Event: checkout (o page con /checkout en URL)
  4. order_created

Display: Funnel visualization
Breakdown: By store_subdomain (opcional)
```

---

## Insight 6: Pedidos por Estado

**Tipo**: Pie Chart
**Descripción**: Distribución de pedidos según su estado actual

### Configuración PostHog:

```
Events to track:
  - order_created (pendiente)
  - order_confirmed (confirmado)
  - order_preparing (en preparación)
  - order_out_for_delivery (enviado)
  - order_delivered (entregado)
  - order_cancelled (cancelado)

Display: Pie chart
Date range: Last 7 days
```

### Alternative (usando properties):
```
Event: order_created
Breakdown: order_status
Math: Total count
```

---

## Insight 7: Crecimiento de Tiendas

**Tipo**: Bar Chart
**Descripción**: Nuevas tiendas por mes

### Configuración PostHog:

```
Event: store_created
Math: Total count
Interval: Month
Date range: Last 12 months
Display: Bar chart
```

---

## Insight 8: Top 10 Tiendas por Volumen

**Tipo**: Table
**Descripción**: Tabla de tiendas con más pedidos

### Configuración PostHog:

```
Event: order_created
Math: Total count
Breakdown: store_name
Show: Top 10
Sort: Descending
Columns:
  - Store Name
  - Total Orders
  - Total Revenue (sum of total_amount)
  - Avg Order Value (average of total_amount)
```

---

## Insight 9: Mapa de Calor - Horas Pico

**Tipo**: Heatmap
**Descripción**: Pedidos por hora del día y día de la semana

### Configuración PostHog:

```
Event: order_created
X-axis: Hour of day (0-23)
Y-axis: Day of week
Color intensity: Count of events
Date range: Last 30 days
```

### En PostHog (alternative con table):
```
Event: order_created
Breakdown:
  - Primary: Day of week (timestamp property)
  - Secondary: Hour of day (timestamp property)
Display: Table with color coding
```

---

## Insight 10: Tasa de Retención de Clientes

**Tipo**: Retention
**Descripción**: % de clientes que regresan a hacer pedidos

### Configuración PostHog:

```
Cohort: Users who did first_order
Return action: repeat_order
Retention interval: Week
Display: Retention table
Date range: Last 12 weeks
```

---

## Dashboard Configuration (Global)

### Filters Globales:

```json
{
  "date_range": {
    "default": "Last 30 days",
    "options": ["Last 7 days", "Last 30 days", "Last 90 days", "Custom"]
  },
  "store_filter": {
    "property": "store_id",
    "type": "multi-select",
    "label": "Filtrar por Tienda"
  },
  "plan_filter": {
    "property": "subscription_plan",
    "type": "select",
    "options": ["all", "trial", "starter", "professional", "enterprise"]
  }
}
```

### Layout Sugerido:

```
Row 1 (Big Numbers):
├── Total Tiendas Activas
├── Pedidos Hoy
├── GMV Total
└── Usuarios Activos

Row 2 (Main Charts):
├── Pedidos por Día (70% width)
└── Pedidos por Estado (30% width)

Row 3 (Analysis):
├── Funnel de Conversión (50%)
└── Crecimiento de Tiendas (50%)

Row 4 (Deep Dive):
├── Top 10 Tiendas (60%)
└── Mapa de Calor Horas Pico (40%)

Row 5 (Retention):
└── Tasa de Retención (100%)
```

---

## Ejemplo de Implementación en PostHog

### Paso 1: Crear el Dashboard

1. Ve a PostHog → Dashboards
2. Click "New Dashboard"
3. Nombre: "Platform Overview"
4. Descripción: "Vista general de toda la plataforma PideAI"

### Paso 2: Agregar Insights

Para cada insight mencionado arriba:

1. Click "+ Add insight"
2. Selecciona el tipo (Trends, Funnel, etc.)
3. Configura según las especificaciones
4. Click "Save & add to dashboard"

### Paso 3: Organizar Layout

1. Arrastra los insights para organizarlos según el layout sugerido
2. Ajusta el tamaño de cada insight (resize handles)
3. Agrupa insights relacionados visualmente

### Paso 4: Configurar Filtros

1. Click "Dashboard settings" (⚙️)
2. Add global filters:
   - Date range selector
   - Store filter
   - Plan filter
3. Save settings

---

## Tips de Optimización

### Performance:

- Usa cache cuando sea posible
- Limita el date range para queries pesadas
- Usa sampling para grandes volúmenes de datos

### Visualización:

- Usa colores consistentes:
  - Verde: Métricas positivas (entregas, conversiones)
  - Rojo: Métricas negativas (cancelaciones, errores)
  - Azul: Métricas neutrales (totales, promedios)

### Actualización:

- Configura refresh automático cada 5 minutos para métricas en tiempo real
- Usa refresh manual para métricas históricas

---

## Alertas Recomendadas

Configura estas alertas basadas en este dashboard:

```javascript
// Alert 1: Caída en pedidos
{
  insight: "Total Pedidos Hoy",
  condition: "Decreases by more than 20%",
  comparison: "Same hour yesterday",
  notification: "Slack + Email"
}

// Alert 2: Tasa de conversión baja
{
  insight: "Funnel de Conversión",
  condition: "Overall conversion < 5%",
  notification: "Email"
}

// Alert 3: Ninguna tienda nueva
{
  insight: "Crecimiento de Tiendas",
  condition: "No new stores in 7 days",
  notification: "Slack"
}
```

---

## Exports Automáticos

Configura exports semanales:

```json
{
  "schedule": "Every Monday at 9:00 AM",
  "recipients": ["team@pideai.com"],
  "format": "PDF",
  "include": [
    "Total Tiendas Activas",
    "GMV Total",
    "Top 10 Tiendas",
    "Tasa de Retención"
  ]
}
```

---

## Notas de Implementación

### Datos Faltantes:

Si un evento no existe aún:
1. Implementa el tracking (ver events-to-track.md)
2. Usa datos de prueba para testear el insight
3. Marca el insight como "En desarrollo"

### Testing:

Antes de marcar el dashboard como completo:
1. Verifica que todos los números sean lógicos
2. Compara con datos de Supabase directamente
3. Prueba todos los filtros
4. Revisa el performance con date ranges grandes

### Mantenimiento:

- Revisa el dashboard semanalmente
- Actualiza queries si cambia la estructura de eventos
- Ajusta rangos de fechas según necesidades del negocio
