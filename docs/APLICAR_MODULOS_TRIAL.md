# 🚀 Instrucciones: Habilitar Módulos Durante Trial

## ⚠️ IMPORTANTE
Los módulos de WhatsApp y Delivery deben estar habilitados automáticamente durante el período de trial de 30 días. Este documento explica cómo aplicar esta configuración manualmente.

## 📋 Pasos para Aplicar

### Opción 1: Desde Supabase Dashboard (RECOMENDADO)

1. **Accede a Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz
   - Inicia sesión con tu cuenta

2. **Abre el SQL Editor**
   - En el menú lateral izquierdo, haz clic en "SQL Editor"
   - O navega a: https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz/sql

3. **Crea una nueva query**
   - Haz clic en "+ New query"
   - Nombra la query: "Enable Trial Modules"

4. **Copia y pega el SQL**
   - Abre el archivo: `APPLY_TRIAL_MODULES_MANUALLY.sql`
   - Copia TODO el contenido
   - Pégalo en el editor SQL

5. **Ejecuta el script**
   - Haz clic en el botón "Run" (▶️) o presiona `Cmd/Ctrl + Enter`
   - Espera a que termine de ejecutarse

6. **Verifica los resultados**
   - Deberías ver una tabla con todas las suscripciones trial
   - Las columnas `whatsapp_enabled` y `delivery_enabled` deben mostrar `true`

### Opción 2: Desde la Terminal (Alternativa)

Si tienes acceso a `psql`, puedes ejecutar:

```bash
# Conectar a la base de datos
psql "postgresql://postgres.wdpexjymbiyjqwdttqhz:DeployPideAI$2025@aws-0-us-west-1.pooler.supabase.com:6543/postgres"

# Luego ejecutar:
\i APPLY_TRIAL_MODULES_MANUALLY.sql
```

## ✅ Verificación

Después de aplicar el SQL, verifica que funcionó correctamente:

### 1. Verifica las suscripciones actuales

En el SQL Editor, ejecuta:

```sql
SELECT
  s.id,
  st.name as store_name,
  s.status,
  s.enabled_modules->>'whatsapp' as whatsapp,
  s.enabled_modules->>'delivery' as delivery,
  s.trial_ends_at
FROM subscriptions s
JOIN stores st ON st.id = s.store_id
WHERE s.status = 'trial'
ORDER BY s.created_at DESC;
```

**Resultado esperado:**
```
id    | store_name | status | whatsapp | delivery | trial_ends_at
------|------------|--------|----------|----------|---------------
uuid1 | Totus      | trial  | true     | true     | 2026-01-01...
uuid2 | Mi Tienda  | trial  | true     | true     | 2026-01-05...
```

### 2. Prueba creando una nueva tienda

1. Crea una nueva tienda desde `/create-store`
2. Ve a `/admin/subscription` en esa tienda
3. En la pestaña "Módulos", verifica que:
   - WhatsApp muestre badge "Activo" ✓
   - Delivery muestre badge "Activo" ✓
   - Aparezca el badge verde "✓ Incluido en trial 30 días"

### 3. Verifica el trigger

Ejecuta este SQL para confirmar que el trigger existe:

```sql
SELECT
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'trg_enable_trial_modules';
```

**Resultado esperado:**
```
trigger_name            | event_manipulation | event_object_table
------------------------|--------------------|-----------------
trg_enable_trial_modules| INSERT             | subscriptions
```

## 🔍 Qué hace el script

El script ejecuta los siguientes pasos:

1. **Actualiza suscripciones existentes**
   - Busca todas las suscripciones en estado `trial`
   - Actualiza `enabled_modules` para habilitar WhatsApp y Delivery

2. **Crea función de trigger**
   - `enable_trial_modules()`: Función que se ejecuta automáticamente
   - Detecta cuando se crea una nueva suscripción con estado `trial`
   - Habilita automáticamente los módulos

3. **Crea trigger**
   - `trg_enable_trial_modules`: Trigger que llama a la función
   - Se ejecuta ANTES de insertar una nueva suscripción

4. **Actualiza función de creación**
   - `create_store_subscription()`: Función usada para crear tiendas
   - Asegura que nuevas suscripciones tengan los módulos habilitados

5. **Registra la migración**
   - Marca la migración como aplicada en `schema_migrations`

## 🐛 Troubleshooting

### Error: "function already exists"
```sql
-- Ejecuta primero:
DROP TRIGGER IF EXISTS trg_enable_trial_modules ON subscriptions;
DROP FUNCTION IF EXISTS enable_trial_modules();
```

### Error: "column does not exist"
```sql
-- Verifica que la tabla tenga la columna:
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'subscriptions'
AND column_name = 'enabled_modules';
```

### Módulos no se habilitan automáticamente
```sql
-- Verifica que el trigger esté activo:
SELECT * FROM pg_trigger WHERE tgname = 'trg_enable_trial_modules';

-- Si no existe, vuelve a ejecutar la sección de creación del trigger
```

## 📝 Notas Importantes

1. **Backup**: Este script NO modifica datos críticos, solo actualiza configuraciones
2. **Reversible**: Si necesitas revertir, puedes ejecutar:
   ```sql
   UPDATE subscriptions
   SET enabled_modules = '{"whatsapp": false, "delivery": false}'::jsonb
   WHERE status = 'trial';
   ```

3. **Producción**: Este script está listo para ejecutarse en producción sin riesgos

## ✨ Beneficio para los Usuarios

Después de aplicar este script:

- ✅ Todas las tiendas en trial tendrán acceso a WhatsApp
- ✅ Todas las tiendas en trial tendrán acceso a Delivery
- ✅ Nuevas tiendas automáticamente recibirán ambos módulos
- ✅ Los módulos se deshabilitarán automáticamente al terminar el trial (a menos que paguen)

## 📞 Contacto

Si tienes problemas aplicando el script:
1. Revisa la sección de Troubleshooting
2. Verifica los logs de errores en Supabase
3. Contacta al equipo de desarrollo con el error exacto

---

**Fecha de creación**: 2 de Diciembre, 2025
**Versión**: 1.0.0
**Estado**: ✅ Listo para producción
