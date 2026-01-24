# 🚨 URGENTE: Errores Críticos en Producción - VERSIÓN ACTUALIZADA

## 🔍 Diagnóstico Actualizado

Después de revisar el código, encontramos que:

1. ✅ `can_access_admin_routes()` **SÍ existe** en las migraciones locales (devuelve TABLE)
2. ❌ `can_access_admin_routes()` **NO existe** en producción (por eso el error 400)
3. ❌ `get_store_by_subdomain_secure()` **NO existe** en producción (por eso el error 404)

**Conclusión**: Las migraciones existen en el repo pero nunca se ejecutaron en producción.

---

## 🔥 Solución Inmediata

### OPCIÓN A: Script Corregido (RECOMENDADO)

Usa el script corregido que no tiene conflictos de tipo:

**📁 Archivo a ejecutar**: `scripts/apply-missing-migrations-FIXED.sql`

**Pasos:**

1. Abre **Supabase Dashboard**: https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz
2. Ve a **SQL Editor** (icono de base de datos)
3. Crea un nuevo query
4. Copia y pega **TODO** el contenido de: `scripts/apply-missing-migrations-FIXED.sql`
5. Haz clic en **Run**

**Resultado esperado:**
```
✅ get_store_by_subdomain_secure creada
❌ can_access_admin_routes NO se puede crear (conflicto de tipo)
```

---

### OPCIÓN B: Aplicar migración oficial completa

Si tienes Supabase CLI configurado:

```bash
# Aplicar la migración oficial que contiene can_access_admin_routes
supabase db push

# O aplicar solo esta migración:
psql "$DATABASE_URL" < supabase/migrations/20251122230000_add_auth_verification_functions.sql
```

Esto creará ambas funciones con los tipos correctos.

---

## 📋 ¿Por qué falló el primer script?

El script `apply-missing-migrations.sql` intentaba crear `can_access_admin_routes` con retorno `BOOLEAN`:

```sql
-- ❌ INCORRECTO (script viejo):
CREATE FUNCTION can_access_admin_routes(p_store_id UUID)
RETURNS BOOLEAN ...
```

Pero la migración oficial define la función con retorno `TABLE`:

```sql
-- ✅ CORRECTO (migración oficial):
CREATE FUNCTION can_access_admin_routes(p_store_id UUID)
RETURNS TABLE (can_access BOOLEAN, reason TEXT, user_id UUID, ...) ...
```

El error `cannot change return type` significa que intentó sobrescribir una función existente cambiando su tipo de retorno, lo cual PostgreSQL no permite.

---

## ✅ Verificación Post-Fix

### 1. Verificar funciones creadas

Ejecuta esto en SQL Editor:

```sql
SELECT
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_store_by_subdomain_secure', 'can_access_admin_routes')
ORDER BY routine_name;
```

**Resultado esperado:**
```
routine_name                      | routine_type | data_type
----------------------------------|--------------|---------------
can_access_admin_routes           | FUNCTION     | USER-DEFINED
get_store_by_subdomain_secure     | FUNCTION     | USER-DEFINED
```

### 2. Verificar que el sitio funciona

1. Recarga **https://pideai.com** (Ctrl+Shift+R para hard refresh)
2. Abre **DevTools** (F12) → Console
3. **NO deberías ver**:
   ```
   ❌ POST .../rpc/get_store_by_subdomain_secure 404
   ❌ POST .../rpc/can_access_admin_routes 400
   ```
4. **Deberías ver**:
   ```
   ✅ POST .../rpc/get_store_by_subdomain_secure 200 (OK)
   ✅ POST .../rpc/can_access_admin_routes 200 (OK)
   ```

### 3. Probar funciones manualmente

En SQL Editor:

```sql
-- Test 1: get_store_by_subdomain_secure
SELECT * FROM get_store_by_subdomain_secure('totus');

-- Test 2: can_access_admin_routes (requiere estar autenticado)
SELECT * FROM can_access_admin_routes(NULL);
```

---

## 🚀 Siguiente Paso: Esperar Build de PostHog

Una vez que las funciones RPC estén funcionando:

1. **GitHub Actions** ya debería estar construyendo v3.0.49
2. El nuevo build incluye `VITE_POSTHOG_API_KEY`
3. El auto-deploy tardará ~10-15 minutos desde que termina el build

**Verificar build**: https://github.com/hectorcanaimero/menu-maestro-saas/actions

**Después del deploy, verificar PostHog:**

```javascript
// En consola del navegador en https://pideai.com
window.posthog?.get_distinct_id()
// Debería devolver un ID, NO undefined
```

---

## 📊 Resumen de Errores y Soluciones

| Error | Causa | Solución | Status |
|-------|-------|----------|--------|
| RPC 404 get_store_by_subdomain_secure | Función no existe en producción | Ejecutar script FIXED | ⏳ Pendiente |
| RPC 400 can_access_admin_routes | Función no existe en producción | Ejecutar migración oficial | ⏳ Pendiente |
| HTML nesting warning | Div dentro de p | Ya corregido en código | ✅ Hecho |
| Sentry 429 | Sampling muy alto | Reducir a 1% (opcional) | ⏳ Pendiente |
| PostHog undefined | Falta API key en build | GitHub Actions v3.0.49 | ⏳ Corriendo |

---

## 🆘 Si Algo Falla

### Error: "function does not exist" después de ejecutar el script

**Causa**: El script FIXED solo crea `get_store_by_subdomain_secure`, no `can_access_admin_routes`

**Solución**: Necesitas aplicar la migración oficial completa:

```bash
# Con Supabase CLI:
supabase db push

# O manualmente en SQL Editor:
# Ejecuta todo el contenido de:
# supabase/migrations/20251122230000_add_auth_verification_functions.sql
```

### Error: "permission denied for function"

**Causa**: Los permisos GRANT no se aplicaron correctamente

**Solución**: Ejecuta esto en SQL Editor:

```sql
GRANT EXECUTE ON FUNCTION public.get_store_by_subdomain_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_admin_routes(UUID) TO anon, authenticated;
```

### El sitio sigue roto después de aplicar migraciones

**Checklist**:

1. ✅ ¿Ejecutaste el script en **producción** (no en local)?
2. ✅ ¿Hiciste hard refresh del navegador? (Ctrl+Shift+R)
3. ✅ ¿Las funciones aparecen en `information_schema.routines`?
4. ✅ ¿Los permisos GRANT se ejecutaron correctamente?

Si todo está ✅ y sigue fallando, comparte:
- Logs de la consola del navegador
- Resultado de la query de verificación
- Errores específicos en SQL Editor

---

## 🎯 TL;DR - Acción Inmediata

```bash
# 1. EJECUTA ESTO AHORA en Supabase SQL Editor:
# Contenido de: scripts/apply-missing-migrations-FIXED.sql

# 2. VERIFICA que funcionó:
SELECT * FROM get_store_by_subdomain_secure('totus');

# 3. SI FALLA can_access_admin_routes:
# Ejecuta la migración oficial completa:
# supabase/migrations/20251122230000_add_auth_verification_functions.sql

# 4. ESPERA 10-15 minutos para el auto-deploy de v3.0.49

# 5. VERIFICA PostHog en producción:
window.posthog?.get_distinct_id()
```

¡Listo! 🚀
