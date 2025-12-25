# 🔍 Debugging: Extras No Aparecen en el Catálogo

## Problema Reportado

> "en el catalogo no se ve los xtras en los productos, cree dos grupos uno de categoria y otro en producto. lso dos no aparecen en el catalogo de productos."

## ✅ Causa Más Probable

**Los grupos fueron creados pero NO tienen extras dentro**. El sistema filtra automáticamente los grupos vacíos.

```typescript
// src/services/extraGroupsService.ts:73
.filter((ge) => ge.extras.length > 0); // Remove empty groups
```

## 🔧 Solución Paso a Paso

### Paso 1: Verificar que los Grupos Tienen Extras

1. Ve a **Admin → Grupos de Extras**
2. Encuentra tus grupos creados
3. Haz clic en **"Gestionar Extras"** en cada grupo
4. ¿Hay extras listados? Si no, necesitas crearlos:

**Crear Extras para el Grupo:**
- Haz clic en **"Agregar Extra"**
- Ingresa:
  - **Nombre**: Ej: "Grande", "Mediana", "Pequeña"
  - **Precio**: Ej: 5, 3, 0
  - **¿Es opción por defecto?**: Marca una si quieres que esté pre-seleccionada
- Haz clic en **"Crear Extra"**
- Repite para cada opción del grupo

### Paso 2: Verificar que el Grupo está Asignado

**Para Grupo de Categoría:**
1. Haz clic en **"Asignar a Productos"** en el grupo
2. Ve a la pestaña **"Por Categoría"**
3. ¿Está seleccionada una categoría?
4. Si no, selecciona una y haz clic en **"Guardar Asignación"**

**Para Grupo de Producto:**
1. Haz clic en **"Asignar a Productos"** en el grupo
2. Ve a la pestaña **"Por Productos"**
3. ¿Están seleccionados productos?
4. Si no, busca y marca los productos, luego **"Guardar Asignación"**

### Paso 3: Verificar que el Grupo está Activo

1. En la lista de grupos, verifica que el grupo tenga el badge **"Activo"**
2. Si dice "Inactivo", edita el grupo y marca **"¿Está activo?"**

### Paso 4: Aplicar el Script SQL (Si No lo Has Hecho)

**CRÍTICO**: Si ves errores al crear extras, ejecuta este script en Supabase:

1. Ve a **Supabase Dashboard → SQL Editor**
2. Copia el contenido de `fix_product_extras_rls_safe.sql`
3. Pégalo y ejecuta
4. Verifica que dice: **"✓ All changes applied successfully!"**

---

## 🐛 Otras Causas Posibles

### Causa 2: Grupo Asignado a Categoría Incorrecta

**Síntoma**: Grupo de categoría creado pero no aparece en productos de esa categoría.

**Verificación**:
1. Ve al producto en el catálogo
2. ¿Qué categoría tiene el producto?
3. ¿El grupo está asignado a ESA categoría exacta?

**Ejemplo**:
- Producto: "Pizza Napolitana" → Categoría: "Pizzas"
- Grupo "Tamaño" debe estar asignado a categoría "Pizzas"
- Si el grupo está en "Bebidas", NO aparecerá en pizzas

### Causa 3: Problema con la Función de Base de Datos

**Síntoma**: Los grupos tienen extras y están asignados, pero aún no aparecen.

**Verificación en Supabase SQL Editor**:

```sql
-- Verifica que la función existe
SELECT routine_name
FROM information_schema.routines
WHERE routine_name = 'get_product_extra_groups';

-- Prueba la función con un producto real
-- Reemplaza 'uuid-del-producto' con el ID real de un producto
SELECT * FROM get_product_extra_groups('uuid-del-producto');
```

**Resultado Esperado**: La función debe retornar los grupos asignados a ese producto.

### Causa 4: Extras Marcados como No Disponibles

**Verificación**:
```sql
-- Verifica el estado de los extras
SELECT
  pe.name,
  pe.is_available,
  eg.name as group_name
FROM product_extras pe
LEFT JOIN extra_groups eg ON pe.group_id = eg.id
WHERE eg.store_id = 'uuid-de-tu-tienda'
ORDER BY eg.name, pe.name;
```

**Problema**: Si `is_available = false`, el extra no aparecerá.

**Solución**: Edita el extra y marca **"¿Está disponible?"**

### Causa 5: Errores de RLS (Row Level Security)

**Síntoma**: Errores en la consola del navegador al abrir el diálogo.

**Verificación**:
1. Abre el producto en el catálogo
2. Presiona **F12** para abrir DevTools
3. Ve a la pestaña **Console**
4. ¿Hay errores en rojo cuando haces clic en "Agregar"?

**Posibles Errores**:
- `"new row violates row-level security policy"` → Aplica `fix_product_extras_rls_safe.sql`
- `"null value in column menu_item_id"` → Aplica `fix_product_extras_rls_safe.sql`

---

## 📊 Checklist de Verificación Completa

Usa este checklist para depurar sistemáticamente:

- [ ] **1. Script SQL Aplicado**
  - [ ] `fix_product_extras_rls_safe.sql` ejecutado en Supabase
  - [ ] Verificación final muestra: "✓ All changes applied successfully!"

- [ ] **2. Grupo Creado Correctamente**
  - [ ] Nombre del grupo configurado
  - [ ] Tipo de selección: Single o Multiple
  - [ ] Reglas: is_required, min_selections, max_selections
  - [ ] Badge "Activo" visible en la lista

- [ ] **3. Extras Agregados al Grupo**
  - [ ] Al menos 1 extra en el grupo
  - [ ] Cada extra tiene nombre y precio
  - [ ] Extras marcados como "Disponible"
  - [ ] Verificado en "Gestionar Extras" del grupo

- [ ] **4. Grupo Asignado a Productos/Categoría**
  - [ ] Si es por categoría: Categoría seleccionada en "Por Categoría"
  - [ ] Si es por producto: Productos marcados en "Por Productos"
  - [ ] "Guardar Asignación" clickeado
  - [ ] No hay error en la confirmación (toast verde)

- [ ] **5. Productos en la Categoría Correcta**
  - [ ] El producto está en la categoría asignada al grupo
  - [ ] Verificado en Admin → Productos

- [ ] **6. Sin Errores en Consola**
  - [ ] F12 → Console → No hay errores en rojo
  - [ ] Al abrir ProductExtrasDialog no hay error de RLS

---

## 🧪 Prueba de Diagnóstico

Ejecuta esta consulta SQL para ver EXACTAMENTE qué está pasando:

```sql
-- Reemplaza estos valores con los reales de tu sistema
DO $$
DECLARE
  v_store_id UUID := 'uuid-de-tu-tienda';
  v_product_id UUID := 'uuid-del-producto';
  v_groups_count INT;
  v_extras_count INT;
  v_assignments_count INT;
BEGIN
  -- Contar grupos de la tienda
  SELECT COUNT(*) INTO v_groups_count
  FROM extra_groups
  WHERE store_id = v_store_id AND is_active = true;

  RAISE NOTICE '===== DIAGNÓSTICO =====';
  RAISE NOTICE '1. Grupos activos en la tienda: %', v_groups_count;

  -- Contar extras en grupos
  SELECT COUNT(*) INTO v_extras_count
  FROM product_extras pe
  JOIN extra_groups eg ON pe.group_id = eg.id
  WHERE eg.store_id = v_store_id AND pe.is_available = true;

  RAISE NOTICE '2. Extras disponibles en grupos: %', v_extras_count;

  -- Mostrar grupos y sus extras
  RAISE NOTICE '3. Detalle de grupos:';
  FOR rec IN (
    SELECT
      eg.name as grupo,
      eg.category_id,
      COUNT(pe.id) as num_extras
    FROM extra_groups eg
    LEFT JOIN product_extras pe ON pe.group_id = eg.id AND pe.is_available = true
    WHERE eg.store_id = v_store_id AND eg.is_active = true
    GROUP BY eg.id, eg.name, eg.category_id
  ) LOOP
    RAISE NOTICE '   - Grupo: % | Categoría: % | Extras: %',
      rec.grupo,
      COALESCE(rec.category_id::text, 'Sin categoría'),
      rec.num_extras;
  END LOOP;

  -- Verificar función para producto específico
  IF v_product_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_assignments_count
    FROM get_product_extra_groups(v_product_id);

    RAISE NOTICE '4. Grupos asignados al producto %: %', v_product_id, v_assignments_count;
  END IF;
END $$;
```

**Interpretación de Resultados**:
- Si "Grupos activos" = 0 → No has creado grupos
- Si "Extras disponibles" = 0 → **ESTE ES TU PROBLEMA** - Agrega extras a los grupos
- Si "num_extras" = 0 para un grupo → Ese grupo está vacío, agrégale extras
- Si "Grupos asignados al producto" = 0 → Asigna el grupo al producto/categoría

---

## 🎯 Flujo Correcto (Ejemplo Real)

**Escenario**: Pizzería con grupo "Tamaño" para todas las pizzas

### 1. Crear Grupo
```
✅ Admin → Grupos de Extras → Crear Grupo
  - Nombre: Tamaño
  - Tipo: Single (radio)
  - Requerido: ✓
  - Min: 1, Max: 1
  - Activo: ✓
```

### 2. Agregar Extras
```
✅ Gestionar Extras → Agregar Extra (x3)
  - Pequeña | $0 | Default: ✓
  - Mediana | $3
  - Grande  | $5
```

### 3. Asignar a Categoría
```
✅ Asignar a Productos → Pestaña "Por Categoría"
  - Seleccionar: Pizzas
  - Guardar Asignación
```

### 4. Verificar en Catálogo
```
✅ Ir al catálogo público
✅ Hacer clic en cualquier pizza
✅ Debería aparecer grupo "Tamaño" con 3 opciones
```

---

## 🆘 Si Nada Funciona

1. **Revisa la consola del navegador** (F12) cuando abres ProductExtrasDialog
2. **Copia los errores** (si hay) y compártelos
3. **Ejecuta la consulta de diagnóstico** arriba y comparte el resultado
4. **Verifica en Supabase** → Table Editor → `extra_groups` y `product_extras`

## 📝 Resumen Ejecutivo

**99% de probabilidad**: Los grupos están vacíos (sin extras).

**Solución**:
1. Ve a Admin → Grupos de Extras
2. Haz clic en "Gestionar Extras" en cada grupo
3. Agrega al menos 1 extra con nombre y precio
4. Verifica que el extra tenga ✓ en "Disponible"
5. Recarga el catálogo

**Si aún no funciona**: Verifica que aplicaste `fix_product_extras_rls_safe.sql` en Supabase.
