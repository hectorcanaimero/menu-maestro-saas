# Configuración de Traefik para Multi-tenant con Wildcard SSL

Este documento explica cómo configurar Traefik v2 para soportar el multitenancy de Menu Maestro con certificados SSL wildcard.

## Opción 1: Certificados Wildcard (DNS-01 Challenge) - RECOMENDADO

Para soportar `*.pideai.com` y `*.artex.lat` necesitas usar DNS-01 challenge.

### 1. Configuración de Traefik (traefik.yml)

```yaml
# traefik.yml
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
          permanent: true

  websecure:
    address: ":443"
    http:
      tls:
        certResolver: letsencrypt

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    swarmMode: true
    exposedByDefault: false
    network: traefik-public

certificatesResolvers:
  letsencrypt:
    acme:
      email: tu-email@ejemplo.com
      storage: /letsencrypt/acme.json
      # DNS Challenge para wildcard certificates
      dnsChallenge:
        provider: cloudflare  # O tu proveedor DNS
        delayBeforeCheck: 30
        resolvers:
          - "1.1.1.1:53"
          - "8.8.8.8:53"

log:
  level: INFO

accessLog: {}
```

### 2. Variables de entorno para DNS Challenge

Según tu proveedor DNS, necesitarás diferentes variables:

#### Cloudflare
```bash
CF_API_EMAIL=tu-email@ejemplo.com
CF_API_KEY=tu_api_key_global
# O usando API Token (recomendado):
CF_DNS_API_TOKEN=tu_api_token
```

#### AWS Route53
```bash
AWS_ACCESS_KEY_ID=tu_access_key
AWS_SECRET_ACCESS_KEY=tu_secret_key
AWS_REGION=us-east-1
```

#### DigitalOcean
```bash
DO_AUTH_TOKEN=tu_token
```

#### Google Cloud DNS
```bash
GCE_PROJECT=tu-proyecto
GCE_SERVICE_ACCOUNT_FILE=/path/to/service-account.json
```

Ver lista completa de proveedores: https://doc.traefik.io/traefik/https/acme/#providers

### 3. Docker Compose para Traefik (con Swarm)

```yaml
# traefik-stack.yml
version: '3.8'

networks:
  traefik-public:
    external: true

volumes:
  traefik-certificates:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: /opt/traefik/letsencrypt

services:
  traefik:
    image: traefik:v2.11
    ports:
      - target: 80
        published: 80
        mode: host
      - target: 443
        published: 443
        mode: host
      - target: 8080
        published: 8080
        protocol: tcp
        mode: host
    networks:
      - traefik-public
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/letsencrypt
      - ./traefik.yml:/traefik.yml:ro
    environment:
      # Variables para DNS challenge - Cloudflare example
      - CF_API_EMAIL=tu-email@ejemplo.com
      - CF_DNS_API_TOKEN=tu_api_token
    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.traefik.rule=Host(`traefik.pideai.com`)"
        - "traefik.http.routers.traefik.entrypoints=websecure"
        - "traefik.http.routers.traefik.tls=true"
        - "traefik.http.routers.traefik.tls.certresolver=letsencrypt"
        - "traefik.http.routers.traefik.service=api@internal"
        - "traefik.http.services.traefik.loadbalancer.server.port=8080"
```

### 4. Deployment de Traefik

```bash
# Crear directorio para certificados
mkdir -p /opt/traefik/letsencrypt

# Crear archivo acme.json con permisos correctos
touch /opt/traefik/letsencrypt/acme.json
chmod 600 /opt/traefik/letsencrypt/acme.json

# Crear network
docker network create --driver=overlay traefik-public

# Deploy Traefik
docker stack deploy -c traefik-stack.yml traefik

# Verificar
docker service logs traefik_traefik -f
```

## Opción 2: Certificados por Subdominio (HTTP-01 Challenge)

Si no puedes usar DNS-01, Traefik generará un certificado para cada subdominio automáticamente.

### Configuración simplificada (traefik.yml)

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: tu-email@ejemplo.com
      storage: /letsencrypt/acme.json
      httpChallenge:
        entryPoint: web
```

**Ventajas:**
- Más simple de configurar
- No necesita credenciales de DNS

**Desventajas:**
- Cada subdominio necesita su propio certificado
- Límite de rate limiting de Let's Encrypt (50 certs/semana por dominio)
- No soporta subdominios que aún no existen

## Configuración DNS Requerida

En tu proveedor de DNS (Cloudflare, Route53, etc.), configura:

### Registros A
```
A       pideai.com          -> IP_SERVIDOR
A       www.pideai.com      -> IP_SERVIDOR
A       *.pideai.com        -> IP_SERVIDOR (wildcard)

A       artex.lat           -> IP_SERVIDOR
A       www.artex.lat       -> IP_SERVIDOR
A       *.artex.lat         -> IP_SERVIDOR (wildcard)
```

### Verificar DNS
```bash
# Verificar dominio principal
dig pideai.com +short

# Verificar wildcard
dig tienda1.pideai.com +short
dig cualquier-cosa.pideai.com +short

# Todos deben resolver a la misma IP
```

## Testing del Setup

### 1. Verificar Traefik está corriendo
```bash
docker service ls
docker service logs traefik_traefik -f
```

### 2. Verificar certificados se están generando
```bash
# Ver contenido de acme.json
cat /opt/traefik/letsencrypt/acme.json | jq .
```

### 3. Testear endpoints
```bash
# Test HTTP -> HTTPS redirect
curl -I http://pideai.com

# Test HTTPS
curl -I https://pideai.com

# Test subdomain
curl -I https://tienda1.pideai.com

# Test artex.lat
curl -I https://tienda1.artex.lat
```

### 4. Verificar headers de seguridad
```bash
curl -I https://tienda1.pideai.com
# Debería mostrar:
# - Strict-Transport-Security
# - X-Content-Type-Options
# - X-Frame-Options
```

## Troubleshooting

### Certificados no se generan

1. Verificar logs de Traefik:
```bash
docker service logs traefik_traefik -f
```

2. Verificar que el DNS está correcto:
```bash
dig tienda1.pideai.com +short
```

3. Verificar variables de entorno del DNS provider:
```bash
docker service inspect traefik_traefik --pretty
```

### Error "too many certificates already issued"

Let's Encrypt tiene un límite de 50 certificados por dominio por semana.

Soluciones:
- Usar DNS-01 challenge con wildcard certificate
- Esperar una semana
- Usar staging environment de Let's Encrypt para testing:

```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      caServer: https://acme-staging-v02.api.letsencrypt.org/directory
```

### Subdomain no resuelve

1. Verificar DNS:
```bash
dig problema.pideai.com +short
```

2. Verificar labels de Traefik en el servicio:
```bash
docker service inspect pideai_app --pretty
```

3. Ver dashboard de Traefik: https://traefik.pideai.com

## Seguridad Adicional

### IP Whitelist para dashboard de Traefik
```yaml
- "traefik.http.middlewares.admin-auth.ipwhitelist.sourcerange=YOUR_IP/32"
- "traefik.http.routers.traefik.middlewares=admin-auth"
```

### Basic Auth para dashboard
```bash
# Generar password
htpasswd -nb admin your_password

# Agregar label
- "traefik.http.middlewares.admin-auth.basicauth.users=admin:$$apr1$$..."
```

## Monitoreo

### Métricas de Traefik
```yaml
# traefik.yml
metrics:
  prometheus:
    entryPoint: metrics
    addServicesLabels: true

entryPoints:
  metrics:
    address: ":8082"
```

### Verificar salud del sistema
```bash
# Ver estado de servicios
docker service ps pideai_app

# Ver uso de recursos
docker stats

# Ver logs en tiempo real
docker service logs pideai_app -f --tail 100
```

## Recursos Adicionales

- [Traefik v2 Documentation](https://doc.traefik.io/traefik/)
- [Let's Encrypt Rate Limits](https://letsencrypt.org/docs/rate-limits/)
- [DNS Providers List](https://doc.traefik.io/traefik/https/acme/#providers)
- [Traefik + Docker Swarm](https://doc.traefik.io/traefik/providers/docker/)
