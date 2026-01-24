# Instrucciones de Deploy v3.0.49 - Fix PostHog Production

## 🎯 Objetivo

Deployar la versión 3.0.49 que corrige el problema de PostHog en producción.

## 📋 Cambios en esta versión

1. **PostHog API Key agregada al Docker build**
   - Ahora el build incluye `VITE_POSTHOG_API_KEY`
   - También incluye `VITE_GOOGLE_MAPS` y `VITE_GA4_MEASUREMENT_ID`

2. **CatalogViewsManager lee de PostHog**
   - Las vistas de catálogo se obtienen de PostHog API
   - No más duplicación de datos

3. **Logs de debug mejorados**
   - Mejor visibilidad de errores en consola

## 🚀 Opción 1: Deploy Automático (Recomendado)

Si tienes CI/CD configurado (GitHub Actions, etc.):

```bash
# Los cambios ya están en main con tag v3.0.49
# El pipeline debería hacer build y deploy automáticamente
```

Verifica en:
- GitHub Actions (si está configurado)
- Tu plataforma de CI/CD

## 🔧 Opción 2: Deploy Manual desde Servidor

### Paso 1: Conectarse al servidor

```bash
ssh usuario@tu-servidor.com
cd /ruta/a/tu/proyecto
```

### Paso 2: Pull de los últimos cambios

```bash
git fetch --all --tags
git checkout v3.0.49
```

### Paso 3: Build de la imagen Docker

```bash
# Asegúrate de que .env.production tiene las variables correctas
cat .env.production | grep POSTHOG

# Build y push al registry
./scripts/build-docker-image.sh --push --tag v3.0.49
```

### Paso 4: Deploy en Docker Swarm

```bash
# Deploy del stack
./scripts/deploy-to-swarm.sh

# O manualmente:
docker stack deploy -c docker-compose.swarm.yml pideai
```

### Paso 5: Verificar que el deploy fue exitoso

```bash
# Ver servicios corriendo
docker service ls

# Ver logs del servicio
docker service logs pideai_app --tail 100 --follow

# Esperar a que el servicio esté completamente arriba
watch -n 2 'docker service ls'
```

## 🔧 Opción 3: Deploy Manual desde tu Mac (sin Docker)

Si no tienes Docker en tu Mac, puedes hacer el build en el servidor:

### Paso 1: Conectarse al servidor

```bash
ssh usuario@tu-servidor.com
```

### Paso 2: Clonar/actualizar el repo

```bash
cd ~
git clone https://github.com/hectorcanaimero/menu-maestro-saas.git menu-maestro
# O si ya existe:
cd ~/menu-maestro
git fetch --all --tags
git checkout v3.0.49
```

### Paso 3: Copiar variables de entorno

```bash
# Copia tu .env.production local al servidor
# Desde tu Mac:
scp .env.production usuario@servidor:~/menu-maestro/.env.production
```

### Paso 4: Build y Deploy en el servidor

```bash
# Ya en el servidor:
cd ~/menu-maestro
./scripts/build-docker-image.sh --push --tag v3.0.49
./scripts/deploy-to-swarm.sh
```

## ✅ Verificación Post-Deploy

### 1. Verificar con el script automático

```bash
./scripts/verify-posthog-production.sh pideai.com
```

### 2. Verificación manual en el navegador

Abre `https://pideai.com` (o tu dominio) en el navegador:

**A. Verificar PostHog está cargado:**
```javascript
// En la consola del navegador (F12)
window.posthog
// Debería mostrar un objeto PostHog, NO undefined
```

**B. Verificar que captura eventos:**
```javascript
window.posthog.get_distinct_id()
// Debería devolver un ID, NO undefined
```

**C. Ver requests de PostHog:**
1. Abre DevTools → Network tab
2. Filtra por "posthog" o "us.i.posthog.com"
3. Recarga la página (Ctrl+R)
4. Deberías ver requests POST a `us.i.posthog.com/e/`

### 3. Verificar en PostHog Dashboard

1. Ve a: https://us.posthog.com/project/88656/events
2. Filtra:
   - Event: `catalog_page_view`
   - `$host` contains `pideai.com`
3. Deberías ver eventos recientes de tu dominio

### 4. Verificar el Admin Panel

1. Ve a: `https://pideai.com/platform-admin/catalogs`
2. Abre la consola del navegador (F12)
3. Busca logs que empiecen con 🔍, ✅ o ❌
4. Deberías ver:
   ```
   🔍 Fetching catalog stores...
   ✅ Found X stores in catalog mode
   📊 Fetching data for store: ...
   ✅ Store Name: X views / 1000 limit
   ```

## 🐛 Troubleshooting

### Problema: Sigo viendo `window.posthog` = `undefined`

**Posibles causas:**
- Cache del navegador mostrando versión antigua
- El deploy no se completó correctamente
- Las variables de entorno no se incluyeron en el build

**Soluciones:**
```bash
# 1. Limpiar cache del navegador
# Ctrl+Shift+R o Cmd+Shift+R

# 2. Verificar que el servicio se actualizó
docker service ps pideai_app --no-trunc

# 3. Verificar variables en la imagen
docker run --rm ghcr.io/hectorcanaimero/menu-maestro:v3.0.49 \
  cat /usr/share/nginx/html/index.html | grep -o "phc_[a-zA-Z0-9]*" | head -1

# 4. Si no aparece nada, rebuild la imagen
./scripts/build-docker-image.sh --no-cache --push --tag v3.0.49
```

### Problema: PostHog API devuelve error

**Verificar en consola del navegador:**
```javascript
// Debería ver requests fallidas a us.i.posthog.com
```

**Causa:** La key de API es incorrecta o no se compiló

**Solución:**
1. Verifica que `.env.production` tiene `VITE_POSTHOG_API_KEY`
2. Rebuild con `--no-cache`
3. Verifica que la key es correcta en PostHog dashboard

### Problema: CatalogViewsManager muestra 0 vistas

**Posibles causas:**
- No hay tiendas con `catalog_mode = true`
- PostHog aún no tiene datos de producción
- La API key no está configurada

**Solución:**
1. Activa `catalog_mode` en una tienda de prueba
2. Visita esa tienda varias veces
3. Espera 2-3 minutos
4. Refresca `/platform-admin/catalogs`
5. Revisa los logs en la consola

## 📊 Verificación de Éxito

Sabrás que el deploy fue exitoso cuando:

- ✅ `window.posthog` devuelve un objeto (no undefined)
- ✅ Ves requests a `us.i.posthog.com` en Network tab
- ✅ PostHog dashboard muestra eventos con `$host` = tu dominio
- ✅ `/platform-admin/catalogs` muestra vistas reales (no 0)
- ✅ Los logs en consola muestran emojis ✅ y 📊

## 📞 Siguiente Paso si Falla

Si después de seguir todos estos pasos aún no funciona:

1. Captura screenshots de:
   - Consola del navegador
   - Network tab
   - PostHog dashboard
   - Logs del servidor

2. Revisa:
   - `docker service logs pideai_app`
   - Estado del servicio: `docker service ps pideai_app`

3. Comparte los logs para más ayuda

## 🎉 Confirmación Final

Una vez que todo funcione, deberías poder:
1. Ver eventos de producción en PostHog
2. Ver vistas reales en el admin panel
3. Filtrar dashboards por dominio de producción

¡Éxito! 🚀
