# Deployment de Menu Maestro en Portainer con Docker Swarm + Traefik

Esta gu\u00eda completa te llevar\u00e1 paso a paso a trav\u00e9s del proceso de deployment de la aplicaci\u00f3n Menu Maestro (PideAI) en Docker Swarm usando Portainer como interfaz de administraci\u00f3n y Traefik como reverse proxy.

## Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Arquitectura del Deployment](#arquitectura-del-deployment)
3. [Configuraci\u00f3n DNS](#configuraci\u00f3n-dns)
4. [Setup de Docker Swarm](#setup-de-docker-swarm)
5. [Setup de Traefik](#setup-de-traefik)
6. [Build de la Imagen Docker](#build-de-la-imagen-docker)
7. [Configuraci\u00f3n de Secrets](#configuraci\u00f3n-de-secrets)
8. [Deployment del Stack en Portainer](#deployment-del-stack-en-portainer)
9. [Verificaci\u00f3n del Deployment](#verificaci\u00f3n-del-deployment)
10. [Troubleshooting](#troubleshooting)
11. [Mantenimiento](#mantenimiento)

---

## Pre-requisitos

### Software Requerido

- **Docker Engine** 20.10+ instalado
- **Docker Swarm** inicializado
- **Portainer** instalado y corriendo
- **Traefik** deployado en el Swarm
- **Git** para clonar el repositorio
- **Acceso SSH** al servidor

### Recursos del Servidor (M\u00ednimos)

- **CPU**: 2 cores
- **RAM**: 4 GB (recomendado 8 GB)
- **Disco**: 20 GB de espacio libre
- **Red**: IP p\u00fablica con puertos 80 y 443 abiertos

### Dominio y DNS

- Dominio registrado (ejemplo: `pideai.com`)
- Acceso a configuraci\u00f3n DNS
- Capacidad de crear registros DNS wildcard

---

## Arquitectura del Deployment

```
Internet
   |
   v
[DNS Wildcard: *.pideai.com]
   |
   v
[Traefik Reverse Proxy]
   |-- SSL/TLS Termination (Let's Encrypt)
   |-- Subdomain Routing
   |-- Load Balancing
   |
   v
[Docker Swarm]
   |
   |-- [Menu Maestro Container 1] (Nginx + Static Files)
   |-- [Menu Maestro Container 2] (Nginx + Static Files)
   |
   v
[Supabase Cloud] (Backend/Database)
```

### Flujo de Requests

1. Usuario accede a `tienda1.pideai.com`
2. DNS resuelve a la IP del servidor
3. Traefik recibe el request en puerto 443
4. Traefik obtiene/renueva certificado SSL autom\u00e1ticamente
5. Traefik hace routing al container correcto basado en subdomain
6. Nginx sirve los archivos est\u00e1ticos de la SPA
7. JavaScript en el navegador extrae el subdomain y carga la tienda correspondiente
8. React app hace requests a Supabase para datos

---

## Configuraci\u00f3n DNS

### Opci\u00f3n 1: Wildcard DNS (Recomendado)

Crea un registro DNS wildcard que apunte todos los subdominios a tu servidor:

```
Tipo    Nombre      Valor               TTL
A       @           123.45.67.89        3600
A       *           123.45.67.89        3600
```

Esto permitir\u00e1:
- `pideai.com` \u2192 123.45.67.89
- `tienda1.pideai.com` \u2192 123.45.67.89
- `restaurante.pideai.com` \u2192 123.45.67.89
- Cualquier subdomain \u2192 123.45.67.89

### Opci\u00f3n 2: Subdominios Espec\u00edficos

Si no puedes usar wildcard, crea registros A individuales:

```
Tipo    Nombre          Valor               TTL
A       @               123.45.67.89        3600
A       tienda1         123.45.67.89        3600
A       restaurante     123.45.67.89        3600
```

### Verificar DNS

Espera a que los cambios DNS se propaguen (puede tomar hasta 48h, usualmente 5-30 min):

```bash
# Verificar dominio principal
dig pideai.com +short

# Verificar wildcard
dig tienda1.pideai.com +short
dig cualquier-subdominio.pideai.com +short
```

Todos deben retornar la IP de tu servidor.

---

## Setup de Docker Swarm

### 1. Inicializar Docker Swarm

Si a\u00fan no has inicializado Swarm en tu servidor:

```bash
# SSH al servidor
ssh user@123.45.67.89

# Inicializar Swarm
docker swarm init --advertise-addr 123.45.67.89
```

**Output esperado:**
```
Swarm initialized: current node (abc123...) is now a manager.
```

### 2. Verificar Estado del Swarm

```bash
docker node ls
```

**Output esperado:**
```
ID                            HOSTNAME   STATUS    AVAILABILITY   MANAGER STATUS
abc123def456 *                server1    Ready     Active         Leader
```

### 3. Crear Network para Traefik

Esta network es compartida entre Traefik y todas las aplicaciones:

```bash
docker network create \
  --driver=overlay \
  --attachable \
  traefik-public
```

### 4. Verificar Network

```bash
docker network ls | grep traefik-public
```

---

## Setup de Traefik

### 1. Crear Directorio de Configuraci\u00f3n

```bash
mkdir -p /opt/traefik
cd /opt/traefik
```

### 2. Crear archivo `traefik.yml`

```yaml
# /opt/traefik/traefik.yml
api:
  dashboard: true
  insecure: false

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-public
    swarmMode: true

certificatesResolvers:
  letsencrypt:
    acme:
      email: tu-email@example.com  # CAMBIAR POR TU EMAIL
      storage: /certificates/acme.json
      httpChallenge:
        entryPoint: web

log:
  level: INFO

accessLog: {}
```

### 3. Crear Stack de Traefik

Crea el archivo `docker-compose.traefik.yml`:

```yaml
# /opt/traefik/docker-compose.traefik.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    networks:
      - traefik-public
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - traefik-certificates:/certificates
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        # Dashboard
        - "traefik.enable=true"
        - "traefik.http.routers.dashboard.rule=Host(`traefik.pideai.com`)"
        - "traefik.http.routers.dashboard.service=api@internal"
        - "traefik.http.routers.dashboard.entrypoints=websecure"
        - "traefik.http.routers.dashboard.tls=true"
        - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"
        - "traefik.http.services.dashboard.loadbalancer.server.port=8080"

        # Auth para dashboard (opcional pero recomendado)
        # Generar password: echo $(htpasswd -nb admin tu-password) | sed -e s/\\$/\\$\\$/g
        # - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
        # - "traefik.http.middlewares.dashboard-auth.basicauth.users=admin:$$apr1$$..."

networks:
  traefik-public:
    external: true

volumes:
  traefik-certificates:
```

### 4. Deployar Traefik

```bash
docker stack deploy -c docker-compose.traefik.yml traefik
```

### 5. Verificar Traefik

```bash
# Ver servicio
docker service ls | grep traefik

# Ver logs
docker service logs -f traefik_traefik

# Acceder al dashboard (si configuraste subdomain)
# https://traefik.pideai.com
```

---

## Build de la Imagen Docker

### M\u00e9todo 1: Build Local con Script Automatizado

#### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/menu-maestro.git
cd menu-maestro
```

#### 2. Configurar Variables de Entorno

Crea o edita `.env.production`:

```bash
# .env.production
VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
VITE_POSTHOG_KEY=phc_tu_key_aqui
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_PERSONAL_KEY=phx_tu_personal_key_aqui
```

#### 3. Build de la Imagen

```bash
# Build sin push
./scripts/build-docker-image.sh --tag v1.0.0

# Build y push a registry
./scripts/build-docker-image.sh --tag v1.0.0 --push

# Build con registry personalizado
./scripts/build-docker-image.sh \
  --registry registry.tudominio.com \
  --tag v1.0.0 \
  --push
```

#### 4. Verificar Imagen

```bash
docker images | grep menu-maestro
```

**Output esperado:**
```
REPOSITORY                              TAG       SIZE
ghcr.io/usuario/menu-maestro           v1.0.0    25MB
ghcr.io/usuario/menu-maestro           latest    25MB
```

### M\u00e9todo 2: Build Manual

Si prefieres hacer el build manualmente:

```bash
# Load variables
source .env.production

# Build
docker build \
  -f Dockerfile.production \
  -t ghcr.io/usuario/menu-maestro:v1.0.0 \
  --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_POSTHOG_KEY="$VITE_POSTHOG_KEY" \
  --build-arg VITE_POSTHOG_HOST="$VITE_POSTHOG_HOST" \
  --build-arg VITE_POSTHOG_PERSONAL_KEY="$VITE_POSTHOG_PERSONAL_KEY" \
  .

# Tag como latest
docker tag ghcr.io/usuario/menu-maestro:v1.0.0 ghcr.io/usuario/menu-maestro:latest

# Push
docker push ghcr.io/usuario/menu-maestro:v1.0.0
docker push ghcr.io/usuario/menu-maestro:latest
```

### M\u00e9todo 3: GitHub Actions (CI/CD Automatizado)

El repositorio incluye un workflow de GitHub Actions que hace build autom\u00e1tico en cada push. Ver `.github/workflows/docker-build.yml`.

---

## Configuraci\u00f3n de Secrets

Docker Swarm usa "secrets" para almacenar datos sensibles de forma segura.

### Opci\u00f3n 1: Script Automatizado (Recomendado)

```bash
# Asegurar que .env.production est\u00e1 configurado
cat .env.production

# Ejecutar script de setup
./scripts/setup-swarm-secrets.sh
```

**Output esperado:**
```
[SUCCESS] Secret creado: pideai_supabase_project_id
[SUCCESS] Secret creado: pideai_supabase_key
[SUCCESS] Secret creado: pideai_supabase_url
[SUCCESS] Secret creado: pideai_posthog_key
[SUCCESS] Secret creado: pideai_posthog_host
[SUCCESS] Secret creado: pideai_posthog_personal_key
```

### Opci\u00f3n 2: Creaci\u00f3n Manual

```bash
# Supabase secrets
echo "wdpexjymbiyjqwdttqhz" | docker secret create pideai_supabase_project_id -
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." | docker secret create pideai_supabase_key -
echo "https://wdpexjymbiyjqwdttqhz.supabase.co" | docker secret create pideai_supabase_url -

# PostHog secrets (opcionales)
echo "phc_tu_key" | docker secret create pideai_posthog_key -
echo "https://us.i.posthog.com" | docker secret create pideai_posthog_host -
echo "phx_tu_personal_key" | docker secret create pideai_posthog_personal_key -
```

### Verificar Secrets

```bash
docker secret ls | grep pideai
```

**Output esperado:**
```
NAME                              CREATED
pideai_posthog_host              30 seconds ago
pideai_posthog_key               30 seconds ago
pideai_posthog_personal_key      30 seconds ago
pideai_supabase_key              30 seconds ago
pideai_supabase_project_id       30 seconds ago
pideai_supabase_url              30 seconds ago
```

### IMPORTANTE: Actualizar Secrets

Los secrets de Docker Swarm son **inmutables**. Para actualizar un secret:

```bash
# 1. Eliminar secret existente
docker secret rm pideai_supabase_url

# 2. Crear nuevo secret
echo "https://nueva-url.supabase.co" | docker secret create pideai_supabase_url -

# 3. Actualizar servicio para usar nuevo secret
docker service update --secret-rm pideai_supabase_url pideai_app
docker service update --secret-add pideai_supabase_url pideai_app
```

---

## Deployment del Stack en Portainer

### M\u00e9todo 1: Portainer Web UI (Recomendado)

#### 1. Acceder a Portainer

Abre tu navegador y accede a Portainer:
```
https://portainer.tudominio.com:9443
```

#### 2. Navegar a Stacks

1. En el men\u00fa lateral, click en **Stacks**
2. Click en **Add stack**

#### 3. Configurar el Stack

**Nombre del Stack**: `pideai`

**Build method**: Selecciona **Web editor**

**Web editor**: Copia y pega el contenido de `docker-compose.swarm.yml`

**IMPORTANTE**: Antes de deployar, edita estas l\u00edneas en el YAML:

```yaml
# Cambiar la imagen por la tuya
image: ghcr.io/TU-USUARIO/menu-maestro:latest

# Cambiar el dominio
- "traefik.http.routers.pideai-http.rule=Host(`TU-DOMINIO.com`) || HostRegexp(`^[a-z0-9-]+\\.TU-DOMINIO\\.com$$`)"
- "traefik.http.routers.pideai-https.rule=Host(`TU-DOMINIO.com`) || HostRegexp(`^[a-z0-9-]+\\.TU-DOMINIO\\.com$$`)"
```

#### 4. Variables de Entorno (Opcional)

Si necesitas agregar variables de entorno no sensibles, puedes agregarlas en la secci\u00f3n **Environment variables**.

#### 5. Deploy del Stack

Click en **Deploy the stack**

#### 6. Monitorear Deployment

Portainer mostrar\u00e1 el progreso. Espera a que todos los servicios est\u00e9n en estado **Running**.

### M\u00e9todo 2: CLI con Script Automatizado

```bash
./scripts/deploy-to-swarm.sh pideai
```

### M\u00e9todo 3: CLI Manual

```bash
docker stack deploy \
  -c docker-compose.swarm.yml \
  --with-registry-auth \
  pideai
```

---

## Verificaci\u00f3n del Deployment

### 1. Verificar Servicios

```bash
# Listar servicios del stack
docker service ls --filter "label=com.docker.stack.namespace=pideai"
```

**Output esperado:**
```
ID             NAME         MODE         REPLICAS   IMAGE
abc123def456   pideai_app   replicated   2/2        ghcr.io/usuario/menu-maestro:latest
```

### 2. Verificar Replicas

```bash
docker service ps pideai_app
```

**Output esperado:**
```
ID             NAME           NODE      DESIRED STATE   CURRENT STATE
abc123         pideai_app.1   server1   Running         Running 2 minutes ago
def456         pideai_app.2   server1   Running         Running 2 minutes ago
```

### 3. Ver Logs

```bash
# Logs en tiempo real
docker service logs -f pideai_app

# \u00daltimas 100 l\u00edneas
docker service logs --tail 100 pideai_app
```

### 4. Verificar Health Check

```bash
# Health check manual
curl http://pideai.com/health

# Debe retornar: OK
```

### 5. Probar Acceso Web

#### Dominio Principal
```bash
curl -I https://pideai.com
```

**Output esperado:**
```
HTTP/2 200
content-type: text/html
```

#### Subdominio
```bash
curl -I https://tienda1.pideai.com
```

**Output esperado:**
```
HTTP/2 200
content-type: text/html
```

### 6. Verificar Certificado SSL

```bash
# Verificar certificado
openssl s_client -connect pideai.com:443 -servername pideai.com < /dev/null | grep "Verify return code"
```

**Output esperado:**
```
Verify return code: 0 (ok)
```

### 7. Probar en Navegador

Abre tu navegador y accede a:

1. **Dominio principal**: https://pideai.com
2. **Subdomain de tienda**: https://tienda1.pideai.com
3. **Subdomain personalizado**: https://mi-restaurante.pideai.com

Todos deben:
- Cargar sin errores de SSL
- Mostrar la aplicaci\u00f3n
- Cargar la tienda correspondiente al subdomain

---

## Troubleshooting

### Problema: Servicio no inicia

**S\u00edntomas:**
```bash
docker service ps pideai_app
# Muestra containers en estado "Failed" o "Rejected"
```

**Soluci\u00f3n 1**: Ver logs detallados
```bash
docker service logs pideai_app --tail 100
```

**Soluci\u00f3n 2**: Ver detalles de la tarea fallida
```bash
docker service ps pideai_app --no-trunc
```

**Causas comunes:**
- Imagen no disponible en el registry
- Secrets no existen
- Network no existe
- Recursos insuficientes

### Problema: 502 Bad Gateway

**S\u00edntomas:**
- Traefik retorna error 502
- No se puede acceder a la aplicaci\u00f3n

**Soluci\u00f3n 1**: Verificar health check
```bash
# Ver si los containers est\u00e1n healthy
docker service ps pideai_app

# Probar health check manualmente
docker exec $(docker ps -q --filter name=pideai_app) curl -f http://localhost/health
```

**Soluci\u00f3n 2**: Verificar network
```bash
# Asegurar que servicio est\u00e1 en network correcta
docker service inspect pideai_app | grep -A 5 Networks
```

**Soluci\u00f3n 3**: Verificar labels de Traefik
```bash
docker service inspect pideai_app --format='{{json .Spec.Labels}}' | jq
```

### Problema: Certificado SSL no se genera

**S\u00edntomas:**
- Error de certificado en navegador
- Traefik no obtiene certificado de Let's Encrypt

**Soluci\u00f3n 1**: Verificar logs de Traefik
```bash
docker service logs traefik_traefik | grep acme
```

**Soluci\u00f3n 2**: Verificar DNS
```bash
# DNS debe resolver correctamente
dig pideai.com +short
```

**Soluci\u00f3n 3**: Verificar puertos
```bash
# Puerto 80 debe estar abierto para challenge HTTP
netstat -tulpn | grep :80
```

### Problema: Subdominios no funcionan

**S\u00edntomas:**
- `pideai.com` funciona pero `tienda1.pideai.com` no

**Soluci\u00f3n 1**: Verificar DNS wildcard
```bash
# Debe resolver a la misma IP
dig tienda1.pideai.com +short
dig cualquier-cosa.pideai.com +short
```

**Soluci\u00f3n 2**: Verificar routing rule de Traefik
```bash
# Ver configuraci\u00f3n del router
docker service inspect pideai_app | grep "traefik.http.routers"
```

### Problema: No hay logs

**Soluci\u00f3n:**
```bash
# Verificar que el servicio est\u00e1 corriendo
docker service ls | grep pideai

# Ver todas las tareas (incluyendo fallidas)
docker service ps pideai_app --no-trunc

# Ver logs de Swarm
journalctl -u docker.service -f
```

### Problema: Actualizaci\u00f3n no se aplica

**S\u00edntomas:**
- Deployaste nueva versi\u00f3n pero sigue mostrando la vieja

**Soluci\u00f3n 1**: Forzar actualizaci\u00f3n
```bash
docker service update --force pideai_app
```

**Soluci\u00f3n 2**: Actualizar imagen
```bash
docker service update --image ghcr.io/usuario/menu-maestro:v1.1.0 pideai_app
```

**Soluci\u00f3n 3**: Redeploy completo
```bash
docker stack rm pideai
# Esperar a que se elimine completamente
docker stack deploy -c docker-compose.swarm.yml pideai
```

### Problema: Rendimiento lento

**Soluci\u00f3n 1**: Verificar recursos
```bash
# Ver uso de CPU/RAM
docker stats
```

**Soluci\u00f3n 2**: Aumentar r\u00e9plicas
```bash
docker service scale pideai_app=4
```

**Soluci\u00f3n 3**: Aumentar resource limits
Edita `docker-compose.swarm.yml`:
```yaml
resources:
  limits:
    cpus: '1.0'
    memory: 1G
```

---

## Mantenimiento

### Actualizar la Aplicaci\u00f3n

#### 1. Build Nueva Versi\u00f3n

```bash
./scripts/build-docker-image.sh --tag v1.1.0 --push
```

#### 2. Actualizar Servicio

**Opci\u00f3n A: Con Portainer**
1. Ir a **Stacks** \u2192 **pideai**
2. Click en **Editor**
3. Cambiar tag de imagen: `v1.0.0` \u2192 `v1.1.0`
4. Click en **Update the stack**

**Opci\u00f3n B: Con CLI**
```bash
docker service update --image ghcr.io/usuario/menu-maestro:v1.1.0 pideai_app
```

#### 3. Monitorear Actualizaci\u00f3n

```bash
# Ver progreso de rolling update
watch docker service ps pideai_app
```

### Rollback

Si la nueva versi\u00f3n tiene problemas:

```bash
# Rollback autom\u00e1tico a versi\u00f3n anterior
docker service rollback pideai_app
```

### Escalar Servicio

```bash
# Aumentar a 4 r\u00e9plicas
docker service scale pideai_app=4

# Reducir a 2 r\u00e9plicas
docker service scale pideai_app=2
```

### Backup de Configuraci\u00f3n

```bash
# Backup de compose file
cp docker-compose.swarm.yml docker-compose.swarm.yml.backup

# Backup de secrets (listar nombres)
docker secret ls > secrets-list.txt
```

### Logs y Monitoreo

```bash
# Ver logs en tiempo real
docker service logs -f pideai_app

# Ver logs de las \u00faltimas 24 horas
docker service logs --since 24h pideai_app

# Ver logs de container espec\u00edfico
docker logs $(docker ps -q --filter name=pideai_app.1)
```

### Limpieza

```bash
# Limpiar im\u00e1genes viejas
docker image prune -a

# Limpiar volumes no usados
docker volume prune

# Limpiar todo (cuidado!)
docker system prune -a
```

---

## Checklist de Deployment

Usa este checklist para asegurar que todo est\u00e1 configurado correctamente:

### Pre-Deployment

- [ ] DNS configurado (wildcard o subdominios espec\u00edficos)
- [ ] DNS propagado y funcionando
- [ ] Docker Swarm inicializado
- [ ] Network `traefik-public` creada
- [ ] Traefik deployado y funcionando
- [ ] Certificados SSL funcionando en Traefik
- [ ] `.env.production` configurado con todas las variables
- [ ] Imagen Docker buildeada y pusheada al registry

### Deployment

- [ ] Secrets creados en Docker Swarm
- [ ] `docker-compose.swarm.yml` editado con tu dominio
- [ ] Stack deployado en Portainer o CLI
- [ ] Servicios en estado Running (2/2 r\u00e9plicas)
- [ ] Health checks pasando
- [ ] Logs sin errores

### Post-Deployment

- [ ] Acceso a dominio principal funciona
- [ ] Acceso a subdominios funciona
- [ ] Certificado SSL v\u00e1lido
- [ ] Aplicaci\u00f3n carga correctamente
- [ ] Multi-tenancy funciona (diferentes tiendas en diferentes subdominios)
- [ ] Integraci\u00f3n con Supabase funciona
- [ ] Analytics (PostHog) funciona (si est\u00e1 habilitado)

---

## Recursos Adicionales

### Documentaci\u00f3n Oficial

- [Docker Swarm](https://docs.docker.com/engine/swarm/)
- [Traefik](https://doc.traefik.io/traefik/)
- [Portainer](https://docs.portainer.io/)
- [Let's Encrypt](https://letsencrypt.org/docs/)

### Archivos del Proyecto

- `Dockerfile.production` - Dockerfile multi-stage optimizado
- `nginx.conf` - Configuraci\u00f3n de Nginx para SPA
- `docker-compose.swarm.yml` - Stack completo para Swarm
- `scripts/build-docker-image.sh` - Script de build automatizado
- `scripts/setup-swarm-secrets.sh` - Script de creaci\u00f3n de secrets
- `scripts/deploy-to-swarm.sh` - Script de deployment automatizado

### Comandos \u00datiles de Referencia

```bash
# Docker Swarm
docker node ls                              # Listar nodos
docker service ls                           # Listar servicios
docker service ps <service>                 # Ver tareas de servicio
docker service logs -f <service>            # Ver logs
docker service scale <service>=N            # Escalar servicio
docker service update --force <service>     # Forzar update
docker service rollback <service>           # Rollback
docker stack ls                             # Listar stacks
docker stack rm <stack>                     # Eliminar stack

# Traefik
docker service logs -f traefik_traefik      # Ver logs de Traefik
docker service update --force traefik_traefik  # Reiniciar Traefik

# Secrets
docker secret ls                            # Listar secrets
docker secret create <name> <file>          # Crear secret
docker secret rm <name>                     # Eliminar secret

# Networks
docker network ls                           # Listar networks
docker network inspect traefik-public       # Ver detalles de network

# Debugging
docker ps                                   # Containers corriendo
docker stats                                # Uso de recursos
docker system df                            # Uso de disco
```

---

## Soporte

Si tienes problemas durante el deployment:

1. Revisa la secci\u00f3n [Troubleshooting](#troubleshooting)
2. Verifica los logs: `docker service logs -f pideai_app`
3. Revisa la configuraci\u00f3n de Traefik: `docker service logs -f traefik_traefik`
4. Abre un issue en GitHub con logs completos

---

**\u00daltima actualizaci\u00f3n**: 2025-11-30
**Versi\u00f3n del documento**: 1.0.0
