# 📋 Resumen de Configuración para Deployment

## ✨ Cambios Realizados

### 1. Docker Compose para Swarm (ACTUALIZADO)
**Archivo**: `docker-compose.swarm.yml`

**Cambios principales**:
- ✅ **Regex de Traefik corregido** para multitenancy
  - Antes: `HostRegexp(\`^[a-z0-9-]+\\.pideai\\.com$$\`)`
  - Ahora: `HostRegexp(\`{subdomain:[a-z0-9-]+}.pideai.com\`)`

- ✅ **Soporte para dos dominios** (pideai.com + artex.lat)
  - Routing para ambos dominios
  - Wildcard SSL para ambos

- ✅ **Eliminados secrets** (incompatibles con Vite build-time vars)
  - Las variables deben estar en la imagen buildeada

- ✅ **Optimización de replicas y recursos**
  - 3 replicas por defecto
  - Rolling updates con zero downtime
  - Health checks configurados

### 2. Dockerfile (YA EXISTENTE - SIN CAMBIOS)
**Archivo**: `Dockerfile.production`

**Estado**: ✅ CORRECTO - No requiere cambios

**Características**:
- Multi-stage build optimizado
- Build args para variables de Vite
- Nginx optimizado para SPA
- Health check endpoint configurado
- Compresión gzip
- Security headers

### 3. Nginx Config (YA EXISTENTE - SIN CAMBIOS)
**Archivo**: `nginx.conf`

**Estado**: ✅ CORRECTO - No requiere cambios

**Características**:
- SPA routing (try_files)
- Caching de assets
- Health check endpoint
- Compresión gzip
- Security headers

### 4. Código de Subdomain Validation (YA EXISTENTE - CORRECTO)
**Archivo**: `src/lib/subdomain-validation.ts`

**Estado**: ✅ CORRECTO - Ya soporta ambos dominios

**Características**:
- Extracción de subdomain del hostname
- Soporte para pideai.com y artex.lat
- Validación de formato
- Detección de dominio principal vs subdomain

## 📁 Nuevos Archivos de Documentación

### 1. DEPLOYMENT_README.md
**Propósito**: Punto de entrada principal para deployment

**Contenido**:
- Resumen ejecutivo
- Quick start guide
- Links a documentación detallada
- Troubleshooting básico
- Checklist

### 2. PORTAINER_DEPLOYMENT.md
**Propósito**: Guía paso a paso para Portainer

**Contenido**:
- Pre-requisitos detallados
- Configuración DNS
- Build de imagen
- Deployment en Portainer
- Verificación
- Operaciones comunes
- Troubleshooting

### 3. TRAEFIK_CONFIG.md
**Propósito**: Configuración de Traefik v2

**Contenido**:
- DNS-01 challenge para wildcard SSL
- HTTP-01 challenge alternativo
- Configuración por proveedor DNS
- Traefik stack para Swarm
- Testing y verificación

### 4. ARCHITECTURE.md
**Propósito**: Diagrama de arquitectura

**Contenido**:
- Diagrama visual del sistema
- Flujo de request multi-tenant
- Componentes del sistema
- High availability
- Seguridad
- Escalabilidad
- Costos

### 5. DOCKER_COMMANDS.md
**Propósito**: Referencia rápida de comandos

**Contenido**:
- Comandos de Swarm
- Comandos de Stack
- Comandos de Service
- Debugging
- Troubleshooting
- Scripts útiles

### 6. deploy-swarm.sh
**Propósito**: Script helper para deployment

**Contenido**:
- Build de imagen con variables
- Push a registry
- Deploy del stack
- Update de servicio
- Ver logs
- Ver status
- Remove stack

## 🔑 Puntos Críticos para Multitenancy

### 1. DNS Configuration ⚠️
**CRÍTICO**: Debes configurar wildcard DNS records:

```
A     *.pideai.com    -> IP_SERVIDOR
A     *.artex.lat     -> IP_SERVIDOR
A     pideai.com      -> IP_SERVIDOR
A     artex.lat       -> IP_SERVIDOR
```

**Verificar**:
```bash
dig tienda1.pideai.com +short
dig test.artex.lat +short
# Ambos deben resolver a la IP del servidor
```

### 2. Traefik Labels ⚠️
**CRÍTICO**: Los labels de Traefik deben capturar subdominios correctamente:

```yaml
# ✅ CORRECTO (nuevo)
- "traefik.http.routers.pideai-https.rule=Host(`pideai.com`) || HostRegexp(`{subdomain:[a-z0-9-]+}.pideai.com`)"

# ❌ INCORRECTO (anterior)
- "traefik.http.routers.pideai-https.rule=Host(`pideai.com`) || HostRegexp(`^[a-z0-9-]+\\.pideai\\.com$$`)"
```

### 3. SSL Certificates ⚠️
**Tienes 2 opciones**:

#### Opción A: Wildcard Certificate (RECOMENDADO)
```yaml
# Requiere DNS-01 challenge en Traefik
certificatesResolvers:
  letsencrypt:
    acme:
      dnsChallenge:
        provider: cloudflare  # O tu proveedor
```

**Ventajas**:
- 1 certificado para todos los subdominios
- Sin límites de rate limiting

**Desventajas**:
- Requiere configurar API keys del proveedor DNS

#### Opción B: Certificado por Subdomain
```yaml
# HTTP-01 challenge (más simple)
certificatesResolvers:
  letsencrypt:
    acme:
      httpChallenge:
        entryPoint: web
```

**Ventajas**:
- Más simple de configurar
- No requiere API keys

**Desventajas**:
- 1 certificado por subdomain
- Límite de 50 certs/semana por dominio

### 4. Build de Imagen con Variables ⚠️
**CRÍTICO**: Las variables de Vite deben estar en BUILD TIME:

```bash
# ✅ CORRECTO - Variables en build
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID=xxx \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=xxx \
  --build-arg VITE_SUPABASE_URL=xxx \
  -f Dockerfile.production \
  -t ghcr.io/hectorcanaimero/menu-maestro-saas:latest \
  .

# ❌ INCORRECTO - Variables en runtime (no funciona)
docker service create \
  -e VITE_SUPABASE_URL=xxx \
  ghcr.io/hectorcanaimero/menu-maestro-saas:latest
```

**Razón**: Vite embebe las variables en el código JS durante el build.

## 🚀 Flujo de Deployment Completo

### Paso 1: Preparar Servidor
```bash
# Inicializar Swarm
docker swarm init

# Crear network
docker network create --driver=overlay traefik-public

# Deploy Traefik (ver TRAEFIK_CONFIG.md)
docker stack deploy -c traefik-stack.yml traefik
```

### Paso 2: Configurar DNS
En tu proveedor (Cloudflare, Route53, etc.):
- `*.pideai.com` → IP_SERVIDOR
- `*.artex.lat` → IP_SERVIDOR
- `pideai.com` → IP_SERVIDOR
- `artex.lat` → IP_SERVIDOR

### Paso 3: Build de Imagen
```bash
# Opción A: Local build
export VITE_SUPABASE_PUBLISHABLE_KEY=tu_key
./deploy-swarm.sh build

# Opción B: GitHub Actions (automático al crear tag)
git tag v3.0.3
git push origin v3.0.3
```

### Paso 4: Deploy
```bash
# Opción A: Via script
./deploy-swarm.sh deploy

# Opción B: Via Portainer
# Stacks → Add Stack → Pegar docker-compose.swarm.yml → Deploy

# Opción C: Via Docker CLI
docker stack deploy -c docker-compose.swarm.yml pideai
```

### Paso 5: Verificar
```bash
# Estado del stack
docker stack ps pideai

# Logs
docker service logs pideai_app -f

# Test endpoints
curl -I https://pideai.com
curl -I https://tienda1.pideai.com
curl -I https://test.artex.lat
```

## ✅ Checklist Pre-Deployment

### Infraestructura
- [ ] Servidor con Docker 20.10+
- [ ] Docker Swarm inicializado
- [ ] Network `traefik-public` creada
- [ ] Traefik v2 deployado y corriendo
- [ ] Puertos 80, 443 abiertos en firewall

### DNS
- [ ] Wildcard A record: `*.pideai.com`
- [ ] Wildcard A record: `*.artex.lat`
- [ ] A record: `pideai.com`
- [ ] A record: `artex.lat`
- [ ] DNS propagado (verificar con dig)

### Imagen Docker
- [ ] Variables de entorno configuradas
- [ ] Imagen buildeada correctamente
- [ ] Imagen pusheada al registry
- [ ] Image tag correcto en docker-compose.swarm.yml

### Configuración
- [ ] docker-compose.swarm.yml revisado
- [ ] Dominio correcto en labels de Traefik
- [ ] Resource limits ajustados
- [ ] Replicas configuradas (default: 3)

## 🔍 Verificación Post-Deployment

### 1. Verificar Servicios
```bash
✅ docker service ls
# Debe mostrar pideai_app con 3/3 replicas

✅ docker stack ps pideai
# Todos los tasks deben estar "Running"
```

### 2. Verificar HTTPS
```bash
✅ curl -I https://pideai.com
# HTTP/2 200

✅ curl -I https://www.pideai.com
# HTTP/2 200

✅ curl -I https://tienda1.pideai.com
# HTTP/2 200

✅ curl -I https://test.artex.lat
# HTTP/2 200
```

### 3. Verificar Redirect HTTP → HTTPS
```bash
✅ curl -I http://pideai.com
# HTTP/1.1 301 Moved Permanently
# Location: https://pideai.com
```

### 4. Verificar Security Headers
```bash
✅ curl -I https://pideai.com | grep -i strict
# strict-transport-security: max-age=31536000
```

### 5. Verificar Health Check
```bash
✅ curl https://pideai.com/health
# OK
```

### 6. Verificar Load Balancing
```bash
# Request a diferentes replicas
for i in {1..10}; do
  curl -I https://pideai.com 2>&1 | grep -i "x-served-by" || echo "Request $i OK"
done
```

### 7. Verificar Logs
```bash
✅ docker service logs pideai_app --tail 50
# No debe haber errores
```

## 🐛 Troubleshooting Rápido

### Problema: Servicio no inicia
```bash
docker service ps pideai_app --no-trunc
docker service logs pideai_app --tail 100
```

### Problema: No puedo acceder via HTTPS
```bash
dig pideai.com +short
docker service logs traefik_traefik -f
```

### Problema: Subdomain no funciona
```bash
dig random.pideai.com +short  # Debe resolver
docker service inspect pideai_app | jq '.[0].Spec.Labels'
```

### Problema: Certificado SSL no se genera
```bash
docker service logs traefik_traefik -f | grep acme
cat /opt/traefik/letsencrypt/acme.json | jq .
```

## 📚 Documentación Completa

Para información detallada, consulta:

1. **[DEPLOYMENT_README.md](./DEPLOYMENT_README.md)** - Punto de entrada principal
2. **[PORTAINER_DEPLOYMENT.md](./PORTAINER_DEPLOYMENT.md)** - Guía paso a paso para Portainer
3. **[TRAEFIK_CONFIG.md](./TRAEFIK_CONFIG.md)** - Configuración de Traefik
4. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Diagrama de arquitectura
5. **[DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)** - Referencia de comandos

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `docker service logs pideai_app -f`
2. Consulta [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md#troubleshooting-common-issues)
3. Verifica el [checklist](#-checklist-pre-deployment)
4. Abre un issue en GitHub

## 🎯 Próximos Pasos

Después del deployment exitoso:

1. [ ] Configurar backups automáticos
2. [ ] Configurar monitoring (Prometheus + Grafana)
3. [ ] Configurar alertas
4. [ ] Configurar rate limiting en Traefik
5. [ ] Optimizar caché de Nginx
6. [ ] Configurar CDN (CloudFlare, CloudFront)
7. [ ] Implementar CI/CD completo

---

**¿Todo listo?** Comienza con [DEPLOYMENT_README.md](./DEPLOYMENT_README.md)
