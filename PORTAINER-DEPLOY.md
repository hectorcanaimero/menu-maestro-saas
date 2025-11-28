# Deploy PideAI desde Portainer

Esta guía te muestra cómo hacer deploy de PideAI usando **Portainer** en tu servidor con Docker Swarm y Traefik ya configurados.

## 📋 Prerequisitos

✅ Portainer instalado y funcionando
✅ Docker Swarm inicializado
✅ Traefik corriendo con Let's Encrypt
✅ Network `network_public` creada
✅ DNS configurado (wildcard `*.pideai.com`)

## 🚀 Método 1: Deploy desde Portainer UI (Recomendado)

### Paso 1: Acceder a Portainer

1. Abre Portainer en tu navegador:
   ```
   https://portainer.tudominio.com
   o
   https://tu-servidor-ip:9443
   ```

2. Login con tus credenciales

3. Selecciona tu **Environment** (Docker Swarm cluster)

### Paso 2: Crear un nuevo Stack

1. Ve a **Stacks** en el menú lateral
2. Click en **+ Add stack**
3. Nombre del stack: `pideai`

### Paso 3: Pegar el docker-compose

Copia y pega uno de estos compose files en el editor:

#### **Opción A: Con nginx (Recomendado para producción)**

```yaml
version: '3.8'

services:
  pideai-app:
    image: ghcr.io/hectorcanaimero/menu-maestro-saas:3.0.0-alpha

    deploy:
      replicas: 2  # Ajusta según necesidad
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback

      labels:
        # Enable Traefik
        - "traefik.enable=true"

        # HTTP Router - Redirect to HTTPS
        - "traefik.http.routers.pideai-http.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`pideai.com`)"
        - "traefik.http.routers.pideai-http.entrypoints=web"
        - "traefik.http.routers.pideai-http.middlewares=redirect-to-https"

        # HTTPS Router - Dynamic Subdomain Routing
        - "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`pideai.com`)"
        - "traefik.http.routers.pideai-https.entrypoints=websecure"
        - "traefik.http.routers.pideai-https.tls=true"
        - "traefik.http.routers.pideai-https.tls.certresolver=letsencryptresolver"

        # Service - Port 80 for nginx
        - "traefik.http.services.pideai.loadbalancer.server.port=80"

        # Middleware: Redirect HTTP to HTTPS
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"

        # Middleware: Forward headers
        - "traefik.http.middlewares.forward-headers.headers.customrequestheaders.X-Forwarded-Host={host}"
        - "traefik.http.middlewares.forward-headers.headers.customrequestheaders.X-Forwarded-Proto=https"
        - "traefik.http.middlewares.forward-headers.headers.customrequestheaders.X-Real-IP={remote_addr}"

        # Apply middlewares
        - "traefik.http.routers.pideai-https.middlewares=forward-headers"

    networks:
      - network_public

    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/health"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s

networks:
  network_public:
    external: true
```

#### **Opción B: Solo Traefik (Más simple)**

```yaml
version: '3.8'

services:
  pideai-app:
    image: ghcr.io/hectorcanaimero/menu-maestro-saas:3.0.0-alpha-traefik

    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure

      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`pideai.com`)"
        - "traefik.http.routers.pideai-https.entrypoints=websecure"
        - "traefik.http.routers.pideai-https.tls=true"
        - "traefik.http.routers.pideai-https.tls.certresolver=letsencryptresolver"
        - "traefik.http.services.pideai.loadbalancer.server.port=3000"

        # Middlewares
        - "traefik.http.middlewares.security.headers.customFrameOptionsValue=SAMEORIGIN"
        - "traefik.http.middlewares.security.headers.contentTypeNosniff=true"
        - "traefik.http.middlewares.compress.compress=true"
        - "traefik.http.routers.pideai-https.middlewares=security,compress"

    networks:
      - network_public

networks:
  network_public:
    external: true
```

### Paso 4: Configurar Variables de Entorno

En Portainer, **debajo del editor de compose**, encontrarás la sección **Environment variables**.

⚠️ **IMPORTANTE**: Las variables `VITE_*` están **baked en el build**. Para usarlas en runtime, necesitas rebuild la imagen.

**Por ahora, deja vacío** (la imagen pre-built tiene valores de ejemplo).

**Para producción**: Necesitarás rebuild con tus valores (ver sección "Variables de Entorno" más abajo).

### Paso 5: Deploy

1. Click en **Deploy the stack**
2. Espera a que Portainer descargue la imagen y cree los servicios
3. Verifica el estado en **Stacks > pideai**

### Paso 6: Verificar Deployment

1. Ve a **Services** en el menú lateral
2. Busca `pideai_pideai-app`
3. Verifica que:
   - Estado: `Running`
   - Replicas: `2/2` (o las que configuraste)
   - Health: `Healthy` (aparecerá después de 10-30 segundos)

4. Click en el servicio para ver:
   - Logs
   - Tasks (containers individuales)
   - Placement (en qué nodos está corriendo)

### Paso 7: Test

Abre en tu navegador:
```
https://tienda1.pideai.com
https://tienda2.pideai.com
https://pideai.com
```

## 🚀 Método 2: Deploy desde Git Repository

### Opción: Build desde Git (Con tus env vars)

Si quieres usar tus propias variables de entorno:

1. En Portainer, al crear el stack:
   - Selecciona **Repository**
   - URL: `https://github.com/hectorcanaimero/menu-maestro-saas`
   - Compose path: `docker-compose.prod.yml` (o `docker-compose.traefik.yml`)
   - Automatic updates: ✅ (opcional)

2. En **Environment variables** agrega:
   ```
   VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
   VITE_SUPABASE_ANON_KEY=tu_key_aqui
   VITE_POSTHOG_KEY=phc_xxxxx
   VITE_POSTHOG_HOST=https://app.posthog.com
   ```

3. Deploy

⚠️ **Problema**: Docker Compose no puede pasar build args desde env vars automáticamente.

**Solución**: Usa el Método 3 (Custom build).

## 🚀 Método 3: Custom Build con Variables de Entorno

### Paso 1: Fork el repositorio (opcional)

O usa el original: `https://github.com/hectorcanaimero/menu-maestro-saas`

### Paso 2: Crear Dockerfile.custom

En tu repositorio (o en Portainer usando **Advanced mode**):

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Build arguments (tus variables)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_POSTHOG_KEY
ARG VITE_POSTHOG_HOST

# Set environment variables for build
ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY
ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production stage with nginx
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Paso 3: Build en Portainer

1. Ve a **Images** → **Build a new image**
2. Nombre: `pideai-custom`
3. Build method: **Upload** o **URL**
4. Si usas URL:
   - URL: `https://github.com/hectorcanaimero/menu-maestro-saas`
   - Dockerfile path: `Dockerfile`
5. Build arguments:
   ```
   VITE_SUPABASE_URL=https://...
   VITE_SUPABASE_ANON_KEY=...
   ```
6. Click **Build the image**

### Paso 4: Usar la imagen custom en Stack

```yaml
services:
  pideai-app:
    image: pideai-custom:latest  # Tu imagen custom
    # ... resto de la config
```

## 📊 Gestión desde Portainer

### Ver Logs

1. **Stacks** → `pideai` → **pideai_pideai-app**
2. Click en **Logs**
3. Puedes filtrar por:
   - Timestamp
   - Service
   - Task (container individual)

### Escalar Replicas

1. **Services** → `pideai_pideai-app`
2. Click en **Scale**
3. Cambia el número de replicas (ej: 2 → 4)
4. Click **Scale service**

### Rolling Update

1. **Services** → `pideai_pideai-app`
2. Click en **Update service**
3. En **Image**: Cambia la tag (ej: `3.0.0-alpha` → `3.1.0`)
4. Click **Update service**
5. Portainer hará rolling update automático (zero downtime)

### Rollback

1. **Services** → `pideai_pideai-app`
2. Click en **Service logs** → **Previous tasks**
3. Verifica la versión anterior
4. Click **Rollback service**

### Ver Métricas

1. **Services** → `pideai_pideai-app`
2. Click en **Stats**
3. Verás:
   - CPU usage
   - Memory usage
   - Network I/O
   - Por container y total

### Reiniciar Servicio

1. **Services** → `pideai_pideai-app`
2. Click en **⋮** (tres puntos)
3. **Restart service**

## 🔧 Configuración Avanzada en Portainer

### Health Checks Personalizados

En el stack compose, ajusta:

```yaml
healthcheck:
  test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:80/health"]
  interval: 30s      # Cada cuánto verificar
  timeout: 3s        # Timeout por check
  retries: 3         # Intentos antes de marcar unhealthy
  start_period: 10s  # Tiempo de gracia inicial
```

### Resource Limits

```yaml
deploy:
  resources:
    limits:
      cpus: '1.0'        # Máximo 1 CPU
      memory: 512M       # Máximo 512MB RAM
    reservations:
      cpus: '0.25'       # Mínimo garantizado
      memory: 128M
```

### Placement Constraints

```yaml
deploy:
  placement:
    constraints:
      - node.role == worker          # Solo en workers
      - node.labels.region == us-east  # Específico
    preferences:
      - spread: node.labels.zone    # Distribuir por zona
```

### Update Config

```yaml
deploy:
  update_config:
    parallelism: 1        # Actualizar 1 a la vez
    delay: 10s            # Esperar 10s entre updates
    failure_action: rollback  # Rollback si falla
    monitor: 30s          # Monitorear por 30s
    max_failure_ratio: 0.3  # Permitir 30% fallos
```

## 🔐 Secretos en Portainer

Para manejar credenciales sensibles:

### Paso 1: Crear Secreto

1. **Secrets** → **Add secret**
2. Nombre: `supabase_url`
3. Secret: `https://tu-proyecto.supabase.co`
4. Click **Create secret**

Repite para:
- `supabase_anon_key`
- `posthog_key`

### Paso 2: Usar en Stack

```yaml
services:
  pideai-app:
    image: ghcr.io/hectorcanaimero/menu-maestro-saas:3.0.0-alpha
    secrets:
      - supabase_url
      - supabase_anon_key
    environment:
      - VITE_SUPABASE_URL=/run/secrets/supabase_url
      - VITE_SUPABASE_ANON_KEY=/run/secrets/supabase_anon_key

secrets:
  supabase_url:
    external: true
  supabase_anon_key:
    external: true
```

⚠️ **Nota**: Para Vite, los secrets deben estar en build time, no runtime. Esto es solo para referencia.

## 🌐 Configurar Múltiples Dominios

Si tienes varios dominios (ej: `artex.lat`, `clubecondor.com`):

```yaml
labels:
  - "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`) || Host(`artex.lat`) || HostRegexp(`{subdomain:[a-z0-9-]+}.clubecondor.com`) || Host(`clubecondor.com`)"
```

## 📊 Monitoreo en Portainer

### Notifications

1. **Settings** → **Notifications**
2. Configurar Webhook para Slack/Discord
3. Triggers:
   - Service unhealthy
   - Stack deployment failed
   - Container stopped unexpectedly

### Auto-updates

1. En el Stack, habilitar **Git Automation**
2. Configurar webhook de GitHub
3. Auto-deploy en cada push a main

## 🐛 Troubleshooting en Portainer

### Problema: Stack no despliega

**Solución:**
1. Ver **Logs** del stack
2. Verificar que `network_public` existe:
   - **Networks** → Buscar `network_public`
   - Si no existe: Crear external overlay network
3. Verificar permisos de imagen:
   - Si es privada, configurar registry credentials

### Problema: Containers unhealthy

**Solución:**
1. Ver logs del servicio
2. Verificar health check endpoint:
   ```bash
   # Desde consola del container
   wget http://localhost/health
   ```
3. Ajustar `start_period` si necesita más tiempo

### Problema: No resuelve subdomains

**Solución:**
1. Verificar labels de Traefik en servicio
2. Ver dashboard de Traefik (si está habilitado)
3. Verificar DNS:
   ```bash
   nslookup tienda1.pideai.com
   ```

## 🎯 Quick Start Checklist

- [ ] DNS configurado (A record + wildcard)
- [ ] Network `network_public` existe en Swarm
- [ ] Traefik corriendo con Let's Encrypt
- [ ] Stack creado en Portainer
- [ ] Compose pegado y revisado
- [ ] Deploy ejecutado
- [ ] Servicio en estado Running
- [ ] Health checks pasando
- [ ] Test de subdomains exitoso

## 📚 Recursos

- **Portainer Docs**: https://docs.portainer.io/
- **Stack Management**: https://docs.portainer.io/user/docker/stacks
- **Service Scaling**: https://docs.portainer.io/user/docker/services

---

**¡Ya puedes gestionar todo desde Portainer UI! 🎉**

No necesitas SSH ni comandos manuales. Todo se hace desde el navegador.
