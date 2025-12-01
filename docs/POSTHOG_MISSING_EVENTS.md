# PostHog - Eventos Faltantes e Implementación

## Resumen

Este documento provee el código exacto para implementar eventos adicionales de PostHog que mejorarán significativamente el análisis de Menu Maestro.

---

## Eventos Faltantes Críticos

### 1. `product_viewed` ⭐ ALTA PRIORIDAD

**Por qué es importante:**
- Analiza qué productos los usuarios ven pero NO agregan al carrito
- Identifica problemas con precio, descripción, imágenes
- Mide efectividad de promociones

**Ubicación:** `src/pages/ProductDetail.tsx` o componente similar

**Código a agregar:**

```typescript
// src/pages/ProductDetail.tsx
import { useEffect } from "react";
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const ProductDetail = () => {
  const { store } = useStore();
  const { product } = useProduct(); // Tu hook/estado para cargar producto

  useEffect(() => {
    if (product && store?.id) {
      try {
        posthog.capture('product_viewed', {
          store_id: store.id,
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          category_id: product.category_id,
          has_promotion: product.is_on_sale || false,
          promotion_price: product.sale_price || null,
          has_image: !!product.image_url,
          is_available: product.is_available !== false,
          source: 'product_detail_page', // o puede venir de navigation state
        });
      } catch (error) {
        console.error('[PostHog] Error tracking product_viewed:', error);
      }
    }
  }, [product?.id, store?.id]); // Solo trackear cuando cambie el producto

  // ... resto del componente
};
```

**Properties incluidas:**
- `store_id`: UUID de la tienda
- `product_id`: UUID del producto
- `product_name`: Nombre del producto
- `product_price`: Precio base
- `category_id`: ID de categoría
- `has_promotion`: Boolean si está en promoción
- `promotion_price`: Precio con descuento (si aplica)
- `has_image`: Boolean si tiene imagen
- `is_available`: Boolean si está disponible
- `source`: De dónde vino ('catalog', 'search', 'category', etc.)

**Métricas que habilita:**
- View-to-cart conversion rate
- Most viewed but not purchased products
- Promotion effectiveness

---

### 2. `category_viewed` ⭐ PRIORIDAD MEDIA

**Por qué es importante:**
- Identifica categorías más exploradas
- Optimiza orden de categorías en el menú
- Analiza navegación del usuario

**Ubicación:** `src/components/catalog/CategoriesSection.tsx` o cuando usuario navega a categoría

**Código a agregar:**

```typescript
// src/components/catalog/CategoryCard.tsx o similar
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const CategoryCard = ({ category }) => {
  const { store } = useStore();

  const handleCategoryClick = () => {
    if (store?.id) {
      try {
        posthog.capture('category_viewed', {
          store_id: store.id,
          category_id: category.id,
          category_name: category.name,
          products_count: category.menu_items?.length || 0,
          display_order: category.display_order || null,
          source: 'category_grid', // o 'navigation', 'search', etc.
        });
      } catch (error) {
        console.error('[PostHog] Error tracking category_viewed:', error);
      }
    }

    // ... resto de la lógica de click (navegar, scroll, etc.)
  };

  return (
    <div onClick={handleCategoryClick}>
      {/* ... UI del category card */}
    </div>
  );
};
```

**Properties incluidas:**
- `store_id`: UUID de la tienda
- `category_id`: UUID de la categoría
- `category_name`: Nombre de la categoría
- `products_count`: Número de productos en la categoría
- `display_order`: Orden de visualización
- `source`: De dónde vino el click

**Métricas que habilita:**
- Most popular categories
- Category navigation patterns
- Empty category views (products_count = 0)

---

### 3. `search_performed` ⭐ PRIORIDAD BAJA (si hay búsqueda)

**Por qué es importante:**
- Identifica qué buscan usuarios pero no encuentran
- Optimiza resultados de búsqueda
- Descubre demanda de productos no existentes

**Ubicación:** Componente de búsqueda (si existe)

**Código a agregar:**

```typescript
// src/components/search/SearchBar.tsx
import { useState } from "react";
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const SearchBar = () => {
  const { store } = useStore();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || !store?.id) return;

    // Realizar búsqueda
    const results = await performSearch(trimmedQuery);

    // Trackear evento
    try {
      posthog.capture('search_performed', {
        store_id: store.id,
        search_query: trimmedQuery,
        results_count: results.length,
        has_results: results.length > 0,
        query_length: trimmedQuery.length,
        source: 'search_bar', // o 'quick_search', 'mobile_search', etc.
      });
    } catch (error) {
      console.error('[PostHog] Error tracking search_performed:', error);
    }

    // ... mostrar resultados
  };

  return (
    <input
      type="search"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && handleSearch(searchQuery)}
      placeholder="Buscar productos..."
    />
  );
};
```

**Properties incluidas:**
- `store_id`: UUID de la tienda
- `search_query`: Texto de búsqueda
- `results_count`: Número de resultados
- `has_results`: Boolean si encontró algo
- `query_length`: Longitud del query
- `source`: De dónde se realizó la búsqueda

**Métricas que habilita:**
- Most searched terms
- Searches with no results (opportunities)
- Search-to-purchase conversion

---

## Eventos Admin (Store Owner Analytics)

### 4. `admin_menu_item_created` ⭐ ALTA PRIORIDAD

**Por qué es importante:**
- Mide engagement de store owners
- Identifica tiendas activas vs inactivas
- Analiza velocidad de onboarding

**Ubicación:** `src/components/admin/MenuItemsManager.tsx`

**Código a agregar:**

```typescript
// src/components/admin/MenuItemsManager.tsx
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const MenuItemsManager = () => {
  const { store } = useStore();

  const handleCreateMenuItem = async (menuItemData) => {
    try {
      // Crear item en Supabase
      const { data: newItem, error } = await supabase
        .from('menu_items')
        .insert([menuItemData])
        .select()
        .single();

      if (error) throw error;

      // Trackear en PostHog
      if (store?.id) {
        posthog.capture('admin_menu_item_created', {
          store_id: store.id,
          product_id: newItem.id,
          product_name: newItem.name,
          category_id: newItem.category_id,
          has_image: !!newItem.image_url,
          has_extras: newItem.extras?.length > 0,
          price: newItem.price,
          is_available: newItem.is_available !== false,
          is_on_sale: newItem.is_on_sale || false,
        });
      }

      toast.success("Producto creado exitosamente");
    } catch (error) {
      console.error("Error creating menu item:", error);
      toast.error("Error al crear producto");
    }
  };

  // ... resto del componente
};
```

**Properties incluidas:**
- `store_id`: UUID de la tienda
- `product_id`: UUID del nuevo producto
- `product_name`: Nombre del producto
- `category_id`: ID de categoría
- `has_image`: Boolean si subió imagen
- `has_extras`: Boolean si agregó extras
- `price`: Precio del producto
- `is_available`: Boolean disponibilidad
- `is_on_sale`: Boolean si está en promoción

**Métricas que habilita:**
- Store owner activity level
- Time to first product (onboarding speed)
- Product creation trends

---

### 5. `admin_menu_item_updated` ⭐ PRIORIDAD MEDIA

**Ubicación:** `src/components/admin/MenuItemsManager.tsx`

**Código a agregar:**

```typescript
const handleUpdateMenuItem = async (itemId, updates) => {
  try {
    const { data: updatedItem, error } = await supabase
      .from('menu_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    if (store?.id) {
      posthog.capture('admin_menu_item_updated', {
        store_id: store.id,
        product_id: itemId,
        product_name: updatedItem.name,
        fields_updated: Object.keys(updates), // ['price', 'name', etc.]
        is_price_change: 'price' in updates,
        is_availability_change: 'is_available' in updates,
      });
    }

    toast.success("Producto actualizado");
  } catch (error) {
    console.error("Error updating menu item:", error);
    toast.error("Error al actualizar producto");
  }
};
```

---

### 6. `admin_menu_item_deleted` ⭐ PRIORIDAD BAJA

**Ubicación:** `src/components/admin/MenuItemsManager.tsx`

**Código a agregar:**

```typescript
const handleDeleteMenuItem = async (itemId, itemName) => {
  try {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    if (store?.id) {
      posthog.capture('admin_menu_item_deleted', {
        store_id: store.id,
        product_id: itemId,
        product_name: itemName,
      });
    }

    toast.success("Producto eliminado");
  } catch (error) {
    console.error("Error deleting menu item:", error);
    toast.error("Error al eliminar producto");
  }
};
```

---

### 7. `admin_settings_updated` ⭐ ALTA PRIORIDAD

**Por qué es importante:**
- Mide qué configuraciones ajustan los owners
- Identifica settings confusos o problemáticos
- Analiza adopción de features

**Ubicación:** Tabs de configuración en admin (`src/components/admin/settings/*Tab.tsx`)

**Código a agregar (ejemplo con BusinessHoursTab):**

```typescript
// src/components/admin/settings/BusinessHoursTab.tsx
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const BusinessHoursTab = () => {
  const { store } = useStore();

  const handleSaveBusinessHours = async (hoursData) => {
    try {
      const { error } = await supabase
        .from('store_hours')
        .upsert(hoursData);

      if (error) throw error;

      if (store?.id) {
        posthog.capture('admin_settings_updated', {
          store_id: store.id,
          setting_type: 'business_hours',
          settings_changed: Object.keys(hoursData),
          // Puedes incluir snapshot de cambios (sin datos sensibles)
          changes_summary: {
            days_updated: hoursData.length,
            has_custom_hours: true,
          },
        });
      }

      toast.success("Horario actualizado");
    } catch (error) {
      console.error("Error updating business hours:", error);
      toast.error("Error al actualizar horario");
    }
  };

  // ... resto del componente
};
```

**Otros setting_type values:**
- `'payment'` - PaymentSettingsTab
- `'delivery'` - DeliverySettingsTab
- `'orders'` - OrderSettingsTab
- `'advanced'` - AdvancedSettingsTab
- `'appearance'` - Si hay tab de colores/logo

---

### 8. `admin_order_status_changed` ⭐ ALTA PRIORIDAD

**Por qué es importante:**
- Analiza velocidad de respuesta de owners
- Identifica tiendas rápidas vs lentas
- Optimiza workflow de órdenes

**Ubicación:** `src/components/admin/OrdersManager.tsx`

**Código a agregar:**

```typescript
// src/components/admin/OrdersManager.tsx
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const OrdersManager = () => {
  const { store } = useStore();

  const handleOrderStatusChange = async (orderId, newStatus, oldStatus, orderCreatedAt) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      if (store?.id) {
        // Calcular tiempo desde creación
        const timeToAction = Math.floor((Date.now() - new Date(orderCreatedAt).getTime()) / 1000);

        posthog.capture('admin_order_status_changed', {
          store_id: store.id,
          order_id: orderId,
          old_status: oldStatus,
          new_status: newStatus,
          time_to_action_seconds: timeToAction,
          time_to_action_minutes: Math.floor(timeToAction / 60),
          is_quick_response: timeToAction < 300, // < 5 minutos
        });
      }

      toast.success(`Orden ${newStatus}`);
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Error al actualizar orden");
    }
  };

  // ... resto del componente
};
```

**Properties incluidas:**
- `store_id`: UUID de la tienda
- `order_id`: UUID de la orden
- `old_status`: Status anterior
- `new_status`: Nuevo status
- `time_to_action_seconds`: Segundos desde creación
- `time_to_action_minutes`: Minutos desde creación
- `is_quick_response`: Boolean si respondió rápido (<5 min)

**Métricas que habilita:**
- Average response time per store
- Fast vs slow stores ranking
- Status change patterns

---

### 9. `admin_dashboard_viewed` ⭐ PRIORIDAD BAJA

**Por qué es importante:**
- Mide engagement con el admin panel
- Identifica owners activos

**Ubicación:** `src/pages/admin/AdminDashboard.tsx`

**Código a agregar:**

```typescript
// src/pages/admin/AdminDashboard.tsx
import { useEffect } from "react";
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const AdminDashboard = () => {
  const { store } = useStore();

  useEffect(() => {
    if (store?.id) {
      posthog.capture('admin_dashboard_viewed', {
        store_id: store.id,
        timestamp: Date.now(),
      });
    }
  }, []); // Solo trackear una vez al montar

  // ... resto del componente
};
```

---

## Eventos de Extras (Product Customization)

### 10. `product_extras_selected` ⭐ PRIORIDAD MEDIA

**Por qué es importante:**
- Analiza qué extras son más populares
- Mide impacto de extras en valor de orden
- Identifica extras que usuarios ignoran

**Ubicación:** `src/components/catalog/ProductExtrasDialog.tsx` o similar

**Código a agregar:**

```typescript
// src/components/catalog/ProductExtrasDialog.tsx
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const ProductExtrasDialog = ({ product, extras }) => {
  const { store } = useStore();
  const [selectedExtras, setSelectedExtras] = useState([]);

  const handleConfirmWithExtras = () => {
    if (store?.id && selectedExtras.length > 0) {
      try {
        const extrasPrice = selectedExtras.reduce((sum, extra) => sum + extra.price, 0);

        posthog.capture('product_extras_selected', {
          store_id: store.id,
          product_id: product.id,
          product_name: product.name,
          extras_selected: selectedExtras.map(e => ({
            id: e.id,
            name: e.name,
            price: e.price,
          })),
          extras_count: selectedExtras.length,
          extras_total_price: extrasPrice,
          base_price: product.price,
          total_price: product.price + extrasPrice,
          price_increase_percent: ((extrasPrice / product.price) * 100).toFixed(2),
        });
      } catch (error) {
        console.error('[PostHog] Error tracking product_extras_selected:', error);
      }
    }

    // ... agregar al carrito con extras
  };

  // ... resto del componente
};
```

**Métricas que habilita:**
- Most popular extras
- Average extras per order
- Revenue impact of extras
- Extras that are shown but never selected

---

## Eventos de Cupones

### 11. `coupon_applied` ⭐ PRIORIDAD ALTA

**Por qué es importante:**
- Mide efectividad de cupones
- Analiza qué cupones convierten mejor
- Identifica uso fraudulento

**Ubicación:** `src/pages/Checkout.tsx` (cuando se valida cupón)

**Código a agregar:**

```typescript
// src/pages/Checkout.tsx
const handleApplyCoupon = async () => {
  setValidatingCoupon(true);
  setCouponError("");

  try {
    const result = await validateCouponCode(couponCode, store!.id, discountedTotal);

    if (result.isValid && result.coupon) {
      const discount = applyCouponDiscount(result.coupon, discountedTotal);

      setAppliedCoupon(result.coupon);
      setCouponDiscount(discount);

      // Trackear cupón aplicado
      if (store?.id) {
        posthog.capture('coupon_applied', {
          store_id: store.id,
          coupon_code: couponCode,
          coupon_id: result.coupon.id,
          coupon_type: result.coupon.discount_type, // 'percentage' | 'fixed'
          discount_value: result.coupon.discount_value,
          discount_amount: discount,
          cart_value_before: discountedTotal,
          cart_value_after: discountedTotal - discount,
          order_type: orderType,
        });
      }

      toast.success(`Cupón aplicado! Descuento: ${formatPrice(discount)}`);
    } else {
      setCouponError(result.error || "Cupón inválido");
      toast.error(result.error || "Cupón inválido");
    }
  } catch (error) {
    console.error("Error validating coupon:", error);
    setCouponError("Error al validar cupón");
    toast.error("Error al validar cupón");
  } finally {
    setValidatingCoupon(false);
  }
};
```

---

### 12. `coupon_attempt_failed` ⭐ PRIORIDAD BAJA

**Ubicación:** Same as above, cuando falla validación

**Código:**

```typescript
if (!result.isValid) {
  // Trackear intento fallido
  if (store?.id) {
    posthog.capture('coupon_attempt_failed', {
      store_id: store.id,
      coupon_code: couponCode,
      failure_reason: result.error,
      cart_value: discountedTotal,
    });
  }

  setCouponError(result.error || "Cupón inválido");
  toast.error(result.error || "Cupón inválido");
}
```

---

## Eventos de Navegación

### 13. `page_viewed` (Custom Pageview)

**Por qué es importante:**
- Complementa el autocapture de PostHog
- Trackea context específico del negocio

**Ubicación:** `src/App.tsx` o en cada página

**Código a agregar (usando React Router):**

```typescript
// src/App.tsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

function App() {
  const location = useLocation();
  const { store } = useStore();

  useEffect(() => {
    if (store?.id) {
      // PostHog ya hace autocapture, pero podemos enriquecer con store context
      posthog.capture('$pageview', {
        store_id: store.id,
        page_path: location.pathname,
        page_title: document.title,
      });
    }
  }, [location.pathname, store?.id]);

  return (
    // ... tu app
  );
}
```

**Nota:** PostHog ya tiene `autocapture: true` configurado, así que este evento es OPCIONAL.

---

## Eventos de Error/Debugging

### 14. `checkout_error` ⭐ PRIORIDAD MEDIA

**Por qué es importante:**
- Identifica problemas técnicos que bloquean conversión
- Debug de errores en producción

**Ubicación:** `src/pages/Checkout.tsx` y `src/pages/ConfirmOrder.tsx`

**Código a agregar:**

```typescript
// src/pages/ConfirmOrder.tsx
const handleConfirm = async () => {
  // ... código existente

  try {
    // ... lógica de orden
  } catch (error) {
    console.error("Error creating order:", error);

    // Trackear error en PostHog
    if (store?.id) {
      posthog.capture('checkout_error', {
        store_id: store.id,
        error_type: 'order_creation_failed',
        error_message: error.message,
        order_type: orderData.order_type,
        cart_value: grandTotal,
        step: 'confirm_order',
        timestamp: Date.now(),
      });
    }

    toast.error("Error al crear el pedido");
  } finally {
    setLoading(false);
  }
};
```

---

## Eventos de WhatsApp Redirect

### 15. `whatsapp_redirect` ⭐ PRIORIDAD MEDIA

**Por qué es importante:**
- Mide cuántos usuarios usan WhatsApp integration
- Analiza conversión post-redirect

**Ubicación:** `src/pages/ConfirmOrder.tsx` (cuando redirect a WhatsApp)

**Código a agregar:**

```typescript
// src/pages/ConfirmOrder.tsx
if (result.shouldRedirectToWhatsApp && result.whatsappNumber && result.whatsappMessage) {
  toast.success("¡Pedido realizado! Redirigiendo a WhatsApp...");
  clearCart();

  // Trackear redirect a WhatsApp
  if (store?.id) {
    posthog.capture('whatsapp_redirect', {
      store_id: store.id,
      order_id: result.orderId,
      order_number: result.orderNumber,
      order_type: orderData.order_type,
      whatsapp_number: result.whatsappNumber,
      message_length: result.whatsappMessage.length,
    });
  }

  setTimeout(() => {
    redirectToWhatsApp(result.whatsappNumber!, result.whatsappMessage!);
    navigate("/");
  }, 1500);
  return;
}
```

---

## Testing de Eventos

### Cómo Verificar que los Eventos Funcionan

#### 1. En Development (Console)

PostHog ya está configurado para loggear en desarrollo:

```typescript
// main.tsx - ya existe
loaded: (posthog) => {
  if (import.meta.env.DEV) console.log('[PostHog] Initialized successfully');
}
```

Verás en la consola:
```
[PostHog] User identified: { user_id: "...", email: "...", store_id: "..." }
[PostHog] Event captured: product_added_to_cart
```

#### 2. En PostHog Dashboard (Production)

1. Ir a: https://us.i.posthog.com/project/185811/events
2. Buscar eventos recientes
3. Filtrar por `event = 'product_viewed'` (o el que estés testeando)
4. Verificar propiedades

#### 3. PostHog Toolbar (Recommended)

1. En tu app, presionar `Cmd+K` (Mac) o `Ctrl+K` (Windows)
2. Se abre el PostHog toolbar
3. Ver eventos en tiempo real mientras navegas
4. Inspeccionar propiedades de cada evento

---

## Prioridades de Implementación

### Sprint 1 (Esta Semana) - Alta Prioridad

1. ✅ `product_added_to_cart` - YA IMPLEMENTADO
2. ✅ `checkout_started` - YA IMPLEMENTADO
3. ✅ `order_placed` - YA IMPLEMENTADO
4. ⏳ `product_viewed` - IMPLEMENTAR AHORA
5. ⏳ `admin_menu_item_created` - IMPLEMENTAR AHORA
6. ⏳ `admin_settings_updated` - IMPLEMENTAR AHORA

### Sprint 2 (Próxima Semana) - Media Prioridad

7. ⏳ `category_viewed`
8. ⏳ `product_extras_selected`
9. ⏳ `coupon_applied`
10. ⏳ `admin_order_status_changed`

### Sprint 3 (Mes Próximo) - Baja Prioridad

11. ⏳ `search_performed` (si hay búsqueda)
12. ⏳ `checkout_error`
13. ⏳ `whatsapp_redirect`
14. ⏳ `admin_dashboard_viewed`

---

## Checklist de Implementación

Para cada evento:

- [ ] Identificar ubicación exacta en el código
- [ ] Importar `posthog` y `useStore`
- [ ] Agregar bloque `try/catch` para el tracking
- [ ] Incluir todas las propiedades necesarias
- [ ] Verificar que `store_id` siempre esté presente
- [ ] Testear en development (console logs)
- [ ] Verificar en PostHog dashboard (production)
- [ ] Documentar el evento en `POSTHOG_DASHBOARD.md`

---

## Template de Evento

```typescript
// Ubicación: src/components/...
import posthog from "posthog-js";
import { useStore } from "@/contexts/StoreContext";

const MyComponent = () => {
  const { store } = useStore();

  const handleSomeAction = () => {
    // ... lógica del componente

    // Trackear evento en PostHog
    if (store?.id) {
      try {
        posthog.capture('event_name', {
          store_id: store.id, // ALWAYS include store_id
          // ... otras propiedades específicas del evento
          timestamp: Date.now(), // opcional pero útil
        });
      } catch (error) {
        console.error('[PostHog] Error tracking event_name:', error);
      }
    }
  };

  // ... resto del componente
};
```

---

## Notas Importantes

### ✅ Mejores Prácticas

1. **SIEMPRE incluir `store_id`** - crítico para multi-tenancy
2. **Usar try/catch** - evita que errores de analytics rompan la UX
3. **Verificar `store?.id`** antes de trackear
4. **No trackear información sensible** (contraseñas, tokens, tarjetas)
5. **Usar nombres consistentes** - snake_case para eventos y propiedades
6. **Documentar nuevos eventos** - actualizar POSTHOG_DASHBOARD.md

### ❌ Qué NO Hacer

1. NO trackear data de usuario sensible (excepto email que ya está en identificación)
2. NO trackear en loops sin control (puede inflar costs)
3. NO usar strings variables como nombres de eventos (dificulta análisis)
4. NO olvidar el `store_id` (rompe multi-tenancy)
5. NO bloquear UI mientras trackea (siempre async/try-catch)

---

## Recursos Adicionales

### PostHog Documentation

- **Event Capture:** https://posthog.com/docs/product-analytics/capture-events
- **Properties:** https://posthog.com/docs/product-analytics/properties
- **Best Practices:** https://posthog.com/docs/product-analytics/best-practices

### Menu Maestro Docs

- **Main Dashboard Guide:** `/docs/POSTHOG_DASHBOARD.md`
- **Implementation Guide:** `/docs/POSTHOG_IMPLEMENTATION_GUIDE.md`
- **Project README:** `/CLAUDE.md`

---

**Creado:** 2025-11-30
**Autor:** Claude Code (Orchestrator Agent)
**Versión:** 1.0.0
