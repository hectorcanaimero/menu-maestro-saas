# 🚀 EJECUTAR LIMPIEZA DE PRODUCCIÓN - PASO A PASO

## ⚠️ IMPORTANTE: Lee esto primero

Esta limpieza:
- ✅ Preserva la tienda "totus" (demo)
- ✅ Preserva TODOS los datos del sistema (planes, métodos de pago, etc.)
- ✅ Configura los 2 super admins (knaimero@gmail.com y tresestudiocreativoweb@gmail.com)
- ❌ Elimina las 7 tiendas de prueba y TODOS sus datos relacionados

## 📋 Opción 1: Ejecución Rápida desde Dashboard

### Paso 1: Abrir SQL Editor

1. Ve a: https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz/sql
2. Click en "New Query"

### Paso 2: Copiar y Ejecutar la Migración

Copia TODO el contenido del archivo:
```
supabase/migrations/20260118000001_production_cleanup.sql
```

Y pégalo en el SQL Editor, luego presiona "Run".

### Paso 3: Revisar los Logs

Verás output como:

```
NOTICE: ==============================================
NOTICE: INICIANDO LIMPIEZA DE PRODUCCIÓN
NOTICE: ==============================================
NOTICE: Tiendas a eliminar: 7
NOTICE:
NOTICE: [1/7] Eliminando tienda: RV Comida (subdomain: rvcomida)
NOTICE:    ✓ Tienda eliminada completamente
...
NOTICE: ==============================================
NOTICE: LIMPIEZA COMPLETADA
NOTICE: Total de tiendas eliminadas: 7
NOTICE: ==============================================
```

### Paso 4: Verificar Resultados

Ejecuta estas queries en el SQL Editor:

```sql
-- Ver tiendas restantes (debería ser solo "totus")
SELECT id, name, subdomain, is_demo_store
FROM stores
ORDER BY created_at;

-- Ver super admins (deberían ser 2)
SELECT u.email, pa.role, pa.is_active
FROM platform_admins pa
JOIN auth.users u ON u.id = pa.user_id
WHERE pa.is_active = true;
```

### Paso 5: Limpiar Storage

Ejecuta el archivo de limpieza de storage:

```sql
-- Copia y pega el contenido de:
-- supabase/migrations/20260118000002_storage_cleanup_instructions.sql

-- Primero en DRY RUN para ver qué se eliminaría:
SELECT * FROM cleanup_orphaned_storage_files('menu-images', true);
SELECT * FROM cleanup_orphaned_storage_files('store-assets', true);
SELECT * FROM cleanup_orphaned_storage_files('payment-proofs', true);

-- Si todo se ve bien, ejecuta la limpieza real:
SELECT * FROM cleanup_orphaned_storage_files('menu-images', false);
SELECT * FROM cleanup_orphaned_storage_files('store-assets', false);
SELECT * FROM cleanup_orphaned_storage_files('payment-proofs', false);
```

## 📋 Opción 2: Usando MCP Supabase

Ya que tienes MCP configurado, puedo ejecutarlo por ti. Solo necesitas confirmar:

**¿Quieres que ejecute la limpieza AHORA?**

Si dices que sí, ejecutaré:
1. La migración principal de limpieza
2. La verificación de resultados
3. Las instrucciones para limpiar storage

## ✅ Verificación Final

Después de ejecutar, verifica:

```sql
-- 1. Solo debe quedar la tienda "totus"
SELECT COUNT(*) as tiendas_restantes FROM stores;
-- Resultado esperado: 1

-- 2. Totus debe estar protegida
SELECT subdomain, is_demo_store FROM stores WHERE subdomain = 'totus';
-- Resultado esperado: totus | true

-- 3. Debe haber 2 super admins
SELECT COUNT(*) FROM platform_admins WHERE is_active = true;
-- Resultado esperado: 2

-- 4. Planes del sistema intactos
SELECT COUNT(*) FROM subscription_plans WHERE is_active = true;
-- Resultado esperado: 4

-- 5. Métodos de pago de plataforma intactos
SELECT COUNT(*) FROM platform_payment_methods WHERE is_active = true;
-- Resultado esperado: 3
```

## 🔄 Qué hacer si algo sale mal

Si encuentras algún problema:

1. **NO entres en pánico**
2. Revisa los logs de la ejecución
3. Verifica qué datos quedaron
4. Si necesitas revertir, contacta al equipo de desarrollo

## 📝 Notas Adicionales

- La tienda "totus" NUNCA será eliminada gracias al trigger de protección
- Si intentas eliminar "totus" manualmente, obtendrás un error (esto es correcto)
- Los super admins pueden acceder a todas las funciones de la plataforma
- El storage debe limpiarse después de la migración principal

## 🎯 Siguiente Paso

**Elige una opción:**

1. **Ejecutar manualmente desde Dashboard**: Sigue la Opción 1 arriba
2. **Que Claude lo ejecute vía MCP**: Confirma y ejecutaré la Opción 2

---

**¿Listo para continuar?** 🚀
