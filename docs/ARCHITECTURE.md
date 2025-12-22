# Arquitectura Multi-tenant con Docker Swarm y Traefik

## Diagrama de Arquitectura

```
                                    INTERNET
                                       |
                                       |
                        DNS (Wildcard A Records)
                   *.pideai.com -> SERVER_IP
                   *.artex.lat  -> SERVER_IP
                                       |
                                       |
                            ┌──────────▼──────────┐
                            │                     │
                            │   TRAEFIK v2        │
                            │   (Reverse Proxy)   │
                            │                     │
                            │  - Port 80 (HTTP)   │
                            │  - Port 443 (HTTPS) │
                            │  - SSL Termination  │
                            │  - Load Balancer    │
                            │                     │
                            └──────────┬──────────┘
                                       |
                      ┌────────────────┼────────────────┐
                      |                |                |
              tienda1.pideai.com  cafe.artex.lat   www.pideai.com
                      |                |                |
                      └────────────────┴────────────────┘
                                       |
                            ┌──────────▼──────────┐
                            │                     │
                            │  DOCKER SWARM       │
                            │  (Orchestrator)     │
                            │                     │
                            └──────────┬──────────┘
                                       |
                    ┌──────────────────┼──────────────────┐
                    |                  |                  |
            ┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
            │               │  │               │  │               │
            │  Container 1  │  │  Container 2  │  │  Container 3  │
            │  (Replica 1)  │  │  (Replica 2)  │  │  (Replica 3)  │
            │               │  │               │  │               │
            │  Nginx:80     │  │  Nginx:80     │  │  Nginx:80     │
            │  + React SPA  │  │  + React SPA  │  │  + React SPA  │
            │               │  │               │  │               │
            └───────┬───────┘  └───────┬───────┘  └───────┬───────┘
                    |                  |                  |
                    └──────────────────┴──────────────────┘
                                       |
                            ┌──────────▼──────────┐
                            │                     │
                            │   SUPABASE          │
                            │   (Backend)         │
                            │                     │
                            │  - PostgreSQL DB    │
                            │  - Auth             │
                            │  - Realtime         │
                            │  - Storage          │
                            │                     │
                            └─────────────────────┘
```

## Flujo de Request Multi-tenant

### Escenario: Usuario accede a `https://tienda1.pideai.com`

```
1. DNS Resolution
   tienda1.pideai.com -> 123.45.67.89 (Server IP)

2. Request llega a Traefik (Port 443)
   ┌─────────────────────────────────────────┐
   │ GET / HTTP/1.1                          │
   │ Host: tienda1.pideai.com                │
   └─────────────────────────────────────────┘

3. Traefik Match Rules
   HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`)
   ✓ Match! -> Forward to pideai_app service

4. Load Balancer selecciona container
   Round-robin entre 3 replicas
   -> Selecciona Container 2

5. Container 2 (Nginx) recibe request
   - Nginx sirve /usr/share/nginx/html/index.html
   - React SPA carga en el browser

6. JavaScript en el Browser extrae subdomain
   window.location.hostname = "tienda1.pideai.com"
   subdomain = "tienda1"  // Extraído por getSubdomainFromHostname()

7. React consulta Supabase
   SELECT * FROM stores WHERE subdomain = 'tienda1'

8. StoreContext carga datos de la tienda
   {
     id: "xxx",
     name: "Tienda 1",
     subdomain: "tienda1",
     settings: {...}
   }

9. App renderiza con datos de "Tienda 1"
```

## Componentes del Sistema

### 1. Traefik (Reverse Proxy)

**Responsabilidades:**
- SSL Termination (HTTPS)
- Routing basado en hostname
- Load Balancing entre containers
- Health checks
- Security headers
- Rate limiting
- Compression

**Configuración clave:**
```yaml
labels:
  # Match ANY subdomain of pideai.com or artex.lat
  - "traefik.http.routers.pideai-https.rule=
     Host(`pideai.com`) ||
     Host(`www.pideai.com`) ||
     HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) ||
     Host(`artex.lat`) ||
     Host(`www.artex.lat`) ||
     HostRegexp(`{subdomain:[a-z0-9-]+}.artex.lat`)"
```

### 2. Docker Swarm (Orchestrator)

**Responsabilidades:**
- Container orchestration
- Service scaling (3 replicas)
- Rolling updates
- Auto-restart on failure
- Health monitoring
- Resource management

**Configuración clave:**
```yaml
deploy:
  replicas: 3
  update_config:
    parallelism: 1
    delay: 15s
    order: start-first  # Zero-downtime deployment
```

### 3. Nginx (Web Server)

**Responsabilidades:**
- Servir archivos estáticos (React build)
- SPA routing (todas las rutas -> index.html)
- Gzip compression
- Caching de assets
- Health check endpoint

**Configuración clave:**
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location /health {
    return 200 "OK\n";
}
```

### 4. React SPA (Frontend)

**Responsabilidades:**
- Extracción de subdomain
- Routing de la aplicación
- Estado global (StoreContext)
- Comunicación con Supabase

**Código clave:**
```typescript
// src/lib/subdomain-validation.ts
export function getSubdomainFromHostname(): string {
  const hostname = window.location.hostname;

  // Production: Extract from hostname
  if (hostname.endsWith('pideai.com')) {
    return hostname.split('.')[0]; // tienda1.pideai.com -> tienda1
  }

  // Development: Use localStorage
  return localStorage.getItem('dev_subdomain') || 'totus';
}
```

### 5. Supabase (Backend)

**Responsabilidades:**
- Database (PostgreSQL)
- Authentication
- Realtime subscriptions
- File storage
- Row Level Security (RLS)

**Schema clave:**
```sql
stores
  - id (uuid)
  - subdomain (text, unique)
  - name (text)
  - settings (jsonb)
  - owner_id (uuid -> users.id)
```

## Flujo de Deployment

### Build & Push
```
Local Machine
  |
  ├─> npm run build (Vite build con env vars)
  ├─> docker build (Multi-stage Dockerfile)
  ├─> docker tag ghcr.io/hectorcanaimero/menu-maestro-saas:latest
  └─> docker push (GitHub Container Registry)
```

### Deploy to Swarm
```
Portainer/CLI
  |
  ├─> docker stack deploy -c docker-compose.swarm.yml pideai
  |
  ├─> Swarm creates 3 tasks (replicas)
  ├─> Each task pulls image from ghcr.io
  ├─> Containers start with health checks
  └─> Traefik detects new containers and updates routing
```

### Rolling Update (Zero Downtime)
```
New Version Available
  |
  v
Start Task 4 (new version)
  |
  v
Wait for health check (30s)
  |
  v
Stop Task 1 (old version)
  |
  v
Wait 15s (delay)
  |
  v
Start Task 5 (new version)
  |
  v
Wait for health check
  |
  v
Stop Task 2
  |
  v
...continue until all 3 replicas updated
```

## High Availability

### Load Balancing
- 3 replicas distribuidas en el cluster
- Traefik balancea requests con round-robin
- Health checks automáticos (cada 30s)
- Auto-restart si un container falla

### Fault Tolerance
```
Si Container 1 falla:
  |
  ├─> Health check detecta fallo
  ├─> Traefik deja de enviar tráfico a Container 1
  ├─> Requests van a Container 2 y 3
  ├─> Swarm reinicia Container 1
  └─> Después de pasar health check, vuelve a recibir tráfico
```

### Disaster Recovery
```
Si todo el servidor se cae:
  |
  ├─> Restaurar servidor
  ├─> docker swarm init
  ├─> docker network create traefik-public
  ├─> docker stack deploy traefik
  └─> docker stack deploy pideai
      |
      └─> Sistema restaurado en ~5 minutos
```

## Seguridad

### Capas de Seguridad

1. **Network Level**
   - Firewall (solo 80, 443, 9443 abiertos)
   - Network overlay aislada (traefik-public)

2. **Traefik Level**
   - HTTPS obligatorio (HTTP -> HTTPS redirect)
   - Security headers (HSTS, CSP, etc.)
   - Rate limiting (opcional)

3. **Application Level**
   - Content Security Policy
   - XSS Protection headers
   - CORS configurado
   - Supabase RLS policies

4. **Container Level**
   - Non-root user (nginx user)
   - Read-only filesystem (excepto /tmp)
   - Resource limits (CPU, RAM)
   - Minimal attack surface (Alpine Linux)

## Monitoreo y Logging

### Logs Centralizados
```
Container Logs
  |
  ├─> Docker JSON File Driver
  ├─> Max 10MB per file
  ├─> Max 3 files (rotation)
  └─> Accessible via:
      - docker service logs
      - Portainer UI
```

### Métricas
```
Docker Stats
  |
  ├─> CPU Usage
  ├─> Memory Usage
  ├─> Network I/O
  └─> Disk I/O

Health Checks
  |
  ├─> HTTP GET /health
  ├─> Interval: 30s
  ├─> Timeout: 5s
  └─> Retries: 3
```

## Escalabilidad

### Horizontal Scaling
```bash
# Escalar a 5 replicas
docker service scale pideai_app=5

# Traefik automáticamente balancea entre 5 containers
```

### Vertical Scaling
```yaml
resources:
  limits:
    cpus: '1.0'      # Aumentar de 0.5 a 1.0
    memory: 1024M    # Aumentar de 512M a 1024M
```

### Multi-node Cluster
```bash
# En nodo manager
docker swarm init

# En nodos workers
docker swarm join --token SWMTKN-xxx manager-ip:2377

# Deploy distribuido
docker service update --constraint-add "node.role==worker" pideai_app
```

## Performance Optimization

### Nginx Caching
```nginx
# Assets con hash - cache agresivo
location ~* \.(js|css|png|jpg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# index.html - no cache
location / {
    add_header Cache-Control "no-cache, no-store";
}
```

### Traefik Compression
```yaml
labels:
  - "traefik.http.middlewares.compression.compress=true"
```

### Resource Limits
```yaml
resources:
  limits:
    cpus: '0.5'
    memory: 512M
  reservations:
    cpus: '0.25'
    memory: 256M
```

## Costo de Infraestructura

### Single Server Setup (Recomendado para empezar)
```
Servidor VPS (ej: DigitalOcean, Vultr, Hetzner)
- 4 vCPU
- 8GB RAM
- 160GB SSD
- Costo: ~$40-60/mes

+ DNS con wildcard support
  - Cloudflare (Free)
  - O tu proveedor actual

+ Container Registry
  - GitHub Container Registry (Free)
  - O Docker Hub (Free para público)

Total: ~$40-60/mes
```

### Multi-node Setup (Alta disponibilidad)
```
3 Servers (1 manager, 2 workers)
- 2 vCPU cada uno
- 4GB RAM cada uno
- 80GB SSD cada uno
- Costo: ~$30/mes × 3 = $90/mes

+ Load Balancer (DigitalOcean)
  - Costo: ~$12/mes

Total: ~$102/mes
```

## Referencias

- [Dockerfile.production](./Dockerfile.production) - Multi-stage build optimizado
- [docker-compose.swarm.yml](./docker-compose.swarm.yml) - Stack configuration
- [nginx.conf](./nginx.conf) - Nginx configuration para SPA
- [TRAEFIK_CONFIG.md](./TRAEFIK_CONFIG.md) - Configuración de Traefik
- [PORTAINER_DEPLOYMENT.md](./PORTAINER_DEPLOYMENT.md) - Guía de deployment
- [deploy-swarm.sh](./deploy-swarm.sh) - Script helper para deployment
