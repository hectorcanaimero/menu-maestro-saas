# Guía de Deployment en Portainer para Menu Maestro

Esta guía te llevará paso a paso para deployar Menu Maestro en Portainer con Docker Swarm y Traefik.

## Pre-requisitos

- [x] Servidor con Docker instalado
- [x] Docker Swarm inicializado
- [x] Portainer instalado y corriendo
- [x] DNS configurado (wildcards para *.pideai.com y *.artex.lat)
- [x] Traefik v2 corriendo con certificate resolver

## Paso 1: Preparar el Entorno

### 1.1 Inicializar Docker Swarm (si no está inicializado)

```bash
# En el servidor
docker swarm init --advertise-addr TU_IP_PUBLICA
```

### 1.2 Crear la Network de Traefik

```bash
docker network create --driver=overlay traefik-public
```

Verificar:
```bash
docker network ls | grep traefik-public
```

## Paso 2: Configurar DNS

En tu proveedor de DNS (Cloudflare, Route53, etc.):

### Registros necesarios:

| Tipo | Nombre | Valor |
|------|--------|-------|
| A | pideai.com | IP_DEL_SERVIDOR |
| A | www.pideai.com | IP_DEL_SERVIDOR |
| A | *.pideai.com | IP_DEL_SERVIDOR |
| A | artex.lat | IP_DEL_SERVIDOR |
| A | www.artex.lat | IP_DEL_SERVIDOR |
| A | *.artex.lat | IP_DEL_SERVIDOR |

### Verificar DNS:
```bash
dig tienda1.pideai.com +short
dig test.artex.lat +short
# Ambos deben resolver a la IP de tu servidor
```

## Paso 3: Build de la Imagen Docker

### Opción A: Build Local y Push a Registry

```bash
# 1. Clonar el repositorio
git clone https://github.com/hectorcanaimero/menu-maestro-saas.git
cd menu-maestro-saas

# 2. Configurar variables de entorno
export VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
export VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=tu_supabase_key
export VITE_POSTHOG_KEY=tu_posthog_key
export VITE_POSTHOG_HOST=https://us.i.posthog.com

# 3. Build usando el script helper
chmod +x deploy-swarm.sh
./deploy-swarm.sh build
```

### Opción B: Usar GitHub Actions (Automático)

El proyecto tiene un workflow de GitHub Actions que hace build automático cuando creas una tag:

```bash
git tag v3.0.3
git push origin v3.0.3
```

Esto construirá y subirá automáticamente la imagen a `ghcr.io/hectorcanaimero/menu-maestro-saas:latest`

## Paso 4: Deploy en Portainer

### 4.1 Acceder a Portainer

1. Navega a `https://tu-servidor:9443` (o el puerto donde esté Portainer)
2. Inicia sesión

### 4.2 Seleccionar el Environment

1. Ve a "Home"
2. Selecciona tu Swarm environment

### 4.3 Crear el Stack

1. En el menú lateral, click en "Stacks"
2. Click en "+ Add stack"
3. Nombre del stack: `pideai`

### 4.4 Configurar el Stack

#### Web Editor

Pega el contenido de `docker-compose.swarm.yml`:

```yaml
version: '3.8'

networks:
  traefik-public:
    external: true

services:
  app:
    image: ghcr.io/hectorcanaimero/menu-maestro-saas:latest

    networks:
      - traefik-public

    deploy:
      mode: replicated
      replicas: 3

      update_config:
        parallelism: 1
        delay: 15s
        failure_action: rollback
        monitor: 30s
        order: start-first

      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M

      labels:
        - "traefik.enable=true"
        - "traefik.docker.network=traefik-public"
        - "traefik.http.services.pideai.loadbalancer.server.port=80"

        # HTTP Router
        - "traefik.http.routers.pideai-http.rule=Host(`pideai.com`) || Host(`www.pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`artex.lat`) || Host(`www.artex.lat`) || HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`)"
        - "traefik.http.routers.pideai-http.entrypoints=web"
        - "traefik.http.routers.pideai-http.middlewares=redirect-to-https"

        # HTTPS Router
        - "traefik.http.routers.pideai-https.rule=Host(`pideai.com`) || Host(`www.pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`artex.lat`) || Host(`www.artex.lat`) || HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`)"
        - "traefik.http.routers.pideai-https.entrypoints=websecure"
        - "traefik.http.routers.pideai-https.tls=true"
        - "traefik.http.routers.pideai-https.tls.certresolver=letsencrypt"
        - "traefik.http.routers.pideai-https.tls.domains[0].main=pideai.com"
        - "traefik.http.routers.pideai-https.tls.domains[0].sans=*.pideai.com"
        - "traefik.http.routers.pideai-https.tls.domains[1].main=artex.lat"
        - "traefik.http.routers.pideai-https.tls.domains[1].sans=*.artex.lat"
        - "traefik.http.routers.pideai-https.middlewares=security-headers,compression"

        # Middlewares
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
        - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
        - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
        - "traefik.http.middlewares.compression.compress=true"

    environment:
      - NODE_ENV=production
      - TZ=America/Mexico_City

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4.5 Deploy

1. Scroll down
2. Click "Deploy the stack"
3. Espera a que se complete el deployment (30-60 segundos)

## Paso 5: Verificación

### 5.1 Verificar en Portainer

1. Ve a "Stacks" -> "pideai"
2. Verifica que el estado sea "running"
3. Click en "pideai_app" para ver los containers
4. Deberías ver 3 tasks corriendo (3 replicas)

### 5.2 Verificar Logs

En Portainer:
1. Click en un task/container
2. Ve a "Logs"
3. Busca mensajes de error

### 5.3 Verificar Health Checks

```bash
# Desde el servidor
docker service ps pideai_app

# Debería mostrar todos como "Running"
```

### 5.4 Test desde Browser

1. Abre `https://pideai.com` - Debería cargar la app
2. Abre `https://www.pideai.com` - Debería funcionar
3. Abre `https://tienda-test.pideai.com` - Debería funcionar
4. Abre `https://test.artex.lat` - Debería funcionar

### 5.5 Test desde Línea de Comandos

```bash
# Test redirect HTTP -> HTTPS
curl -I http://pideai.com
# Debería retornar 301/302 redirect a https

# Test HTTPS
curl -I https://pideai.com
# Debería retornar 200 OK

# Test subdomain
curl -I https://tienda1.pideai.com
# Debería retornar 200 OK

# Test health endpoint
curl https://pideai.com/health
# Debería retornar "OK"

# Test security headers
curl -I https://pideai.com | grep -i "strict-transport"
# Debería mostrar HSTS header
```

## Paso 6: Updates y Mantenimiento

### 6.1 Update de la Imagen

Cuando hay una nueva versión:

#### Opción A: Via Portainer UI

1. Ve a "Stacks" -> "pideai"
2. Click en "Editor"
3. Cambia `latest` por la nueva tag (ej: `v3.0.3`)
4. Click "Update the stack"
5. Selecciona "Pull latest image"
6. Click "Update"

#### Opción B: Via CLI

```bash
# Pull nueva imagen
docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.3 pideai_app

# O forzar re-pull de latest
docker service update --force pideai_app
```

### 6.2 Rollback

Si algo sale mal:

```bash
# Via CLI
docker service rollback pideai_app

# Via Portainer: Ve al servicio -> click "Rollback"
```

### 6.3 Escalar Replicas

#### Via Portainer:
1. Ve a "Services" -> "pideai_app"
2. Click en "Scale"
3. Ajusta el número de replicas
4. Click "Scale service"

#### Via CLI:
```bash
docker service scale pideai_app=5
```

### 6.4 Ver Métricas

En Portainer:
1. Ve a "Services" -> "pideai_app"
2. Click en "Stats" para ver uso de CPU/RAM

## Troubleshooting

### Problema: Servicio no inicia

**Verificar:**
```bash
# Ver estado
docker service ps pideai_app --no-trunc

# Ver logs
docker service logs pideai_app --tail 100

# Ver detalles del servicio
docker service inspect pideai_app
```

### Problema: No puedo acceder via HTTPS

**Verificar:**
1. DNS está configurado correctamente
2. Traefik está corriendo: `docker service ls | grep traefik`
3. Network existe: `docker network ls | grep traefik-public`
4. Labels de Traefik están correctos: `docker service inspect pideai_app | grep traefik`

### Problema: Certificado SSL no se genera

**Verificar:**
1. Logs de Traefik: `docker service logs traefik_traefik -f`
2. DNS está propagado: `dig tienda1.pideai.com +short`
3. Firewall permite puerto 80 y 443
4. Rate limit de Let's Encrypt no alcanzado

### Problema: Subdomain no funciona

**Verificar:**
1. DNS wildcard configurado: `*.pideai.com`
2. Regex de Traefik correcta en labels
3. Test con curl: `curl -H "Host: test.pideai.com" http://localhost`

## Monitoreo Continuo

### Logs en Tiempo Real

```bash
# Via CLI
docker service logs pideai_app -f --tail 100

# Via Portainer: Service -> Logs -> Enable "Auto-refresh"
```

### Alertas

Configurar alertas en Portainer para:
- Service down
- High CPU usage
- High memory usage
- Failed health checks

## Backup y Disaster Recovery

### Backup del Stack Configuration

```bash
# Exportar stack config
docker stack config pideai > pideai-backup.yml

# Guardar en control de versiones (git)
git add docker-compose.swarm.yml
git commit -m "Update stack config"
git push
```

### Disaster Recovery

Si el servidor se cae:

1. Reinstalar Docker
2. Inicializar Swarm: `docker swarm init`
3. Crear network: `docker network create --driver=overlay traefik-public`
4. Deploy Traefik
5. Deploy app: `docker stack deploy -c docker-compose.swarm.yml pideai`

## Checklist Final

- [ ] DNS configurado (wildcard A records)
- [ ] Network `traefik-public` creada
- [ ] Traefik corriendo con certificate resolver
- [ ] Imagen Docker buildeada y en registry
- [ ] Stack deployado en Portainer
- [ ] Health checks pasando
- [ ] HTTPS funcionando
- [ ] Subdominios funcionando
- [ ] Security headers configurados
- [ ] Logs monitoreándose
- [ ] Backup del stack config

## Recursos Adicionales

- [Documentación de Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Documentación de Traefik v2](https://doc.traefik.io/traefik/)
- [Documentación de Portainer](https://docs.portainer.io/)
- [TRAEFIK_CONFIG.md](./TRAEFIK_CONFIG.md) - Configuración detallada de Traefik
