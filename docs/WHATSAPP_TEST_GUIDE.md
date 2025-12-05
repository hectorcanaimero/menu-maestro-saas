# 🧪 Guía de Prueba WhatsApp - Pedido Real

Esta guía te llevará paso a paso para probar el envío de mensajes WhatsApp con un pedido real.

## 📋 Pre-requisitos

- [ ] Tienda creada en la plataforma
- [ ] Número de teléfono WhatsApp para pruebas: **+5541988003278**
- [ ] Acceso a Supabase Dashboard
- [ ] Evolution API URL y API Key

---

## 🔧 Paso 1: Verificar Configuración Actual

### 1.1 Ejecutar Script de Verificación

```sql
-- Copiar y pegar en Supabase SQL Editor:
-- /scripts/VERIFY_WHATSAPP_SETUP.sql
```

Este script verifica:
- ✅ Configuración de system_settings
- ✅ Estado de WhatsApp por tienda
- ✅ Créditos disponibles
- ✅ Templates de mensajes
- ✅ Triggers actuales
- ✅ Órdenes recientes
- ✅ Mensajes WhatsApp enviados

### 1.2 Revisar Resultados

**System Settings** debe mostrar:
```
supabase_url: https://wdpexjymbiyjqwdttqhz.supabase.co ✅
supabase_service_role_key: ***HIDDEN*** ✅
```

Si muestra `❌ NEEDS CONFIGURATION`, ejecutar:

```sql
-- Actualizar con valores reales
UPDATE system_settings
SET value = 'https://wdpexjymbiyjqwdttqhz.supabase.co'
WHERE key = 'supabase_url';

UPDATE system_settings
SET value = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
WHERE key = 'supabase_service_role_key';
```

---

## 🔧 Paso 2: Configurar Evolution API

### 2.1 Verificar Secrets en Supabase

Ir a: **Supabase Dashboard > Project Settings > Edge Functions > Secrets**

Debe tener:
```
EVOLUTION_API_URL=https://tu-evolution-api.com
EVOLUTION_API_KEY=tu-api-key-aqui
```

Si no existen, agregarlos.

---

## 🔧 Paso 3: Aplicar Triggers Actualizados

### 3.1 Ejecutar Script de Triggers

```sql
-- Copiar y pegar en Supabase SQL Editor:
-- /scripts/APPLY_WHATSAPP_TRIGGERS_FIX.sql
```

### 3.2 Verificar Triggers Creados

El script mostrará al final:

```
trigger_name                              | event_manipulation | event_object_table
------------------------------------------+--------------------+-------------------
trigger_notify_order_confirmed_whatsapp  | UPDATE             | orders
trigger_notify_order_ready_whatsapp      | UPDATE             | orders
```

✅ Ambos triggers deben aparecer.

---

## 🔧 Paso 4: Habilitar WhatsApp para tu Tienda

### 4.1 Identificar tu Store ID

```sql
SELECT id, name, subdomain
FROM stores
ORDER BY created_at DESC
LIMIT 5;
```

### 4.2 Habilitar WhatsApp

```sql
-- Reemplazar 'TU_STORE_ID' con el ID real
UPDATE whatsapp_settings
SET
  is_enabled = true,
  auto_order_confirmation = true,
  auto_order_ready = true
WHERE store_id = 'TU_STORE_ID';
```

### 4.3 Verificar Configuración

```sql
SELECT
  is_enabled,
  is_connected,
  auto_order_confirmation,
  auto_order_ready
FROM whatsapp_settings
WHERE store_id = 'TU_STORE_ID';
```

Debe mostrar:
```
is_enabled: true ✅
is_connected: false (aún no conectado)
auto_order_confirmation: true ✅
auto_order_ready: true ✅
```

---

## 📱 Paso 5: Conectar WhatsApp

### 5.1 Ir al Panel Admin

1. Abrir navegador: `http://localhost:8080/admin` (o tu URL de producción)
2. Navegar a: **WhatsApp Settings**
3. Click en botón: **"Conectar WhatsApp"**

### 5.2 Escanear QR Code

1. Esperar a que aparezca el QR Code
2. Abrir WhatsApp en tu teléfono
3. Ir a: **Ajustes > Dispositivos vinculados > Vincular dispositivo**
4. Escanear el QR Code mostrado

### 5.3 Verificar Conexión

Después de escanear, deberías ver:
- ✅ "¡Conectado exitosamente!"
- Tu número de WhatsApp conectado

### 5.4 Verificar en Base de Datos

```sql
SELECT
  is_connected,
  connected_phone
FROM whatsapp_settings
WHERE store_id = 'TU_STORE_ID';
```

Debe mostrar:
```
is_connected: true ✅
connected_phone: 5541988003278 (o tu número)
```

---

## 🧪 Paso 6: Crear Pedido de Prueba

### 6.1 Ir al Checkout

1. Abrir tienda: `http://localhost:8080` (con subdomain configurado)
2. Agregar productos al carrito
3. Ir a Checkout

### 6.2 Completar Formulario

**Información del Cliente:**
- Nombre: `Test WhatsApp`
- Email: `test@whatsapp.com`
- Teléfono: **`+5541988003278`** ← ¡IMPORTANTE!
- Seleccionar país: **Brasil**

**Dirección (si es delivery):**
- Completar datos de dirección

**Método de Pago:**
- Seleccionar método de pago disponible

### 6.3 Confirmar Pedido

Click en **"Confirmar Pedido"**

El pedido se creará con status: `pending`

---

## 📬 Paso 7: Probar Envío de Mensajes

### 7.1 Cambiar Status a "Confirmed"

**Opción A: Desde Admin Panel**
1. Ir a: `Admin > Orders`
2. Buscar el pedido recién creado
3. Cambiar status de `pending` → `confirmed`

**Opción B: Desde SQL**
```sql
-- Buscar tu pedido
SELECT id, customer_name, customer_phone, status
FROM orders
WHERE customer_phone LIKE '%5541988003278%'
ORDER BY created_at DESC
LIMIT 1;

-- Cambiar a confirmed (reemplazar ORDER_ID)
UPDATE orders
SET status = 'confirmed'
WHERE id = 'ORDER_ID';
```

### 7.2 Verificar Mensaje Enviado

**✅ Deberías recibir WhatsApp:**
```
¡Hola Test WhatsApp! Tu pedido #XXXXXXXX ha sido confirmado...
```

**Verificar en Base de Datos:**
```sql
SELECT
  customer_phone,
  message_type,
  status,
  created_at,
  error_message
FROM whatsapp_messages
WHERE customer_phone LIKE '%5541988003278%'
ORDER BY created_at DESC
LIMIT 1;
```

Debe mostrar:
```
message_type: order_confirmation
status: sent ✅
error_message: null
```

### 7.3 Cambiar Status a "Ready"

**Opción A: Desde Admin Panel**
1. En `Admin > Orders`
2. Cambiar status de `confirmed` → `ready`

**Opción B: Desde SQL**
```sql
UPDATE orders
SET status = 'ready'
WHERE id = 'ORDER_ID';
```

### 7.4 Verificar Segundo Mensaje

**✅ Deberías recibir WhatsApp:**
```
¡Tu pedido #XXXXXXXX está listo!...
```

**Verificar en Base de Datos:**
```sql
SELECT
  customer_phone,
  message_type,
  status,
  created_at
FROM whatsapp_messages
WHERE customer_phone LIKE '%5541988003278%'
ORDER BY created_at DESC
LIMIT 2;
```

Debe mostrar 2 mensajes:
1. `order_ready` - status: `sent` ✅
2. `order_confirmation` - status: `sent` ✅

---

## 🔍 Solución de Problemas

### Problema 1: No recibí ningún mensaje

**Verificar:**
```sql
-- 1. Verificar que el trigger se ejecutó
SELECT * FROM whatsapp_messages
WHERE customer_phone LIKE '%5541988003278%'
ORDER BY created_at DESC;
```

Si NO hay registros:
- ✅ Verificar que `is_enabled = true`
- ✅ Verificar que `is_connected = true`
- ✅ Verificar que `auto_order_confirmation = true`

### Problema 2: Mensaje con status "failed"

**Verificar error:**
```sql
SELECT
  message_type,
  status,
  error_message,
  evolution_message_id
FROM whatsapp_messages
WHERE customer_phone LIKE '%5541988003278%'
ORDER BY created_at DESC
LIMIT 1;
```

**Errores comunes:**
- "Evolution API not configured" → Verificar EVOLUTION_API_URL y KEY en Secrets
- "WhatsApp module is not enabled" → Verificar is_enabled y is_connected
- "No credits available" → Verificar whatsapp_credits

### Problema 3: QR Code no aparece

**Verificar logs del navegador:**
```javascript
// Abrir DevTools Console
// Buscar logs que empiecen con:
[WhatsAppConnectionModal]
[manage-whatsapp-instance]
```

**Posibles causas:**
- Evolution API credentials incorrectos
- Evolution API no accesible
- Instance name (subdomain) incorrecto

### Problema 4: Formateo de teléfono incorrecto

**Verificar en logs de Edge Function:**

Ir a: **Supabase Dashboard > Edge Functions > send-whatsapp-message > Logs**

Buscar:
```
[WhatsApp] Original phone number: +5541988003278
[WhatsApp] Cleaned phone number: 5541988003278
[WhatsApp] Brazilian number detected (already has +55 prefix)
[WhatsApp] Final formatted phone: 5541988003278
```

---

## ✅ Checklist Final

- [ ] System settings configurados
- [ ] Evolution API credentials en Secrets
- [ ] Triggers aplicados correctamente
- [ ] WhatsApp habilitado para tienda (is_enabled = true)
- [ ] WhatsApp conectado (is_connected = true, QR escaneado)
- [ ] Pedido creado con número +5541988003278
- [ ] Status cambiado a "confirmed" → ✅ WhatsApp recibido
- [ ] Status cambiado a "ready" → ✅ WhatsApp recibido
- [ ] 2 mensajes en tabla whatsapp_messages con status "sent"

---

## 📊 Flujo Completo Esperado

```
1. Crear Pedido
   → Status: pending
   → ❌ No envía WhatsApp

2. Admin confirma
   → Status: pending → confirmed
   → ✅ Trigger: trigger_notify_order_confirmed_whatsapp
   → ✅ Envía: "Pedido confirmado"
   → ✅ WhatsApp recibido

3. Cocina prepara
   → Status: confirmed → preparing
   → ❌ No envía WhatsApp

4. Pedido listo
   → Status: preparing → ready
   → ✅ Trigger: trigger_notify_order_ready_whatsapp
   → ✅ Envía: "Pedido listo"
   → ✅ WhatsApp recibido
```

---

## 🎉 Éxito!

Si completaste todos los pasos y recibiste ambos mensajes WhatsApp, ¡la integración está funcionando correctamente! 🎊

**Próximos pasos:**
- Personalizar templates de mensajes
- Configurar mensajes para otros estados (delivered, etc.)
- Monitorear créditos de WhatsApp
- Configurar más tiendas
