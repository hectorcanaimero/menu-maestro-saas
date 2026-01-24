# 🚨 URGENTE: Errores Críticos en Producción

## Problema Detectado

Tu sitio en producción tiene **errores críticos** que están rompiendo funcionalidad core:

### Error 1: RPC Functions faltantes (404)
```
POST .../rpc/get_store_by_subdomain_secure 404 (Not Found)
POST .../rpc/can_access_admin_routes 400 (Bad Request)
```

**Impacto:**
- ❌ No se pueden cargar las tiendas
- ❌ El admin panel no funciona correctamente
- ❌ Errores visibles para usuarios

**Causa:** Las migraciones SQL no se han aplicado en producción

### Error 2: Sentry Rate Limit (429)
```
Transport returned status code 429
```

**Impacto:**
- ⚠️ No se están reportando errores a Sentry
- ⚠️ Costos excesivos si  tienes plan de pago

**Causa:** Configuración muy agresiva de sampling

### Error 3: HTML Anidado Incorrecto
```
Warning: <div> cannot appear as a descendant of <p>
```

**Impacto:**
- ⚠️ Warnings en consola
- ⚠️ Potenciales problemas de renderizado

**Solución:** ✅ Ya corregido en el código

## 🔥 Solución Inmediata

### Paso 1: Aplicar Migraciones SQL Faltantes

**Urgencia:** Alta - Hazlo AHORA

1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/wdpexjymbiyjqwdttqhz
2. Ve a SQL Editor (icono de base de datos en el sidebar)
3. Crea un nuevo query
4. Copia y pega TODO el contenido de: [`scripts/apply-missing-migrations.sql`](../scripts/apply-missing-migrations.sql)
5. Ejecuta el query (botón "Run")
6. Verifica que aparezcan 2 funciones creadas

**Verificación:**
Deberías ver este resultado:
```
routine_name                      | routine_type | data_type
----------------------------------|--------------|----------
can_access_admin_routes           | FUNCTION     | boolean
get_store_by_subdomain_secure     | FUNCTION     | SETOF record
```

### Paso 2: Reducir Sampling de Sentry

**Urgencia:** Media - Puedes hacerlo después del Paso 1

Edita `src/main.tsx`:

```typescript
// CAMBIAR ESTAS LÍNEAS:

// ANTES:
tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.1,  // 10% en prod
replaysSessionSampleRate: import.meta.env.DEV ? 0.5 : 0.05,  // 5% en prod
replaysOnErrorSampleRate: import.meta.env.DEV ? 1.0 : 0.5,  // 50% en prod

// DESPUÉS:
tracesSampleRate: import.meta.env.DEV ? 1.0 : 0.01,  // 1% en prod
replaysSessionSampleRate: import.meta.env.DEV ? 0.5 : 0.01,  // 1% en prod
replaysOnErrorSampleRate: import.meta.env.DEV ? 1.0 : 0.1,  // 10% en prod
```

### Paso 3: Deploy del Fix HTML

**Urgencia:** Baja - Hazlo cuando tengas tiempo

El fix del HTML ya está commitado, solo necesitas:
1. Push los cambios (si no se han pusheado)
2. Esperar al auto-deploy

## ✅ Verificación de Que Funcionó

### Verificar Paso 1 (RPC Functions)

Recarga tu sitio en producción y abre la consola (F12).

**Antes (❌ Errores):**
```
POST .../rpc/get_store_by_subdomain_secure 404 (Not Found)
POST .../rpc/can_access_admin_routes 400 (Bad Request)
```

**Después (✅ Sin errores):**
```
POST .../rpc/get_store_by_subdomain_secure 200 (OK)
POST .../rpc/can_access_admin_routes 200 (OK)
```

### Verificar Paso 2 (Sentry)

Después del rebuild:
- No deberías ver más errores 429 en consola
- Sentry solo capturará 1% del tráfico (mucho más económico)

## 🔍 Diagnóstico Completo

### Por qué pasó esto?

**RPC Functions faltantes:**
- Las migraciones existen en el repo: `supabase/migrations/*.sql`
- Pero NO se ejecutaron en la base de datos de producción
- Probablemente usas migraciones manuales en lugar de auto-sync

**Sentry Rate Limit:**
- El sampling estaba en 10% (traces) y 5% (replays)
- Con el tráfico de producción, esto excede los límites de Sentry
- Sentry te bloqueó con error 429

### Cómo prevenir esto en el futuro?

**Para RPC Functions:**
1. Usa Supabase CLI para sincronizar migraciones automáticamente:
   ```bash
   supabase db push
   ```
2. O configura auto-migrations en tu CI/CD
3. O aplica manualmente cada migración nueva

**Para Sentry:**
1. Usa sampling bajo en producción (1-2%)
2. Aumenta solo si tienes plan Enterprise
3. Monitorea el uso en Sentry Dashboard

## 📊 Prioridad de Fixes

| Fix | Urgencia | Impacto | Tiempo |
|-----|----------|---------|--------|
| 1. Aplicar migraciones SQL | 🔴 CRÍTICO | Alto - Rompe funcionalidad | 5 min |
| 2. Reducir Sentry sampling | 🟡 Medio | Medio - Costos y monitoreo | 10 min |
| 3. Fix HTML warnings | 🟢 Bajo | Bajo - Solo warnings | Auto |

## 🆘 Si Algo Falla

### Si las migraciones fallan en Supabase:

1. Revisa el error específico
2. Puede ser que las funciones ya existan (no es un error)
3. Verifica permisos: ¿Eres admin del proyecto?

### Si Sentry sigue con 429:

1. Ve a Sentry Dashboard → Settings → Quota
2. Verifica el límite de tu plan
3. Considera upgrade o reduce más el sampling

### Si el sitio sigue roto después de las migraciones:

1. Hard refresh (Ctrl+Shift+R)
2. Limpia cache del navegador
3. Verifica en modo incógnito
4. Revisa logs en Supabase Dashboard

## 🎯 Siguiente Paso AHORA MISMO

1. **Abre Supabase Dashboard** → SQL Editor
2. **Copia y ejecuta** `scripts/apply-missing-migrations.sql`
3. **Verifica** que las funciones se crearon
4. **Recarga** tu sitio y verifica que no hay errores 404

¡Hazlo ahora antes de continuar con PostHog!
