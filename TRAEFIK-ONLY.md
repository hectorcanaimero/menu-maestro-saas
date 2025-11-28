# Traefik-Only Deployment (Sin nginx)

Esta guía muestra cómo hacer deployment **solo con Traefik**, sin usar nginx como servidor intermedio.

## 🆚 Comparación: Traefik-Only vs Traefik + nginx

### Opción 1: Solo Traefik (Recomendado para simplicidad)

```
Internet → Traefik → Node 'serve' → Static Files
```

**Ventajas:**
- ✅ Más simple (una capa menos)
- ✅ Menos memoria (~100MB vs ~150MB)
- ✅ Configuración más fácil
- ✅ Traefik maneja SSL, headers, compresión
- ✅ Ideal para multi-tenant (Traefik ya hace routing)

**Desventajas:**
- ⚠️ 'serve' no es tan optimizado como nginx para archivos estáticos
- ⚠️ Menor rendimiento en alta concurrencia (>1000 req/s)

### Opción 2: Traefik + nginx (Actual)

```
Internet → Traefik → nginx → Static Files
```

**Ventajas:**
- ✅ nginx es MUY rápido sirviendo archivos estáticos
- ✅ Mejor rendimiento en alta concurrencia
- ✅ Configuración avanzada (rate limiting, caching, etc.)
- ✅ Producción probada en millones de sitios

**Desventajas:**
- ⚠️ Una capa adicional
- ⚠️ Más memoria
- ⚠️ Configuración más compleja

## 📊 ¿Cuál elegir?

| Criterio | Solo Traefik | Traefik + nginx |
|----------|--------------|-----------------|
| **Simplicidad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Rendimiento** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Memoria** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Producción** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Multi-tenant** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

**Recomendación:**
- **Hasta 10,000 usuarios**: Solo Traefik es suficiente
- **Más de 10,000 usuarios**: Traefik + nginx para mejor rendimiento

## 🚀 Deployment con Solo Traefik

### 1. Usar el Dockerfile.traefik

```bash
# Build local
docker build -f Dockerfile.traefik -t pideai-traefik .

# Run local
docker run -p 3000:3000 pideai-traefik
```

### 2. Deploy en Docker Swarm

```bash
# Usar docker-compose.traefik.yml
docker stack deploy -c docker-compose.traefik.yml pideai
```

### 3. Características de Traefik

**Traefik ya incluye:**
- ✅ SSL/TLS con Let's Encrypt
- ✅ Compresión gzip/brotli
- ✅ Security headers
- ✅ Rate limiting (configurable)
- ✅ Access logs
- ✅ Metrics (Prometheus)
- ✅ Health checks
- ✅ Retry automático
- ✅ Circuit breaker

## 🔧 Configuración de Traefik Middlewares

### Security Headers (Reemplaza nginx headers)

```yaml
labels:
  - "traefik.http.middlewares.security.headers.customFrameOptionsValue=SAMEORIGIN"
  - "traefik.http.middlewares.security.headers.contentTypeNosniff=true"
  - "traefik.http.middlewares.security.headers.browserXssFilter=true"
  - "traefik.http.middlewares.security.headers.forceSTSHeader=true"
  - "traefik.http.middlewares.security.headers.stsSeconds=31536000"
```

### Compression (Reemplaza nginx gzip)

```yaml
labels:
  - "traefik.http.middlewares.compress.compress=true"
```

### Rate Limiting (Opcional)

```yaml
labels:
  # 100 requests per second per IP
  - "traefik.http.middlewares.ratelimit.ratelimit.average=100"
  - "traefik.http.middlewares.ratelimit.ratelimit.burst=50"
```

### Caching (Opcional - Headers)

```yaml
labels:
  # Cache static assets for 1 year
  - "traefik.http.middlewares.cache.headers.customResponseHeaders.Cache-Control=public, max-age=31536000"
```

## 📝 Modificar CI/CD para Traefik-Only

### Opción A: Cambiar Dockerfile principal

```yaml
# .github/workflows/docker-publish.yml
- name: Build and push Docker image
  uses: docker/build-push-action@v5
  with:
    context: .
    file: ./Dockerfile.traefik  # Usar Dockerfile.traefik en lugar de Dockerfile
```

### Opción B: Crear workflow separado

```yaml
# .github/workflows/docker-publish-traefik.yml
name: Docker Build Traefik-Only

on:
  push:
    tags:
      - 'traefik-v*.*.*'

# ... mismo workflow pero con Dockerfile.traefik
```

## 🧪 Testing Local

### Con docker-compose

```bash
# Start Traefik + App
docker-compose -f docker-compose.traefik.yml up

# Test
curl http://localhost:3000
```

### Con Traefik local completo

```yaml
# docker-compose.test.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - "--api.insecure=true"
      - "--providers.docker=true"
      - "--entrypoints.web.address=:80"
    ports:
      - "80:80"
      - "8080:8080"  # Traefik dashboard
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock

  app:
    build:
      context: .
      dockerfile: Dockerfile.traefik
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.app.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.localhost`) || Host(`localhost`)"
      - "traefik.http.services.app.loadbalancer.server.port=3000"
```

```bash
docker-compose -f docker-compose.test.yml up

# Test subdomains
curl -H "Host: tienda1.localhost" http://localhost
curl -H "Host: tienda2.localhost" http://localhost

# Traefik dashboard
open http://localhost:8080
```

## 🔄 Migrar de nginx a Traefik-Only

Si ya tienes nginx en producción:

### 1. Build nueva imagen

```bash
docker build -f Dockerfile.traefik -t ghcr.io/user/app:traefik .
docker push ghcr.io/user/app:traefik
```

### 2. Update docker-compose

```bash
# Cambiar image en docker-compose.prod.yml
image: ghcr.io/user/app:traefik

# Cambiar puerto
- "traefik.http.services.pideai.loadbalancer.server.port=3000"
```

### 3. Rolling update

```bash
docker service update --image ghcr.io/user/app:traefik pideai_pideai-app
```

## 📊 Monitoreo

### Traefik Access Logs

```yaml
# traefik.yml
accessLog:
  filePath: "/var/log/traefik/access.log"
  format: json
  fields:
    defaultMode: keep
    headers:
      defaultMode: keep
```

### Traefik Metrics (Prometheus)

```yaml
# traefik.yml
metrics:
  prometheus:
    buckets:
      - 0.1
      - 0.3
      - 1.2
      - 5.0
```

### Application Logs

```bash
# Ver logs del container
docker service logs -f pideai_pideai-app

# Filtrar por subdomain
docker service logs pideai_pideai-app | grep "tienda1"
```

## 🎯 Performance Tips con Traefik

### 1. Enable HTTP/2

```yaml
# traefik.yml (estático)
entryPoints:
  websecure:
    address: ":443"
    http2:
      maxConcurrentStreams: 250
```

### 2. Connection Timeouts

```yaml
labels:
  - "traefik.http.services.pideai.loadbalancer.responseForwarding.flushInterval=100ms"
  - "traefik.http.services.pideai.loadbalancer.passhostheader=true"
```

### 3. Buffering

```yaml
# traefik.yml
serversTransport:
  maxIdleConnsPerHost: 200
```

## 🔐 Security Best Practices

### 1. IP Allowlist (Opcional)

```yaml
labels:
  # Solo permitir IPs específicas
  - "traefik.http.middlewares.ipwhitelist.ipwhitelist.sourcerange=127.0.0.1/32,192.168.1.0/24"
  - "traefik.http.routers.pideai-https.middlewares=ipwhitelist"
```

### 2. Basic Auth para Admin (Opcional)

```yaml
labels:
  # Proteger /admin con basic auth
  - "traefik.http.middlewares.admin-auth.basicauth.users=admin:$$apr1$$xyz..."
  - "traefik.http.routers.pideai-admin.rule=Host(`pideai.com`) && PathPrefix(`/admin`)"
  - "traefik.http.routers.pideai-admin.middlewares=admin-auth"
```

### 3. CORS Headers

```yaml
labels:
  - "traefik.http.middlewares.cors.headers.accesscontrolallowmethods=GET,OPTIONS,PUT,POST,DELETE"
  - "traefik.http.middlewares.cors.headers.accesscontrolalloworiginlist=https://pideai.com"
  - "traefik.http.middlewares.cors.headers.accesscontrolmaxage=100"
  - "traefik.http.middlewares.cors.headers.addvaryheader=true"
```

## 🆘 Troubleshooting

### Issue: 404 en rutas SPA

**Problema:** `/products/123` devuelve 404

**Solución:** `serve` con flag `-s` (ya incluido en Dockerfile.traefik)

```bash
# Verificar que el comando sea:
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Issue: Headers de seguridad no aparecen

**Problema:** Headers no se aplican

**Solución:** Verificar middleware chain

```yaml
# Debe estar en la cadena
- "traefik.http.routers.pideai-https.middlewares=security-headers,compress,forward-headers"
```

### Issue: Subdomains no funcionan

**Problema:** Solo funciona dominio principal

**Solución:** Verificar HostRegexp

```yaml
# Correcto
- "traefik.http.routers.pideai-https.rule=HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`) || Host(`pideai.com`)"

# Incorrecto
- "traefik.http.routers.pideai-https.rule=Host(`pideai.com`)"
```

## 📦 Recursos Adicionales

- **Traefik Docs**: https://doc.traefik.io/traefik/
- **Middlewares**: https://doc.traefik.io/traefik/middlewares/overview/
- **Docker Provider**: https://doc.traefik.io/traefik/providers/docker/
- **Let's Encrypt**: https://doc.traefik.io/traefik/https/acme/

## 🎯 Conclusión

**Usa Solo Traefik si:**
- ✅ Quieres simplicidad
- ✅ Tienes menos de 10,000 usuarios activos
- ✅ Quieres reducir memoria/costos
- ✅ Multi-tenant es tu prioridad

**Usa Traefik + nginx si:**
- ✅ Necesitas máximo rendimiento
- ✅ Tienes alta concurrencia (>1000 req/s)
- ✅ Requieres configuración avanzada de caching
- ✅ Ya tienes experiencia con nginx

Ambas opciones funcionan perfectamente para subdominios dinámicos. La elección depende de tus necesidades específicas.
