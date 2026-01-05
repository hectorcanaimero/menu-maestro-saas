# Configuración de Sentry - PideAI

## ✅ Estado: Activo y Funcionando

Sentry está completamente configurado y capturando errores en tiempo real.

---

## 📋 Información del Proyecto

- **Organization**: `pideai` (ID: o172702)
- **Project**: `pideai-restaurant-app` (ID: 4510482187878400)
- **DSN**: `https://63afd0c5a58daa15228eba85ac8356eb@o172702.ingest.us.sentry.io/4510482187878400`
- **Dashboard**: https://pideai.sentry.io/issues/

---

## 🔧 Configuración Actual

### Variables de Entorno (.env)

```bash
# Sentry Auth Token (para source maps en CI/CD)
SENTRY_AUTH_TOKEN=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

# Version de la app (para tracking de releases)
VITE_APP_VERSION=3.0.25
```

### Configuración en main.tsx

**Archivo**: `src/main.tsx`

```typescript
Sentry.init({
  dsn: 'https://63afd0c5a58daa15228eba85ac8356eb@o172702.ingest.us.sentry.io/4510482187878400',

  environment: import.meta.env.MODE, // 'development' o 'production'
  release: import.meta.env.VITE_APP_VERSION || 'development',

  // Debug mode activo en desarrollo
  debug: import.meta.env.DEV,

  integrations: [
    // React Router V6 tracking
    Sentry.reactRouterV6BrowserTracingIntegration({...}),

    // Session Replay con privacidad
    Sentry.replayIntegration({
      maskAllText: true,
      maskAllInputs: true,
      blockAllMedia: false,
    }),

    // Profiling de rendimiento
    Sentry.browserProfilingIntegration(),

    // Browser tracing
    Sentry.browserTracingIntegration({
      traceFetch: true,
      traceXHR: true,
      enableLongTask: true,
      enableInp: true,
    }),
  ],

  // Sample Rates
  tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.2,      // 100% dev, 20% prod
  replaysSessionSampleRate: import.meta.env.DEV ? 1.0 : 0.1, // 100% dev, 10% prod
  replaysOnErrorSampleRate: 1.0,                          // 100% siempre
  profilesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,   // 100% dev, 10% prod

  beforeSend(event, hint) {
    // En desarrollo: log all events
    if (import.meta.env.DEV) {
      console.log('🚀 Sentry Event:', event);
      console.log('💡 Hint:', hint);
    }

    // Filtros solo en producción
    if (!import.meta.env.DEV) {
      // Ignorar ResizeObserver errors
      if (error?.message?.includes('ResizeObserver')) {
        return null;
      }
    }

    return event;
  },
});
```

### Configuración de Vite (vite.config.ts)

```typescript
import { sentryVitePlugin } from "@sentry/vite-plugin";

export default defineConfig(({ mode }) => ({
  plugins: [
    // Sentry plugin solo en producción
    mode === "production" &&
      sentryVitePlugin({
        org: "pideai",
        project: "pideai-restaurant-app",
        authToken: process.env.SENTRY_AUTH_TOKEN,

        // Subir source maps
        sourcemaps: {
          assets: "./dist/**",
          ignore: ["node_modules"],
          filesToDeleteAfterUpload: ["./dist/**/*.map"],
        },

        release: {
          name: process.env.VITE_APP_VERSION || "development",
          setCommits: { auto: true },
        },

        telemetry: false,
        debug: false,
      }),
  ],

  build: {
    // Generar source maps en producción
    sourcemap: mode === "production",
  },
}));
```

---

## 📊 Características Activas

### ✅ Error Tracking
- Captura automática de errores no manejados
- Stack traces completos
- Source maps para debugging de código minificado

### ✅ Performance Monitoring
- Tracking de navegación (React Router)
- Monitoreo de APIs (fetch/XHR)
- Long tasks tracking
- Interaction to Next Paint (INP)

### ✅ Session Replay
- Grabación de sesiones (10% en prod, 100% en errores)
- Privacidad: máscaras en inputs y texto sensible
- Network recording para debugging

### ✅ Profiling
- Performance profiling del navegador
- Análisis de funciones lentas

### ✅ Breadcrumbs
- Máximo 50 breadcrumbs por evento
- Contexto completo de navegación y acciones

---

## 🧪 Testing de Sentry

### En Desarrollo

Sentry está configurado para **capturar el 100%** de eventos en desarrollo con logs detallados en consola.

**Para probar manualmente:**

1. Abre la consola del navegador (F12)
2. Ejecuta cualquiera de estos comandos:

```javascript
// Error básico
Sentry.captureException(new Error('Test error'));

// Mensaje
Sentry.captureMessage('Test message', 'info');

// Error no capturado
throw new Error('Unhandled test error');
```

3. Verifica en consola los logs:
```
🚀 Sentry Event: {...}
💡 Hint: {...}
[Sentry] Sending event: ...
```

4. Espera 10-30 segundos y verifica en: https://pideai.sentry.io/issues/

### Componente de Prueba (solo desarrollo)

El componente `SentryTestButton` está disponible pero **no está incluido** en la aplicación principal. Para usarlo temporalmente:

```typescript
// En App.tsx (temporal)
import { SentryTestButton } from "./components/SentryTestButton";

// Agregar en JSX
<SentryTestButton />
```

Recuerda removerlo después de las pruebas.

---

## 🏗️ Build de Producción

### Source Maps

Los source maps se suben automáticamente a Sentry durante el build de producción:

```bash
# Build con source maps
npm run build

# Vite generará los source maps
# El plugin de Sentry los subirá automáticamente
# Los source maps se eliminarán del dist/ después
```

**Verificación:**
1. Ve a Sentry → Settings → Source Maps
2. Deberías ver los source maps para la versión `3.0.25`

### Variables Requeridas en CI/CD

```bash
SENTRY_AUTH_TOKEN=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
VITE_APP_VERSION=3.0.25
```

---

## 📈 Sample Rates Explicados

### Desarrollo (import.meta.env.DEV)
- **Traces**: 100% (todas las transacciones)
- **Replays**: 100% (todas las sesiones)
- **Profiles**: 100% (todos los profiles)
- **Replays on Error**: 100% (siempre)

### Producción
- **Traces**: 20% (1 de cada 5 transacciones)
- **Replays**: 10% (1 de cada 10 sesiones normales)
- **Profiles**: 10% (1 de cada 10 profiles)
- **Replays on Error**: 100% (todas las sesiones con errores)

**Razón**: Balance entre visibilidad completa y costos de cuota.

---

## 🔒 Privacidad y Seguridad

### Session Replay
- **maskAllText**: `true` - Todo el texto está enmascarado
- **maskAllInputs**: `true` - Todos los inputs están enmascarados
- **blockAllMedia**: `false` - Imágenes visibles (sin datos sensibles)

### PII (Personally Identifiable Information)
- **sendDefaultPii**: `false` - No envía PII por defecto
- Emails, teléfonos y direcciones NO se envían a Sentry

### Network Capture
- Solo se capturan headers personalizados específicos
- Bodies de requests se incluyen para debugging (sin PII)

---

## 🚨 Filtros de Errores

### Errores Ignorados (solo en producción)

1. **ResizeObserver errors**
   - Quirk común del navegador
   - No afecta funcionalidad

2. **Network errors** (Failed to fetch, NetworkError)
   - Se capturan pero se etiquetan con `network_error: true`
   - Útil para distinguir problemas de red vs bugs reales

---

## 📚 Utilidades de Sentry

**Archivo**: `src/lib/sentry-utils.ts`

Funciones helper para tracking avanzado:

```typescript
// Business events
trackOrderEvent('created', orderId, orderData);
trackPaymentEvent('completed', paymentData);

// Performance
const transaction = startPerformanceTransaction('checkout', 'user-flow');
transaction.finish();

// Breadcrumbs
addBreadcrumb('User clicked checkout', 'user-action');

// Exceptions con contexto
captureException(error, {
  tags: { section: 'checkout' },
  extra: { orderId, amount },
});
```

---

## 🔗 Links Útiles

- **Dashboard**: https://pideai.sentry.io/issues/
- **Settings**: https://pideai.sentry.io/settings/projects/pideai-restaurant-app/
- **Performance**: https://pideai.sentry.io/performance/
- **Releases**: https://pideai.sentry.io/releases/
- **Replays**: https://pideai.sentry.io/replays/

---

## 🆘 Soporte

Si tienes problemas con Sentry:

1. **Verifica que esté inicializado**: Abre consola y busca `[Sentry] ...`
2. **Revisa la Network tab**: Busca requests a `sentry.io`
3. **Verifica el DSN**: Debe coincidir con el proyecto correcto
4. **Revisa sample rates**: En dev debería ser 100%
5. **Contacta a Sentry**: https://sentry.io/support/

---

## ✨ Resumen

✅ **Sentry está completamente configurado y funcional**
- Captura errores en tiempo real
- Performance monitoring activo
- Session replay con privacidad
- Source maps configurados para producción
- Debug mode activo en desarrollo
- Integración con React Router

🎯 **Próximos pasos**:
- Monitorear el dashboard regularmente
- Configurar alertas personalizadas en Sentry
- Revisar performance issues periódicamente
