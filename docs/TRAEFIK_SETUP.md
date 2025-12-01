# Configuraci\u00f3n de Traefik para Menu Maestro

Esta gu\u00eda detalla la configuraci\u00f3n completa de Traefik como reverse proxy para Menu Maestro en Docker Swarm.

## Tabla de Contenidos

1. [Overview](#overview)
2. [Configuraci\u00f3n B\u00e1sica](#configuraci\u00f3n-b\u00e1sica)
3. [Configuraci\u00f3n Avanzada](#configuraci\u00f3n-avanzada)
4. [SSL/TLS con Let's Encrypt](#ssltls-con-lets-encrypt)
5. [Dashboard de Traefik](#dashboard-de-traefik)
6. [Middlewares](#middlewares)
7. [Monitoring](#monitoring)

---

## Overview

Traefik act\u00faa como reverse proxy y load balancer para la aplicaci\u00f3n Menu Maestro:

- **Routing Din\u00e1mico**: Detecta autom\u00e1ticamente servicios de Docker Swarm
- **SSL/TLS Autom\u00e1tico**: Obtiene y renueva certificados de Let's Encrypt
- **Load Balancing**: Distribuye tr\u00e1fico entre m\u00faltiples r\u00e9plicas
- **Health Checks**: Verifica salud de containers antes de enviar tr\u00e1fico
- **Wildcard Domains**: Soporta routing por subdominios (*.pideai.com)

---

## Configuraci\u00f3n B\u00e1sica

### 1. Estructura de Directorios

```bash
/opt/traefik/
\u251c\u2500\u2500 traefik.yml                    # Configuraci\u00f3n principal
\u251c\u2500\u2500 docker-compose.traefik.yml     # Stack de Docker Swarm
\u2514\u2500\u2500 acme.json                      # Certificados (auto-generado)
```

### 2. Archivo de Configuraci\u00f3n Principal

Crea `/opt/traefik/traefik.yml`:

```yaml
# ============================================================================
# Traefik v2 Configuration para Menu Maestro
# ============================================================================

# ----------------------------------------------------------------------------
# Global Configuration
# ----------------------------------------------------------------------------
global:
  checkNewVersion: true
  sendAnonymousUsage: false

# ----------------------------------------------------------------------------
# API y Dashboard
# ----------------------------------------------------------------------------
api:
  dashboard: true
  insecure: false  # Dashboard requiere autenticaci\u00f3n

# ----------------------------------------------------------------------------
# Entry Points (Puertos de entrada)
# ----------------------------------------------------------------------------
entryPoints:
  # HTTP (Port 80) - Redirige a HTTPS
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https
          permanent: true

  # HTTPS (Port 443)
  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

# ----------------------------------------------------------------------------
# Providers - Docker Swarm
# ----------------------------------------------------------------------------
providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false  # Solo exponer servicios con traefik.enable=true
    network: traefik-public
    swarmMode: true
    watch: true

# ----------------------------------------------------------------------------
# Certificate Resolvers - Let's Encrypt
# ----------------------------------------------------------------------------
certificatesResolvers:
  letsencrypt:
    acme:
      # Email para notificaciones de Let's Encrypt
      email: admin@pideai.com  # CAMBIAR POR TU EMAIL

      # Storage de certificados
      storage: /certificates/acme.json

      # HTTP Challenge (puerto 80 debe estar accesible)
      httpChallenge:
        entryPoint: web

      # Usar Let's Encrypt Staging para testing (descomenta para produccion)
      # caServer: https://acme-staging-v02.api.letsencrypt.org/directory

# ----------------------------------------------------------------------------
# Logging
# ----------------------------------------------------------------------------
log:
  level: INFO  # DEBUG, INFO, WARN, ERROR
  format: json

# Access logs
accessLog:
  format: json
  fields:
    defaultMode: keep
    headers:
      defaultMode: keep

# ----------------------------------------------------------------------------
# Metrics (opcional)
# ----------------------------------------------------------------------------
# metrics:
#   prometheus:
#     addEntryPointsLabels: true
#     addServicesLabels: true
```

### 3. Docker Compose Stack

Crea `/opt/traefik/docker-compose.traefik.yml`:

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10

    # Puertos expuestos
    ports:
      - target: 80
        published: 80
        protocol: tcp
        mode: host
      - target: 443
        published: 443
        protocol: tcp
        mode: host

    networks:
      - traefik-public

    volumes:
      # Docker socket (solo lectura)
      - /var/run/docker.sock:/var/run/docker.sock:ro

      # Configuraci\u00f3n de Traefik
      - ./traefik.yml:/traefik.yml:ro

      # Certificados (persistente)
      - traefik-certificates:/certificates

    deploy:
      mode: replicated
      replicas: 1

      # Solo en manager nodes
      placement:
        constraints:
          - node.role == manager

      # Resource limits
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M

      # Labels para el dashboard
      labels:
        # Enable Traefik
        - "traefik.enable=true"

        # Dashboard router
        - "traefik.http.routers.dashboard.rule=Host(`traefik.pideai.com`)"
        - "traefik.http.routers.dashboard.service=api@internal"
        - "traefik.http.routers.dashboard.entrypoints=websecure"
        - "traefik.http.routers.dashboard.tls=true"
        - "traefik.http.routers.dashboard.tls.certresolver=letsencrypt"

        # Dashboard authentication (Basic Auth)
        # Generar password: echo $(htpasswd -nb admin tu-password) | sed -e s/\\$/\\$\\$/g
        - "traefik.http.routers.dashboard.middlewares=dashboard-auth"
        - "traefik.http.middlewares.dashboard-auth.basicauth.users=admin:$$apr1$$8EVjn/nj$$GiLUZqcbueTFeD23SuB6x0"
        # User: admin, Password: changeme (CAMBIAR EN PRODUCCI\u00d3N!)

        # Service port (dashboard interno)
        - "traefik.http.services.dashboard.loadbalancer.server.port=8080"

networks:
  traefik-public:
    external: true

volumes:
  traefik-certificates:
    driver: local
```

---

## Configuraci\u00f3n Avanzada

### Wildcard SSL Certificates (DNS Challenge)

Para obtener certificados wildcard (*.pideai.com), necesitas usar DNS challenge:

```yaml
# traefik.yml
certificatesResolvers:
  letsencrypt:
    acme:
      email: admin@pideai.com
      storage: /certificates/acme.json
      dnsChallenge:
        provider: cloudflare  # o route53, digitalocean, etc.
        delayBeforeCheck: 0
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"
```

**Environment variables necesarias (Cloudflare ejemplo):**

```yaml
# docker-compose.traefik.yml
services:
  traefik:
    environment:
      - CF_API_EMAIL=tu-email@example.com
      - CF_API_KEY=tu_cloudflare_api_key
```

### Rate Limiting Global

Protege tu aplicaci\u00f3n contra DDoS:

```yaml
# traefik.yml
http:
  middlewares:
    global-rate-limit:
      rateLimit:
        average: 100
        burst: 200
        period: 1s
```

### Compresi\u00f3n

Habilitar compresi\u00f3n gzip global:

```yaml
# traefik.yml
http:
  middlewares:
    global-compression:
      compress: true
```

---

## SSL/TLS con Let's Encrypt

### Configuraci\u00f3n B\u00e1sica (HTTP Challenge)

La configuraci\u00f3n por defecto usa HTTP challenge, que es m\u00e1s simple:

**Ventajas:**
- F\u00e1cil de configurar
- No requiere API keys
- Funciona con cualquier dominio

**Desventajas:**
- No soporta certificados wildcard
- Requiere puerto 80 accesible
- Un certificado por subdomain

### Verificar Certificados

```bash
# Ver certificados almacenados
docker exec $(docker ps -q -f name=traefik_traefik) \
  cat /certificates/acme.json | jq '.letsencrypt.Certificates[].domain'

# Verificar certificado de un dominio
openssl s_client -connect pideai.com:443 -servername pideai.com < /dev/null 2>/dev/null | \
  openssl x509 -noout -dates
```

### Renovaci\u00f3n Autom\u00e1tica

Traefik renueva autom\u00e1ticamente certificados 30 d\u00edas antes de expirar. No requiere configuraci\u00f3n adicional.

### Troubleshooting SSL

#### Error: "too many certificates already issued"

Let's Encrypt tiene un l\u00edmite de 50 certificados por dominio por semana.

**Soluci\u00f3n:**
1. Usar staging server para testing
2. Esperar a que pase la semana
3. Consolidar subdominios con wildcard certificate

#### Error: "challenge failed"

**Causas comunes:**
- Puerto 80 no accesible desde internet
- DNS no resuelve correctamente
- Firewall bloqueando tr\u00e1fico

**Soluci\u00f3n:**
```bash
# Verificar puerto 80
curl -I http://pideai.com/.well-known/acme-challenge/test

# Verificar DNS
dig pideai.com +short

# Ver logs de Traefik
docker service logs traefik_traefik | grep acme
```

---

## Dashboard de Traefik

### Acceder al Dashboard

URL: `https://traefik.pideai.com`

**Credenciales por defecto:**
- Usuario: `admin`
- Password: `changeme`

**IMPORTANTE**: Cambiar password en producci\u00f3n!

### Generar Nueva Password

```bash
# Instalar htpasswd (si no est\u00e1 instalado)
sudo apt-get install apache2-utils

# Generar hash de password
echo $(htpasswd -nb admin tu-nueva-password) | sed -e s/\\$/\\$\\$/g
```

Copiar el output y actualizar el label en `docker-compose.traefik.yml`:

```yaml
- "traefik.http.middlewares.dashboard-auth.basicauth.users=admin:$$apr1$$..."
```

### Informaci\u00f3n del Dashboard

El dashboard muestra:

1. **HTTP Routers**: Reglas de routing
2. **Services**: Servicios detectados
3. **Middlewares**: Middlewares activos
4. **EntryPoints**: Puertos de entrada
5. **Certificates**: Certificados SSL activos

---

## Middlewares

### Security Headers

Middleware para agregar headers de seguridad:

```yaml
# En docker-compose.swarm.yml del servicio
labels:
  - "traefik.http.middlewares.security-headers.headers.stsSeconds=31536000"
  - "traefik.http.middlewares.security-headers.headers.stsIncludeSubdomains=true"
  - "traefik.http.middlewares.security-headers.headers.stsPreload=true"
  - "traefik.http.middlewares.security-headers.headers.frameDeny=true"
  - "traefik.http.middlewares.security-headers.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security-headers.headers.browserXssFilter=true"
  - "traefik.http.middlewares.security-headers.headers.customResponseHeaders.X-Robots-Tag=none"
```

### Rate Limiting

Limitar requests por IP:

```yaml
labels:
  - "traefik.http.middlewares.rate-limit.ratelimit.average=100"
  - "traefik.http.middlewares.rate-limit.ratelimit.burst=200"
  - "traefik.http.middlewares.rate-limit.ratelimit.period=1m"
```

### IP Whitelist

Restringir acceso a IPs espec\u00edficas:

```yaml
labels:
  - "traefik.http.middlewares.ip-whitelist.ipwhitelist.sourcerange=192.168.1.0/24,10.0.0.0/8"
```

### Redirect Scheme

Forzar HTTPS:

```yaml
labels:
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
  - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"
```

### Chain de Middlewares

Aplicar m\u00faltiples middlewares:

```yaml
labels:
  - "traefik.http.middlewares.app-chain.chain.middlewares=security-headers,compression,rate-limit"
  - "traefik.http.routers.app.middlewares=app-chain"
```

---

## Monitoring

### Logs

```bash
# Ver logs en tiempo real
docker service logs -f traefik_traefik

# Filtrar por nivel
docker service logs traefik_traefik | grep ERROR

# Ver access logs
docker service logs traefik_traefik | grep accessLog
```

### M\u00e9tricas con Prometheus

Habilitar m\u00e9tricas en `traefik.yml`:

```yaml
metrics:
  prometheus:
    addEntryPointsLabels: true
    addServicesLabels: true
    entryPoint: metrics
```

Agregar entrypoint de m\u00e9tricas:

```yaml
entryPoints:
  metrics:
    address: ":8082"
```

Exponer puerto en docker-compose:

```yaml
ports:
  - target: 8082
    published: 8082
    protocol: tcp
    mode: host
```

Acceder a m\u00e9tricas:
```bash
curl http://localhost:8082/metrics
```

### Health Check

```bash
# Verificar que Traefik est\u00e1 respondiendo
curl -I http://traefik.pideai.com/ping

# Verificar routing
curl -I https://pideai.com
```

---

## Comandos \u00datiles

```bash
# Deployar Traefik
docker stack deploy -c docker-compose.traefik.yml traefik

# Ver servicios de Traefik
docker service ls | grep traefik

# Ver logs
docker service logs -f traefik_traefik

# Actualizar Traefik
docker service update --force traefik_traefik

# Ver configuraci\u00f3n actual
docker service inspect traefik_traefik --pretty

# Ver certificados
docker exec $(docker ps -q -f name=traefik) cat /certificates/acme.json | jq

# Reiniciar Traefik
docker service update --force traefik_traefik

# Eliminar Traefik
docker stack rm traefik
```

---

## Troubleshooting Traefik

### Problema: Traefik no detecta servicios

**Soluci\u00f3n:**
```bash
# Verificar que servicio tiene label traefik.enable=true
docker service inspect pideai_app | grep "traefik.enable"

# Verificar que est\u00e1 en network correcta
docker service inspect pideai_app | grep -A 5 Networks
```

### Problema: 404 Not Found

**Causas:**
- Routing rule incorrecta
- Servicio no expuesto

**Soluci\u00f3n:**
```bash
# Ver routers en dashboard
# https://traefik.pideai.com

# Ver logs
docker service logs traefik_traefik | grep -i error
```

### Problema: Certificado SSL inv\u00e1lido

**Soluci\u00f3n:**
```bash
# Eliminar certificados y regenerar
docker service scale traefik_traefik=0
docker volume rm traefik_traefik-certificates
docker service scale traefik_traefik=1
```

---

**\u00daltima actualizaci\u00f3n**: 2025-11-30
**Versi\u00f3n**: 1.0.0
