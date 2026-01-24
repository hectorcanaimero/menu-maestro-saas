# Eventos de PostHog - Especificación Completa

Esta es la lista completa de eventos que deben ser trackeados en la aplicación PideAI para alimentar los dashboards de análisis.

## Formato de Implementación

```javascript
// Ejemplo de cómo trackear un evento
posthog.capture('event_name', {
  // Properties del evento
  property_name: value,
  // ... más properties
});
```

---

## 1. Eventos de Pedidos (Orders)

### `order_created`
**Cuándo**: Cuando un cliente crea un nuevo pedido

```javascript
posthog.capture('order_created', {
  order_id: string,           // UUID del pedido
  store_id: string,           // UUID de la tienda
  store_name: string,         // Nombre de la tienda
  store_subdomain: string,    // Subdominio
  order_type: string,         // 'delivery' | 'pickup'
  total_amount: number,       // Monto total en USD
  items_count: number,        // Cantidad de items
  has_extras: boolean,        // Si tiene productos con extras
  payment_method: string,     // 'cash' | 'card' | 'transfer'
  delivery_zone: string,      // Zona de delivery (si aplica)
  customer_id: string,        // UUID del cliente
  customer_type: string,      // 'new' | 'returning'
  timestamp: string           // ISO 8601
});
```

### `order_confirmed`
**Cuándo**: Cuando la tienda confirma el pedido

```javascript
posthog.capture('order_confirmed', {
  order_id: string,
  store_id: string,
  confirmed_by: string,       // UUID del usuario que confirmó
  time_to_confirm: number,    // Segundos desde creación
  timestamp: string
});
```

### `order_preparing`
**Cuándo**: Cuando el pedido pasa a estado "en preparación"

```javascript
posthog.capture('order_preparing', {
  order_id: string,
  store_id: string,
  estimated_prep_time: number, // Minutos estimados
  timestamp: string
});
```

### `order_out_for_delivery`
**Cuándo**: Cuando el pedido sale para entrega

```javascript
posthog.capture('order_out_for_delivery', {
  order_id: string,
  store_id: string,
  driver_id: string,          // UUID del motorista (si aplica)
  estimated_delivery_time: number, // Minutos estimados
  timestamp: string
});
```

### `order_delivered`
**Cuándo**: Cuando el pedido es entregado/completado

```javascript
posthog.capture('order_delivered', {
  order_id: string,
  store_id: string,
  total_time: number,         // Minutos desde creación hasta entrega
  delivery_time: number,      // Minutos desde salida hasta entrega
  rating: number,             // 1-5 (si aplica)
  has_photo: boolean,         // Si tiene foto de entrega
  has_signature: boolean,     // Si tiene firma
  timestamp: string
});
```

### `order_cancelled`
**Cuándo**: Cuando un pedido es cancelado

```javascript
posthog.capture('order_cancelled', {
  order_id: string,
  store_id: string,
  cancelled_by: string,       // 'customer' | 'store' | 'system'
  cancellation_reason: string,// Motivo de cancelación
  order_status_at_cancel: string, // Estado del pedido al cancelar
  refund_issued: boolean,
  timestamp: string
});
```

### `payment_completed`
**Cuándo**: Cuando un pago es completado exitosamente

```javascript
posthog.capture('payment_completed', {
  order_id: string,
  store_id: string,
  payment_method: string,
  amount: number,
  currency: string,           // 'USD'
  timestamp: string
});
```

### `payment_failed`
**Cuándo**: Cuando un pago falla

```javascript
posthog.capture('payment_failed', {
  order_id: string,
  store_id: string,
  payment_method: string,
  amount: number,
  error_code: string,
  error_message: string,
  timestamp: string
});
```

---

## 2. Eventos de Productos

### `product_viewed`
**Cuándo**: Cuando un usuario ve el detalle de un producto

```javascript
posthog.capture('product_viewed', {
  product_id: string,
  product_name: string,
  category_id: string,
  category_name: string,
  price: number,
  store_id: string,
  is_featured: boolean,
  has_extras: boolean,
  timestamp: string
});
```

### `product_added_to_cart`
**Cuándo**: Cuando se agrega un producto al carrito

```javascript
posthog.capture('product_added_to_cart', {
  product_id: string,
  product_name: string,
  quantity: number,
  price: number,
  extras_selected: array,     // Array de IDs de extras
  extras_total: number,       // Precio total de extras
  store_id: string,
  timestamp: string
});
```

### `product_removed_from_cart`
**Cuándo**: Cuando se remueve un producto del carrito

```javascript
posthog.capture('product_removed_from_cart', {
  product_id: string,
  product_name: string,
  quantity: number,
  store_id: string,
  reason: string,             // 'user_action' | 'unavailable'
  timestamp: string
});
```

### `category_viewed`
**Cuándo**: Cuando un usuario hace click en una categoría

```javascript
posthog.capture('category_viewed', {
  category_id: string,
  category_name: string,
  products_count: number,
  store_id: string,
  timestamp: string
});
```

### `product_search`
**Cuándo**: Cuando un usuario busca productos

```javascript
posthog.capture('product_search', {
  search_query: string,
  results_count: number,
  store_id: string,
  timestamp: string
});
```

---

## 3. Eventos de Usuarios

### `user_signup`
**Cuándo**: Cuando un nuevo usuario se registra

```javascript
posthog.capture('user_signup', {
  user_id: string,
  user_type: string,          // 'customer' | 'store_owner'
  signup_method: string,      // 'email' | 'phone' | 'google'
  store_id: string,           // Si es customer, la tienda donde se registró
  timestamp: string
});
```

### `first_order`
**Cuándo**: Cuando un cliente hace su primer pedido

```javascript
posthog.capture('first_order', {
  user_id: string,
  order_id: string,
  store_id: string,
  time_since_signup: number,  // Días desde registro
  order_amount: number,
  timestamp: string
});
```

### `repeat_order`
**Cuándo**: Cuando un cliente hace un pedido adicional

```javascript
posthog.capture('repeat_order', {
  user_id: string,
  order_id: string,
  store_id: string,
  order_number: number,       // Número de pedido del cliente
  days_since_last_order: number,
  order_amount: number,
  timestamp: string
});
```

### `customer_return`
**Cuándo**: Cuando un cliente regresa después de 30+ días

```javascript
posthog.capture('customer_return', {
  user_id: string,
  store_id: string,
  days_since_last_visit: number,
  timestamp: string
});
```

---

## 4. Eventos de Suscripciones

### `subscription_created`
**Cuándo**: Cuando se crea una nueva suscripción

```javascript
posthog.capture('subscription_created', {
  subscription_id: string,
  store_id: string,
  plan_id: string,
  plan_name: string,          // 'trial' | 'starter' | 'professional' | 'enterprise'
  price_monthly: number,
  is_trial: boolean,
  trial_days: number,
  timestamp: string
});
```

### `subscription_upgraded`
**Cuándo**: Cuando una tienda hace upgrade de plan

```javascript
posthog.capture('subscription_upgraded', {
  subscription_id: string,
  store_id: string,
  from_plan: string,
  to_plan: string,
  price_difference: number,
  reason: string,             // 'reached_limit' | 'need_features'
  timestamp: string
});
```

### `subscription_downgraded`
**Cuándo**: Cuando una tienda hace downgrade de plan

```javascript
posthog.capture('subscription_downgraded', {
  subscription_id: string,
  store_id: string,
  from_plan: string,
  to_plan: string,
  reason: string,
  timestamp: string
});
```

### `subscription_cancelled`
**Cuándo**: Cuando se cancela una suscripción

```javascript
posthog.capture('subscription_cancelled', {
  subscription_id: string,
  store_id: string,
  plan_name: string,
  days_active: number,
  cancellation_reason: string,
  feedback: string,           // Feedback del usuario
  timestamp: string
});
```

### `trial_started`
**Cuándo**: Cuando una tienda inicia un trial

```javascript
posthog.capture('trial_started', {
  subscription_id: string,
  store_id: string,
  trial_days: number,
  source: string,             // 'signup' | 'landing_page'
  timestamp: string
});
```

### `trial_converted`
**Cuándo**: Cuando un trial se convierte en suscripción paga

```javascript
posthog.capture('trial_converted', {
  subscription_id: string,
  store_id: string,
  trial_days_used: number,
  selected_plan: string,
  timestamp: string
});
```

### `trial_expired`
**Cuándo**: Cuando un trial expira sin conversión

```javascript
posthog.capture('trial_expired', {
  subscription_id: string,
  store_id: string,
  orders_during_trial: number,
  products_created: number,
  timestamp: string
});
```

---

## 5. Eventos de Módulos

### `whatsapp_message_sent`
**Cuándo**: Cuando se envía un mensaje de WhatsApp

```javascript
posthog.capture('whatsapp_message_sent', {
  message_id: string,
  store_id: string,
  message_type: string,       // 'order_confirmation' | 'order_update' | etc
  order_id: string,
  recipient_phone: string,    // Hasheado
  timestamp: string
});
```

### `whatsapp_message_delivered`
**Cuándo**: Cuando WhatsApp confirma entrega del mensaje

```javascript
posthog.capture('whatsapp_message_delivered', {
  message_id: string,
  store_id: string,
  delivery_time: number,      // Segundos desde envío
  timestamp: string
});
```

### `delivery_assigned`
**Cuándo**: Cuando se asigna un motorista a un pedido

```javascript
posthog.capture('delivery_assigned', {
  order_id: string,
  store_id: string,
  driver_id: string,
  estimated_time: number,
  distance_km: number,
  timestamp: string
});
```

### `driver_location_updated`
**Cuándo**: Cuando se actualiza la ubicación del motorista (sample cada 30s)

```javascript
posthog.capture('driver_location_updated', {
  driver_id: string,
  order_id: string,
  store_id: string,
  latitude: number,
  longitude: number,
  speed: number,              // km/h
  timestamp: string
});
```

### `delivery_photo_uploaded`
**Cuándo**: Cuando el motorista sube foto de entrega

```javascript
posthog.capture('delivery_photo_uploaded', {
  order_id: string,
  store_id: string,
  driver_id: string,
  timestamp: string
});
```

### `delivery_signature_captured`
**Cuándo**: Cuando se captura la firma del cliente

```javascript
posthog.capture('delivery_signature_captured', {
  order_id: string,
  store_id: string,
  driver_id: string,
  timestamp: string
});
```

---

## 6. Eventos de Tiendas

### `store_created`
**Cuándo**: Cuando se crea una nueva tienda

```javascript
posthog.capture('store_created', {
  store_id: string,
  store_name: string,
  subdomain: string,
  owner_id: string,
  operating_mode: string,     // 'delivery' | 'pickup' | 'digital_menu'
  source: string,             // 'landing_page' | 'referral' | 'direct'
  timestamp: string
});
```

### `store_settings_updated`
**Cuándo**: Cuando se actualizan configuraciones importantes

```javascript
posthog.capture('store_settings_updated', {
  store_id: string,
  setting_changed: string,    // 'hours' | 'payment' | 'delivery_zones'
  timestamp: string
});
```

### `onboarding_completed`
**Cuándo**: Cuando una tienda completa el onboarding

```javascript
posthog.capture('onboarding_completed', {
  store_id: string,
  time_to_complete: number,   // Minutos desde creación
  products_added: number,
  categories_added: number,
  timestamp: string
});
```

---

## 7. Eventos de Performance

### `page_load_slow`
**Cuándo**: Cuando una página tarda más de 3 segundos en cargar

```javascript
posthog.capture('page_load_slow', {
  page_url: string,
  load_time: number,          // Milisegundos
  store_id: string,
  device_type: string,        // 'mobile' | 'desktop'
  timestamp: string
});
```

### `api_error`
**Cuándo**: Cuando ocurre un error de API

```javascript
posthog.capture('api_error', {
  endpoint: string,
  error_code: number,
  error_message: string,
  store_id: string,
  user_id: string,
  timestamp: string
});
```

### `checkout_abandoned`
**Cuándo**: Usuario llega a checkout pero no completa el pedido

```javascript
posthog.capture('checkout_abandoned', {
  cart_id: string,
  store_id: string,
  items_count: number,
  cart_value: number,
  step_abandoned: string,     // 'delivery_info' | 'payment' | 'confirmation'
  timestamp: string
});
```

---

## 8. Eventos de Marketing

### `landing_page_viewed`
**Cuándo**: Usuario visita landing page principal

```javascript
posthog.capture('landing_page_viewed', {
  source: string,             // UTM source
  medium: string,             // UTM medium
  campaign: string,           // UTM campaign
  referrer: string,
  timestamp: string
});
```

### `signup_started`
**Cuándo**: Usuario comienza el proceso de registro

```javascript
posthog.capture('signup_started', {
  source: string,
  user_type: string,          // 'customer' | 'store_owner'
  timestamp: string
});
```

### `signup_completed`
**Cuándo**: Usuario completa el registro

```javascript
posthog.capture('signup_completed', {
  user_id: string,
  source: string,
  time_to_complete: number,   // Segundos desde signup_started
  timestamp: string
});
```

---

## Implementación en el Código

### 1. Inicializar PostHog (ya está en main.tsx)

```typescript
// src/main.tsx
import posthog from 'posthog-js';

posthog.init('YOUR_PROJECT_API_KEY', {
  api_host: 'https://app.posthog.com',
  autocapture: true,
  capture_pageview: true,
  capture_pageleave: true
});
```

### 2. Ejemplo de implementación

```typescript
// src/pages/Checkout.tsx
import posthog from 'posthog-js';

const handleCreateOrder = async (orderData) => {
  try {
    const order = await createOrder(orderData);

    // Track order created event
    posthog.capture('order_created', {
      order_id: order.id,
      store_id: store.id,
      store_name: store.name,
      store_subdomain: store.subdomain,
      order_type: orderData.type,
      total_amount: orderData.total,
      items_count: orderData.items.length,
      has_extras: orderData.items.some(item => item.extras?.length > 0),
      payment_method: orderData.payment_method,
      delivery_zone: orderData.delivery_zone,
      customer_id: user.id,
      customer_type: isFirstOrder ? 'new' : 'returning',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    // Track error
    posthog.capture('api_error', {
      endpoint: '/api/orders',
      error_code: error.code,
      error_message: error.message,
      store_id: store.id,
      user_id: user.id,
      timestamp: new Date().toISOString()
    });
  }
};
```

### 3. Hook personalizado para tracking

```typescript
// src/hooks/useTracking.ts
import { useCallback } from 'react';
import posthog from 'posthog-js';
import { useStore } from '@/contexts/StoreContext';

export function useTracking() {
  const { store } = useStore();

  const trackEvent = useCallback((eventName: string, properties: any = {}) => {
    posthog.capture(eventName, {
      ...properties,
      store_id: store?.id,
      store_name: store?.name,
      store_subdomain: store?.subdomain,
      timestamp: new Date().toISOString()
    });
  }, [store]);

  return { trackEvent };
}

// Uso:
const { trackEvent } = useTracking();
trackEvent('product_viewed', {
  product_id: product.id,
  product_name: product.name,
  price: product.price
});
```

## Verificación

Para verificar que los eventos se están enviando correctamente:

1. Abre PostHog Toolbar (click en el botón PostHog en tu app)
2. Ve a la pestaña "Events"
3. Realiza acciones en la app
4. Verifica que los eventos aparezcan en tiempo real

## Próximos Pasos

1. Implementar estos eventos en el código
2. Verificar que se envían correctamente
3. Crear los dashboards usando estos eventos
4. Configurar alertas basadas en los eventos críticos
