# Sentry - Quick Start Guide

## 🚀 Inicio Rápido en 3 Pasos

### 1. La integración ya está activa ✓

Sentry está configurado y funcionando desde el momento en que inicias la aplicación.

**DSN configurado:**
```
https://63afd0c5a58daa15228eba85ac8356eb@o172702.ingest.us.sentry.io/4510482187878400
```

### 2. Verificar que funciona

#### Opción A: Usar el Test Button (Development)

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Importa el componente de test en cualquier página:
   ```tsx
   import { SentryTestButton } from "@/components/SentryTestButton";

   // En tu componente JSX
   <SentryTestButton />
   ```

3. Verás un panel flotante con botones de test. Haz clic en "Test Error"

4. Ve a Sentry Dashboard:
   https://sentry.io/organizations/pideai/issues/

#### Opción B: Código Manual

Agrega esto en cualquier componente temporalmente:
```tsx
<button onClick={() => {
  throw new Error('Test Sentry Error!');
}}>
  Test Sentry
</button>
```

### 3. Ver los datos en Sentry

**Dashboard Principal:**
https://sentry.io/organizations/pideai/projects/pideai-restaurant-app/

**Secciones importantes:**
- **Issues** - Errores capturados
- **Performance** - Métricas de velocidad
- **Replays** - Grabaciones de sesiones
- **Releases** - Versiones deployadas

---

## 📝 Uso Básico

### Capturar un Error

```typescript
import * as Sentry from '@sentry/react';

try {
  // Código que puede fallar
  riskyOperation();
} catch (error) {
  Sentry.captureException(error);
  throw error; // O manejar el error
}
```

### Usar Utilidades Personalizadas

```typescript
import { trackOrderEvent, captureException } from '@/lib/sentry-utils';

// Track orden creada
trackOrderEvent('created', orderId, { total: 100 });

// Capturar error con contexto
captureException(error, {
  tags: { module: 'checkout' },
  extra: { orderId: '123' }
});
```

### Agregar Context

```typescript
import * as Sentry from '@sentry/react';

// User context (ya se hace automáticamente en StoreContext)
Sentry.setUser({
  id: userId,
  email: userEmail,
});

// Custom tags
Sentry.setTag('payment_method', 'cash');

// Custom context
Sentry.setContext('order', {
  id: orderId,
  total: 100,
  items: 3
});
```

---

## 🏗️ Build de Producción

### Setup Inicial (Una Vez)

1. Obtén el Auth Token:
   - Ve a: https://sentry.io/settings/account/api/auth-tokens/
   - Crea un token con scopes: `project:read`, `project:releases`, `org:read`

2. Agrégalo a tu `.env` local (NUNCA lo commitees):
   ```bash
   SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxx
   ```

3. O agrégalo a tu CI/CD como secret

### Build

```bash
# Local
export SENTRY_AUTH_TOKEN=your_token
export VITE_APP_VERSION=$(git rev-parse --short HEAD)
npm run build

# Los source maps se subirán automáticamente
```

---

## 🎯 Características Ya Configuradas

| Feature | Status | Config |
|---------|--------|--------|
| Error Tracking | ✅ Active | 100% capture |
| Performance Monitoring | ✅ Active | 20% sample |
| Session Replay | ✅ Active | 10% normal, 100% errors |
| User Feedback Widget | ✅ Active | Spanish |
| Source Maps | ✅ Active | Auto-upload in prod |
| Multi-tenant Context | ✅ Active | Store + User info |
| Browser Profiling | ✅ Active | 10% sample |

---

## 📚 Documentación Completa

Para más detalles, consulta:

1. **SENTRY_IMPLEMENTATION_SUMMARY.md** - Resumen completo de la implementación
2. **SENTRY_SETUP.md** - Guía detallada con todos los addons
3. **src/lib/sentry-utils.ts** - Utilidades personalizadas con ejemplos

---

## 🆘 Problemas Comunes

### No veo errores en Sentry

1. Verifica que estás en el proyecto correcto
2. Espera unos segundos (puede tardar en aparecer)
3. Revisa la consola del navegador por errores de Sentry
4. Verifica que el error realmente se lanzó

### Source Maps no funcionan

1. Verifica que `SENTRY_AUTH_TOKEN` está configurado
2. Verifica el build en modo producción: `npm run build`
3. Revisa los logs del build para warnings de Sentry
4. Verifica permisos del token en Sentry

### Session Replay no graba

1. Verifica que estás en HTTPS (localhost está OK)
2. Verifica el sample rate en `main.tsx`
3. Para forzar replay, causa un error (100% capture en errores)

---

## 💡 Tips Rápidos

### Ver Source Code en Errores

Los source maps ya están configurados. En producción, verás el código original TypeScript en los stack traces de Sentry.

### Session Replay

Cuando un usuario reporta un bug, ve a Issues → Click en el issue → Tab "Replays" para ver exactamente qué hizo el usuario.

### Performance

Ve a Performance → Web Vitals para ver métricas de velocidad de tu app.

### Feedback Widget

Los usuarios pueden reportar bugs directamente desde la app. El widget está en español y se muestra automáticamente en errores.

---

## 🎉 ¡Listo!

Sentry está completamente configurado y funcionando. Solo necesitas:

1. ✅ **Development**: Todo funciona out-of-the-box
2. ✅ **Testing**: Usa `SentryTestButton` o lanza errores manualmente
3. 🔧 **Production**: Configura `SENTRY_AUTH_TOKEN` para source maps

**Dashboard**: https://sentry.io/organizations/pideai/

**¡Feliz monitoring!** 🚀
