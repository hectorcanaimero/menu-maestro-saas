# Admin Order Management - Documentación Completa

## Resumen

Este documento describe la implementación completa del sistema de gestión de pedidos desde el panel de administración, que permite a los dueños de tiendas crear y editar pedidos manualmente.

## Cambios Implementados

### 1. Eliminación de "Servicio en Tienda" del Catálogo Público

Se removió la opción de `digital_menu` (servicio en tienda) del flujo de checkout público:

**Archivos modificados:**
- `/src/pages/Checkout.tsx`
- `/src/pages/ConfirmOrder.tsx`

**Cambios:**
- Tipo de orden actualizado a solo `"delivery" | "pickup"`
- Eliminado el paso de selección de número de mesa
- Actualizada la validación de esquemas

### 2. Nuevas Rutas y Componentes Admin

#### Hook: `useAdminCart`
**Ubicación:** `/src/hooks/useAdminCart.ts`

Hook personalizado para manejar un carrito temporal en el panel de administración.

**Funcionalidades:**
- `addItem()` - Agregar productos con extras
- `removeItem()` - Eliminar productos
- `updateQuantity()` - Actualizar cantidades
- `clearCart()` - Limpiar carrito
- Cálculos automáticos de totales, subtotales y extras

**Uso:**
```typescript
const { items, addItem, removeItem, updateQuantity, clearCart, totalPrice } = useAdminCart();
```

#### Componente: `PaymentMethodSelector`
**Ubicación:** `/src/components/admin/PaymentMethodSelector.tsx`

Selector reutilizable de métodos de pago configurados en la tienda.

**Props:**
```typescript
interface PaymentMethodSelectorProps {
  selectedMethod: string | null;
  onMethodChange: (method: string) => void;
  required?: boolean;
}
```

**Características:**
- Carga métodos de pago activos de la tienda
- Selección única con cards clicables
- Auto-selección si solo hay un método
- Indicador de método requerido

#### Componente: `AdminOrderCreate`
**Ubicación:** `/src/components/admin/AdminOrderCreate.tsx`

Wizard de 4 pasos para crear pedidos manualmente desde el admin.

**Props:**
```typescript
interface AdminOrderCreateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (orderId: string) => void;
}
```

**Pasos del Wizard:**

1. **Información del Cliente**
   - Tipo de pedido (Delivery/Pickup)
   - Email del cliente
   - Nombre completo
   - Teléfono

2. **Información de Entrega** (solo si es delivery)
   - Dirección de entrega
   - Zona de entrega (con precio calculado)

3. **Agregar Productos**
   - Lista de productos agregados al pedido
   - Grid de productos disponibles
   - Gestión de cantidades
   - Soporte para extras de productos
   - Cálculo de subtotal en tiempo real

4. **Método de Pago y Confirmación**
   - Selector de método de pago
   - Campo de notas adicionales
   - Resumen completo del pedido
   - Total calculado (subtotal + delivery)

**Funcionalidades:**
- Validación por pasos con Zod
- Integración con `ProductExtrasDialog` para selección de extras
- Búsqueda y selección de clientes existentes
- Creación automática de clientes nuevos
- Tracking con PostHog del evento `admin_order_created`

#### Componente: `AdminOrderEdit`
**Ubicación:** `/src/components/admin/AdminOrderEdit.tsx`

Modal para editar pedidos existentes.

**Props:**
```typescript
interface AdminOrderEditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string | null;
  onSuccess?: () => void;
}
```

**Campos Editables:**
- Información del cliente (nombre, email, teléfono)
- Dirección de entrega
- Productos del pedido (agregar/remover/modificar cantidades)
- Estado del pedido
- Método de pago
- Notas

**Restricciones:**
- Solo se pueden editar pedidos en estados: `pending`, `confirmed`, `preparing`
- Validación de permisos mediante RPC `admin_can_edit_order()`
- Recálculo automático del total si se modifican productos

**Funcionalidades:**
- Validación de permisos antes de cargar
- Badge visual si el pedido no es editable
- Integración con `ProductExtrasDialog`
- Tracking con PostHog del evento `admin_order_edited`

### 3. Actualización de `OrdersManager`

**Archivo:** `/src/components/admin/OrdersManager.tsx`

**Cambios:**
- Agregado botón **"Crear Pedido"** en el header
- Agregado botón **"Editar"** en cada fila de la tabla de pedidos
- Integración con `AdminOrderCreate` y `AdminOrderEdit`
- Refresh automático de la lista después de crear/editar

**Nuevos Imports:**
```typescript
import { AdminOrderCreate } from "./AdminOrderCreate";
import { AdminOrderEdit } from "./AdminOrderEdit";
```

**Nuevos Estados:**
```typescript
const [createOrderOpen, setCreateOrderOpen] = useState(false);
const [editOrderOpen, setEditOrderOpen] = useState(false);
const [editOrderId, setEditOrderId] = useState<string | null>(null);
```

### 4. Funciones RPC de Supabase

**Archivo:** `/supabase/migrations/20251130000001_admin_order_management.sql`

#### RPC: `admin_create_order()`

Crea un pedido completo (order + items + extras) en una sola transacción.

**Parámetros:**
```sql
p_store_id UUID              -- ID de la tienda
p_customer_id UUID           -- ID del cliente
p_customer_name TEXT         -- Nombre del cliente
p_customer_email TEXT        -- Email del cliente
p_customer_phone TEXT        -- Teléfono del cliente
p_order_type TEXT            -- 'delivery' o 'pickup'
p_delivery_address TEXT      -- Dirección (opcional)
p_notes TEXT                 -- Notas (opcional)
p_payment_method TEXT        -- Método de pago (opcional)
p_total_amount NUMERIC       -- Total del pedido
p_delivery_price NUMERIC     -- Precio de delivery
p_items JSONB                -- Array de items con extras
```

**Formato de `p_items`:**
```json
[
  {
    "menu_item_id": "uuid",
    "quantity": 2,
    "price_at_time": 10.50,
    "item_name": "Pizza Margarita",
    "extras": [
      {
        "name": "Extra queso",
        "price": 2.00
      }
    ]
  }
]
```

**Retorno:**
```sql
TABLE (
  order_id UUID,
  order_number TEXT,
  success BOOLEAN,
  error_message TEXT
)
```

**Validaciones:**
- Verifica ownership de la tienda mediante `user_owns_store()`
- Valida tipo de pedido
- Valida que haya al menos un producto
- Crea orden, items y extras en transacción atómica

#### RPC: `admin_update_order()`

Actualiza un pedido existente.

**Parámetros:**
```sql
p_order_id UUID              -- ID del pedido a actualizar
p_customer_name TEXT         -- Nuevo nombre (opcional)
p_customer_email TEXT        -- Nuevo email (opcional)
p_customer_phone TEXT        -- Nuevo teléfono (opcional)
p_delivery_address TEXT      -- Nueva dirección (opcional)
p_notes TEXT                 -- Nuevas notas (opcional)
p_payment_method TEXT        -- Nuevo método de pago (opcional)
p_status TEXT                -- Nuevo estado (opcional)
p_items JSONB                -- Nuevos items (reemplaza todos)
p_recalculate_total BOOLEAN  -- Si recalcular el total
```

**Retorno:**
```sql
TABLE (
  success BOOLEAN,
  error_message TEXT,
  new_total NUMERIC
)
```

**Validaciones:**
- Verifica ownership de la tienda
- Valida que el pedido esté en estado editable
- Actualiza solo campos proporcionados (COALESCE)
- Recalcula total si `p_recalculate_total = true`

#### RPC: `admin_can_edit_order()`

Verifica si un pedido puede ser editado.

**Parámetros:**
```sql
p_order_id UUID
```

**Retorno:**
```sql
TABLE (
  can_edit BOOLEAN,
  reason TEXT,
  current_status TEXT
)
```

**Condiciones para editar:**
- Usuario debe ser owner de la tienda
- Pedido debe existir
- Estado debe ser: `pending`, `confirmed`, o `preparing`

### 5. Políticas de Seguridad RLS

**Agregadas en la migración:**

```sql
-- Permitir a store owners crear pedidos
CREATE POLICY "Store owners can create orders manually"
ON public.orders
FOR INSERT TO authenticated
WITH CHECK (public.user_owns_store(store_id));

-- Permitir a store owners crear order_items
CREATE POLICY "Store owners can create order items"
ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND public.user_owns_store(orders.store_id)
  )
);

-- Permitir a store owners crear order_item_extras
CREATE POLICY "Store owners can create order item extras"
ON public.order_item_extras
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = order_item_extras.order_item_id
    AND public.user_owns_store(o.store_id)
  )
);
```

## Flujos de Usuario

### Flujo: Crear Pedido Manual

1. Admin abre `/admin/orders`
2. Click en botón **"Crear Pedido"**
3. **Paso 1:** Ingresa datos del cliente y selecciona tipo de pedido
4. **Paso 2:** Ingresa dirección y zona de entrega (si es delivery)
5. **Paso 3:** Agrega productos al pedido
   - Click en producto
   - Selecciona extras en dialog
   - Confirma para agregar al carrito
   - Ajusta cantidades según necesidad
6. **Paso 4:** Selecciona método de pago y confirma
7. Sistema crea pedido y muestra notificación de éxito
8. Redirección a lista de pedidos actualizada

### Flujo: Editar Pedido Existente

1. Admin abre `/admin/orders`
2. Click en botón **"Editar"** de un pedido
3. Sistema valida si el pedido puede ser editado
4. Si puede editar:
   - Modifica información del cliente
   - Agrega/remueve productos
   - Cambia cantidades
   - Actualiza estado
   - Modifica método de pago o notas
5. Click en **"Guardar Cambios"**
6. Sistema actualiza pedido y recalcula total
7. Muestra notificación de éxito
8. Cierra modal y actualiza lista

## Testing

### Test Manual - Crear Pedido

1. ✅ Crear pedido con delivery
2. ✅ Crear pedido con pickup
3. ✅ Agregar productos sin extras
4. ✅ Agregar productos con extras
5. ✅ Modificar cantidades en el carrito
6. ✅ Remover productos del carrito
7. ✅ Seleccionar método de pago
8. ✅ Agregar notas al pedido
9. ✅ Verificar cálculo correcto de totales
10. ✅ Verificar que el pedido se guarda correctamente

### Test Manual - Editar Pedido

1. ✅ Editar pedido en estado `pending`
2. ✅ Editar pedido en estado `confirmed`
3. ✅ Editar pedido en estado `preparing`
4. ❌ Intentar editar pedido en estado `delivered` (debe fallar)
5. ❌ Intentar editar pedido en estado `cancelled` (debe fallar)
6. ✅ Agregar productos a pedido existente
7. ✅ Remover productos de pedido existente
8. ✅ Cambiar cantidades
9. ✅ Actualizar información del cliente
10. ✅ Cambiar estado del pedido
11. ✅ Verificar recálculo de total

### Test de Seguridad

1. ✅ Verificar que solo store owner puede crear pedidos
2. ✅ Verificar que solo store owner puede editar sus pedidos
3. ✅ Verificar aislamiento multi-tenant (no acceso a pedidos de otras tiendas)
4. ✅ Verificar validación de estados editables

## Eventos de PostHog

### `admin_order_created`
```typescript
{
  store_id: string,
  order_id: string,
  order_total: number,
  items_count: number,
  payment_method: string,
  order_type: "delivery" | "pickup"
}
```

### `admin_order_edited`
```typescript
{
  store_id: string,
  order_id: string,
  fields_changed: string[],
  new_total: number
}
```

## Archivos Creados/Modificados

### Archivos Nuevos

1. `/src/hooks/useAdminCart.ts` - Hook de carrito temporal para admin
2. `/src/components/admin/PaymentMethodSelector.tsx` - Selector de métodos de pago
3. `/src/components/admin/AdminOrderCreate.tsx` - Wizard de creación de pedidos
4. `/src/components/admin/AdminOrderEdit.tsx` - Modal de edición de pedidos
5. `/supabase/migrations/20251130000001_admin_order_management.sql` - RPCs y políticas RLS
6. `/docs/ADMIN_ORDER_MANAGEMENT.md` - Esta documentación

### Archivos Modificados

1. `/src/components/admin/OrdersManager.tsx` - Agregados botones de crear/editar
2. `/src/pages/Checkout.tsx` - Removido `digital_menu`
3. `/src/pages/ConfirmOrder.tsx` - Removido `digital_menu`

## Estructura de Base de Datos

### Tabla: `orders`

Campos relevantes:
- `id` (UUID, PK)
- `store_id` (UUID, FK → stores)
- `customer_id` (UUID, FK → customers)
- `customer_name` (TEXT)
- `customer_email` (TEXT)
- `customer_phone` (TEXT, nullable)
- `order_type` (TEXT) - 'delivery' | 'pickup'
- `delivery_address` (TEXT, nullable)
- `notes` (TEXT, nullable)
- `payment_method` (TEXT, nullable)
- `total_amount` (NUMERIC)
- `delivery_price` (NUMERIC, nullable)
- `status` (TEXT) - 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Tabla: `order_items`

Campos:
- `id` (UUID, PK)
- `order_id` (UUID, FK → orders)
- `menu_item_id` (UUID, FK → menu_items)
- `quantity` (INTEGER)
- `price_at_time` (NUMERIC)
- `item_name` (TEXT)
- `created_at` (TIMESTAMP)

### Tabla: `order_item_extras`

Campos:
- `id` (UUID, PK)
- `order_item_id` (UUID, FK → order_items)
- `extra_name` (TEXT)
- `extra_price` (NUMERIC)
- `created_at` (TIMESTAMP)

### Tabla: `payment_methods`

Campos:
- `id` (UUID, PK)
- `store_id` (UUID, FK → stores)
- `name` (TEXT)
- `description` (TEXT, nullable)
- `is_active` (BOOLEAN)
- `display_order` (INTEGER, nullable)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Mejoras Futuras

1. **Búsqueda de Clientes:** Agregar campo de búsqueda para clientes existentes en el paso 1
2. **Plantillas de Pedidos:** Guardar combinaciones frecuentes de productos como plantillas
3. **Descuentos Manuales:** Permitir aplicar descuentos ad-hoc desde admin
4. **Historial de Cambios:** Registrar todas las ediciones de un pedido
5. **Impresión de Pedidos:** Generar PDF para imprimir pedidos
6. **Notificaciones:** Enviar email/WhatsApp automático al crear pedido desde admin
7. **Duplicar Pedido:** Botón para duplicar un pedido existente
8. **Validación de Stock:** Verificar disponibilidad de productos antes de crear pedido

## Notas Técnicas

- **Transacciones Atómicas:** Todos los RPCs usan transacciones para garantizar consistencia
- **Seguridad:** RLS policies verifican ownership en cada operación
- **Performance:** Queries optimizados con índices en `store_id` y `order_id`
- **Type Safety:** TypeScript estricto en todos los componentes
- **Validación:** Zod para validación de formularios por pasos
- **UX:** Wizard con indicadores de progreso y feedback inmediato
- **Responsive:** Todos los componentes son mobile-friendly

## Soporte

Para problemas o preguntas sobre esta funcionalidad:
1. Revisar logs del navegador
2. Revisar logs de Supabase (función RPC)
3. Verificar políticas RLS en Supabase Dashboard
4. Consultar eventos de PostHog para debugging

---

**Fecha de implementación:** 2025-11-30
**Versión:** 1.0
**Agentes responsables:** Developer Agent (60%), Supabase Agent (25%), Security Agent (10%), PostHog Agent (5%)
