# Estado de Implementación de Eventos PostHog

Este documento muestra qué eventos están ya implementados y cuáles necesitan ser agregados para que los dashboards funcionen completamente.

## ✅ Eventos YA Implementados (11/70+)

### Catálogo y Carrito
- ✅ `catalog_page_view` - [src/pages/Index.tsx:71]
- ✅ `product_added_to_cart` - [src/contexts/CartContext.tsx]
- ✅ `product_removed_from_cart` - [src/contexts/CartContext.tsx]
- ✅ `cart_viewed` - [src/components/cart/CartSheet.tsx]
- ✅ `floating_cart_clicked` - [src/components/cart/FloatingCartButton.tsx]

### Checkout y Órdenes
- ✅ `checkout_started` - [src/pages/Checkout.tsx]
- ✅ `order_placed` - [src/pages/ConfirmOrder.tsx]

### Admin
- ✅ `admin_order_created` - [src/components/admin/AdminOrderCreate.tsx]
- ✅ `admin_order_edited` - [src/components/admin/AdminOrderEdit.tsx]

### Landing Page
- ✅ `pricing_section_viewed` - [src/components/landing/PricingSection.tsx]
- ✅ `pricing_plan_clicked` - [src/components/landing/PricingSection.tsx]

---

## ❌ Eventos FALTANTES Requeridos para Dashboards

### Dashboard: Platform Overview
- ❌ `order_created` - Necesario para contar tiendas activas
- ⚠️ `order_placed` ya existe pero necesita propiedades: `order_status`, `store_id`, `store_name`

### Dashboard: Stores Analysis
- ⚠️ Los eventos existen pero necesitan la propiedad `store_name` consistente

### Dashboard: Orders Deep Dive
- ❌ `order_preparing` - Cuando la orden está siendo preparada
- ❌ `order_out_for_delivery` - Cuando sale a delivery
- ❌ `order_delivered` - Cuando se entrega
- ❌ `order_cancelled` - Cuando se cancela una orden
- ⚠️ `order_placed` necesita: `order_type` (delivery/pickup), `order_status`

### Dashboard: Products & Catalog
- ❌ `product_viewed` - Cuando se ve el detalle de un producto
- ❌ `category_viewed` - Cuando se filtra por categoría
- ⚠️ Eventos existentes necesitan: `product_name`, `product_id`, `category_name`

### Dashboard: Customers Lifecycle
- ❌ `first_order` - Primera orden de un cliente
- ❌ `repeat_order` - Orden repetida de un cliente
- ❌ `customer_return` - Cliente que regresa después de X días
- ⚠️ Todos los eventos de orden necesitan: `customer_id` consistente

### Dashboard: Subscriptions & Revenue
- ❌ `subscription_created` - Nueva suscripción
- ❌ `subscription_upgraded` - Upgrade de plan
- ❌ `subscription_downgraded` - Downgrade de plan
- ❌ `subscription_cancelled` - Cancelación de suscripción
- ❌ `trial_started` - Inicio de trial
- ❌ `trial_converted` - Trial convertido a pago
- ❌ `trial_expired` - Trial expirado sin conversión
- ❌ `payment_completed` - Pago completado
- ❌ `payment_failed` - Pago fallido

### Dashboard: Modules & Features
- ❌ `whatsapp_message_sent` - Mensaje enviado por WhatsApp
- ❌ `whatsapp_message_delivered` - Mensaje entregado
- ❌ `delivery_assigned` - Delivery asignado a driver
- ❌ `driver_location_updated` - Actualización de ubicación del driver
- ❌ `delivery_photo_uploaded` - Foto de entrega subida
- ❌ `delivery_signature_captured` - Firma capturada

### Dashboard: Technical Performance
- ❌ `api_error` - Error de API
- ❌ `page_load_slow` - Carga lenta de página (>3s)
- ❌ `checkout_abandoned` - Checkout abandonado

### Dashboard: Marketing & Acquisition
- ❌ `landing_page_viewed` - Vista de landing page
- ❌ `signup_started` - Inicio de registro
- ❌ `signup_completed` - Registro completado
- ❌ `store_created` - Nueva tienda creada
- ❌ `store_settings_updated` - Settings de tienda actualizados
- ❌ `onboarding_completed` - Onboarding completado

---

## 🔧 Propiedades Faltantes en Eventos Existentes

### `order_placed` necesita agregar:
```typescript
{
  order_id: string,
  order_status: string, // 'pending', 'confirmed', 'preparing', etc.
  order_type: string, // 'delivery' o 'pickup'
  payment_method: string,
  customer_id: string,
  items_count: number,
  total: number, // Ya existe
  store_id: string, // Ya existe
  store_name: string // Ya existe
}
```

### `product_added_to_cart` necesita agregar:
```typescript
{
  product_id: string,
  product_name: string,
  quantity: number,
  price: number,
  category_name?: string,
  store_id: string,
  cart_total: number
}
```

### `checkout_started` necesita agregar:
```typescript
{
  cart_total: number,
  items_count: number,
  order_type: string, // 'delivery' o 'pickup'
  payment_method: string,
  has_delivery_address: boolean
}
```

---

## 📊 Resumen de Implementación

| Dashboard | Eventos Implementados | Eventos Faltantes | % Completado |
|-----------|----------------------|-------------------|--------------|
| Platform Overview | 1/6 | 5 | ~17% |
| Conversión y Ventas | 2/2 | 0 (propiedades faltantes) | ~50% |
| Stores Analysis | 1/3 | 2 | ~33% |
| Orders Deep Dive | 1/4 | 3 | ~25% |
| Products & Catalog | 2/4 | 2 | ~50% |
| Customers Lifecycle | 1/3 | 2 | ~33% |
| Subscriptions & Revenue | 0/9 | 9 | 0% |
| Modules & Features | 0/6 | 6 | 0% |
| Technical Performance | 0/3 | 3 | 0% |
| Marketing & Acquisition | 1/5 | 4 | ~20% |

**Total General: ~15% implementado**

---

## 🚀 Plan de Acción Recomendado

### Fase 1: Mejorar Eventos Existentes (Prioridad Alta)
1. Agregar propiedades faltantes a `order_placed`
2. Agregar propiedades faltantes a `product_added_to_cart`
3. Agregar propiedades faltantes a `checkout_started`
4. Agregar `customer_id` consistente en todos los eventos

### Fase 2: Eventos Críticos de Negocio (Prioridad Alta)
1. `order_created` - Para tracking de órdenes
2. `order_preparing`, `order_delivered`, `order_cancelled` - Estados de orden
3. `product_viewed` - Vista de productos
4. `first_order` y `repeat_order` - Lifecycle de clientes

### Fase 3: Eventos de Suscripciones (Prioridad Media)
1. `subscription_created`, `subscription_cancelled`
2. `trial_started`, `trial_converted`
3. `payment_completed`, `payment_failed`

### Fase 4: Eventos de Módulos y Features (Prioridad Media)
1. `whatsapp_message_sent`
2. `delivery_assigned`, `delivery_photo_uploaded`

### Fase 5: Eventos Técnicos y Marketing (Prioridad Baja)
1. `api_error`, `page_load_slow`
2. `landing_page_viewed`, `signup_started`

---

## 📝 Próximos Pasos

1. **Mejorar hook usePostHogTracking** - Agregar helpers para eventos comunes
2. **Crear funciones de tracking por módulo** - Ej: `trackOrder()`, `trackProduct()`
3. **Implementar eventos faltantes fase por fase**
4. **Verificar eventos en PostHog Live Events**
5. **Validar que los dashboards se popúlen con datos reales**

---

## 🔍 Cómo Verificar

1. Ve a PostHog → Events → Live Events
2. Navega por la app y realiza acciones
3. Verifica que los eventos aparezcan en tiempo real
4. Revisa que tengan todas las propiedades necesarias
5. Ve a los dashboards y verifica que se muestren datos
