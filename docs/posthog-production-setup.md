# PostHog Production Setup - Troubleshooting Guide

## Problema Identificado

PostHog no estaba capturando eventos de producción (`pideai.com`), solo de desarrollo local (`localhost:8080`).

## Causa Raíz

El script de build de Docker (`scripts/build-docker-image.sh`) **no estaba pasando** `VITE_POSTHOG_API_KEY` como build argument, lo que causaba que:

1. ✅ Los eventos se capturaban en PostHog (tracking básico funcionaba)
2. ❌ Pero la API de PostHog no podía consultarse desde el admin panel
3. ❌ El CatalogViewsManager mostraba 0 vistas porque no podía consultar PostHog API

## Solución Implementada

Se agregó `VITE_POSTHOG_API_KEY` al script de build:

```bash
--build-arg VITE_POSTHOG_API_KEY="${VITE_POSTHOG_API_KEY:-}"
```

También se agregaron las variables faltantes de Google Maps y GA4.

## Verificación Post-Deploy

Después de hacer el nuevo build y deploy, verifica:

### 1. Verificar que PostHog está activo en producción

Abre la consola del navegador en `pideai.com` y ejecuta:

```javascript
console.log('PostHog:', window.posthog);
console.log('PostHog Key:', import.meta.env.VITE_POSTHOG_KEY);
console.log('PostHog API Key:', import.meta.env.VITE_POSTHOG_API_KEY);
```

Deberías ver las keys configuradas (no `undefined`).

### 2. Verificar eventos en PostHog

1. Ve a PostHog dashboard
2. Busca eventos `catalog_page_view`
3. Filtra por `$host` = `pideai.com`
4. Deberías ver eventos con:
   - `store_id`
   - `store_name`
   - `subdomain`
   - `catalog_mode`

### 3. Verificar API de PostHog

En `/platform-admin/catalogs`:

1. Abre la consola del navegador
2. Busca logs que empiecen con 🔍, ✅ o ❌
3. Verifica que se obtengan las vistas desde PostHog
4. Deberías ver logs como:
   ```
   🔍 Fetching catalog stores...
   ✅ Found X stores in catalog mode
   📊 Fetching data for store: ...
   ✅ Store Name: X views / 1000 limit
   ```

## Pasos para Re-Deploy

### Opción 1: Build y Deploy Local

```bash
# 1. Build la nueva imagen
./scripts/build-docker-image.sh --push --tag v3.0.49

# 2. Deploy en Swarm
./scripts/deploy-to-swarm.sh
```

### Opción 2: CI/CD (GitHub Actions)

Si tienes CI/CD configurado, simplemente:

1. Hacer commit de los cambios
2. Push a main
3. El pipeline debería hacer build y deploy automáticamente

```bash
git add scripts/build-docker-image.sh
git commit -m "fix: Add missing PostHog API key to Docker build"
git push origin main
```

## Variables de Entorno Requeridas

Asegúrate de que `.env.production` tenga:

```bash
# PostHog Analytics (todas necesarias)
VITE_POSTHOG_KEY=phc_...           # Key pública para tracking
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_PERSONAL_KEY=phx_...  # Personal API key para queries
VITE_POSTHOG_API_KEY=phc_...       # Mismo que VITE_POSTHOG_KEY
```

## Monitoreo Continuo

### Dashboard de PostHog

Crea un dashboard con:

1. **Eventos por Host**
   - Métrica: Count de `catalog_page_view`
   - Group by: `$host`
   - Deberías ver `pideai.com` y sus subdominios

2. **Vistas por Tienda**
   - Métrica: Count de `catalog_page_view`
   - Group by: `store_id`, `store_name`
   - Filtro: `catalog_mode = true`

3. **Tiendas cerca del límite**
   - Métrica: Count de `catalog_page_view`
   - Group by: `store_id`
   - Filtro: `catalog_mode = true`
   - Alert: cuando > 800 vistas (80% del límite)

## Troubleshooting Adicional

### Problema: Sigo viendo solo localhost

**Causa**: Cache del navegador o no se hizo deploy del nuevo build

**Solución**:
1. Limpia cache del navegador (Ctrl+Shift+R)
2. Verifica que el deployment se haya completado
3. Verifica la versión de la imagen en el servidor:
   ```bash
   docker ps | grep menu-maestro
   docker inspect <container_id> | grep VITE_POSTHOG
   ```

### Problema: PostHog API devuelve error 401

**Causa**: `VITE_POSTHOG_PERSONAL_KEY` o `VITE_POSTHOG_API_KEY` incorrectos

**Solución**:
1. Regenera el Personal API Key en PostHog
2. Actualiza `.env.production`
3. Re-build la imagen

### Problema: No aparecen datos en el admin panel

**Causa**: No hay tiendas con `catalog_mode = true` o PostHog API no está configurada

**Solución**:
1. Activa `catalog_mode` en al menos una tienda
2. Visita la tienda varias veces para generar vistas
3. Espera 1-2 minutos para que PostHog procese los eventos
4. Refresca `/platform-admin/catalogs`

## Contacto y Soporte

Si los problemas persisten:
1. Revisa los logs de la consola del navegador
2. Revisa los logs del container Docker
3. Verifica la configuración en PostHog dashboard
