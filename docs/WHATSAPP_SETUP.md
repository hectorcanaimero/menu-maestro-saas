# 📱 WhatsApp Evolution API - Guía de Configuración

## 🎯 Resumen

Este proyecto integra WhatsApp Business vía Evolution API para enviar notificaciones automáticas a clientes cuando:
- ✅ Se crea una nueva orden (confirmación)
- ✅ Una orden está lista para recoger/entregar

## 📋 Pre-requisitos

1. **Evolution API** desplegada y funcionando
   - URL de la API (ej: `https://evolution-api.tu-dominio.com`)
   - API Key de autenticación

2. **Supabase Project** con:
   - Edge Functions habilitadas
   - Extensión `pg_net` instalada

## 🔧 Configuración Paso a Paso

### 1. Variables de Entorno - Edge Functions

Configura las siguientes variables en tu proyecto Supabase:

```bash
# Ir a: Supabase Dashboard > Project Settings > Edge Functions > Environment Variables

EVOLUTION_API_URL=https://evolution-api.tu-dominio.com
EVOLUTION_API_KEY=tu-api-key-de-evolution
```

### 2. Configurar URLs en la Base de Datos

Para que los triggers de base de datos puedan llamar a las Edge Functions, necesitas configurar la tabla `system_settings`:

**Método Rápido: Usar el script SQL**

1. Abre el archivo `docs/setup-whatsapp-database.sql`
2. Reemplaza `YOUR_SERVICE_ROLE_KEY_HERE` con tu Service Role Key real
3. Copia todo el contenido y ejecútalo en Supabase SQL Editor

**Método Manual:**

Ejecuta estos comandos en el SQL Editor (reemplaza con tus valores reales):

```sql
-- Configurar URL de Supabase
UPDATE system_settings
SET value = 'https://wdpexjymbiyqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

-- Configurar Service Role Key (obtenerlo de: Settings > API > service_role key)
UPDATE system_settings
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOi...'
WHERE key = 'supabase_service_role_key';

-- Verificar configuración
SELECT key, value FROM system_settings;
```

**IMPORTANTE:**

- La URL debe ser tu Supabase Project URL (sin trailing slash)
- El Service Role Key lo encuentras en: **Project Settings > API > service_role (secret)**
- ⚠️ **NUNCA** expongas el Service Role Key en el frontend

### 3. Desplegar Edge Functions

```bash
cd supabase/functions

# Desplegar función de gestión de instancias
supabase functions deploy manage-whatsapp-instance

# Desplegar función de envío de mensajes
supabase functions deploy send-whatsapp-message

# Desplegar webhook
supabase functions deploy whatsapp-webhook
```

### 4. Aplicar Migrations

```bash
# Aplicar todas las migraciones de WhatsApp
supabase db push

# O específicamente:
supabase migration up --name whatsapp_order_notifications
supabase migration up --name configure_whatsapp_settings
```

### 5. Habilitar pg_net Extension

Si no está habilitada, ejecuta en SQL Editor:

```sql
CREATE EXTENSION IF NOT EXISTS pg_net;
```

## 🔌 Configurar Evolution API Webhook

Para recibir actualizaciones de estado de mensajes (entregado, leído):

1. En Evolution API, configura el webhook URL:
   ```
   https://TU_PROJECT_REF.supabase.co/functions/v1/whatsapp-webhook
   ```

2. Eventos a escuchar:
   - `messages.update` - Actualización de estado de mensajes
   - `send.message` - Confirmación de envío

## 🚀 Uso - Admin Panel

### Conectar WhatsApp

1. Ir a **Admin > WhatsApp > Configuración**
2. Click en **"Conectar WhatsApp"**
3. Escanear el QR Code con tu WhatsApp Business
4. Esperar confirmación de conexión

### Activar Automatizaciones

En **Admin > WhatsApp > Configuración**:

1. **Confirmación de Pedido**
   - Toggle: Activar/Desactivar
   - Envía mensaje al cliente cuando se crea una orden

2. **Pedido Listo**
   - Toggle: Activar/Desactivar
   - Envía mensaje cuando el pedido está listo

3. **Carrito Abandonado**
   - Toggle: Activar/Desactivar
   - Configura delay en minutos (ej: 30)
   - *Nota: Requiere cron job (próxima fase)*

### Personalizar Templates

En **Admin > WhatsApp > Templates**:

1. Selecciona el template (order_confirmation, order_ready, etc.)
2. Edita el mensaje
3. Usa variables disponibles:
   - `{customer_name}` - Nombre del cliente
   - `{order_number}` - Número de orden
   - `{order_total}` - Total de la orden
   - `{delivery_address}` - Dirección de entrega

## 🔍 Verificar que Todo Funciona

### Test 1: Conexión Manual

1. Admin > WhatsApp > Configuración
2. Click "Probar Conexión"
3. Debe mostrar: ✅ Conectado

### Test 2: Crear Orden de Prueba

1. Desde el admin, crear una orden manual
2. Verificar que:
   - El cliente recibe mensaje de WhatsApp
   - Dashboard WhatsApp muestra mensaje enviado
   - Estado del mensaje se actualiza (entregado, leído)

### Test 3: Cambiar Estado a "Listo"

1. Tomar una orden pendiente
2. Cambiar estado a "Listo"
3. Verificar que el cliente recibe notificación

## 🐛 Troubleshooting

### No se envían mensajes automáticos

**Check 1: Configuración de WhatsApp**

```sql
SELECT
  is_enabled,
  is_connected,
  auto_order_confirmation,
  auto_order_ready
FROM whatsapp_settings
WHERE store_id = 'TU_STORE_ID';
```

Todos deben estar en `true`.

**Check 1.5: Configuración de system_settings**

```sql
SELECT key, value FROM system_settings;
```

Verifica que `supabase_url` y `supabase_service_role_key` tengan valores correctos (no los valores por defecto).

**Check 2: Verificar triggers**
```sql
SELECT
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'orders';
```

Debe mostrar:
- `trigger_notify_new_order_whatsapp`
- `trigger_notify_order_ready_whatsapp`

**Check 3: Logs de Base de Datos**

En Supabase Dashboard > Database > Logs, buscar:
- "WhatsApp notification queued"
- "WhatsApp notification skipped"

**Check 4: Logs de Edge Functions**

En Supabase Dashboard > Edge Functions > Logs:
- Verificar llamadas a `send-whatsapp-message`
- Revisar errores

### Mensajes no se marcan como entregados/leídos

**Check: Webhook Evolution API**

1. Verificar que webhook esté configurado en Evolution API
2. URL correcta: `https://TU_PROJECT.supabase.co/functions/v1/whatsapp-webhook`
3. En logs de Edge Functions, buscar eventos `messages.update`

### QR Code no aparece

**Check: Edge Function desplegada**
```bash
supabase functions list
```

Debe mostrar: `manage-whatsapp-instance`

**Check: Variables de entorno**

En Supabase Dashboard > Project Settings > Edge Functions:
- `EVOLUTION_API_URL` ✓
- `EVOLUTION_API_KEY` ✓

## 📊 Estructura de Datos

### whatsapp_settings
```sql
- is_enabled: boolean           -- Módulo activado
- is_connected: boolean          -- WhatsApp conectado
- connected_phone: text          -- Número conectado
- auto_order_confirmation: bool  -- Auto-enviar confirmación
- auto_order_ready: bool         -- Auto-enviar cuando listo
```

### whatsapp_messages
```sql
- message_type: text             -- order_confirmation, order_ready, etc.
- status: text                   -- pending, sent, delivered, read, failed
- evolution_message_id: text     -- ID en Evolution API
- delivered_at: timestamp        -- Fecha de entrega
- read_at: timestamp             -- Fecha de lectura
```

## 🔐 Seguridad

- ✅ Service Role Key solo en backend (Edge Functions, Database)
- ✅ RLS policies activas en todas las tablas
- ✅ Triggers ejecutan con SECURITY DEFINER
- ✅ Validaciones de store_id en todas las operaciones

## 📝 Notas Importantes

1. **Créditos**: Cada tienda tiene 50 mensajes/mes incluidos
2. **Phone Format**: Venezuela (+58) por defecto (cambiar en edge function si necesario)
3. **Instance Naming**: Usa subdomain de la tienda como nombre de instancia
4. **Polling**: QR Code polling cada 3 segundos, máx 3 minutos

## 🆘 Soporte

Si tienes problemas:

1. Revisar logs en orden:
   - Database Logs (triggers)
   - Edge Functions Logs
   - Evolution API Logs

2. Verificar configuración paso a paso en este README

3. Contactar soporte con:
   - Logs específicos del error
   - Store ID afectado
   - Timestamp del intento
