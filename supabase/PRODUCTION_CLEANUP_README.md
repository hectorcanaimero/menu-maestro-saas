# 🚀 Guía de Preparación para Producción

Esta guía te ayudará a limpiar la base de datos de Supabase y prepararla para producción.

## 📋 Resumen

El proceso de limpieza:
- ✅ Configura los super admins (knaimero@gmail.com y tresestudiocreativoweb@gmail.com)
- ✅ Protege la tienda demo "totus" para que no pueda ser eliminada
- ✅ Elimina todas las tiendas de prueba excepto "totus"
- ✅ Limpia archivos huérfanos en storage
- ✅ Preserva TODOS los datos del sistema (planes, métodos de pago, etc.)

## 🔒 Datos que NO se eliminarán

Los siguientes datos están protegidos y NO serán eliminados:

### Sistema
- ✅ Planes de suscripción (`subscription_plans`)
- ✅ Métodos de pago de la plataforma (`platform_payment_methods`)
- ✅ Administradores de plataforma (`platform_admins`)
- ✅ Subdominios reservados (`reserved_subdomains`)
- ✅ Configuración del sistema (`system_settings`)

### Tienda Demo
- ✅ Tienda "totus" completa (marcada como `is_demo_store = true`)
- ✅ Todas sus categorías, productos, órdenes, etc.
- ✅ Archivos de storage relacionados

## 🗑️ Datos que SÍ se eliminarán

Para cada tienda que NO sea "totus":
- ❌ La tienda y toda su configuración
- ❌ Categorías y productos
- ❌ Órdenes y clientes
- ❌ Suscripciones y pagos
- ❌ Configuración de WhatsApp
- ❌ Drivers y entregas
- ❌ Promociones y cupones
- ❌ Todos los datos relacionados

## 📝 Pasos para Ejecutar la Limpieza

### Paso 1: Backup de Seguridad (IMPORTANTE)

Antes de ejecutar cualquier cosa, haz un backup completo:

```bash
# Opción A: Desde el Dashboard de Supabase
# Ve a: Database > Backups > Create Backup

# Opción B: Usando CLI (si tienes acceso)
npx supabase db dump -f backup_before_cleanup.sql
```

### Paso 2: Aplicar Migración Principal

Ejecuta la migración principal que limpiará los datos:

```bash
# Opción A: Usando CLI local
npx supabase db push

# Opción B: Copiar y pegar en SQL Editor del Dashboard
# 1. Abre: Dashboard > SQL Editor
# 2. Copia el contenido de: migrations/20260118000001_production_cleanup.sql
# 3. Pega y ejecuta
```

La migración mostrará logs detallados de lo que está haciendo:

```
==============================================
INICIANDO LIMPIEZA DE PRODUCCIÓN
==============================================
Tiendas a eliminar: 7

[1/7] Eliminando tienda: RV Comida (subdomain: rvcomida)
   ✓ Tienda eliminada completamente
[2/7] Eliminando tienda: la conga del sabor (subdomain: la-conga-del-sabor)
   ✓ Tienda eliminada completamente
...

==============================================
LIMPIEZA COMPLETADA
Total de tiendas eliminadas: 7
==============================================
```

### Paso 3: Verificar Resultado

Verifica que la limpieza fue exitosa:

```sql
-- Ver tiendas restantes (debería ser solo "totus")
SELECT id, name, subdomain, is_demo_store
FROM stores
ORDER BY created_at;

-- Ver super admins configurados (deberían ser 2)
SELECT u.email, pa.role, pa.is_active
FROM platform_admins pa
JOIN auth.users u ON u.id = pa.user_id
WHERE pa.is_active = true;

-- Ver datos del sistema
SELECT 'Planes' as tipo, COUNT(*) FROM subscription_plans WHERE is_active = true
UNION ALL
SELECT 'Métodos de pago', COUNT(*) FROM platform_payment_methods WHERE is_active = true
UNION ALL
SELECT 'Super admins', COUNT(*) FROM platform_admins WHERE is_active = true;
```

### Paso 4: Limpiar Storage (Archivos)

Ahora limpia los archivos huérfanos:

```bash
# En el SQL Editor, ejecuta:
```

```sql
-- Ver qué archivos se eliminarían (DRY RUN)
SELECT * FROM cleanup_orphaned_storage_files('menu-images', true);
SELECT * FROM cleanup_orphaned_storage_files('store-assets', true);
SELECT * FROM cleanup_orphaned_storage_files('payment-proofs', true);

-- Si todo se ve correcto, ejecuta la limpieza real
SELECT * FROM cleanup_orphaned_storage_files('menu-images', false);
SELECT * FROM cleanup_orphaned_storage_files('store-assets', false);
SELECT * FROM cleanup_orphaned_storage_files('payment-proofs', false);
```

#### Limpieza Manual Alternativa

Si prefieres hacerlo manualmente desde el Dashboard:

1. Ve a: **Storage** > **menu-images**
2. Revisa los archivos
3. Elimina los que NO pertenezcan a "totus"
4. Repite para `store-assets` y `payment-proofs`

### Paso 5: Verificación Final

```sql
-- Ver estadísticas de storage
SELECT
  bucket_id,
  COUNT(*) as total_files,
  pg_size_pretty(SUM((metadata->>'size')::bigint)) as total_size
FROM storage.objects
GROUP BY bucket_id
ORDER BY bucket_id;

-- Ver si quedaron datos huérfanos
SELECT COUNT(*) as customers_sin_ordenes
FROM customers
WHERE id NOT IN (SELECT DISTINCT customer_id FROM orders WHERE customer_id IS NOT NULL);
```

## ✅ Checklist Final

Antes de considerar el proceso completo, verifica:

- [ ] Solo queda la tienda "totus" en la base de datos
- [ ] Los 2 super admins están configurados correctamente
- [ ] Los 4 planes de suscripción están activos
- [ ] Los 3 métodos de pago de plataforma están activos
- [ ] El storage solo contiene archivos de "totus"
- [ ] No hay datos huérfanos en la base de datos

## 🔧 Configuración Post-Limpieza

### 1. Verificar Super Admins

Si el usuario `tresestudiocreativoweb@gmail.com` aún no está registrado:

1. Pídele que se registre en la plataforma
2. Luego ejecuta manualmente:

```sql
-- Agregar como super admin
INSERT INTO platform_admins (user_id, role, is_active, created_by)
SELECT
  id,
  'super_admin',
  true,
  (SELECT id FROM auth.users WHERE email = 'knaimero@gmail.com')
FROM auth.users
WHERE email = 'tresestudiocreativoweb@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET role = 'super_admin';

-- Actualizar perfil
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'tresestudiocreativoweb@gmail.com');
```

### 2. Protección de Tienda Demo

La tienda "totus" ahora tiene estas protecciones:

- ✅ Campo `is_demo_store = true`
- ✅ Trigger que previene su eliminación
- ✅ Si intentas eliminarla, obtendrás un error: "No se puede eliminar una tienda de demostración"

### 3. Monitoreo

Considera agregar alertas para:
- Nuevas tiendas creadas
- Cambios en super admins
- Intentos de eliminar la tienda demo

## 🚨 Solución de Problemas

### Error: "No se puede eliminar una tienda de demostración"

Esto es ESPERADO. Significa que la protección está funcionando correctamente.

### Storage no se limpia correctamente

Ejecuta manualmente desde el Dashboard:
1. Storage > [bucket]
2. Selecciona archivos huérfanos
3. Delete

### Datos del sistema eliminados por error

Restaura desde el backup:

```bash
# Usando CLI
npx supabase db reset --db-url "postgresql://..."
# Luego importa el backup
psql -f backup_before_cleanup.sql
```

## 📞 Soporte

Si encuentras algún problema:
1. Revisa los logs de la migración
2. Verifica el backup antes de continuar
3. Contacta al equipo de desarrollo

## 📚 Archivos Relacionados

- `migrations/20260118000001_production_cleanup.sql` - Migración principal
- `migrations/20260118000002_storage_cleanup_instructions.sql` - Instrucciones de storage
- Este archivo - Guía completa

## ⚠️ ADVERTENCIAS FINALES

1. **SIEMPRE** haz un backup antes de ejecutar
2. **NUNCA** ejecutes esto en producción sin probarlo en staging primero
3. **VERIFICA** que solo "totus" es la tienda demo antes de ejecutar
4. **CONFIRMA** que los super admins son correctos
5. **REVISA** los logs durante la ejecución

---

**¿Listo para producción?** 🚀

Sigue los pasos en orden y verifica cada uno antes de continuar al siguiente.
