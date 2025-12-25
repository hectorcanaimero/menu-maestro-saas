# Cómo Funciona el Sistema de Extras Agrupados

## 🎯 Resumen Ejecutivo

**TODO está funcionando correctamente**. El sistema de grupos de extras:
- ✅ Valida reglas obligatorias (required)
- ✅ Valida mínimos y máximos de selección
- ✅ Calcula precios correctamente en carrito y checkout
- ✅ Soporta asignación por categoría o productos individuales
- ✅ Mantiene compatibilidad con extras sin agrupar

**Solo necesitas**: Ejecutar el script SQL `fix_product_extras_rls_safe.sql` en Supabase.

---

## 📊 Flujo Completo: Del Catálogo al Checkout

### 1️⃣ **Cliente ve el Producto**

```
Catálogo → Cliente hace clic en "Agregar al Carrito"
          ↓
Se abre ProductExtrasDialog
```

### 2️⃣ **ProductExtrasDialog - Selección y Validación**

El diálogo muestra los grupos organizados:

```
┌────────────────────────────────────────┐
│  Tamaño (Requerido) ● Única            │
│  ○ Pequeña    $5                       │
│  ○ Mediana    $8                       │
│  ○ Grande     $10   ← Cliente selecciona│
├────────────────────────────────────────┤
│  Ingredientes (0-3) ☐ Múltiple         │
│  ☐ Pepperoni  $2                       │
│  ☑ Jamón      $2    ← Cliente selecciona│
│  ☑ Champiñones $1.5 ← Cliente selecciona│
└────────────────────────────────────────┘
```

**Validaciones en Tiempo Real:**

```typescript
// src/services/extraGroupsService.ts:325-395
validateExtrasSelection(selection, groups)

✓ Grupos obligatorios completados
✓ Mínimo de selecciones cumplido
✓ Máximo de selecciones respetado
✓ Tipo de selección correcto (single vs multiple)
```

### 3️⃣ **Confirmación de Extras**

```typescript
// src/components/catalog/ProductExtrasDialog.tsx:122-149
const handleConfirm = () => {
  // ❌ Bloqueado si no pasa validación
  if (!validationResult.isValid) {
    return; // NO permite confirmar
  }

  // ✅ Obtiene extras seleccionados con sus precios
  const selectedExtras = getSelectedExtrasDetails(selection, groupedExtras);

  // Ejemplo de resultado:
  // [
  //   { id: 'uuid', name: 'Grande', price: 10, group_id: 'uuid', group_name: 'Tamaño' },
  //   { id: 'uuid', name: 'Jamón', price: 2, group_id: 'uuid', group_name: 'Ingredientes' },
  //   { id: 'uuid', name: 'Champiñones', price: 1.5, group_id: 'uuid', group_name: 'Ingredientes' }
  // ]

  onConfirm(selectedExtras); // Pasa al ProductCard
};
```

### 4️⃣ **Agregando al Carrito**

```typescript
// src/components/catalog/ProductCard.tsx:70-72
const handleConfirmWithExtras = (extras) => {
  addItem({
    id: 'pizza-123',
    name: 'Pizza Napolitana',
    price: 15,
    image_url: '...',
    extras: [
      { name: 'Grande', price: 10 },
      { name: 'Jamón', price: 2 },
      { name: 'Champiñones', price: 1.5 }
    ],
    categoryId: 'pizzas'
  });
};
```

### 5️⃣ **Cálculo de Totales en el Carrito**

```typescript
// src/contexts/CartContext.tsx:234-237
const totalPrice = items.reduce((sum, item) => {
  // Suma TODOS los precios de extras
  const extrasPrice = item.extras?.reduce((acc, extra) => acc + extra.price, 0) || 0;
  // extrasPrice = 10 + 2 + 1.5 = $13.5

  // Total = (Producto + Extras) × Cantidad
  return sum + (item.price + extrasPrice) * item.quantity;
  // = (15 + 13.5) × 1 = $28.5
}, 0);
```

### 6️⃣ **Visualización en el Checkout**

```typescript
// src/pages/Checkout.tsx:976
<DualPrice
  price={(item.price + (item.extras?.reduce((sum, e) => sum + e.price, 0) || 0)) * item.quantity}
/>
// Muestra: $28.50
```

---

## 🎨 Ejemplo Completo: Pizzería

### Setup del Administrador

**1. Crear Grupo "Tamaño"**
```
Nombre: Tamaño
Tipo: Única (radio)
Requerido: ✓ Sí
Min: 1
Max: 1
```

**2. Agregar Extras al Grupo**
```
- Pequeña: $5
- Mediana: $8  (marcar como default)
- Grande: $10
```

**3. Asignar a Categoría "Pizzas"**
```
Modo: Por Categoría
Categoría seleccionada: Pizzas
```

**Resultado**: TODAS las pizzas ahora tienen automáticamente el grupo "Tamaño".

### Experiencia del Cliente

**Producto**: Pizza Napolitana ($15)

**Cliente hace clic en "Agregar"**:
```
┌──────────────────────────────────┐
│  Pizza Napolitana                │
│  Precio base: $15                │
├──────────────────────────────────┤
│  Tamaño (Requerido) *            │
│  ○ Pequeña    +$5                │
│  ● Mediana    +$8   ← Pre-selected│
│  ○ Grande     +$10               │
├──────────────────────────────────┤
│  Total: $23.00                   │
│  [Cancelar] [Agregar al Carrito] │
└──────────────────────────────────┘
```

**Flujo de Validación**:
1. ❌ Cliente NO puede hacer clic en "Agregar" sin seleccionar un tamaño
2. ✅ "Mediana" está pre-seleccionada (is_default)
3. ✅ Total se actualiza en tiempo real: $15 + $8 = $23
4. ✅ Al confirmar, se agrega al carrito con precio correcto

**En el Carrito**:
```
Pizza Napolitana (Mediana)
1 × $23.00 = $23.00
```

**En el Checkout**:
```
Resumen del Pedido
─────────────────
1x Pizza Napolitana       $23.00

Subtotal:                 $23.00
Delivery:                  $3.00
─────────────────
Total:                    $26.00
```

---

## 🔍 Validaciones Implementadas

### 1. Grupos Obligatorios (`is_required: true`)

```typescript
// src/services/extraGroupsService.ts:337-346
if (group.is_required && selectedCount < group.min_selections) {
  errors.push({
    groupId: group.id,
    groupName: group.name,
    message: group.min_selections === 1
      ? `Debes seleccionar una opción`
      : `Debes seleccionar al menos ${group.min_selections} opciones`,
  });
}
```

**Ejemplo**:
- Grupo "Tamaño" con `is_required: true`, `min_selections: 1`
- ❌ Cliente NO puede continuar sin seleccionar
- Botón "Agregar" permanece deshabilitado

### 2. Mínimo de Selecciones (`min_selections`)

```typescript
// src/services/extraGroupsService.ts:350-357
if (selectedCount > 0 && selectedCount < group.min_selections) {
  errors.push({
    message: `Debes seleccionar al menos ${group.min_selections} opciones`,
  });
}
```

**Ejemplo**:
- Grupo "Ingredientes" con `min_selections: 2`
- Cliente selecciona 1 ingrediente
- ❌ Mensaje: "Debes seleccionar al menos 2 opciones"

### 3. Máximo de Selecciones (`max_selections`)

```typescript
// src/services/extraGroupsService.ts:360-367
if (group.max_selections && selectedCount > group.max_selections) {
  errors.push({
    message: `No puedes seleccionar más de ${group.max_selections} opciones`,
  });
}
```

**Ejemplo**:
- Grupo "Toppings" con `max_selections: 3`
- Cliente intenta seleccionar 4to topping
- ❌ Checkbox se deshabilita o muestra error

### 4. Tipo de Selección (`selection_type`)

```typescript
// src/services/extraGroupsService.ts:370-377
if (group.selection_type === 'single' && selectedCount > 1) {
  errors.push({
    message: `Solo puedes seleccionar una opción`,
  });
}
```

**Ejemplo**:
- Grupo "Tamaño" con `selection_type: 'single'`
- ✓ Se renderiza como Radio Buttons (solo una opción)
- Grupo "Ingredientes" con `selection_type: 'multiple'`
- ✓ Se renderiza como Checkboxes (varias opciones)

---

## 💰 Cálculo de Precios

### Fórmula General

```
Total Item = (Precio Base + Suma de Extras) × Cantidad
```

### Ejemplo Detallado

**Producto**: Hamburguesa Premium ($12)

**Extras Seleccionados**:
- Tamaño Grande: $3
- Extra Queso: $2
- Tocino: $2.5
- Aguacate: $1.5

**Cálculo Paso a Paso**:

```typescript
// 1. Calcular suma de extras
const extrasPrice = item.extras.reduce((sum, extra) => sum + extra.price, 0);
// = 3 + 2 + 2.5 + 1.5 = $9

// 2. Precio unitario del item
const itemPrice = item.price + extrasPrice;
// = 12 + 9 = $21

// 3. Total considerando cantidad
const itemTotal = itemPrice * item.quantity;
// = 21 × 2 = $42 (si compró 2 hamburguesas)
```

**Visualización en UI**:
```
Carrito:
2x Hamburguesa Premium        $42.00
   - Grande (+$3)
   - Extra Queso (+$2)
   - Tocino (+$2.5)
   - Aguacate (+$1.5)
```

---

## 🎭 Casos de Uso Reales

### Caso 1: Pizzería

**Categoría**: Pizzas

**Grupos**:
1. **Tamaño** (single, required, min=1, max=1)
   - Pequeña: $0
   - Mediana: $3
   - Grande: $5
   - Familiar: $8

2. **Tipo de Masa** (single, optional, min=0, max=1)
   - Delgada: $0 (default)
   - Gruesa: $1
   - Rellena de queso: $3

3. **Ingredientes Extra** (multiple, optional, min=0, max=5)
   - Pepperoni: $2
   - Jamón: $2
   - Champiñones: $1.5
   - Aceitunas: $1
   - Piña: $1.5

**Resultado**: Todas las 15 pizzas del menú tienen estos grupos automáticamente.

### Caso 2: Tienda de Celulares

**Producto**: iPhone 15

**Grupos**:
1. **Color** (single, required, min=1, max=1)
   - Blanco: $0
   - Negro: $0
   - Azul: $0
   - Rosa: $0

2. **Capacidad** (single, required, min=1, max=1)
   - 128GB: $0
   - 256GB: $100
   - 512GB: $200
   - 1TB: $300

3. **Accesorios** (multiple, optional, min=0, max=3)
   - Funda: $15
   - Protector de pantalla: $10
   - Cargador rápido: $25
   - AirPods: $150

### Caso 3: Cafetería

**Categoría**: Bebidas Calientes

**Grupos**:
1. **Tamaño** (single, required, min=1, max=1)
   - Pequeño: $0
   - Mediano: $1.5 (default)
   - Grande: $2.5

2. **Tipo de Leche** (single, optional, min=0, max=1)
   - Normal: $0 (default)
   - Deslactosada: $0.5
   - Almendras: $1
   - Coco: $1

3. **Endulzante** (multiple, optional, min=0, max=2)
   - Azúcar: $0
   - Miel: $0.5
   - Stevia: $0.3

---

## 🚀 Ventajas del Sistema

### 1. **Validación Automática**
- ✅ Cliente NO puede hacer pedidos inválidos
- ✅ Sistema garantiza que se cumplen las reglas de negocio
- ✅ Reduce errores y devoluciones

### 2. **Cálculo Preciso**
- ✅ Precios siempre correctos en carrito y checkout
- ✅ No hay discrepancias entre lo mostrado y lo cobrado
- ✅ Cliente ve el total en tiempo real

### 3. **Asignación Flexible**
- ✅ Asignar a categoría completa (eficiente)
- ✅ Asignar a productos específicos (personalizado)
- ✅ Un grupo puede estar en una categoría O en productos, no ambos

### 4. **Experiencia de Usuario**
- ✅ Interfaces claras (radio para única, checkbox para múltiple)
- ✅ Validaciones con mensajes descriptivos
- ✅ Pre-selección de valores default
- ✅ Indicador de progreso para grupos requeridos

### 5. **Mantenibilidad**
- ✅ Agregar nuevos extras solo al grupo (no producto por producto)
- ✅ Cambiar reglas de validación en un solo lugar
- ✅ Compatibilidad con extras antiguos sin agrupar

---

## 📋 Checklist de Implementación

### ✅ Ya Completado

- [x] Migración de base de datos (tablas `extra_groups`, `product_extras` actualizada)
- [x] Servicios de negocio (`extraGroupsService.ts`)
- [x] Hooks de React Query (`useExtraGroups.ts`)
- [x] Admin UI - Crear grupos (`AdminExtraGroups.tsx`)
- [x] Admin UI - Gestionar extras del grupo
- [x] Admin UI - Asignar a productos (`AssignGroupDialog.tsx`)
- [x] Admin UI - Asignar a categorías (`AssignGroupDialog.tsx`)
- [x] Cliente UI - Diálogo de selección (`ProductExtrasDialog.tsx`)
- [x] Validaciones de selección (obligatorio, min/max)
- [x] Cálculo de precios en carrito
- [x] Cálculo de precios en checkout
- [x] Backward compatibility (extras sin agrupar)

### ⚠️ Pendiente

- [ ] **CRÍTICO**: Aplicar `fix_product_extras_rls_safe.sql` en Supabase
  - Este script actualiza las políticas RLS para permitir crear extras en grupos
  - Sin esto, verás error de permisos al crear extras

### 🎯 Opcional (Mejoras Futuras)

- [ ] UI para mostrar grupos heredados de categoría en vista de producto
- [ ] Migrar extras antiguos sin agrupar (usar `src/utils/migrateUngroupedExtras.ts`)
- [ ] Tests automatizados
- [ ] Documentación de API

---

## 🐛 Troubleshooting

### ⚠️ Extras NO Aparecen en el Catálogo (COMÚN)

**Síntoma**: Creaste grupos pero no aparecen cuando haces clic en "Agregar" en un producto.

**Causa Más Probable**: Los grupos están vacíos (no tienen extras dentro).

**Solución Rápida**:
1. Ve a **Admin → Grupos de Extras**
2. Haz clic en **"Gestionar Extras"** en el grupo
3. Agrega al menos 1 extra con nombre y precio
4. Marca el extra como **"Disponible"**

**📋 Para depuración detallada, ver**: [DEBUG_EXTRAS_NO_APARECEN.md](DEBUG_EXTRAS_NO_APARECEN.md)

---

### Error: "new row violates row-level security policy"

**Causa**: No has aplicado el script SQL de fix.

**Solución**: Ejecuta `fix_product_extras_rls_safe.sql` en Supabase SQL Editor.

### Error: "null value in column menu_item_id"

**Causa**: Constraint NOT NULL aún existe.

**Solución**: El script `fix_product_extras_rls_safe.sql` lo remueve automáticamente.

### Extras no aparecen en el diálogo del cliente

**Verificar**:
1. ¿El grupo tiene `is_active = true`?
2. ¿Los extras tienen `is_available = true`?
3. ¿El grupo está asignado al producto o su categoría?
4. ¿El grupo tiene al menos 1 extra? (grupos vacíos se filtran)
5. Revisa la consola del navegador para errores

### Validación no funciona

**Verificar**:
1. ¿Los valores de `min_selections`, `max_selections` son correctos?
2. ¿El `selection_type` es 'single' o 'multiple'?
3. ¿El grupo tiene `is_required = true` si es obligatorio?

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la consola del navegador (F12)
2. Verifica que aplicaste el script SQL correctamente
3. Consulta los archivos de documentación en este mismo directorio

**Archivos de Referencia**:
- `EXTRAS_MIGRATION_README.md` - Guía de migración completa
- `fix_product_extras_rls_safe.sql` - Script SQL seguro
- `src/services/extraGroupsService.ts` - Lógica de validación
- `src/components/catalog/ProductExtrasDialog.tsx` - UI cliente
