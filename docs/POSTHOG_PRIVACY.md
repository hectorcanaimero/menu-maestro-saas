# PostHog Privacy Configuration

## Resumen

PostHog es nuestra herramienta de analytics y session replay. Por defecto, PostHog puede almacenar datos sensibles en `localStorage`, lo cual representa un riesgo de privacidad. Hemos implementado configuraciones para proteger la información personal identificable (PII) de nuestros usuarios.

## Problema Original

PostHog almacenaba en `localStorage` (sin encriptar):
- ❌ Emails de usuarios
- ❌ Teléfonos de clientes
- ❌ Direcciones de entrega
- ❌ Otra información personal

**Riesgo**: Cualquiera con acceso al navegador podía leer estos datos sensibles.

## Solución Implementada

### 1. Configuración de Privacidad en PostHog

**Archivo**: `/src/main.tsx`

```typescript
posthog.init(POSTHOG_KEY, {
  // Privacy & Security Configuration
  persistence: 'localStorage',

  // Sanitize properties before storing
  sanitize_properties: (properties) => {
    const sanitized = { ...properties };
    const sensitiveKeys = ['email', 'customer_email', 'phone', 'customer_phone', 'address', 'delivery_address'];
    sensitiveKeys.forEach(key => {
      if (sanitized[key]) delete sanitized[key];
    });
    return sanitized;
  },

  // Blacklist sensitive properties
  property_blacklist: ['$email', 'email', 'customer_email', 'customer_phone', 'phone'],

  // Session recording with privacy
  session_recording: {
    maskAllInputs: true,
    maskTextSelector: '[data-sensitive]',
  },
});
```

### 2. Identificación Segura de Usuarios

**Archivo**: `/src/contexts/StoreContext.tsx`

```typescript
// ❌ ANTES (Inseguro)
posthog.identify(userId, {
  email: user.email,  // Se guardaba en localStorage
  ...
});

// ✅ AHORA (Seguro)
posthog.identify(userId, {
  // Solo metadatos no sensibles
  store_id: storeData.id,
  is_store_owner: isOwner,
  role: isOwner ? 'owner' : 'customer',
  user_type: 'authenticated',
});

// Email se envía SOLO a servidores de PostHog (no localStorage)
posthog.people.set({
  email: user.email,  // Va directo al servidor, no a localStorage
});
```

### 3. Eventos Sin PII

**Archivo**: `/src/pages/ConfirmOrder.tsx`

```typescript
// ❌ ANTES (Inseguro)
posthog.capture('order_placed', {
  customer_email: orderData.customer_email,  // PII
  customer_phone: orderData.customer_phone,  // PII
  ...
});

// ✅ AHORA (Seguro)
posthog.capture('order_placed', {
  store_id: store.id,
  order_type: orderData.order_type,
  order_total: grandTotal,
  items_count: items.length,
  // NO se envían emails, teléfonos ni direcciones
});
```

## Datos que PostHog PUEDE Almacenar

✅ **Permitido** (metadatos no sensibles):
- IDs de usuario (UUID anónimos)
- IDs de tienda
- Tipo de orden (delivery/pickup/digital_menu)
- Totales de órdenes
- Cantidad de items
- Tipo de pago (ej: "efectivo", "transferencia")
- Códigos de cupón
- Timestamps
- Tipo de usuario (owner/customer/visitor)

## Datos que PostHog NO DEBE Almacenar

❌ **Prohibido** (PII - Personal Identifiable Information):
- Emails
- Teléfonos
- Nombres completos
- Direcciones físicas
- Números de tarjeta
- Comprobantes de pago
- Cualquier dato que identifique a una persona

## Cómo Funciona

### Flujo de Datos Sensibles

```
1. Usuario ingresa email en formulario
   ↓
2. Email se usa para identificar al usuario
   ↓
3. posthog.identify() - NO incluye email
   ↓
4. posthog.people.set({ email }) - Envía email directamente al servidor
   ↓
5. localStorage - Solo guarda ID de usuario y metadatos
```

### Flujo de Eventos

```
1. Usuario completa orden
   ↓
2. Se genera evento 'order_placed'
   ↓
3. sanitize_properties() elimina PII del evento
   ↓
4. Solo metadatos se almacenan en localStorage
   ↓
5. Evento completo (con PII) se envía al servidor PostHog
```

## Session Recording con Privacidad

```typescript
session_recording: {
  maskAllInputs: true,           // Enmascara TODOS los inputs
  maskTextSelector: '[data-sensitive]',  // Enmascara elementos con atributo
}
```

**Resultado**: Los recordings NO muestran:
- ❌ Texto en campos de input
- ❌ Elementos con `data-sensitive` attribute
- ✅ Solo flujo de navegación y clics

## localStorage Antes vs Después

### ❌ ANTES (Inseguro)

```javascript
localStorage: {
  "ph_phc_...": {
    "distinct_id": "user-123",
    "email": "cliente@email.com",        // ❌ PII expuesto
    "customer_phone": "+58 414 555-1234", // ❌ PII expuesto
    "$sesion_id": "abc123",
    ...
  }
}
```

### ✅ AHORA (Seguro)

```javascript
localStorage: {
  "ph_phc_...": {
    "distinct_id": "user-123",
    "store_id": "uuid-456",
    "is_store_owner": true,
    "role": "owner",
    "user_type": "authenticated",
    // ✅ NO hay emails, teléfonos ni direcciones
  }
}
```

## Archivos Modificados

1. **`/src/main.tsx`** (líneas 12-43)
   - Configuración de sanitización de propiedades
   - Property blacklist
   - Session recording con privacidad

2. **`/src/contexts/StoreContext.tsx`** (líneas 184-235)
   - Identificación sin PII
   - Uso de `posthog.people.set()` para enviar email solo al servidor

3. **`/src/pages/ConfirmOrder.tsx`** (líneas 108-128)
   - Eventos sin PII
   - Solo metadatos en tracking

## Pruebas Recomendadas

### 1. Verificar localStorage

```javascript
// En la consola del navegador
localStorage.getItem('ph_phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH_posthog')

// Debería mostrar JSON sin emails, teléfonos ni direcciones
```

### 2. Probar Identificación de Usuario

1. Inicia sesión en la aplicación
2. Abre DevTools → Application → LocalStorage
3. Busca el key de PostHog (`ph_phc_...`)
4. Verifica que NO contenga `email`, `phone`, o `address`

### 3. Verificar Eventos

1. Completa una orden
2. Abre DevTools → Network → Filter by "posthog"
3. Busca el request con evento `order_placed`
4. Verifica en el payload que NO incluya PII en properties

### 4. Session Recording

1. Navega por la aplicación mientras estás siendo grabado
2. Ve a PostHog dashboard → Session Recordings
3. Reproduce tu sesión
4. Verifica que los campos de input están enmascarados

## Cumplimiento GDPR/LOPD

✅ **Ahora cumplimos con**:
- Minimización de datos (solo guardamos lo necesario)
- Seguridad de datos (PII no expuesta en localStorage)
- Transparencia (documentación clara de qué se guarda)

## Comandos de Debug

```javascript
// Ver datos de PostHog en localStorage
localStorage.getItem('ph_phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH_posthog')

// Reset completo de PostHog
posthog.reset()

// Ver propiedades actuales del usuario
posthog.get_property('store_id')
posthog.get_property('email') // Debería retornar undefined

// Ver distinct_id actual
posthog.get_distinct_id()
```

## Notas Importantes

1. **Email sí se envía al servidor**: El email SÍ se envía a los servidores de PostHog (vía `posthog.people.set()`), pero NO se almacena en localStorage del navegador.

2. **Session Recordings**: Aunque los inputs están enmascarados, PostHog puede ver flujos de navegación y clics.

3. **Analytics siguen funcionando**: Todas las métricas importantes (conversiones, ordenes, revenue) siguen siendo rastreadas correctamente.

4. **Compatibilidad**: Esta configuración funciona con PostHog Cloud y self-hosted.

## Referencias

- [PostHog Privacy Settings](https://posthog.com/docs/privacy)
- [GDPR Compliance](https://posthog.com/docs/privacy/gdpr-compliance)
- [Session Recording Privacy](https://posthog.com/docs/session-replay/privacy)
