# Migration: Fix RLS Multi-Tenant Security

**Archivo:** `20251122_fix_rls_multi_tenant_security.sql`
**Issue:** [#1 - Fix RLS policies for multi-tenant isolation](https://github.com/hectorcanaimero/menu-maestro-saas/issues/1)
**Prioridad:** 🔴 **CRÍTICO**

---

## ⚠️ IMPORTANTE: Leer Antes de Aplicar

Esta migración **DEBE aplicarse en un entorno de desarrollo primero** y testearse exhaustivamente antes de ir a producción.

### Pre-requisitos

- [ ] Backup de la base de datos
- [ ] Supabase CLI instalado (`npm i -g supabase`)
- [ ] Conexión al proyecto Supabase configurada
- [ ] Ambiente de testing disponible

---

## 📋 Qué Hace Esta Migración

### 1. **Crea función helper `user_owns_store(UUID)`**
   - Centraliza la verificación de ownership
   - Mejora performance y mantenibilidad

### 2. **Corrige bug crítico en `orders.store_id`**
   - **ANTES (BUG):** `store_id REFERENCES orders(id)` ❌
   - **DESPUÉS:** `store_id REFERENCES stores(id)` ✅

### 3. **Optimiza RLS Policies**
   - Reemplaza subqueries repetitivas con `user_owns_store()`
   - Agrega policies faltantes en `order_items`

### 4. **Mejora documentación**
   - Comentarios en todas las tablas
   - Función de logging de violaciones

---

## 🚀 Pasos de Aplicación

### Paso 1: Backup (OBLIGATORIO)

```bash
# Backup usando Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d_%H%M%S).sql

# O usando pg_dump directamente
pg_dump [CONNECTION_STRING] > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Paso 2: Aplicar en Development

```bash
# Opción A: Usando Supabase CLI (Recomendado)
supabase db push

# Opción B: Aplicar archivo específico
supabase db execute -f supabase/migrations/20251122_fix_rls_multi_tenant_security.sql
```

### Paso 3: Verificar Aplicación

```sql
-- 1. Verificar que la función existe
SELECT proname, proargnames
FROM pg_proc
WHERE proname = 'user_owns_store';
-- Debe retornar 1 fila

-- 2. Verificar foreign key corregido
SELECT conname, confrelid::regclass
FROM pg_constraint
WHERE conname = 'orders_store_id_fkey';
-- Debe retornar: orders_store_id_fkey | stores

-- 3. Contar policies actualizadas
SELECT COUNT(*)
FROM pg_policies
WHERE schemaname = 'public'
AND (qual::TEXT LIKE '%user_owns_store%' OR with_check::TEXT LIKE '%user_owns_store%');
-- Debe retornar >= 10
```

### Paso 4: Ejecutar Tests

```bash
# Ejecutar suite de tests
psql [CONNECTION_STRING] -f supabase/tests/test_multi_tenant_isolation.sql
```

**Salida esperada:**
```
✓ Test 1: user_owns_store function exists
✓ Test 2: All tables have RLS policies
✓ Test 3: Foreign key is correct
```

### Paso 5: Testing Manual

#### Test A: Verificar aislamiento entre stores

1. **Crear dos stores de prueba:**
```sql
INSERT INTO stores (subdomain, name, owner_id, is_active)
VALUES
  ('test-store-a', 'Store A', [USER_A_UUID], true),
  ('test-store-b', 'Store B', [USER_B_UUID], true);
```

2. **Login como Owner de Store A** en la app

3. **Intentar acceder a datos de Store B:**
```typescript
// En la consola del navegador o en un test
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('store_id', 'store-b-uuid');

console.log(data); // Debe ser []
```

4. **Verificar que SÍ puede acceder a Store A:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('store_id', 'store-a-uuid');

console.log(data); // Debe contener categorías
```

#### Test B: Verificar que clientes pueden ver menú

1. **Logout** (o abrir ventana incógnita)

2. **Intentar ver categorías de store activa:**
```typescript
const { data, error } = await supabase
  .from('categories')
  .select('*')
  .eq('store_id', 'store-a-uuid');

console.log(data); // Debe contener categorías públicas
```

3. **Intentar modificar:**
```typescript
const { error } = await supabase
  .from('categories')
  .update({ name: 'Hacked' })
  .eq('id', 'category-uuid');

console.log(error); // Debe ser "new row violates row-level security policy"
```

---

## 🐛 Troubleshooting

### Error: "function user_owns_store does not exist"

**Causa:** La migración no se aplicó completamente

**Solución:**
```sql
-- Ejecutar manualmente la creación de la función
CREATE OR REPLACE FUNCTION public.user_owns_store(target_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.stores
    WHERE id = target_store_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;
```

### Error: "constraint orders_store_id_fkey already exists"

**Causa:** La migración intenta crear un constraint que ya existe (pero puede estar incorrecto)

**Solución:**
```sql
-- Forzar recreación del constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey CASCADE;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_store_id_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;
```

### Error: "permission denied for function user_owns_store"

**Causa:** Falta grant de permisos

**Solución:**
```sql
GRANT EXECUTE ON FUNCTION public.user_owns_store(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_owns_store(UUID) TO anon;
```

### Los tests fallan con "RLS violation"

**Causa:** Las policies están funcionando correctamente (es el comportamiento esperado)

**Acción:** Verificar que el usuario autenticado SÍ puede acceder a sus propios datos

---

## 📊 Checklist de Validación

Antes de considerar la migración exitosa, verificar:

### Base de Datos

- [ ] Función `user_owns_store` existe
- [ ] Foreign key `orders.store_id -> stores.id` es correcto
- [ ] Todas las tablas multi-tenant tienen RLS policies
- [ ] Policies usan `user_owns_store()` donde corresponde

### Funcionalidad

- [ ] Store owners pueden ver sus propios datos
- [ ] Store owners NO pueden ver datos de otros stores
- [ ] Clientes (no autenticados) pueden ver menú de stores activas
- [ ] Clientes NO pueden modificar nada
- [ ] Órdenes se crean correctamente
- [ ] Admin panel funciona sin errores

### Performance

- [ ] Queries de categorías son rápidas (< 100ms)
- [ ] Queries de menu items son rápidas (< 100ms)
- [ ] Dashboard carga en < 2s

---

## 🔄 Rollback

Si necesitas revertir la migración:

### Opción 1: Restaurar desde backup

```bash
psql [CONNECTION_STRING] < backup_YYYYMMDD_HHMMSS.sql
```

### Opción 2: Revertir manualmente

```sql
-- 1. Eliminar función
DROP FUNCTION IF EXISTS public.user_owns_store(UUID);

-- 2. Restaurar policies anteriores (copiar desde migraciones previas)
-- Ver: supabase/migrations/20251121232527_*.sql

-- 3. Revertir foreign key (si es necesario)
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_store_id_fkey;
-- (Dejar sin constraint o aplicar el anterior)
```

---

## 📞 Soporte

Si encuentras problemas:

1. **Verificar logs de Supabase:**
   - Dashboard > Logs > Postgres Logs

2. **Revisar documentación:**
   - [docs/ISSUE_1_IMPLEMENTATION.md](../../docs/ISSUE_1_IMPLEMENTATION.md)

3. **Crear issue en GitHub:**
   - [Nuevo Issue](https://github.com/hectorcanaimero/menu-maestro-saas/issues/new)

4. **Contactar al equipo:**
   - Slack: #dev-support
   - Email: dev@menumaestro.com

---

## ✅ Siguiente Paso

Una vez aplicada y validada esta migración:

➡️ **Continuar con Issue #2**: Implement centralized route protection
- [Ver Issue #2](https://github.com/hectorcanaimero/menu-maestro-saas/issues/2)

---

**Fecha de creación:** 22 de Noviembre, 2025
**Última actualización:** 22 de Noviembre, 2025
**Mantenedor:** Equipo Backend
