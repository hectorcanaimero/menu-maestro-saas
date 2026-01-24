# Guía de Implementación de Dashboards PostHog

Esta guía paso a paso te ayudará a implementar todos los dashboards de PostHog para PideAI.

## Estado Actual

✅ **Completado:**
- Especificación completa de dashboards (DANILO_POSTHOG_DASHBOARDS.md)
- Documentación de eventos a trackear (events-to-track.md)
- Queries detalladas para Dashboard #1 - Platform Overview
- Estructura de directorios y archivos de configuración

🔄 **En Progreso:**
- Implementación de tracking de eventos en el código
- Creación de dashboards en PostHog

⏳ **Pendiente:**
- Queries para Dashboards #2-9
- Configuración de alertas
- Configuración de exports automáticos

---

## Fase 1: Preparación (Antes de crear dashboards)

### 1.1 Verificar Configuración de PostHog

```bash
# Verifica que PostHog esté correctamente configurado
# src/main.tsx debe tener:

import posthog from 'posthog-js';

posthog.init('YOUR_API_KEY', {
  api_host: 'https://app.posthog.com',
  autocapture: true,
  capture_pageview: true
});
```

### 1.2 Implementar Eventos Críticos

**Prioridad ALTA - Implementar primero:**

1. **order_created** - Archivo: `src/pages/Checkout.tsx`
2. **order_confirmed** - Archivo: `src/components/admin/OrdersManager.tsx`
3. **order_delivered** - Archivo: `src/components/admin/OrdersManager.tsx`
4. **order_cancelled** - Archivo: `src/components/admin/OrdersManager.tsx`
5. **payment_completed** - Archivo: `src/pages/ConfirmOrder.tsx`

**Prioridad MEDIA:**

6. **product_viewed** - Archivo: `src/pages/ProductDetail.tsx`
7. **product_added_to_cart** - Archivo: `src/contexts/CartContext.tsx`
8. **user_signup** - Archivo: `src/pages/Auth.tsx`
9. **store_created** - Archivo: `src/pages/CreateStore.tsx`

**Prioridad BAJA (pueden esperar):**

10. **whatsapp_message_sent**
11. **delivery_assigned**
12. **trial_started**

### 1.3 Crear Hook de Tracking

Crea `src/hooks/usePostHogTracking.ts`:

```typescript
import { useCallback } from 'react';
import posthog from 'posthog-js';
import { useStore } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';

export function usePostHogTracking() {
  const { store } = useStore();
  const { user } = useAuth();

  const track = useCallback((
    eventName: string,
    properties: Record<string, any> = {}
  ) => {
    // Agregar properties comunes automáticamente
    const enrichedProperties = {
      ...properties,
      store_id: store?.id,
      store_name: store?.name,
      store_subdomain: store?.subdomain,
      user_id: user?.id,
      timestamp: new Date().toISOString(),
    };

    // Remover undefined values
    Object.keys(enrichedProperties).forEach(key => {
      if (enrichedProperties[key] === undefined) {
        delete enrichedProperties[key];
      }
    });

    posthog.capture(eventName, enrichedProperties);
  }, [store, user]);

  return { track };
}
```

### 1.4 Ejemplo de Uso del Hook

```typescript
// En cualquier componente:
import { usePostHogTracking } from '@/hooks/usePostHogTracking';

function Checkout() {
  const { track } = usePostHogTracking();

  const handleCreateOrder = async (orderData) => {
    const order = await createOrder(orderData);

    track('order_created', {
      order_id: order.id,
      order_type: orderData.type,
      total_amount: orderData.total,
      items_count: orderData.items.length,
      payment_method: orderData.payment_method,
    });
  };

  return (
    // ... tu componente
  );
}
```

---

## Fase 2: Verificación de Eventos (1-2 días)

### 2.1 Testing Local

1. Abre tu app en development
2. Abre PostHog Toolbar (botón en esquina inferior derecha)
3. Realiza acciones que deberían trackear eventos:
   - Crea un pedido
   - Agrega productos al carrito
   - Navega entre páginas
4. Verifica en PostHog Toolbar → Events que los eventos aparezcan

### 2.2 Verificación en PostHog

1. Ve a PostHog → Events
2. Filtra por evento específico (ej: `order_created`)
3. Verifica:
   - ✅ El evento aparece
   - ✅ Tiene todas las properties esperadas
   - ✅ Las properties tienen los tipos correctos
   - ✅ No hay errores en los values

### 2.3 Checklist de Eventos

Marca cada evento cuando esté verificado:

```
Core Events:
[ ] order_created
[ ] order_confirmed
[ ] order_preparing
[ ] order_out_for_delivery
[ ] order_delivered
[ ] order_cancelled
[ ] payment_completed
[ ] payment_failed

Product Events:
[ ] product_viewed
[ ] product_added_to_cart
[ ] product_removed_from_cart
[ ] category_viewed
[ ] product_search

User Events:
[ ] user_signup
[ ] first_order
[ ] repeat_order

Subscription Events:
[ ] subscription_created
[ ] subscription_upgraded
[ ] trial_started
[ ] trial_converted

Store Events:
[ ] store_created
[ ] onboarding_completed
```

---

## Fase 3: Creación de Dashboards (3-5 días)

### 3.1 Dashboard #1: Platform Overview (PRIORIDAD 1)

**Tiempo estimado:** 2-3 horas

1. Ve a PostHog → Dashboards → New Dashboard
2. Nombre: "Platform Overview"
3. Descripción: "Vista general de la plataforma completa"
4. Sigue las instrucciones en: `dashboard-queries/01-platform-overview-queries.md`

**Insights a crear:**
- Total Tiendas Activas (Big Number)
- Total Pedidos Hoy (Line Chart)
- GMV Total (Big Number + Trend)
- Usuarios Activos (Big Number)
- Tasa de Conversión (Funnel)
- Pedidos por Estado (Pie Chart)
- Crecimiento de Tiendas (Bar Chart)
- Top 10 Tiendas (Table)
- Mapa de Calor Horas Pico (Heatmap)
- Tasa de Retención (Retention)

**Verificación:**
```
[ ] Todos los insights muestran datos
[ ] Los números parecen correctos
[ ] Los filtros globales funcionan
[ ] El layout es claro y legible
[ ] Se puede exportar a PDF
```

### 3.2 Dashboard #2: Análisis de Tiendas (PRIORIDAD 1)

**Tiempo estimado:** 2 horas

Ver especificaciones en DANILO_POSTHOG_DASHBOARDS.md sección 2.

**Insights principales:**
- Tabla de todas las tiendas con KPIs
- Distribución por plan
- Tendencia de adopción de módulos
- Análisis de churn

### 3.3 Dashboard #3: Deep Dive de Pedidos (PRIORIDAD 1)

**Tiempo estimado:** 3 horas

**Insights principales:**
- Funnel de estados de pedido
- Serie temporal por hora del día
- Distribución geográfica
- Análisis de cancelaciones
- Tiempo promedio por estado

### 3.4 Dashboards #4-6 (PRIORIDAD 2)

**Tiempo estimado:** 1-2 horas cada uno

- Dashboard #4: Productos y Catálogo
- Dashboard #5: Clientes y Lifecycle
- Dashboard #6: Suscripciones y Revenue (MRR, ARR, Churn)

### 3.5 Dashboards #7-9 (PRIORIDAD 3)

**Tiempo estimado:** 1 hora cada uno

- Dashboard #7: Módulos y Features
- Dashboard #8: Performance Técnico
- Dashboard #9: Marketing y Adquisición

---

## Fase 4: Configuración Avanzada (1 día)

### 4.1 Alertas

Crea alertas para métricas críticas:

```javascript
// En PostHog → Alerts → New Alert

Alert 1: "Caída significativa en pedidos"
Insight: Total Pedidos Hoy
Condition: Decreases by more than 30%
Comparison: Same hour yesterday
Notification: Slack #alerts + Email

Alert 2: "Tasa de conversión baja"
Insight: Funnel de Conversión
Condition: Overall conversion < 3%
Notification: Email

Alert 3: "Churn rate alto"
Insight: Subscription Churn Rate
Condition: Exceeds 12%
Notification: Slack #management + Email

Alert 4: "Error rate alto"
Insight: API Errors
Condition: Exceeds 100 errors in 1 hour
Notification: Slack #engineering

Alert 5: "Pago fallido"
Insight: Payment Failed Count
Condition: More than 5 in 1 hour
Notification: Slack #payments
```

### 4.2 Exports Automáticos

```javascript
// PostHog → Dashboard → Settings → Scheduled Exports

Export 1: Weekly Summary
Dashboard: Platform Overview
Schedule: Every Monday at 9:00 AM
Recipients: management@pideai.com
Format: PDF
Include: All insights

Export 2: Monthly MRR Report
Dashboard: Subscriptions & Revenue
Schedule: First day of month at 10:00 AM
Recipients: finance@pideai.com
Format: CSV
Include: MRR, ARR, Churn Rate

Export 3: Top Stores Report
Dashboard: Stores Analysis
Schedule: Every Friday at 5:00 PM
Recipients: sales@pideai.com
Format: PDF
Include: Top 20 stores table
```

### 4.3 Permisos y Sharing

```javascript
// PostHog → Dashboard → Share

Public Access: Off
Team Access:
  - Engineering: Edit
  - Management: View + Comment
  - Sales: View only
  - Finance: View only (specific dashboards)

Shared Links:
  - Create shareable link for investors
  - Set expiration: 30 days
  - Password protect: Yes
```

---

## Fase 5: Optimización y Mantenimiento

### 5.1 Performance Optimization

1. **Usar Sampling para Queries Pesadas**
```
Para dashboards con > 1M events:
- Enable sampling al 10%
- Solo para visualizaciones, no para números exactos
```

2. **Cache Strategy**
```
Insights en tiempo real: Cache 5 minutos
Insights históricos: Cache 1 hora
Exports: Cache 24 horas
```

3. **Date Range Defaults**
```
Real-time dashboards: Last 24 hours
Weekly reviews: Last 7 days
Monthly reviews: Last 30 days
Historical analysis: Custom range
```

### 5.2 Mantenimiento Semanal

**Checklist semanal:**
```
[ ] Revisar que todos los dashboards cargan correctamente
[ ] Verificar que los números sean lógicos
[ ] Revisar alertas disparadas
[ ] Actualizar queries si es necesario
[ ] Revisar feedback del equipo
```

### 5.3 Mantenimiento Mensual

**Checklist mensual:**
```
[ ] Analizar performance de queries
[ ] Revisar eventos obsoletos
[ ] Actualizar documentación
[ ] Capacitar a nuevos team members
[ ] Review de KPIs con stakeholders
```

---

## Troubleshooting Común

### Problema: Eventos no aparecen en PostHog

**Solución:**
1. Verifica la consola del navegador por errores
2. Chequea que PostHog esté inicializado antes de llamar `capture()`
3. Verifica la API key
4. Revisa que no haya bloqueadores de ads
5. Usa PostHog Toolbar para debug

### Problema: Números no coinciden con Supabase

**Solución:**
1. Revisa la zona horaria (PostHog usa UTC por default)
2. Verifica los filtros aplicados
3. Chequea que no haya duplicación de eventos
4. Compara timestamps exactos

### Problema: Dashboard muy lento

**Solución:**
1. Reduce el date range
2. Habilita sampling
3. Usa breakdown solo cuando sea necesario
4. Considera crear insights pre-calculados

### Problema: Funnel con drop-off inesperado

**Solución:**
1. Verifica que todos los pasos del funnel estén trackeándose
2. Revisa el tiempo de ventana (window) del funnel
3. Chequea que el orden de eventos sea correcto
4. Usa PostHog Session Recordings para ver user behavior

---

## Recursos y Soporte

### Documentación
- [PostHog Docs](https://posthog.com/docs)
- [Dashboard Best Practices](https://posthog.com/docs/user-guides/dashboards)
- [Funnel Analysis Guide](https://posthog.com/docs/user-guides/funnels)

### Archivos de Referencia
- `DANILO_POSTHOG_DASHBOARDS.md` - Especificaciones completas
- `events-to-track.md` - Lista de todos los eventos
- `dashboard-queries/` - Queries específicas por dashboard

### Soporte
- Slack: #analytics
- Email: tech@pideai.com
- PostHog Community: posthog.com/questions

---

## Checklist Final

Antes de considerar la implementación completa:

```
Tracking:
[ ] Todos los eventos críticos implementados
[ ] Eventos verificados en PostHog
[ ] Hook usePostHogTracking creado
[ ] Tests de tracking pasando

Dashboards - Fase 1:
[ ] Platform Overview creado
[ ] Stores Analysis creado
[ ] Orders Deep Dive creado

Dashboards - Fase 2:
[ ] Subscriptions & Revenue creado
[ ] Customers Lifecycle creado

Dashboards - Fase 3:
[ ] Products & Catalog creado
[ ] Modules & Features creado
[ ] Technical Performance creado
[ ] Marketing & Acquisition creado

Configuración:
[ ] Alertas configuradas
[ ] Exports automáticos configurados
[ ] Permisos configurados
[ ] Team members invitados

Documentación:
[ ] README actualizado
[ ] Queries documentadas
[ ] Guía de uso creada
[ ] Training session realizada

Mantenimiento:
[ ] Schedule de reviews definido
[ ] Responsables asignados
[ ] Proceso de actualización documentado
```

---

## Próximos Pasos

1. **Esta Semana:**
   - Implementar eventos críticos (order_created, payment_completed, etc.)
   - Crear Dashboard #1: Platform Overview
   - Verificar que los datos sean correctos

2. **Próxima Semana:**
   - Crear Dashboards #2 y #3
   - Configurar primeras alertas
   - Training session con el equipo

3. **Este Mes:**
   - Completar todos los 9 dashboards
   - Configurar todos los exports
   - Optimizar performance
   - Primera revisión mensual con stakeholders

¡Buena suerte con la implementación! 🚀
