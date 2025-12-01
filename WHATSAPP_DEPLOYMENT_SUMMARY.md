# 🚀 WhatsApp Integration - Deployment Summary

## ✅ Problema Resuelto

**Error original:** `ERROR: 42501: permission denied to set parameter "app.settings.supabase_url"`

**Causa:** Las migraciones intentaban usar `ALTER DATABASE SET` para configurar variables de entorno, lo cual requiere permisos de superusuario que no tenemos en Supabase.

**Solución:** Creamos una tabla `system_settings` para almacenar la configuración de manera segura y accesible desde las funciones de base de datos.

---

## 📝 Cambios Realizados

### 1. **Migration 20251201000002 - Actualizada** ✅

**Archivo:** `supabase/migrations/20251201000002_configure_whatsapp_settings.sql`

**Cambios principales:**
- ✅ Creada tabla `system_settings` para almacenar configuración
- ✅ Agregadas RLS policies (solo `service_role` puede acceder)
- ✅ Funciones `get_supabase_url()` y `get_service_role_key()` actualizadas para leer de la tabla
- ✅ Valores por defecto insertados (placeholders que el usuario debe actualizar)

**Estructura de `system_settings`:**
```sql
CREATE TABLE system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. **Migration 20251201000001 - Actualizada** ✅

**Archivo:** `supabase/migrations/20251201000001_whatsapp_order_notifications.sql`

**Cambios principales:**
- ✅ Triggers actualizados para usar `get_supabase_url()` en lugar de `current_setting()`
- ✅ Triggers actualizados para usar `get_service_role_key()` en lugar de `current_setting()`

**Antes:**
```sql
url := current_setting('app.settings.supabase_url') || '/functions/v1/send-whatsapp-message'
```

**Después:**
```sql
url := get_supabase_url() || '/functions/v1/send-whatsapp-message'
```

### 3. **Script de Configuración - Creado** ✅

**Archivo:** `docs/setup-whatsapp-database.sql`

**Propósito:** Script SQL listo para usar que configura `system_settings` con los valores correctos.

**Uso:**
1. Abrir el script
2. Reemplazar `YOUR_SERVICE_ROLE_KEY_HERE` con el Service Role Key real
3. Ejecutar en Supabase SQL Editor

### 4. **Documentación - Actualizada** ✅

**Archivo:** `WHATSAPP_SETUP.md`

**Cambios:**
- ✅ Sección "Configurar URLs en la Base de Datos" actualizada
- ✅ Método rápido agregado (usando `docs/setup-whatsapp-database.sql`)
- ✅ Método manual mantenido para referencia
- ✅ Sección de troubleshooting actualizada con verificación de `system_settings`

---

## 🔧 Pasos para Deployment

### Pre-requisitos
1. ✅ Evolution API desplegada con URL y API Key
2. ✅ Supabase project configurado
3. ✅ Service Role Key disponible

### Paso 1: Configurar Edge Functions
```bash
# En Supabase Dashboard > Project Settings > Edge Functions > Environment Variables
EVOLUTION_API_URL=https://evolution-api.tu-dominio.com
EVOLUTION_API_KEY=tu-api-key-de-evolution
```

### Paso 2: Aplicar Migraciones
```bash
supabase db push
```

### Paso 3: Configurar system_settings

**Opción A - Script rápido:**
1. Editar `docs/setup-whatsapp-database.sql`
2. Reemplazar `YOUR_SERVICE_ROLE_KEY_HERE`
3. Ejecutar en Supabase SQL Editor

**Opción B - Manual:**
```sql
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

UPDATE system_settings
SET value = 'TU_SERVICE_ROLE_KEY_AQUI'
WHERE key = 'supabase_service_role_key';

-- Verificar
SELECT key, value FROM system_settings;
```

### Paso 4: Desplegar Edge Functions
```bash
cd supabase/functions

supabase functions deploy manage-whatsapp-instance
supabase functions deploy send-whatsapp-message
supabase functions deploy whatsapp-webhook
```

### Paso 5: Conectar WhatsApp
1. Ir a Admin > WhatsApp > Configuración
2. Click "Conectar WhatsApp"
3. Escanear QR Code
4. Activar automatizaciones deseadas

---

## ✅ Verificación

### 1. Verificar system_settings
```sql
SELECT * FROM system_settings;
```

**Esperado:**
- `supabase_url` debe tener tu URL de proyecto (ej: `https://wdpexjymbiyqwdttqhz.supabase.co`)
- `supabase_service_role_key` debe tener tu Service Role Key (comienza con `eyJ...`)

### 2. Verificar triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'orders';
```

**Esperado:**
- `trigger_notify_new_order_whatsapp`
- `trigger_notify_order_ready_whatsapp`

### 3. Verificar pg_net extension
```sql
SELECT * FROM pg_extension WHERE extname = 'pg_net';
```

**Esperado:** 1 fila con `extname = 'pg_net'`

### 4. Test de conexión
1. Admin > WhatsApp > Configuración
2. Click "Conectar WhatsApp"
3. Si aparece QR Code → ✅ Edge functions OK
4. Si conecta exitosamente → ✅ Todo funciona

### 5. Test de notificación automática
1. Crear orden de prueba (desde admin o cliente)
2. Verificar que cliente recibe mensaje de WhatsApp
3. Cambiar estado a "Listo"
4. Verificar que cliente recibe segundo mensaje

---

## 🔒 Seguridad

### ✅ Implementado
- RLS policies en `system_settings` (solo `service_role` puede acceder)
- `SECURITY DEFINER` en funciones helper
- Service Role Key nunca expuesto en frontend
- Triggers ejecutan con permisos elevados pero validados

### ⚠️ Importante
- **NUNCA** commitear el Service Role Key en Git
- **NUNCA** usar Service Role Key en el frontend
- Mantener Evolution API Key segura
- Rotar keys periódicamente

---

## 📊 Estado del Proyecto

| Componente | Estado | Notas |
|------------|--------|-------|
| Migrations | ✅ Listo | Aplicar con `supabase db push` |
| Edge Functions | ✅ Listo | Desplegar con `supabase functions deploy` |
| Frontend | ✅ Listo | Build exitoso, QR modal funcional |
| Database Triggers | ✅ Listo | Automáticamente envían notificaciones |
| Documentación | ✅ Completo | `WHATSAPP_SETUP.md` + este archivo |
| Scripts Helper | ✅ Creado | `docs/setup-whatsapp-database.sql` |

---

## 📖 Documentación Relacionada

- **Setup completo:** [WHATSAPP_SETUP.md](WHATSAPP_SETUP.md)
- **Script de configuración:** [docs/setup-whatsapp-database.sql](docs/setup-whatsapp-database.sql)
- **Edge Functions:**
  - `supabase/functions/manage-whatsapp-instance/` - Gestión de instancias
  - `supabase/functions/send-whatsapp-message/` - Envío de mensajes
  - `supabase/functions/whatsapp-webhook/` - Recepción de eventos

---

## 🎯 Próximos Pasos (Opcionales)

- [ ] Implementar abandoned cart automation (requiere cron job)
- [ ] Agregar campaña de mensajes masivos
- [ ] Soporte multi-idioma en templates
- [ ] Analytics de mensajes enviados/leídos
- [ ] Mapas de cobertura de zonas de entrega
