# Actualización: Validación de Horarios en Carrito de Compras

## 📋 Cambio Implementado

Se agregó validación de horarios de tienda en el botón **"Realizar Pedido"** del carrito de compras (CartSheet).

## 🎯 Objetivo

Prevenir que los usuarios intenten realizar pedidos desde el carrito cuando la tienda está cerrada, mostrando el mismo dialog informativo que se muestra en el checkout.

## ✅ Implementación

### Archivo Modificado: `src/components/cart/CartSheet.tsx`

#### 1. Imports Agregados

```typescript
import { useState } from "react";
import { useStoreStatus } from "@/hooks/useStoreStatus";
import { StoreClosedDialog } from "@/components/catalog/StoreClosedDialog";
```

#### 2. Hook y Estado

```typescript
export const CartSheet = () => {
  // ... otros hooks

  const { status: storeStatus } = useStoreStatus(store?.id, store?.force_status || null);
  const [showClosedDialog, setShowClosedDialog] = useState(false);
```

#### 3. Función de Validación

```typescript
const handleCheckout = () => {
  // Validate store is open
  if (!storeStatus.isOpen) {
    setShowClosedDialog(true);
    return;
  }

  navigate("/checkout");
};
```

#### 4. Botón Actualizado

**Antes**:
```typescript
<Button className="w-full" size="lg" onClick={() => navigate("/checkout")}>
  Realizar Pedido
</Button>
```

**Después**:
```typescript
<Button className="w-full" size="lg" onClick={handleCheckout}>
  Realizar Pedido
</Button>
```

#### 5. Dialog Agregado

```typescript
</SheetContent>

{/* Store Closed Dialog */}
<StoreClosedDialog
  open={showClosedDialog}
  onOpenChange={setShowClosedDialog}
  storeName={store?.name}
  nextOpenTime={storeStatus.nextOpenTime}
  onViewHours={() => {
    setShowClosedDialog(false);
  }}
/>
</Sheet>
```

## 🎯 Puntos de Validación

Ahora la validación de horario ocurre en **2 lugares**:

### 1. CartSheet (Carrito)
- ✅ Usuario hace clic en "Realizar Pedido" en el carrito
- ✅ Sistema valida: ¿Tienda abierta?
  - **NO** → Muestra dialog "Tienda cerrada"
  - **SÍ** → Navega a `/checkout`

### 2. Checkout (Finalizar Pedido)
- ✅ Usuario completa los 3 pasos del checkout
- ✅ Usuario hace clic en "Revisar Pedido"
- ✅ Sistema valida: ¿Tienda abierta?
  - **NO** → Muestra dialog "Tienda cerrada"
  - **SÍ** → Procesa pedido

## 📊 Flujo Completo Actualizado

```
1. Usuario agrega productos al carrito
   ↓
2. Usuario abre el carrito (Sheet lateral)
   ↓
3. Usuario hace clic en "Realizar Pedido"
   ↓
4. Sistema valida: ¿Tienda abierta?
   ├─ NO → Dialog "Tienda cerrada" + Próximo horario
   │        └─ Usuario informado
   │        └─ No navega a checkout
   └─ SÍ → Navega a /checkout
            ↓
            Usuario completa checkout (3 pasos)
            ↓
            Click en "Revisar Pedido"
            ↓
            Sistema valida nuevamente: ¿Tienda abierta?
            ├─ NO → Dialog "Tienda cerrada"
            └─ SÍ → Procesa pedido
```

## 🎨 Beneficios de la Doble Validación

### Validación en Carrito (Nueva):
- ✅ **Feedback más temprano** - Usuario sabe antes de ir a checkout
- ✅ **Ahorra tiempo** - No completa 3 pasos innecesariamente
- ✅ **Mejor UX** - Información al momento de decidir comprar

### Validación en Checkout (Existente):
- ✅ **Seguridad adicional** - Por si la tienda cierra mientras usuario está en checkout
- ✅ **Previene edge cases** - Usuario puede tardar en completar checkout
- ✅ **Validación final** - Última barrera antes de procesar

## 🔍 Casos de Uso

### Caso 1: Tienda Cierra Mientras Usuario Navega

```
1. 17:55 - Usuario agrega productos (tienda abierta)
2. 18:00 - Tienda cierra
3. 18:02 - Usuario abre carrito y hace clic en "Realizar Pedido"
4. ✅ Dialog muestra: "Tienda cerrada - Próxima apertura: Mañana 08:00"
```

### Caso 2: Usuario Tarda en Checkout

```
1. Usuario hace clic en "Realizar Pedido" (tienda abierta)
2. Usuario toma 10 minutos llenando formulario
3. Tienda cierra durante ese tiempo
4. Usuario hace clic en "Revisar Pedido"
5. ✅ Dialog muestra: "Tienda cerrada"
```

### Caso 3: Tienda Abierta Todo el Tiempo

```
1. Usuario hace clic en "Realizar Pedido" (tienda abierta)
2. ✅ Navega a checkout sin dialog
3. Usuario completa checkout rápidamente
4. Usuario hace clic en "Revisar Pedido" (tienda aún abierta)
5. ✅ Procesa pedido sin dialog
```

## 📱 Experiencia Visual

### En el Carrito (CartSheet):

```
┌─────────────────────────────────┐
│  Carrito de Compras             │
├─────────────────────────────────┤
│                                 │
│  Total: $13,99                  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Realizar Pedido         │  │ ← Click aquí
│  └──────────────────────────┘  │
│                                 │
│  [Productos listados...]        │
└─────────────────────────────────┘

         ↓ (si tienda cerrada)

┌─────────────────────────────────┐
│         🕐                      │
│   Totus está cerrada            │
│                                 │
│ Próxima apertura: Mañana 08:00  │
│                                 │
│  [ Ver Horarios ]               │
│  [  Entendido   ]               │
└─────────────────────────────────┘
```

## 🚀 Estado

- ✅ Validación implementada en CartSheet
- ✅ Validación implementada en Checkout (previa)
- ✅ Dialog reutilizado correctamente
- ✅ HMR funcionando (hot reload)
- ✅ Sin errores de compilación
- ✅ Servidor dev corriendo: `http://localhost:8081/`

## 🧪 Cómo Probar

### Prueba en Carrito:

1. **Configurar tienda como cerrada**:
   - Admin → Configuración → Horarios
   - Configurar para que esté cerrada ahora
   - O usar "Force Status: Closed"

2. **Probar flujo**:
   - Agregar productos al carrito
   - Abrir carrito (botón con icono de carrito)
   - Click en "Realizar Pedido"

3. **Verificar**:
   - ✅ Debe aparecer dialog "Tienda cerrada"
   - ✅ NO debe navegar a checkout
   - ✅ Debe mostrar próximo horario

### Prueba en Checkout (ya existente):

1. **Configurar tienda como abierta**
2. Ir a checkout normalmente
3. **Cambiar a cerrada** durante el checkout
4. Completar los 3 pasos
5. Click en "Revisar Pedido"
6. ✅ Debe aparecer dialog

## 📊 Comparación

| Aspecto | Antes | Después |
|---------|-------|---------|
| Validación en carrito | ❌ No | ✅ Sí |
| Validación en checkout | ✅ Sí | ✅ Sí |
| Dialog informativo | Solo checkout | Carrito + Checkout |
| Feedback temprano | ❌ No | ✅ Sí |
| Previene navegación | ❌ No | ✅ Sí |

## 📝 Archivos Modificados

1. `src/components/cart/CartSheet.tsx`
   - Agregado `useStoreStatus` hook
   - Agregado `StoreClosedDialog` component
   - Agregado estado `showClosedDialog`
   - Creada función `handleCheckout()`
   - Actualizado botón "Realizar Pedido"
   - Agregado dialog en JSX

## 🎉 Resultado

El carrito de compras ahora valida que la tienda esté abierta **antes** de navegar al checkout, proporcionando:

- ✅ **Feedback más temprano** al usuario
- ✅ **Mejor experiencia** de usuario
- ✅ **Consistencia** con el checkout
- ✅ **Prevención** de navegación innecesaria
- ✅ **Doble capa** de validación (carrito + checkout)

---

**Documentado**: 2025-12-05
**Archivo**: `src/components/cart/CartSheet.tsx`
**Estado**: ✅ Implementado y funcionando
