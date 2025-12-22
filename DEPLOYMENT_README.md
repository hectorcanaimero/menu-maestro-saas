# 🚀 Menu Maestro - Deployment Guide

Documentación completa para deployar Menu Maestro en producción con Docker Swarm, Traefik v2 y Portainer.

## 📋 Tabla de Contenidos

1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Arquitectura](#arquitectura)
3. [Pre-requisitos](#pre-requisitos)
4. [Quick Start](#quick-start)
5. [Documentación Detallada](#documentación-detallada)
6. [Troubleshooting](#troubleshooting)

## 🎯 Resumen Ejecutivo

Menu Maestro es una plataforma multi-tenant de pedidos en línea que soporta múltiples restaurantes con subdominios independientes:

- **Multi-tenant**: Cada tienda tiene su propio subdominio (ej: `tienda1.pideai.com`, `cafe.artex.lat`)
- **Alta disponibilidad**: 3 replicas con load balancing automático
- **Zero downtime**: Rolling updates sin interrupciones
- **SSL automático**: Certificados Let's Encrypt vía Traefik
- **Escalable**: Fácil de escalar horizontal y verticalmente

### URLs de Ejemplo

- Main domain: `https://pideai.com` (landing page)
- Platform admin: `https://www.pideai.com` (admin platform)
- Store 1: `https://tienda1.pideai.com`
- Store 2: `https://restaurante-abc.artex.lat`

## 🏗️ Arquitectura

```
Internet → DNS Wildcard → Traefik (SSL/Load Balancer)
  → Docker Swarm (3 replicas) → Nginx + React SPA → Supabase
```

**Stack de tecnología:**
- **Frontend**: React + TypeScript + Vite
- **Web Server**: Nginx (Alpine)
- **Orchestration**: Docker Swarm
- **Reverse Proxy**: Traefik v2
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Management**: Portainer

Ver diagrama completo: [ARCHITECTURE.md](./ARCHITECTURE.md)

## ✅ Pre-requisitos

### Servidor
- [x] VPS con Docker instalado (Ubuntu 22.04 recomendado)
- [x] Mínimo: 4 vCPU, 8GB RAM, 160GB SSD
- [x] Puertos abiertos: 80, 443, 9443 (Portainer)

### DNS
- [x] Dominio configurado con wildcard A records:
  - `*.pideai.com` → IP_SERVIDOR
  - `*.artex.lat` → IP_SERVIDOR
  - `pideai.com` → IP_SERVIDOR
  - `artex.lat` → IP_SERVIDOR

### Software
- [x] Docker 20.10+
- [x] Docker Compose v2
- [x] Portainer (opcional pero recomendado)
- [x] Traefik v2 con Let's Encrypt configurado

## 🚀 Quick Start

### Paso 1: Preparar el Servidor

```bash
# Inicializar Docker Swarm
docker swarm init

# Crear network para Traefik
docker network create --driver=overlay traefik-public

# Verificar
docker network ls | grep traefik-public
```

### Paso 2: Build de la Imagen

```bash
# Clonar el repositorio
git clone https://github.com/hectorcanaimero/menu-maestro-saas.git
cd menu-maestro-saas

# Configurar variables de entorno
export VITE_SUPABASE_PROJECT_ID=wdpexjymbiyjqwdttqhz
export VITE_SUPABASE_URL=https://wdpexjymbiyjqwdttqhz.supabase.co
export VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_key
export VITE_POSTHOG_KEY=your_posthog_key
export VITE_POSTHOG_HOST=https://us.i.posthog.com

# Build usando el helper script
chmod +x deploy-swarm.sh
./deploy-swarm.sh build
```

**Alternativa**: Usar GitHub Actions para build automático al crear una tag:
```bash
git tag v3.0.3
git push origin v3.0.3
# GitHub Actions hará el build y push automáticamente
```

### Paso 3: Deploy en Portainer

1. Accede a Portainer: `https://tu-servidor:9443`
2. Ve a **Stacks** → **Add Stack**
3. Nombre: `pideai`
4. Pega el contenido de [docker-compose.swarm.yml](./docker-compose.swarm.yml)
5. Click **Deploy the stack**

**Alternativa CLI**:
```bash
./deploy-swarm.sh deploy
```

### Paso 4: Verificar Deployment

```bash
# Ver estado del stack
docker stack ps pideai

# Ver logs
docker service logs pideai_app -f --tail 100

# Test endpoints
curl -I https://pideai.com
curl -I https://tienda1.pideai.com
```

**Desde el browser**:
- https://pideai.com (debe cargar)
- https://tienda1.pideai.com (debe cargar)
- https://test.artex.lat (debe cargar)

## 📚 Documentación Detallada

### Configuración y Setup
- **[PORTAINER_DEPLOYMENT.md](./PORTAINER_DEPLOYMENT.md)** - Guía paso a paso para deployar en Portainer
- **[TRAEFIK_CONFIG.md](./TRAEFIK_CONFIG.md)** - Configuración de Traefik con wildcard SSL
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Diagrama de arquitectura y flujo de datos

### Archivos de Configuración
- **[Dockerfile.production](./Dockerfile.production)** - Multi-stage build optimizado
- **[docker-compose.swarm.yml](./docker-compose.swarm.yml)** - Stack configuration para Swarm
- **[nginx.conf](./nginx.conf)** - Configuración de Nginx para SPA
- **[deploy-swarm.sh](./deploy-swarm.sh)** - Script helper para deployment

### Referencia
- **[DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md)** - Comandos útiles de Docker Swarm

## 🔧 Operaciones Comunes

### Actualizar a Nueva Versión

```bash
# Opción 1: Via script helper
./deploy-swarm.sh update

# Opción 2: Via Docker CLI
docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.3 pideai_app

# Opción 3: Via Portainer
# Stacks → pideai → Editor → Cambiar tag → Update
```

### Escalar Replicas

```bash
# Via CLI
docker service scale pideai_app=5

# Via Portainer
# Services → pideai_app → Scale → 5 replicas
```

### Ver Logs en Tiempo Real

```bash
# Todos los logs del servicio
docker service logs pideai_app -f --tail 100

# Logs de un container específico
docker logs container_id -f
```

### Rollback a Versión Anterior

```bash
# Via CLI
docker service rollback pideai_app

# Via Portainer
# Services → pideai_app → Rollback
```

## 🐛 Troubleshooting

### Problema: Servicio no inicia

**Diagnóstico:**
```bash
# Ver estado
docker service ps pideai_app --no-trunc

# Ver logs
docker service logs pideai_app --tail 100

# Inspeccionar servicio
docker service inspect pideai_app --pretty
```

**Soluciones comunes:**
1. Verificar que la imagen existe: `docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:latest`
2. Verificar que la network existe: `docker network ls | grep traefik-public`
3. Verificar recursos del servidor: `docker stats`

### Problema: No puedo acceder via HTTPS

**Diagnóstico:**
```bash
# Test desde el servidor
curl -I https://pideai.com

# Verificar DNS
dig pideai.com +short
dig tienda1.pideai.com +short

# Ver logs de Traefik
docker service logs traefik_traefik -f
```

**Soluciones comunes:**
1. Verificar DNS propagado (puede tomar hasta 48h)
2. Verificar Traefik corriendo: `docker service ls | grep traefik`
3. Verificar certificados: `cat /opt/traefik/letsencrypt/acme.json | jq .`
4. Verificar firewall permite puertos 80 y 443

### Problema: Subdominio no funciona

**Diagnóstico:**
```bash
# Verificar DNS wildcard
dig random-subdomain.pideai.com +short

# Test con curl
curl -H "Host: test.pideai.com" http://localhost

# Ver labels de Traefik
docker service inspect pideai_app | jq '.[0].Spec.Labels'
```

**Soluciones comunes:**
1. Verificar wildcard DNS configurado: `*.pideai.com`
2. Verificar regex de Traefik en labels
3. Ver dashboard de Traefik para routing

### Problema: Containers reiniciándose

**Diagnóstico:**
```bash
# Ver por qué están reiniciando
docker service ps pideai_app --no-trunc

# Ver health check logs
docker inspect container_id | jq '.[0].State.Health'

# Test health check manualmente
docker exec -it container_id curl http://localhost/health
```

**Soluciones comunes:**
1. Verificar `/health` endpoint responde
2. Aumentar recursos: CPU/RAM
3. Ver logs para errores: `docker logs container_id`

Ver más en: [DOCKER_COMMANDS.md](./DOCKER_COMMANDS.md#troubleshooting-common-issues)

## 📊 Monitoreo

### Métricas Básicas

```bash
# Ver estado de servicios
docker service ls

# Ver uso de recursos
docker stats

# Ver tasks del stack
docker stack ps pideai

# Ver eventos en tiempo real
docker events --filter 'type=service'
```

### Health Checks

El servicio tiene health checks automáticos:
- **Endpoint**: `/health`
- **Interval**: 30s
- **Timeout**: 5s
- **Retries**: 3

```bash
# Verificar health status
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.ContainerSpec.Healthcheck'
```

## 🔒 Seguridad

### Configurado automáticamente:
- ✅ HTTPS obligatorio (HTTP → HTTPS redirect)
- ✅ HSTS headers (Strict-Transport-Security)
- ✅ CSP headers (Content-Security-Policy)
- ✅ XSS Protection
- ✅ Clickjacking protection
- ✅ MIME sniffing protection
- ✅ Certificados SSL automáticos (Let's Encrypt)

### Recomendaciones adicionales:
- [ ] Configurar firewall (UFW): solo puertos 80, 443, 22, 9443
- [ ] Cambiar puerto SSH del default (22)
- [ ] Configurar fail2ban
- [ ] Habilitar rate limiting en Traefik
- [ ] Configurar backups automáticos
- [ ] Monitoreo con Prometheus/Grafana

## 📈 Escalabilidad

### Horizontal Scaling (Más Replicas)
```bash
# Escalar a 5 replicas
docker service scale pideai_app=5

# Escalar a 10 replicas
docker service scale pideai_app=10
```

### Vertical Scaling (Más Recursos)
Editar `docker-compose.swarm.yml`:
```yaml
resources:
  limits:
    cpus: '1.0'      # De 0.5 a 1.0
    memory: 1024M    # De 512M a 1024M
```

### Multi-Node Cluster
```bash
# En nodo manager
docker swarm init

# En nodos workers
docker swarm join --token SWMTKN-xxx manager-ip:2377

# Verificar cluster
docker node ls
```

## 💰 Costos Estimados

### Single Server (Inicio)
- VPS (4 vCPU, 8GB RAM): **$40-60/mes**
- DNS (Cloudflare): **Gratis**
- Container Registry (GHCR): **Gratis**
- **Total: ~$40-60/mes**

### Multi-Node (Producción)
- 3 VPS (2 vCPU, 4GB RAM cada uno): **$90/mes**
- Load Balancer: **$12/mes**
- **Total: ~$102/mes**

## 🔄 CI/CD con GitHub Actions

El proyecto incluye workflow automático:

```bash
# Crear nueva versión
git tag v3.0.3
git push origin v3.0.3

# GitHub Actions automáticamente:
# 1. Build de la imagen
# 2. Push a ghcr.io
# 3. Tag como :latest y :v3.0.3
```

Ver: [.github/workflows/docker-publish.yml](.github/workflows/docker-publish.yml)

## 📞 Soporte

- **Documentación**: Revisa los archivos `.md` en este directorio
- **Issues**: https://github.com/hectorcanaimero/menu-maestro-saas/issues
- **Logs**: `docker service logs pideai_app -f`

## 📝 Checklist de Deployment

- [ ] Servidor con Docker instalado
- [ ] Docker Swarm inicializado
- [ ] Network `traefik-public` creada
- [ ] DNS configurado (wildcards)
- [ ] Traefik corriendo
- [ ] Variables de entorno configuradas
- [ ] Imagen buildeada y en registry
- [ ] Stack deployado
- [ ] Health checks pasando
- [ ] HTTPS funcionando
- [ ] Subdominios funcionando
- [ ] Logs monitoreándose
- [ ] Backup configurado

## 🎓 Recursos Adicionales

### Docker Swarm
- [Docker Swarm Docs](https://docs.docker.com/engine/swarm/)
- [Best Practices](https://docs.docker.com/engine/swarm/swarm-tutorial/)

### Traefik v2
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [Let's Encrypt](https://doc.traefik.io/traefik/https/acme/)

### Nginx
- [Nginx Docs](https://nginx.org/en/docs/)
- [SPA Configuration](https://www.nginx.com/blog/deploying-nginx-nginx-plus-docker/)

---

**¿Listo para deployar?** Empieza con [PORTAINER_DEPLOYMENT.md](./PORTAINER_DEPLOYMENT.md)
