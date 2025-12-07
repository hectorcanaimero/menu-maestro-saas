# Platform Admin - Gestión de Módulos

**Fecha:** 2025-12-05
**Estado:** ✅ Implementado

---

## 📋 Funcionalidad

El Platform Admin ahora puede habilitar/deshabilitar módulos específicos para cada cliente (tienda) desde `/platform-admin/subscriptions`.

## 🎯 Módulos Disponibles

### 1. WhatsApp (`whatsapp`)
**Descripción:** Integración de notificaciones y mensajes vía WhatsApp

**Funcionalidades incluidas:**
- Notificaciones de nuevas órdenes al admin por WhatsApp
- Plantillas de mensajes personalizables
- Redirección opcional a WhatsApp al confirmar orden
- Templates por tipo de orden (delivery/pickup/digital_menu)

**Estado por defecto:** Deshabilitado

---

### 2. Delivery Avanzado (`delivery`)
**Descripción:** Sistema avanzado de delivery con gestión de motoristas y GPS tracking

**Funcionalidades incluidas:**
- ✅ Cálculo de precio por kilómetro
- ✅ Gestión de motoristas
- ✅ Asignación de motoristas a órdenes
- ✅ App PWA para motoristas
- ✅ GPS tracking en tiempo real
- ✅ Mapa con ubicación del motorista
- ✅ Seguimiento de entrega para clientes
- ✅ Estados de entrega (assigned, picked_up, in_transit, delivered)
- ✅ Captura de ubicación GPS automática

**NO incluye (siempre disponible para todos):**
- ❌ Delivery básico por precio fijo
- ❌ Delivery básico por zona/barrio
- ❌ Gestión de zonas de entrega

**Estado por defecto:** Deshabilitado

**Nota importante:** El delivery básico (precio fijo o por zona) está disponible para **TODAS** las tiendas sin necesidad de habilitar este módulo. Este módulo solo habilita las funcionalidades avanzadas con motoristas y tracking.

---

## 🔧 Implementación Técnica

### Estructura de Datos

**Tabla:** `subscriptions`

**Campo:** `enabled_modules` (JSONB)

```json
{
  "whatsapp": false,
  "delivery": false
}
```

### Archivo Modificado

**`src/pages/platform-admin/SubscriptionsManager.tsx`**

**Cambios realizados:**

1. **Actualizada interfaz `Subscription`** (líneas 24-48)
   - Cambiado de campos individuales a JSONB `enabled_modules`
   ```typescript
   // ❌ Antes
   whatsapp_enabled: boolean;
   delivery_enabled: boolean;

   // ✅ Ahora
   enabled_modules: {
     whatsapp?: boolean;
     delivery?: boolean;
   };
   ```

2. **Actualizada mutación `toggleModuleMutation`** (líneas 82-105)
   - Ahora actualiza correctamente el campo JSONB
   - Merge del objeto en lugar de columnas individuales
   ```typescript
   const updatedModules = {
     ...currentModules,
     [module]: enable,
   };

   await supabase
     .from('subscriptions')
     .update({ enabled_modules: updatedModules })
     .eq('id', subscriptionId);
   ```

3. **Actualizada función `confirmToggleModule`** (líneas 160-171)
   - Lee correctamente desde `enabled_modules`
   ```typescript
   const currentlyEnabled = selectedSubscription.enabled_modules?.[moduleType] || false;
   ```

4. **Actualizada UI de botones** (líneas 285-308)
   - Muestra estado correcto desde `enabled_modules`
   - Etiqueta actualizada: "Delivery Avanzado"
   - Agregada descripción explicativa
   ```typescript
   <Button
     variant={subscription.enabled_modules?.delivery ? 'default' : 'outline'}
   >
     Delivery Avanzado {subscription.enabled_modules?.delivery && '✓'}
   </Button>
   <p className="text-xs text-muted-foreground mt-1">
     Delivery Avanzado = Por kilómetro + Motoristas + GPS tracking
   </p>
   ```

5. **Actualizado Dialog de confirmación** (líneas 320-357)
   - Mensajes clarificados
   - Nota explicativa para delivery avanzado
   ```typescript
   {moduleType === 'delivery' && (
     <p className="text-xs text-muted-foreground border-l-2 border-blue-500 pl-3 mt-2">
       <strong>Nota:</strong> Delivery Avanzado incluye: cálculo por kilómetro,
       gestión de motoristas y GPS tracking en tiempo real.
       El delivery básico (precio fijo/por zona) siempre está disponible.
     </p>
   )}
   ```

---

## 📱 Cómo Usar (Platform Admin)

### Acceso
```
URL: /platform-admin/subscriptions
Rol requerido: super_admin o billing
```

### Pasos para Habilitar/Deshabilitar Módulos

1. **Navegar a Subscriptions Manager**
   - `/platform-admin` → Menú lateral → "Suscripciones"

2. **Buscar la tienda cliente**
   - Usar barra de búsqueda (por nombre, subdominio o email)
   - O filtrar por estado de suscripción

3. **Identificar sección de Módulos**
   - En cada card de suscripción, buscar la sección "Módulos"
   - Verás dos botones:
     - **WhatsApp** (con ✓ si está habilitado)
     - **Delivery Avanzado** (con ✓ si está habilitado)

4. **Habilitar/Deshabilitar módulo**
   - Click en el botón del módulo deseado
   - Se abre dialog de confirmación
   - Leer la información (especialmente nota de delivery)
   - Click en "Confirmar"

5. **Verificar cambio**
   - El botón cambiará de estado (outline ↔ default)
   - Aparecerá ✓ si está habilitado
   - Toast de confirmación mostrará el cambio

---

## 🔍 Verificación de Cambios

### Verificar en Base de Datos

```sql
-- Ver módulos habilitados de una tienda
SELECT
  s.name as tienda,
  sub.enabled_modules,
  sub.status
FROM subscriptions sub
JOIN stores s ON s.id = sub.store_id
WHERE s.subdomain = 'nombre-tienda';
```

**Resultado esperado:**
```json
{
  "whatsapp": true,
  "delivery": false
}
```

### Verificar en Frontend (Cliente)

**Para WhatsApp:**
1. Crear una orden de prueba
2. Admin debería recibir notificación WhatsApp (si está habilitado)
3. Botón "Continuar en WhatsApp" aparece en confirmación (si `redirect_to_whatsapp` está activo)

**Para Delivery Avanzado:**
1. Admin puede acceder a `/admin/delivery`
2. Puede gestionar motoristas
3. Puede ver dashboard de entregas
4. Cliente puede ver tracking en `/track-order/:id` si tiene motorista asignado

---

## ⚠️ Consideraciones Importantes

### 1. Delivery Básico vs Avanzado

**Siempre disponible (sin habilitar módulo):**
- ✅ Configurar precio fijo de delivery
- ✅ Configurar delivery por zona/barrio
- ✅ Agregar/editar zonas
- ✅ Cliente puede seleccionar zona en checkout
- ✅ Tab "Entrega" en `/admin/settings`

**Solo con módulo habilitado:**
- ⚠️ Acceso a `/admin/delivery`
- ⚠️ Gestión de motoristas
- ⚠️ Asignación de motoristas a órdenes
- ⚠️ GPS tracking en tiempo real
- ⚠️ App PWA para motoristas
- ⚠️ Cliente ve mapa con ubicación del motorista

### 2. Función `has_module_enabled()`

Esta función RPC de Supabase verifica si un módulo está habilitado para una tienda:

```sql
-- Función en: supabase/migrations/20251202000002_subscription_functions.sql

CREATE OR REPLACE FUNCTION has_module_enabled(
  p_store_id UUID,
  p_module_name TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Verifica en subscription.enabled_modules
  -- Considera módulos incluidos en el plan
  -- Considera módulos habilitados manualmente por admin
  -- Verifica que suscripción esté activa o en trial
END;
$$;
```

**Uso en frontend:**
```typescript
import { useModuleAccess } from '@/hooks/useSubscription';

const { data: hasDelivery, isLoading } = useModuleAccess('delivery');

if (hasDelivery) {
  // Mostrar funcionalidades avanzadas
}
```

### 3. Impacto en RLS Policies

Las políticas RLS verifican si un módulo está habilitado antes de permitir acceso:

```sql
-- Ejemplo: Solo stores con módulo delivery habilitado pueden gestionar motoristas
CREATE POLICY "Store admins can manage drivers if module enabled"
ON drivers
FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM subscriptions
    WHERE (enabled_modules->>'delivery')::boolean = true
    AND status IN ('trial', 'active')
  )
);
```

---

## 🧪 Testing

### Test 1: Habilitar WhatsApp

**Pasos:**
1. Login como platform admin
2. Navegar a `/platform-admin/subscriptions`
3. Buscar tienda de prueba
4. Click en botón "WhatsApp"
5. Confirmar en dialog

**Resultado esperado:**
- ✅ Botón cambia a verde con ✓
- ✅ Toast: "El módulo WhatsApp ha sido habilitado exitosamente"
- ✅ En BD: `enabled_modules.whatsapp = true`

**Verificar:**
```sql
SELECT enabled_modules FROM subscriptions WHERE store_id = 'store-id';
```

---

### Test 2: Habilitar Delivery Avanzado

**Pasos:**
1. Login como platform admin
2. Navegar a `/platform-admin/subscriptions`
3. Buscar tienda de prueba
4. Click en botón "Delivery Avanzado"
5. Leer nota explicativa en dialog
6. Confirmar

**Resultado esperado:**
- ✅ Botón cambia a verde con ✓
- ✅ Toast: "El módulo Delivery Avanzado (por kilómetro) ha sido habilitado exitosamente"
- ✅ En BD: `enabled_modules.delivery = true`

**Verificar en tienda:**
1. Login como admin de la tienda
2. Navegar a `/admin/delivery`
3. ✅ Página carga sin error "Módulo no disponible"
4. ✅ Puede gestionar motoristas
5. ✅ Puede ver dashboard de entregas

---

### Test 3: Deshabilitar Módulo

**Pasos:**
1. Click en botón verde con ✓ de módulo habilitado
2. Confirmar deshabilitación

**Resultado esperado:**
- ✅ Botón cambia a outline sin ✓
- ✅ Toast: "El módulo X ha sido deshabilitado exitosamente"
- ✅ En BD: `enabled_modules.X = false`

**Verificar en tienda:**
- ⚠️ Admin ya no puede acceder a funcionalidades del módulo
- ⚠️ Muestra mensaje "Módulo no disponible"

---

## 📊 Estados de Módulos

| Estado | Descripción | Visual |
|--------|-------------|--------|
| **Habilitado** | Módulo activo para la tienda | Botón verde con ✓ |
| **Deshabilitado** | Módulo no disponible | Botón outline sin ✓ |
| **En proceso** | Habilitando/deshabilitando | Botón deshabilitado + "Procesando..." |

---

## 🎉 Resultado Final

### Desde Platform Admin:

✅ **Vista clara** de módulos habilitados por tienda
✅ **Habilitación/deshabilitación** con un click
✅ **Confirmación** con dialog explicativo
✅ **Feedback inmediato** con toasts
✅ **Descripción clara** de qué incluye cada módulo

### Desde Tienda (Cliente):

✅ **Acceso controlado** a funcionalidades según módulos habilitados
✅ **Mensajes claros** cuando un módulo no está disponible
✅ **Sin confusión** entre delivery básico y avanzado

---

## 📝 Notas Adicionales

### Módulos Futuros

El sistema está diseñado para agregar fácilmente nuevos módulos:

```typescript
// Agregar nuevo módulo en interfaz
interface Subscription {
  enabled_modules: {
    whatsapp?: boolean;
    delivery?: boolean;
    ai_enhancement?: boolean;  // ← Nuevo módulo
  };
}

// Agregar botón en UI
<Button
  variant={subscription.enabled_modules?.ai_enhancement ? 'default' : 'outline'}
  onClick={() => handleToggleModule(subscription, 'ai_enhancement')}
>
  AI Enhancement {subscription.enabled_modules?.ai_enhancement && '✓'}
</Button>
```

### Migración de Datos

Si necesitas migrar de campos antiguos (`whatsapp_enabled`, `delivery_enabled`) al nuevo formato JSONB:

```sql
-- Migración a enabled_modules JSONB
UPDATE subscriptions
SET enabled_modules = jsonb_build_object(
  'whatsapp', COALESCE(whatsapp_enabled, false),
  'delivery', COALESCE(delivery_enabled, false)
)
WHERE enabled_modules IS NULL OR enabled_modules = '{}'::jsonb;
```

---

**Documentado por:** Claude Code (Orchestrator Agent)
**Fecha:** 2025-12-05
**Archivo:** `src/pages/platform-admin/SubscriptionsManager.tsx`
**Estado:** ✅ Implementado y funcional
