# Revisión del Módulo de Analytics y Plan de Integración

**Fecha:** 2025-12-06
**Estado:** En Revisión

## 📊 Resumen Ejecutivo

El módulo de Analytics está **funcionalmente implementado** con los siguientes componentes:
- Dashboard completo con métricas clave
- Gráficos de líneas (ingresos diarios) y barras (pedidos diarios)
- Top 10 productos más vendidos
- Estadísticas de clientes
- Lista de órdenes del período
- Exportación a CSV y PDF

## ✅ Componentes Verificados

### 1. **Página Principal** - `AdminAnalytics.tsx`
- ✅ Correctamente registrada en rutas (`/admin/analytics`)
- ✅ Usa AdminLayout
- ✅ Renderiza AnalyticsDashboard

### 2. **Dashboard** - `AnalyticsDashboard.tsx`
- ✅ Sistema de filtros completo:
  - Rangos de fechas (7d, 30d, 90d, personalizado)
  - Estado de orden
  - Método de pago
- ✅ 6 tarjetas de métricas:
  - Ingresos Totales (con trend)
  - Total de Pedidos (con trend)
  - Valor Promedio (con trend)
  - Clientes
  - Productos Vendidos (con trend)
  - Promedio Diario (con trend)
- ✅ Gráficos de Recharts
- ✅ Top 10 productos con imágenes
- ✅ Estadísticas de órdenes (completadas, pendientes, canceladas)
- ✅ Lista expandible de órdenes
- ✅ Exportación múltiple:
  - Resumen CSV
  - Órdenes CSV
  - Órdenes PDF

### 3. **Gráficos** - `AnalyticsCharts.tsx`
- ✅ Gráfico de líneas para ingresos diarios
- ✅ Gráfico de barras para pedidos diarios
- ✅ Tooltips personalizados
- ✅ Responsive design

### 4. **Hook de Datos** - `useAnalytics.ts`
- ✅ Query de métricas de ventas
- ✅ Query de datos de gráficos (daily aggregation)
- ✅ Query de top productos
- ✅ Query de estadísticas de clientes
- ✅ Query de lista de órdenes
- ✅ Query de período anterior para comparación
- ✅ Cálculo de trends (cambio porcentual)

## ⚠️ Problemas Identificados

### 1. **CRÍTICO - Consulta de Clientes Sin Filtro de Tienda**
**Archivo:** `src/hooks/useAnalytics.ts` (líneas 234-236)

```typescript
const { data: customers, error } = await supabase
  .from('customers')
  .select('id, created_at');
  // ❌ FALTA: .eq('store_id', store.id)
```

**Impacto:**
- Muestra clientes de TODAS las tiendas en el sistema
- Violación de seguridad multi-tenant
- Datos incorrectos en métricas de clientes

**Solución:**
```typescript
const { data: customers, error } = await supabase
  .from('customers')
  .select('id, created_at')
  .eq('store_id', store.id); // ✅ Filtrar por tienda
```

### 2. **MEDIO - Estados de Orden Desactualizados**
**Archivo:** `src/hooks/useAnalytics.ts` (líneas 57-59, 128)

El código usa el estado `'completed'` pero según el sistema de órdenes, el estado correcto es `'delivered'`.

**Evidencia:**
- En `OrderCard.tsx` y `OrdersManager.tsx` los estados son: pending, confirmed, preparing, ready, **delivered**, cancelled
- En analytics se usa: **completed** ❌

**Impacto:**
- Métricas de ingresos siempre en $0 (solo cuenta completed)
- Top productos vacío (solo cuenta completed)

**Solución:**
Reemplazar todas las referencias de `'completed'` con `'delivered'`:
```typescript
// Línea 57
const completedOrders = orders?.filter((o) => o.status === 'delivered').length || 0;

// Línea 128
const revenue = order.status === 'delivered' ? Number(order.total_amount) : 0;

// Líneas 174-175
if (!status || status === 'all' || status === 'delivered') {
  query = query.eq('status', 'delivered');
```

### 3. **BAJO - Formateo de Moneda Inconsistente**
**Archivo:** `src/components/admin/AnalyticsDashboard.tsx`

Algunos lugares usan `formatCurrency(value, store?.currency)` y otros solo `formatCurrency(value)`.

**Solución:**
Asegurar que TODAS las llamadas incluyan la moneda de la tienda.

### 4. **BAJO - Tabla de Clientes No Filtra por Tienda**
**Base de datos:** Tabla `customers`

Si la tabla `customers` no tiene un campo `store_id`, necesitamos obtener los clientes únicos a través de las órdenes.

**Solución alternativa:**
```typescript
// Obtener clientes únicos de las órdenes
const { data: orders, error } = await supabase
  .from('orders')
  .select('customer_email, created_at')
  .eq('store_id', store.id);

const uniqueCustomers = new Set(orders?.map(o => o.customer_email));
const totalCustomers = uniqueCustomers.size;
```

## 📋 Plan de Acción

### Fase 1: Correcciones Críticas (Alta Prioridad)
**Estimado:** 30 minutos

1. **Corregir filtro de clientes por tienda**
   - Modificar consulta en `useAnalytics.ts`
   - Verificar si tabla `customers` tiene `store_id`
   - Si no tiene, usar método alternativo basado en órdenes

2. **Cambiar estado 'completed' a 'delivered'**
   - Buscar y reemplazar en `useAnalytics.ts`
   - Actualizar todas las referencias (6 ocurrencias)

3. **Probar métricas en navegador**
   - Verificar que los ingresos se calculan correctamente
   - Verificar que los top productos aparecen
   - Verificar conteo de clientes

### Fase 2: Mejoras de UX (Media Prioridad)
**Estimado:** 20 minutos

1. **Estandarizar formateo de moneda**
   - Revisar todas las llamadas a `formatCurrency`
   - Asegurar que todas incluyen `store?.currency`

2. **Agregar estados de carga**
   - Verificar que los skeletons se muestran correctamente
   - Agregar mensajes de "Sin datos" más descriptivos

3. **Mejorar tooltips de gráficos**
   - Agregar más contexto (día de la semana, etc.)
   - Formato consistente

### Fase 3: Optimizaciones (Baja Prioridad)
**Estimado:** 30 minutos

1. **Caché de queries**
   - Revisar configuración de React Query
   - Agregar staleTime apropiado para cada query

2. **Lazy loading de gráficos**
   - Considerar cargar gráficos bajo demanda
   - Mejorar performance en móviles

3. **Tests**
   - Agregar tests unitarios para cálculos
   - Tests de integración para queries

## 🔧 Archivos que Requieren Modificación

### Críticos
1. `src/hooks/useAnalytics.ts` - Líneas 57-59, 128, 174-175, 234-236, 317-319

### Opcionales
1. `src/components/admin/AnalyticsDashboard.tsx` - Verificar formatCurrency
2. `src/lib/analytics.ts` - Revisar utilidades

## ✅ Criterios de Éxito

- [ ] Métricas de ingresos muestran valores > $0 cuando hay órdenes entregadas
- [ ] Top productos muestra datos cuando hay ventas
- [ ] Clientes únicos se calculan solo de la tienda actual
- [ ] Trends muestran cambios porcentuales correctos
- [ ] Gráficos renderizan sin errores en consola
- [ ] Exportaciones CSV/PDF contienen datos correctos
- [ ] Filtros funcionan correctamente
- [ ] UI responsive en móvil y desktop

## 📝 Notas Adicionales

### Dependencias
- `recharts` - Instalado ✅
- `date-fns` - Instalado ✅
- `@tanstack/react-query` - Instalado ✅
- `jspdf`, `jspdf-autotable` - Para exportación PDF ✅

### Consideraciones de Seguridad
- ✅ Todas las queries filtran por `store_id`
- ⚠️ Falta filtro en query de customers
- ✅ RLS policies deberían prevenir acceso cross-tenant

### Performance
- Queries están bien optimizadas con índices apropiados
- React Query cachea resultados
- Agregaciones se hacen en cliente (considerar mover a servidor para grandes volúmenes)

## 🚀 Próximos Pasos

1. Revisar y aprobar este plan
2. Ejecutar Fase 1 (correcciones críticas)
3. Probar en navegador con datos reales
4. Ejecutar Fase 2 si es necesario
5. Documentar cualquier hallazgo adicional
