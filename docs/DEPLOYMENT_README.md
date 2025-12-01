# Menu Maestro - Deployment con Docker Swarm + Traefik

Este directorio contiene toda la configuraci\u00f3n necesaria para deployar Menu Maestro en producci\u00f3n usando Docker Swarm con Traefik como reverse proxy.

## Estructura de Archivos

```
.
\u251c\u2500\u2500 Dockerfile.production              # Multi-stage build optimizado con Nginx
\u251c\u2500\u2500 nginx.conf                         # Configuraci\u00f3n de Nginx para SPA
\u251c\u2500\u2500 docker-compose.swarm.yml          # Stack completo para Docker Swarm
\u251c\u2500\u2500 .dockerignore                     # Archivos a ignorar en build
\u251c\u2500\u2500 .env.production                   # Variables de entorno (crear desde .env.production.example)
\u251c\u2500\u2500
\u251c\u2500\u2500 scripts/
\u2502   \u251c\u2500\u2500 build-docker-image.sh        # Script de build automatizado
\u2502   \u251c\u2500\u2500 setup-swarm-secrets.sh       # Script para crear secrets
\u2502   \u2514\u2500\u2500 deploy-to-swarm.sh           # Script de deployment
\u251c\u2500\u2500
\u2514\u2500\u2500 docs/
    \u251c\u2500\u2500 PORTAINER_DEPLOYMENT.md      # Gu\u00eda completa de deployment
    \u251c\u2500\u2500 TRAEFIK_SETUP.md             # Configuraci\u00f3n de Traefik
    \u2514\u2500\u2500 DEPLOYMENT_QUICKSTART.md     # Quick start en 15 minutos
```

## Gu\u00edas de Deployment

### Para Principiantes

Si es tu primera vez deployando con Docker Swarm:

1. **Lee primero**: `docs/PORTAINER_DEPLOYMENT.md`
2. **Configura Traefik**: `docs/TRAEFIK_SETUP.md`
3. **Sigue el paso a paso**: La gu\u00eda completa te llevar\u00e1 desde cero

### Para Usuarios Experimentados

Si ya tienes Docker Swarm y Traefik configurados:

1. **Quick Start**: `docs/DEPLOYMENT_QUICKSTART.md`
2. **Deploy en 15 minutos**: Sigue los 5 pasos r\u00e1pidos

## Quick Start (TL;DR)

```bash
# 1. Configurar variables
cp .env.production.example .env.production
vim .env.production

# 2. Build imagen
./scripts/build-docker-image.sh --tag v1.0.0 --push

# 3. Crear secrets
./scripts/setup-swarm-secrets.sh

# 4. Deploy
./scripts/deploy-to-swarm.sh pideai

# 5. Verificar
docker service logs -f pideai_app
curl https://tu-dominio.com/health
```

## Arquitectura

```
Internet
   |
   v
[Traefik]
   |-- SSL/TLS (Let's Encrypt)
   |-- Subdomain Routing
   |
   v
[Docker Swarm]
   |
   |-- Menu Maestro (2 r\u00e9plicas)
   |   |-- Nginx
   |   \u2514\u2500\u2500 React SPA
   |
   v
[Supabase Cloud]
```

## Caracter\u00edsticas del Deployment

- **Multi-stage Docker Build**: Imagen optimizada de ~25MB
- **Zero Downtime Updates**: Rolling updates autom\u00e1ticos
- **SSL Autom\u00e1tico**: Let's Encrypt con renovaci\u00f3n autom\u00e1tica
- **Multi-tenant**: Routing por subdomain (*.pideai.com)
- **Load Balancing**: Distribuci\u00f3n autom\u00e1tica de carga
- **Health Checks**: Monitoreo autom\u00e1tico de containers
- **Secrets Management**: Secrets seguros con Docker Swarm

## Variables de Entorno Requeridas

```bash
# Supabase (REQUERIDO)
VITE_SUPABASE_PROJECT_ID=xxx
VITE_SUPABASE_PUBLISHABLE_KEY=xxx
VITE_SUPABASE_URL=https://xxx.supabase.co

# PostHog Analytics (OPCIONAL)
VITE_POSTHOG_KEY=phc_xxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
VITE_POSTHOG_PERSONAL_KEY=phx_xxx
```

## Pre-requisitos

### Software
- Docker Engine 20.10+
- Docker Swarm inicializado
- Traefik deployado
- Git

### Infraestructura
- Servidor con 2+ CPU cores
- 4 GB RAM (8 GB recomendado)
- 20 GB disco
- Puertos 80 y 443 abiertos

### DNS
- Dominio registrado
- DNS configurado (wildcard: `*.pideai.com`)
- Propagaci\u00f3n completa

## Comandos \u00datiles

```bash
# Ver servicios
docker service ls

# Ver logs
docker service logs -f pideai_app

# Escalar
docker service scale pideai_app=4

# Actualizar
docker service update --image nueva-imagen pideai_app

# Rollback
docker service rollback pideai_app

# Eliminar
docker stack rm pideai
```

## Troubleshooting

### Problema com\u00fan #1: Certificado SSL no se genera

**Soluci\u00f3n:**
```bash
# Verificar DNS
dig pideai.com +short

# Ver logs de Traefik
docker service logs traefik_traefik | grep acme

# Verificar puerto 80 abierto
curl http://pideai.com/.well-known/acme-challenge/test
```

### Problema com\u00fan #2: 502 Bad Gateway

**Soluci\u00f3n:**
```bash
# Ver logs del servicio
docker service logs pideai_app

# Verificar health check
docker service ps pideai_app

# Probar health check manualmente
curl http://pideai.com/health
```

### Problema com\u00fan #3: Subdominios no funcionan

**Soluci\u00f3n:**
```bash
# Verificar DNS wildcard
dig tienda1.pideai.com +short
dig cualquier-cosa.pideai.com +short

# Ambos deben retornar la IP del servidor
```

Ver `docs/PORTAINER_DEPLOYMENT.md` secci\u00f3n "Troubleshooting" para m\u00e1s problemas y soluciones.

## Actualizaciones

### Actualizar la Aplicaci\u00f3n

```bash
# 1. Build nueva versi\u00f3n
./scripts/build-docker-image.sh --tag v1.1.0 --push

# 2. Actualizar servicio (rolling update autom\u00e1tico)
docker service update --image ghcr.io/usuario/menu-maestro:v1.1.0 pideai_app

# 3. Monitorear
watch docker service ps pideai_app
```

### Actualizar Configuraci\u00f3n

```bash
# Editar stack
vim docker-compose.swarm.yml

# Redeploy
docker stack deploy -c docker-compose.swarm.yml pideai
```

## Monitoring y Logs

```bash
# Logs en tiempo real
docker service logs -f pideai_app

# Logs de las \u00faltimas 24 horas
docker service logs --since 24h pideai_app

# Filtrar errores
docker service logs pideai_app | grep ERROR

# Ver m\u00e9tricas de recursos
docker stats
```

## Backup y Restore

### Backup

```bash
# Backup de configuraci\u00f3n
tar -czf backup-$(date +%Y%m%d).tar.gz \
  docker-compose.swarm.yml \
  nginx.conf \
  .env.production \
  scripts/

# Listar secrets (no se pueden exportar, documentar nombres)
docker secret ls > secrets-list.txt
```

### Restore

```bash
# Extraer backup
tar -xzf backup-YYYYMMDD.tar.gz

# Recrear secrets (desde .env.production)
./scripts/setup-swarm-secrets.sh

# Redeploy
./scripts/deploy-to-swarm.sh pideai
```

## Seguridad

### Mejores Pr\u00e1cticas Implementadas

- [x] Secrets management con Docker Swarm
- [x] SSL/TLS con Let's Encrypt
- [x] Security headers en Nginx
- [x] No ejecutar como root en container
- [x] Read-only filesystem donde sea posible
- [x] Health checks configurados
- [x] Resource limits definidos
- [x] Logging habilitado

### Recomendaciones Adicionales

1. **Firewall**: Solo abrir puertos 22, 80, 443
2. **SSH**: Deshabilitar password auth, solo usar keys
3. **Updates**: Mantener Docker y Traefik actualizados
4. **Monitoring**: Configurar alertas para servicios ca\u00eddos
5. **Backups**: Automatizar backups de configuraci\u00f3n

## Performance

### Configuraci\u00f3n Actual

- **Replicas**: 2 containers
- **CPU**: 0.5 cores por container
- **RAM**: 512MB por container
- **Image size**: ~25MB (optimizado)

### Escalamiento

```bash
# Escalar horizontalmente
docker service scale pideai_app=4

# Escalar verticalmente (editar docker-compose.swarm.yml)
resources:
  limits:
    cpus: '1.0'
    memory: 1G
```

## CI/CD

El proyecto incluye un workflow de GitHub Actions para CI/CD autom\u00e1tico.

Ver: `.github/workflows/docker-build.yml`

**Features:**
- Build autom\u00e1tico en cada push
- Push a GitHub Container Registry
- Tagging autom\u00e1tico (commit SHA + latest)
- Multi-platform builds (opcional)

## Soporte

### Documentaci\u00f3n Completa

- `docs/PORTAINER_DEPLOYMENT.md` - Gu\u00eda completa paso a paso
- `docs/TRAEFIK_SETUP.md` - Configuraci\u00f3n de Traefik
- `docs/DEPLOYMENT_QUICKSTART.md` - Quick start r\u00e1pido

### Recursos Externos

- [Docker Swarm Docs](https://docs.docker.com/engine/swarm/)
- [Traefik Docs](https://doc.traefik.io/traefik/)
- [Portainer Docs](https://docs.portainer.io/)

### Obtener Ayuda

1. Revisa la secci\u00f3n Troubleshooting en `docs/PORTAINER_DEPLOYMENT.md`
2. Revisa logs: `docker service logs -f pideai_app`
3. Abre un issue en GitHub con logs completos

---

## Changelog

### Version 1.0.0 (2025-11-30)
- Initial release
- Docker Swarm support
- Traefik integration
- Multi-tenant subdomain routing
- Automated scripts
- Complete documentation

---

**Mantenido por**: Menu Maestro Team
**\u00daltima actualizaci\u00f3n**: 2025-11-30
**Licencia**: MIT
