# Guía de Deployment con Portainer

Esta guía explica cómo pasar las variables de entorno (`ARG`) del Dockerfile en Portainer.

## 📋 Variables Requeridas

Las siguientes variables deben ser configuradas durante el **build** de la imagen:

```
VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcGV4anltYml5anF3ZHR0cWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzc3MzksImV4cCI6MjA3OTMxMzczOX0.eIeDRNLcdTKx8QidcrKSKJRqG1NtkLDKNXZFX_tGjv4
VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
VITE_POSTHOG_KEY=phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_PERSONAL_KEY=phx_eeQqcG3kkkpOzDLOK5cSpUkPJiIhLtQ6v33055zLoH73SEU
VITE_POSTHOG_API_KEY=phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
VITE_GOOGLE_MAPS=
```

---

## 🚀 Método 1: Build Directo en Portainer (Manual)

### Paso 1: Ir a Images
1. En Portainer, navega a: **Images** → **Build a new image**

### Paso 2: Configurar Build
1. **Image name**: `ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.9`
2. **Build method**: Selecciona una de estas opciones:
   - **Web editor**: Pega el contenido del Dockerfile
   - **Upload**: Sube el archivo Dockerfile.production
   - **Repository**: Conecta tu repositorio de GitHub

### Paso 3: Agregar Build Arguments
En la sección **Build arguments**, agrega cada variable en formato `key=value`:

```
VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcGV4anltYml5anF3ZHR0cWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzc3MzksImV4cCI6MjA3OTMxMzczOX0.eIeDRNLcdTKx8QidcrKSKJRqG1NtkLDKNXZFX_tGjv4
VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
VITE_POSTHOG_KEY=phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_PERSONAL_KEY=phx_eeQqcG3kkkpOzDLOK5cSpUkPJiIhLtQ6v33055zLoH73SEU
VITE_POSTHOG_API_KEY=phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH
VITE_GOOGLE_MAPS=
```

### Paso 4: Build
Haz clic en **Build the image** y espera a que termine.

---

## 🔄 Método 2: GitHub Actions + Portainer Webhook (Recomendado)

Este método es más automático y permite builds desde GitHub.

### Paso 1: Configurar GitHub Actions

El proyecto ya tiene un workflow en `.github/workflows/docker-publish.yml`. Asegúrate de que tenga los secrets configurados.

#### Secrets necesarios en GitHub:
Ve a: **GitHub Repo** → **Settings** → **Secrets and variables** → **Actions**

Agrega estos secrets:

```
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_PUBLISHABLE_KEY
VITE_SUPABASE_URL
VITE_POSTHOG_KEY
VITE_POSTHOG_HOST
VITE_POSTHOG_PERSONAL_KEY
VITE_POSTHOG_API_KEY
VITE_GOOGLE_MAPS
```

### Paso 2: Configurar Portainer Webhook

1. En Portainer: **Stacks** → Tu Stack → **Webhooks**
2. Copia el webhook URL
3. Ve a GitHub: **Settings** → **Webhooks** → **Add webhook**
4. Pega el webhook URL de Portainer
5. Selecciona eventos: `push`, `release`

### Paso 3: Trigger Deploy

Cada vez que hagas push a `main` o crees un tag, GitHub Actions:
1. Construirá la imagen con las variables
2. La subirá a `ghcr.io`
3. Notificará a Portainer via webhook
4. Portainer actualizará el stack automáticamente

---

## 🐳 Método 3: Build Local + Push Manual

Si prefieres construir localmente y subir a Portainer:

### Paso 1: Build Local
Usa el script incluido:

```bash
./build-docker.sh
```

O manualmente:

```bash
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID="wdpexjymbiyjqwdttqhz" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkcGV4anltYml5anF3ZHR0cWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3Mzc3MzksImV4cCI6MjA3OTMxMzczOX0.eIeDRNLcdTKx8QidcrKSKJRqG1NtkLDKNXZFX_tGjv4" \
  --build-arg VITE_SUPABASE_URL="https://wdpexjymbiyjqwdttqhz.supabase.co" \
  --build-arg VITE_POSTHOG_KEY="phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH" \
  --build-arg VITE_POSTHOG_HOST="https://us.i.posthog.com" \
  --build-arg VITE_POSTHOG_PERSONAL_KEY="phx_eeQqcG3kkkpOzDLOK5cSpUkPJiIhLtQ6v33055zLoH73SEU" \
  --build-arg VITE_POSTHOG_API_KEY="phc_hXvQ4TnLXIFgRP9zaj5yzIfGYrrTjDBzyPZKWLAp5WH" \
  --build-arg VITE_GOOGLE_MAPS="" \
  -f Dockerfile.production \
  -t ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.9 \
  .
```

### Paso 2: Push a Registry

```bash
docker push ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.9
```

### Paso 3: Actualizar Stack en Portainer

1. Ve a: **Stacks** → Tu Stack → **Editor**
2. Actualiza la versión de la imagen si es necesario
3. Haz clic en **Update the stack**

---

## 📝 Notas Importantes

### ⚠️ Variables ARG vs ENV

- **ARG**: Solo disponibles durante el **build** (lo que necesitas)
- **ENV**: Disponibles durante el **runtime** (no sirven para Vite build)

Las variables `VITE_*` **DEBEN** ser pasadas como `--build-arg` porque Vite las necesita durante el build para embeddearlas en el JavaScript compilado.

### 🔒 Seguridad

Los archivos `portainer-build-args.txt` y `portainer-build-args.json` contienen secrets. **NO** los subas a GitHub. Están incluidos en `.gitignore`.

### 🔍 Verificar Variables

Para verificar que las variables fueron embebidas correctamente en el build:

```bash
# Después del build, inspecciona el JavaScript
docker run --rm ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.9 cat /usr/share/nginx/html/assets/index-*.js | grep -o "wdpexjymbiyjqwdttqhz"
```

Si ves el project ID, las variables fueron correctamente embebidas.

---

## 🆘 Troubleshooting

### Problema: "VITE_POSTHOG_API_KEY=your_api_key_here"

**Causa**: La imagen se construyó sin pasar los build args.

**Solución**: Reconstruye la imagen pasando todos los `--build-arg` como se muestra arriba.

### Problema: Variables no aparecen en el frontend

**Causa**: Las variables se pasaron como `environment` en el stack en lugar de `build args`.

**Solución**: Las variables `VITE_*` deben pasarse durante el **build**, no en runtime.

### Problema: Build falla en Portainer

**Causa**: Puede ser falta de memoria o timeout.

**Solución**:
- Aumenta recursos del nodo de Docker
- Usa build local + push manual
- Configura GitHub Actions para builds automáticos

---

## 📚 Recursos

- [Documentación oficial de Portainer](https://docs.portainer.io/)
- [Docker Build Args](https://docs.docker.com/engine/reference/commandline/build/#build-arg)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
