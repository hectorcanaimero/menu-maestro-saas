# 🔍 Diagnóstico Paso a Paso - Extras No Aparecen

## Paso 1: Verificar que el Script SQL se Aplicó Correctamente

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- Verificar que menu_item_id es nullable
SELECT
  column_name,
  is_nullable,
  data_type
FROM information_schema.columns
WHERE table_name = 'product_extras'
  AND column_name = 'menu_item_id';

-- Resultado esperado: is_nullable = 'YES'
```

**¿Qué resultado obtuviste?** (Copia y pega la respuesta)

---

## Paso 2: Verificar que los Grupos Existen y Están Activos

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- Reemplaza 'uuid-de-tu-tienda' con el ID real de tu tienda
-- Puedes obtenerlo desde Admin → Settings o desde la tabla stores

SELECT
  id,
  name,
  selection_type,
  is_required,
  is_active,
  category_id,
  min_selections,
  max_selections
FROM extra_groups
WHERE store_id = 'uuid-de-tu-tienda'  -- REEMPLAZA ESTO
ORDER BY name;
```

**¿Qué resultado obtuviste?** (¿Cuántos grupos aparecen? ¿Tienen `is_active = true`?)

---

## Paso 3: Verificar que los Grupos Tienen Extras

**Ejecuta esto en Supabase SQL Editor:**

```sql
-- Reemplaza 'uuid-de-tu-tienda' con el ID real
SELECT
  eg.name as grupo,
  eg.id as grupo_id,
  pe.name as extra,
  pe.price,
  pe.is_available,
  pe.is_default
FROM extra_groups eg
LEFT JOIN product_extras pe ON pe.group_id = eg.id
WHERE eg.store_id = 'uuid-de-tu-tienda'  -- REEMPLAZA ESTO
ORDER BY eg.name, pe.display_order;
```

**¿Qué resultado obtuviste?**
- ¿Aparecen extras para cada grupo?
- Si ves `NULL` en las columnas de extras, significa que el grupo está vacío

---

## Paso 4: Verificar las Asignaciones

**Para grupo de categoría:**

```sql
-- Ver grupos asignados a categorías
SELECT
  eg.name as grupo,
  c.name as categoria,
  COUNT(mi.id) as productos_en_categoria
FROM extra_groups eg
INNER JOIN categories c ON c.id = eg.category_id
LEFT JOIN menu_items mi ON mi.category_id = c.id AND mi.is_available = true
WHERE eg.store_id = 'uuid-de-tu-tienda'  -- REEMPLAZA ESTO
  AND eg.category_id IS NOT NULL
GROUP BY eg.id, eg.name, c.name;
```

**Para grupo de productos:**

```sql
-- Ver grupos asignados a productos específicos
SELECT
  eg.name as grupo,
  mi.name as producto,
  pe.id as assignment_id
FROM product_extras pe
INNER JOIN extra_groups eg ON eg.id = pe.group_id
INNER JOIN menu_items mi ON mi.id = pe.menu_item_id
WHERE eg.store_id = 'uuid-de-tu-tienda'  -- REEMPLAZA ESTO
  AND pe.menu_item_id IS NOT NULL
ORDER BY eg.name, mi.name;
```

**¿Qué resultado obtuviste?**
- ¿Aparecen asignaciones?
- Si no aparece nada, los grupos no están asignados

---

## Paso 5: Probar la Función de Base de Datos

**Selecciona un producto de tu catálogo y obtén su ID:**

```sql
-- Ver productos disponibles con sus IDs
SELECT
  id,
  name,
  category_id
FROM menu_items
WHERE store_id = 'uuid-de-tu-tienda'  -- REEMPLAZA ESTO
  AND is_available = true
LIMIT 10;
```

**Ahora prueba la función con uno de esos productos:**

```sql
-- Reemplaza 'uuid-del-producto' con un ID real de arriba
SELECT * FROM get_product_extra_groups('uuid-del-producto');
```

**¿Qué resultado obtuviste?**
- Si retorna filas: Los grupos se están obteniendo correctamente
- Si retorna vacío: Hay un problema con la función o las asignaciones

---

## Paso 6: Verificar Errores en el Navegador

1. **Abre tu catálogo** en el navegador
2. **Presiona F12** para abrir DevTools
3. **Ve a la pestaña "Console"**
4. **Haz clic en "Agregar"** en cualquier producto
5. **Copia TODOS los errores** que aparezcan en rojo

**¿Qué errores ves?** (Copia y pega)

---

## Paso 7: Verificar el Network Tab

1. Con **DevTools abierto** (F12)
2. Ve a la pestaña **"Network"**
3. Haz clic en **"Agregar"** en un producto
4. Busca la llamada a **`get_product_extra_groups`** o **`product_extras`**
5. Haz clic en ella y ve a **"Response"**

**¿Qué respuesta obtuviste?** (Copia el JSON)

---

## Flujo Correcto Completo

### 1️⃣ Crear Grupo (Admin)

```
Admin → Grupos de Extras → Crear Grupo
├─ Nombre: "Tamaño"
├─ Tipo: Single (radio)
├─ Requerido: ✓
├─ Min: 1, Max: 1
└─ Activo: ✓
```

**Base de Datos:**
```sql
INSERT INTO extra_groups (store_id, name, selection_type, is_required, ...)
VALUES ('store-uuid', 'Tamaño', 'single', true, ...);
```

---

### 2️⃣ Agregar Extras al Grupo (Admin)

```
Gestionar Extras → Agregar Extra (x3)
├─ Pequeña | $0 | Default: ✓
├─ Mediana | $3
└─ Grande  | $5
```

**Base de Datos:**
```sql
INSERT INTO product_extras (group_id, name, price, is_available, is_default, ...)
VALUES
  ('group-uuid', 'Pequeña', 0, true, true, ...),
  ('group-uuid', 'Mediana', 3, true, false, ...),
  ('group-uuid', 'Grande', 5, true, false, ...);
```

---

### 3️⃣ Asignar a Categoría (Admin)

```
Asignar a Productos → Por Categoría → Seleccionar "Pizzas"
```

**Base de Datos:**
```sql
UPDATE extra_groups
SET category_id = 'pizzas-category-uuid'
WHERE id = 'group-uuid';
```

---

### 4️⃣ Cliente Abre Producto (Frontend)

**Cuando el cliente hace clic en "Agregar":**

```typescript
// 1. ProductCard abre ProductExtrasDialog
<ProductExtrasDialog
  productId="pizza-uuid"
  open={true}
  ...
/>

// 2. ProductExtrasDialog llama a useProductExtraGroups
const { data: groupedExtras } = useProductExtraGroups('pizza-uuid');

// 3. Hook ejecuta servicio
extraGroupsService.getGroupsForProduct('pizza-uuid')

// 4. Servicio llama a función de BD
supabase.rpc('get_product_extra_groups', { p_product_id: 'pizza-uuid' })

// 5. Función retorna grupos que coinciden con el producto
```

**La función `get_product_extra_groups` hace:**

```sql
-- Busca grupos asignados directamente al producto
SELECT * FROM extra_groups eg
WHERE eg.id IN (
  SELECT group_id FROM product_extras
  WHERE menu_item_id = 'pizza-uuid'
)

UNION

-- Busca grupos asignados a la categoría del producto
SELECT * FROM extra_groups eg
WHERE eg.category_id = (
  SELECT category_id FROM menu_items WHERE id = 'pizza-uuid'
)
```

---

### 5️⃣ Obtener Extras de Cada Grupo

```typescript
// Después de obtener los grupos, busca los extras
const { data: extrasData } = await supabase
  .from('product_extras')
  .select('*')
  .in('group_id', groupIds)  // IDs de los grupos obtenidos
  .eq('is_available', true)
  .order('display_order');
```

---

### 6️⃣ Filtrar Grupos Vacíos

```typescript
// CRÍTICO: Se filtran grupos sin extras
.filter((ge) => ge.extras.length > 0)
```

**Si un grupo no tiene extras, NO aparecerá aunque esté asignado.**

---

### 7️⃣ Renderizar en Dialog

```tsx
{groupedExtras.map((groupedExtra) => {
  const { group, extras } = groupedExtra;

  return (
    <div key={group.id}>
      <h4>{group.name} {group.is_required && '*'}</h4>

      {group.selection_type === 'single' ? (
        <RadioGroup>
          {extras.map(extra => (
            <RadioButton value={extra.id}>
              {extra.name} - ${extra.price}
            </RadioButton>
          ))}
        </RadioGroup>
      ) : (
        <div>
          {extras.map(extra => (
            <Checkbox>
              {extra.name} - ${extra.price}
            </Checkbox>
          ))}
        </div>
      )}
    </div>
  );
})}
```

---

## Checklist de Verificación

Marca lo que ya verificaste:

- [ ] Script SQL aplicado (menu_item_id es nullable)
- [ ] Grupos existen en `extra_groups` con `is_active = true`
- [ ] Cada grupo tiene al menos 1 extra en `product_extras`
- [ ] Extras tienen `is_available = true`
- [ ] Grupo está asignado (tiene `category_id` O hay registros en `product_extras` con ese `group_id` y `menu_item_id`)
- [ ] Función `get_product_extra_groups` retorna resultados para un producto
- [ ] No hay errores en la consola del navegador
- [ ] Network tab muestra que se está llamando a la función correctamente

---

## Próximos Pasos

**Después de ejecutar cada consulta SQL arriba, comparte los resultados** y podré identificar exactamente dónde está el problema.

**Probables causas basadas en síntomas:**

1. **Grupos sin extras** → Paso 3 mostrará `NULL` en columnas de extras
2. **Grupos no asignados** → Paso 4 retornará vacío
3. **Función no encuentra grupos** → Paso 5 retornará vacío
4. **Error de RLS** → Paso 6 mostrará error en consola
5. **Script SQL no aplicado** → Paso 1 mostrará `is_nullable = 'NO'`

Por favor ejecuta las consultas y comparte los resultados para continuar. 🔍
