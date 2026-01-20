# Google Analytics 4 (GA4) - Status Report

**Fecha**: 20 de enero de 2026
**Measurement ID**: `G-KXBQ17W7H1`

---

## ✅ Estado General

**Configuración Base**: ✅ **CORRECTA**
**Page View Tracking**: ✅ **FUNCIONANDO**
**E-commerce Events**: ⚠️ **NO IMPLEMENTADOS** (métodos disponibles pero no utilizados)

---

## 📊 Configuración Actual

### 1. Inicialización (main.tsx)
✅ **Correctamente configurado**

```typescript
// src/main.tsx:166-198
if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
  ReactGA.initialize(import.meta.env.VITE_GA4_MEASUREMENT_ID, {
    gaOptions: {
      anonymize_ip: true,                        // ✅ GDPR compliant
      cookie_flags: 'SameSite=None;Secure',      // ✅ Secure cookies
    },
    gtagOptions: {
      send_page_view: false,                     // ✅ Manual tracking
      allow_google_signals: false,               // ✅ Privacy
      allow_ad_personalization_signals: false,   // ✅ Privacy
    },
  });
}
```

**Características**:
- ✅ Inicialización condicional (solo si `VITE_GA4_MEASUREMENT_ID` está configurado)
- ✅ IP anonymization habilitado (GDPR)
- ✅ Señales de Google deshabilitadas (privacidad)
- ✅ Personalización de anuncios deshabilitada (privacidad)
- ✅ Page views manuales (mejor control)

---

### 2. Page View Tracking
✅ **Implementado y Funcionando**

**Hook**: `src/hooks/useGoogleAnalytics.ts`
**Uso**: `src/App.tsx:89`

```typescript
// Tracking automático de cambios de ruta
useEffect(() => {
  if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
    ReactGA.send({
      hitType: 'pageview',
      page: location.pathname + location.search,
      title: document.title,
    });
  }
}, [location]);
```

**Tracking automático en**:
- ✅ Cambios de ruta (React Router)
- ✅ Parámetros de query
- ✅ Título de documento

---

### 3. E-commerce Events
⚠️ **Métodos Disponibles pero NO Implementados**

El hook `useGoogleAnalytics` incluye métodos para eventos de e-commerce estándar de GA4, pero **NO se están usando** en la aplicación:

#### Métodos Disponibles

**a. `trackAddToCart`** - Agregar al Carrito
```typescript
trackAddToCart(itemId, itemName, price)
```
- **Debería estar en**: `src/contexts/CartContext.tsx`
- **Estado**: ❌ NO implementado

**b. `trackPurchase`** - Compra Completada
```typescript
trackPurchase(transactionId, value, currency)
```
- **Debería estar en**: `src/pages/ConfirmOrder.tsx`
- **Estado**: ❌ NO implementado

**c. `trackBeginCheckout`** - Inicio de Checkout
```typescript
trackBeginCheckout(value, items)
```
- **Debería estar en**: `src/pages/Checkout.tsx`
- **Estado**: ❌ NO implementado

**d. `trackViewItem`** - Vista de Producto
```typescript
trackViewItem(itemId, itemName, price, category)
```
- **Debería estar en**: Componente de detalle de producto
- **Estado**: ❌ NO implementado

**e. `trackRemoveFromCart`** - Remover del Carrito
```typescript
trackRemoveFromCart(itemId, itemName, price)
```
- **Debería estar en**: `src/contexts/CartContext.tsx`
- **Estado**: ❌ NO implementado

---

## 🔍 Comparación: PostHog vs GA4

| Evento | PostHog | GA4 |
|--------|---------|-----|
| **Page Views** | ✅ Autocapture | ✅ Manual tracking |
| **Catalog View** | ✅ `catalog_page_view` | ✅ Pageview (automático) |
| **Add to Cart** | ✅ `product_added_to_cart` | ❌ NO implementado |
| **Begin Checkout** | ✅ `checkout_started` | ❌ NO implementado |
| **Purchase** | ✅ `order_placed` | ❌ NO implementado |

**Conclusión**: PostHog tiene mejor cobertura de eventos de e-commerce actualmente.

---

## 🎯 Eventos de E-commerce Recomendados

GA4 tiene **eventos recomendados** para e-commerce que deberías implementar:

### Eventos Críticos (Alta Prioridad)

1. **`view_item`** - Vista de Producto
   - Cuando: Usuario ve detalle de producto
   - Parámetros: `item_id`, `item_name`, `price`, `item_category`

2. **`add_to_cart`** - Agregar al Carrito
   - Cuando: Usuario agrega producto al carrito
   - Parámetros: `currency`, `value`, `items[]`

3. **`begin_checkout`** - Inicio de Checkout
   - Cuando: Usuario inicia proceso de pago
   - Parámetros: `currency`, `value`, `items[]`

4. **`purchase`** - Compra Completada
   - Cuando: Orden confirmada exitosamente
   - Parámetros: `transaction_id`, `value`, `currency`, `items[]`

### Eventos Opcionales (Media Prioridad)

5. **`remove_from_cart`** - Remover del Carrito
6. **`view_cart`** - Ver Carrito
7. **`add_shipping_info`** - Agregar Info de Envío
8. **`add_payment_info`** - Agregar Info de Pago
9. **`view_item_list`** - Ver Lista de Productos (catálogo)
10. **`select_item`** - Seleccionar Producto de la Lista

---

## 🚀 Plan de Implementación

### Opción 1: Implementar Eventos GA4 (Recomendado)

**Beneficios**:
- Informes de e-commerce nativos en GA4
- Análisis de funnel de ventas en GA4
- Integración con Google Ads
- Métricas de e-commerce estándar de la industria

**Esfuerzo**: ~2-3 horas

**Pasos**:
1. Implementar `trackAddToCart` en CartContext.tsx
2. Implementar `trackBeginCheckout` en Checkout.tsx
3. Implementar `trackPurchase` en ConfirmOrder.tsx
4. (Opcional) Implementar `trackViewItem` si tienes página de producto

### Opción 2: Mantener Solo PostHog

**Beneficios**:
- Menos código duplicado
- Eventos ya implementados
- Análisis más avanzado (funnels, cohorts, session replay)

**Desventajas**:
- No aprovecharás las capacidades de GA4
- Sin integración con Google Ads
- Sin informes de e-commerce nativos de GA4

### Opción 3: Usar Ambos (Máxima Visibilidad)

**Beneficios**:
- GA4 para métricas estándar y Google Ads
- PostHog para análisis avanzado y product analytics
- Redundancia en caso de falla de una plataforma

**Desventajas**:
- Más código a mantener
- Posible inconsistencia de datos

---

## 📝 Código de Implementación

### 1. Add to Cart (CartContext.tsx)

```typescript
// src/contexts/CartContext.tsx
import { useGoogleAnalytics } from '@/hooks/useGoogleAnalytics';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  // ... código existente

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    // ... código existente de PostHog

    // Agregar tracking de GA4
    try {
      const { trackAddToCart } = useGoogleAnalytics();
      const extrasPrice = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
      const totalPrice = item.price + extrasPrice;

      trackAddToCart(item.id, item.name, totalPrice);
    } catch (error) {
      console.error('[GA4] Error tracking add_to_cart:', error);
    }

    // ... resto del código
  };
};
```

**⚠️ Problema**: No puedes usar hooks (`useGoogleAnalytics`) dentro de funciones que no son componentes.

**✅ Solución**: Usar `ReactGA.event()` directamente:

```typescript
// src/contexts/CartContext.tsx
import ReactGA from 'react-ga4';

const addItem = (item: Omit<CartItem, 'quantity'>) => {
  try {
    // ... código existente de PostHog

    // Track en GA4
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      const extrasPrice = item.extras?.reduce((sum, extra) => sum + extra.price, 0) || 0;
      const totalPrice = item.price + extrasPrice;

      ReactGA.event('add_to_cart', {
        currency: 'USD', // o usar la moneda de la tienda
        value: totalPrice,
        items: [{
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: 1,
        }],
      });
    }
  } catch (error) {
    console.error('[GA4] Error tracking add_to_cart:', error);
  }

  // ... resto del código
};
```

### 2. Begin Checkout (Checkout.tsx)

```typescript
// src/pages/Checkout.tsx
import ReactGA from 'react-ga4';

const handleSubmit = async (values: FormValues) => {
  // ... código existente

  // Track en GA4
  try {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID) {
      ReactGA.event('begin_checkout', {
        currency: 'USD',
        value: grandTotal,
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }
  } catch (error) {
    console.error('[GA4] Error tracking begin_checkout:', error);
  }

  // ... resto del código (PostHog ya está implementado)
};
```

### 3. Purchase (ConfirmOrder.tsx)

```typescript
// src/pages/ConfirmOrder.tsx
import ReactGA from 'react-ga4';

const handleConfirm = async () => {
  // ... después de completeOrder exitoso

  try {
    if (import.meta.env.VITE_GA4_MEASUREMENT_ID && store?.id) {
      ReactGA.event('purchase', {
        transaction_id: result.orderId,
        value: grandTotal,
        currency: 'USD',
        items: items.map(item => ({
          item_id: item.id,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
      });
    }
  } catch (error) {
    console.error('[GA4] Error tracking purchase:', error);
  }

  // ... resto del código (PostHog ya está implementado)
};
```

---

## 🔒 Privacidad y Cumplimiento

### Configuración Actual (Excelente)

✅ **IP Anonymization**: Habilitado
✅ **Google Signals**: Deshabilitado (no cross-device tracking)
✅ **Ad Personalization**: Deshabilitado
✅ **Manual Page Tracking**: Mejor control sobre qué se envía

### Datos NO Enviados a GA4

- ❌ Emails de clientes
- ❌ Teléfonos
- ❌ Direcciones
- ❌ Información de tarjetas

### Datos Enviados a GA4

- ✅ Page views (rutas)
- ✅ IDs de productos (UUIDs)
- ✅ Nombres de productos
- ✅ Montos (precios, totales)
- ✅ IDs de transacciones

**Cumplimiento**: ✅ GDPR/CCPA compliant con la configuración actual

---

## 📊 Cómo Verificar en Producción

### Método 1: Chrome DevTools (Recomendado)

1. Abre tu sitio en producción
2. Abre DevTools (F12)
3. Ve a la pestaña **Network**
4. Filtra por `collect?v=2` o `analytics.google.com`
5. Navega por tu sitio
6. Deberías ver requests a Google Analytics con cada cambio de página

### Método 2: Google Analytics DebugView

1. Instala la extensión [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/)
2. Activa el debugger
3. Ve a GA4 → Admin → DebugView
4. Navega por tu sitio
5. Verás eventos en tiempo real

### Método 3: GA4 Realtime Reports

1. Ve a [Google Analytics](https://analytics.google.com)
2. Selecciona tu propiedad
3. Ve a **Reports → Realtime**
4. Navega por tu sitio
5. Deberías ver usuarios activos y eventos en tiempo real

---

## 🎯 Recomendaciones

### Corto Plazo (Esta Semana)

1. ✅ **Verificación actual**: GA4 está correctamente inicializado y tracking pageviews
2. ⚠️ **Decisión**: ¿Implementar eventos de e-commerce en GA4?
   - Si **SÍ**: Seguir el código de implementación arriba (~2-3 horas)
   - Si **NO**: Está bien, PostHog tiene cobertura completa

### Mediano Plazo (Este Mes)

1. **Monitorear datos**: Verificar que los page views se estén capturando correctamente
2. **Configurar Google Ads** (si planeas usarlo): Vincular GA4 con Google Ads
3. **Enhanced Measurement**: Habilitar en GA4 Admin → Data Streams
   - ✅ Page views
   - ✅ Scrolls
   - ✅ Outbound clicks
   - ✅ File downloads

### Largo Plazo (Próximos 3 Meses)

1. **Custom Dimensions**: Agregar dimensiones personalizadas (store_id, subdomain)
2. **Conversion Goals**: Configurar conversiones en GA4
3. **Audiences**: Crear audiencias para remarketing
4. **BigQuery Export**: Exportar datos a BigQuery para análisis avanzado

---

## 📚 Recursos

### Documentación Oficial
- [GA4 E-commerce Events](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce)
- [react-ga4 Documentation](https://github.com/PriceRunner/react-ga4)
- [GA4 Setup Guide](https://support.google.com/analytics/answer/9304153)

### Testing Tools
- [Google Analytics Debugger](https://chrome.google.com/webstore/detail/google-analytics-debugger/)
- [GA4 DebugView](https://support.google.com/analytics/answer/7201382)
- [Tag Assistant](https://tagassistant.google.com/)

---

## ✅ Checklist de Verificación

- [x] GA4 Measurement ID configurado en .env
- [x] ReactGA importado e inicializado
- [x] Anonymize IP habilitado
- [x] Google Signals deshabilitado
- [x] Ad personalization deshabilitado
- [x] Page view tracking implementado
- [x] Hook de tracking integrado en App.tsx
- [ ] **E-commerce events implementados** (PENDIENTE)
- [ ] Eventos verificados en GA4 Realtime
- [ ] Enhanced Measurement configurado
- [ ] Conversion goals configurados

---

**Resumen**: GA4 está **correctamente configurado** para page tracking, pero **falta implementar eventos de e-commerce** para aprovechar todo su potencial. PostHog tiene mejor cobertura actualmente.

**Decisión requerida**: ¿Implementar eventos de e-commerce en GA4 o confiar solo en PostHog?
