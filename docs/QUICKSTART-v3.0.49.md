# 🚀 Quick Start - Deploy v3.0.49

## ✅ Lo que ya se hizo automáticamente

Cuando se creó la tag `v3.0.49`, GitHub Actions se disparó automáticamente y:

1. ✅ Build de la imagen Docker con todas las variables de PostHog
2. ✅ Push al registry: `ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.49`
3. ✅ Notificación al webhook de deployment

## 🔍 Verificar que el workflow se ejecutó

Ve a: https://github.com/hectorcanaimero/menu-maestro-saas/actions

Deberías ver:
- Un workflow corriendo o completado para tag `v3.0.49`
- Estado: ✅ Success (verde)
- Duration: ~5-10 minutos

## 🎯 Próximos Pasos

### Paso 1: Verificar que la imagen está disponible

La imagen debería estar en:
```
ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.49
ghcr.io/hectorcanaimero/menu-maestro-saas:3.0
ghcr.io/hectorcanaimero/menu-maestro-saas:3
ghcr.io/hectorcanaimero/menu-maestro-saas:latest
```

### Paso 2: El auto-deploy debería estar en progreso

El webhook (`https://webhooks.guria.lat/webhook/...`) debería haber sido llamado y tu servidor debería estar haciendo pull de la nueva imagen automáticamente.

### Paso 3: Verificar que el deploy se completó

Dependiendo de tu configuración de auto-deploy, verifica:

**Si usas Portainer/Watchtower:**
- Las imágenes se actualizan automáticamente
- Espera ~2-5 minutos

**Si usas un script personalizado:**
- Revisa los logs del webhook
- Verifica que el servicio se actualizó

### Paso 4: Verificar en producción

**A. Verificar PostHog está cargado (5 minutos después del deploy):**

1. Abre `https://pideai.com` en el navegador
2. Abre consola (F12)
3. Ejecuta:
   ```javascript
   window.posthog
   ```
4. Debería mostrar un objeto PostHog ✅ (no `undefined` ❌)

**B. Verificar que captura eventos:**
```javascript
window.posthog.get_distinct_id()
```
Debería devolver un ID ✅ (no `undefined` ❌)

**C. Usar el script de verificación:**
```bash
./scripts/verify-posthog-production.sh pideai.com
```

## ⏱️ Timeline Esperado

- **T+0 min**: Tag creada, workflow disparado
- **T+5 min**: Build completado, imagen pusheada
- **T+7 min**: Webhook notificado, auto-deploy iniciado
- **T+10 min**: Servicio actualizado, nueva versión live
- **T+15 min**: Puedes verificar PostHog en producción

## 🐛 Si algo falló

### Problema: Workflow falló en GitHub Actions

Ve a la página del workflow y revisa los logs:
```
https://github.com/hectorcanaimero/menu-maestro-saas/actions
```

Causas comunes:
- Secret faltante en GitHub
- Error en el Dockerfile
- Error de permisos en GHCR

### Problema: Auto-deploy no funcionó

Verifica el webhook manualmente:
```bash
curl -X POST https://webhooks.guria.lat/webhook/aff2fdab-f81b-4031-b145-5f6bccca32cc \
  -H "Content-Type: application/json" \
  -d '{
    "service": "frontend_web",
    "image": "ghcr.io/hectorcanaimero/menu-maestro-saas",
    "tag": "v3.0.49"
  }'
```

### Problema: Servicio no se actualizó

Deploy manual en el servidor:
```bash
ssh usuario@servidor
docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.49 pideai_app
```

## ✅ Verificación de Éxito

Sabrás que todo funcionó cuando:

1. ✅ GitHub Actions workflow completado con éxito
2. ✅ `window.posthog` devuelve un objeto (no undefined)
3. ✅ PostHog dashboard muestra eventos de `pideai.com`
4. ✅ `/platform-admin/catalogs` muestra vistas reales

## 📊 Secrets de GitHub que necesitas verificar

Ve a: `https://github.com/hectorcanaimero/menu-maestro-saas/settings/secrets/actions`

Asegúrate de que tienes estos secrets configurados:

- ✅ `VITE_SUPABASE_PROJECT_ID`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_POSTHOG_KEY`
- ✅ `VITE_POSTHOG_HOST`
- ✅ `VITE_POSTHOG_PERSONAL_KEY`
- ✅ `VITE_POSTHOG_API_KEY` ← **Este es crítico**
- ✅ `VITE_GOOGLE_MAPS`
- ✅ `VITE_GA4_MEASUREMENT_ID`

Si falta `VITE_POSTHOG_API_KEY`, agrégalo con el valor de `.env.production`:
```
phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
```

## 🎉 ¡Listo!

Si todo está bien configurado, en ~10-15 minutos después de crear la tag deberías tener PostHog funcionando en producción.

**Siguiente paso:** Ve a la página de Actions y verifica el estado del workflow.
