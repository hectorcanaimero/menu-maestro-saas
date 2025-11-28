# Build Custom Image con tus Variables de Entorno

Esta guía te muestra cómo crear una imagen Docker personalizada con **tus propias credenciales de Supabase y PostHog**.

## ⚠️ Problema con Variables de Entorno en Vite

Vite (el bundler que usa React) **NO soporta variables de entorno en runtime**. Las variables `VITE_*` se "hornean" en el código durante el **BUILD**.

### ❌ Esto NO funciona:
```bash
# Intentar pasar env vars al container
docker run -e VITE_SUPABASE_URL=... pideai-app
```

### ✅ Esto SÍ funciona:
```bash
# Build con tus env vars
docker build --build-arg VITE_SUPABASE_URL=... -t custom-image .
docker run custom-image
```

## 🚀 Método 1: Build Local + Push a Registry (Recomendado)

### Paso 1: Configurar .env.production

Ya está creado en `.env.production` con tus credenciales:

```bash
VITE_SUPABASE_PROJECT_ID="wdpexjymbiyjqwdttqhz"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbG..."
VITE_SUPABASE_URL="https://wdpexjymbiyjqwdttqhz.supabase.co"
VITE_POSTHOG_KEY=phc_hXv...
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_PERSONAL_KEY=phx_eeQ...
```

⚠️ **IMPORTANTE**: Este archivo NO debe commitearse a Git (ya está en .gitignore)

### Paso 2: Build la Imagen Custom

**Opción A: Usar el script (más fácil)**

```bash
./build-custom.sh
```

**Opción B: Manual**

```bash
# Load env vars
export $(cat .env.production | grep -v '^#' | xargs)

# Build
docker build \
    -f Dockerfile.custom \
    --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
    --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
    --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    --build-arg VITE_POSTHOG_KEY="$VITE_POSTHOG_KEY" \
    --build-arg VITE_POSTHOG_HOST="$VITE_POSTHOG_HOST" \
    --build-arg VITE_POSTHOG_PERSONAL_KEY="$VITE_POSTHOG_PERSONAL_KEY" \
    -t pideai-custom:latest \
    .
```

### Paso 3: Test Local

```bash
# Run
docker run -p 80:80 pideai-custom:latest

# Test
curl http://localhost
```

Verifica en el navegador que:
- ✅ Se conecta a Supabase correctamente
- ✅ PostHog está trackeando eventos
- ✅ No hay errores de CORS

### Paso 4: Push a tu Registry

**Opción A: Docker Hub**

```bash
# Login
docker login

# Tag
docker tag pideai-custom:latest TU_USERNAME/pideai:latest

# Push
docker push TU_USERNAME/pideai:latest
```

**Opción B: GitHub Container Registry**

```bash
# Login
echo $GITHUB_TOKEN | docker login ghcr.io -u TU_USERNAME --password-stdin

# Tag
docker tag pideai-custom:latest ghcr.io/TU_USERNAME/pideai:latest

# Push
docker push ghcr.io/TU_USERNAME/pideai:latest
```

**Opción C: Registry Privado**

```bash
# Tag
docker tag pideai-custom:latest registry.tudominio.com/pideai:latest

# Push
docker push registry.tudominio.com/pideai:latest
```

### Paso 5: Actualizar portainer-stack.yml

En Portainer, edita el stack:

```yaml
services:
  pideai-app:
    # Cambia a tu imagen custom
    image: TU_USERNAME/pideai:latest  # o ghcr.io/TU_USERNAME/pideai:latest

    # ... resto de la config igual
```

**Update the stack** → Listo!

## 🚀 Método 2: Build en Portainer (Avanzado)

Portainer puede buildar la imagen directamente desde Git.

### Paso 1: Crear Secretos en Portainer

1. **Portainer** → **Secrets** → **Add secret**

Crear estos secretos:
- `supabase_project_id` → valor: `wdpexjymbiyjqwdttqhz`
- `supabase_key` → valor: `eyJhbGci...` (tu key completa)
- `supabase_url` → valor: `https://wdpexjymbiyjqwdttqhz.supabase.co`
- `posthog_key` → valor: `phc_hXv...`
- `posthog_host` → valor: `https://us.i.posthog.com`
- `posthog_personal_key` → valor: `phx_eeQ...`

### Paso 2: Build desde Git en Portainer

1. **Images** → **Build a new image**
2. **Image name**: `pideai-custom`
3. **Build method**: URL
4. **URL**: `https://github.com/hectorcanaimero/menu-maestro-saas`
5. **Dockerfile path**: `Dockerfile.custom`
6. **Build arguments**:
   ```
   VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
   VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
   VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
   VITE_POSTHOG_KEY=phc_hXv...
   VITE_POSTHOG_HOST=https://us.i.posthog.com
   VITE_POSTHOG_PERSONAL_KEY=phx_eeQ...
   ```
7. **Build the image**

⚠️ **Desventaja**: Las build args quedan visibles en Portainer UI.

### Paso 3: Usar en Stack

```yaml
services:
  pideai-app:
    image: pideai-custom:latest
    # ... resto
```

## 🚀 Método 3: GitHub Actions (Automatizado)

Configura GitHub Actions para buildar automáticamente con tus env vars.

### Paso 1: Agregar Secrets en GitHub

1. **GitHub** → **Settings** → **Secrets and variables** → **Actions**
2. **New repository secret**

Agregar:
- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_POSTHOG_KEY`
- `VITE_POSTHOG_HOST`
- `VITE_POSTHOG_PERSONAL_KEY`

### Paso 2: Modificar Workflow

Editar `.github/workflows/docker-publish.yml`:

```yaml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile.custom  # Usar Dockerfile.custom
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    build-args: |
      VITE_SUPABASE_PROJECT_ID=${{ secrets.VITE_SUPABASE_PROJECT_ID }}
      VITE_SUPABASE_PUBLISHABLE_KEY=${{ secrets.VITE_SUPABASE_PUBLISHABLE_KEY }}
      VITE_SUPABASE_URL=${{ secrets.VITE_SUPABASE_URL }}
      VITE_POSTHOG_KEY=${{ secrets.VITE_POSTHOG_KEY }}
      VITE_POSTHOG_HOST=${{ secrets.VITE_POSTHOG_HOST }}
      VITE_POSTHOG_PERSONAL_KEY=${{ secrets.VITE_POSTHOG_PERSONAL_KEY }}
```

### Paso 3: Create Release

```bash
git tag v3.1.0
git push origin v3.1.0
```

GitHub Actions buildará automáticamente con tus credenciales.

## 🔄 Actualizar Variables

Si cambias tus credenciales de Supabase o PostHog:

### Método 1 (Local):
1. Actualizar `.env.production`
2. Re-build: `./build-custom.sh`
3. Re-push al registry
4. Update stack en Portainer

### Método 2 (GitHub Actions):
1. Actualizar secrets en GitHub
2. Crear nuevo tag: `git tag v3.1.1 && git push origin v3.1.1`
3. GitHub Actions builda automáticamente
4. Update stack en Portainer con nuevo tag

## 🐛 Troubleshooting

### Error: Cannot connect to Supabase

**Causa**: Variables no se hornearon correctamente en el build.

**Solución**:
```bash
# Verificar que las variables están en el build
docker run pideai-custom:latest cat /usr/share/nginx/html/assets/index-*.js | grep supabase

# Deberías ver tu URL de Supabase en el output
```

### Error: PostHog not tracking

**Causa**: VITE_POSTHOG_KEY no está en el build.

**Solución**:
```bash
# Rebuild con --no-cache
docker build --no-cache -f Dockerfile.custom ... -t pideai-custom:latest .
```

### Error: CORS from Supabase

**Causa**: Dominio no está en allowed origins de Supabase.

**Solución**:
1. Supabase Dashboard → Settings → API
2. **Additional Allowed Origins**
3. Agregar: `https://tudominio.com`, `https://*.tudominio.com`

## 📊 Comparación de Métodos

| Método | Complejidad | Seguridad | Auto-update | Recomendado |
|--------|-------------|-----------|-------------|-------------|
| **Local Build** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ❌ | ✅ Desarrollo |
| **Portainer Build** | ⭐⭐⭐ | ⭐⭐⭐ | ❌ | ⚠️ Testing |
| **GitHub Actions** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ | ✅ Producción |

## 🎯 Recomendación

Para **producción**, usa **GitHub Actions**:

1. Agrega secrets en GitHub (una vez)
2. Modifica workflow para usar `Dockerfile.custom`
3. Cada release builda automáticamente con tus credenciales
4. Portainer siempre puede hacer `docker service update` con nuevo tag

**Ventajas:**
- ✅ Seguro (secrets en GitHub, no en código)
- ✅ Automático (cada release)
- ✅ Reproducible (mismo build process)
- ✅ Versionado (tags de git)

## 📝 Archivos Importantes

- **`.env.production`** - Tus credenciales (NO committear)
- **`Dockerfile.custom`** - Dockerfile que usa build args
- **`build-custom.sh`** - Script para build local
- **`.gitignore`** - Asegura que .env.production no se commitee

---

**¿Necesitas ayuda con algún método específico?**
