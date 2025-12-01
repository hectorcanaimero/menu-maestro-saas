# Checklist de Deployment - Menu Maestro

Usa este checklist para asegurar que todos los pasos se completen correctamente durante el deployment.

## Pre-Deployment

### Infraestructura

- [ ] Servidor con recursos adecuados (2+ CPU, 4+ GB RAM)
- [ ] Docker Engine 20.10+ instalado
- [ ] Docker Swarm inicializado (`docker swarm init`)
- [ ] Acceso SSH al servidor configurado
- [ ] Firewall configurado (puertos 22, 80, 443 abiertos)

### DNS y Dominio

- [ ] Dominio registrado (ejemplo: `pideai.com`)
- [ ] Acceso a configuraci\u00f3n DNS
- [ ] DNS configurado con registro wildcard:
  - [ ] Registro A: `@` \u2192 IP del servidor
  - [ ] Registro A: `*` \u2192 IP del servidor
- [ ] DNS propagado (verificar con `dig pideai.com +short`)

### Docker Swarm

- [ ] Swarm inicializado y activo (`docker info | grep Swarm`)
- [ ] Manager node confirmado (`docker node ls`)
- [ ] Network `traefik-public` creada (`docker network create --driver=overlay traefik-public`)

### Traefik

- [ ] Traefik deployado y corriendo
- [ ] Traefik configurado con Let's Encrypt
- [ ] Certificados SSL funcionando
- [ ] Dashboard de Traefik accesible (opcional)
- [ ] Logs de Traefik sin errores

---

## Configuraci\u00f3n de la Aplicaci\u00f3n

### Variables de Entorno

- [ ] Archivo `.env.production` creado
- [ ] `VITE_SUPABASE_URL` configurado
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY` configurado
- [ ] `VITE_SUPABASE_PROJECT_ID` configurado
- [ ] Variables de PostHog configuradas (opcional):
  - [ ] `VITE_POSTHOG_KEY`
  - [ ] `VITE_POSTHOG_HOST`
  - [ ] `VITE_POSTHOG_PERSONAL_KEY`

### Build de Imagen Docker

- [ ] Repositorio clonado localmente
- [ ] Script de build ejecutable (`chmod +x scripts/build-docker-image.sh`)
- [ ] Build exitoso (`./scripts/build-docker-image.sh --tag v1.0.0`)
- [ ] Imagen tageada correctamente
- [ ] Registry configurado (GitHub Container Registry, Docker Hub, etc.)
- [ ] Login al registry exitoso
- [ ] Imagen pusheada al registry (`--push`)

### Configuraci\u00f3n del Stack

- [ ] Archivo `docker-compose.swarm.yml` revisado
- [ ] Imagen actualizada en compose file (tu registry + tag)
- [ ] Dominio actualizado en labels de Traefik (3 lugares)
- [ ] Resource limits ajustados seg\u00fan servidor
- [ ] N\u00famero de r\u00e9plicas configurado

---

## Deployment

### Secrets

- [ ] Script de secrets ejecutable (`chmod +x scripts/setup-swarm-secrets.sh`)
- [ ] Secrets creados exitosamente:
  - [ ] `pideai_supabase_project_id`
  - [ ] `pideai_supabase_key`
  - [ ] `pideai_supabase_url`
  - [ ] `pideai_posthog_key` (opcional)
  - [ ] `pideai_posthog_host` (opcional)
  - [ ] `pideai_posthog_personal_key` (opcional)
- [ ] Secrets verificados (`docker secret ls | grep pideai`)

### Deploy del Stack

Elige un m\u00e9todo:

#### Opci\u00f3n A: Portainer UI
- [ ] Portainer accesible
- [ ] Stack creado en Portainer
- [ ] Compose file copiado correctamente
- [ ] Variables personalizadas editadas
- [ ] Stack deployado sin errores

#### Opci\u00f3n B: CLI con Script
- [ ] Script de deploy ejecutable (`chmod +x scripts/deploy-to-swarm.sh`)
- [ ] Deploy ejecutado (`./scripts/deploy-to-swarm.sh pideai`)
- [ ] No hay errores en output

#### Opci\u00f3n C: CLI Manual
- [ ] Comando ejecutado: `docker stack deploy -c docker-compose.swarm.yml pideai`
- [ ] No hay errores en output

---

## Verificaci\u00f3n Post-Deployment

### Estado de Servicios

- [ ] Servicio listado en `docker service ls`
- [ ] R\u00e9plicas correctas (2/2 o configuraci\u00f3n elegida)
- [ ] Estado "Running" en todos los containers
- [ ] Tareas sin fallos (`docker service ps pideai_app`)
- [ ] No hay containers en estado "Failed" o "Rejected"

### Health Checks

- [ ] Health check pasando en Docker (`docker service ps pideai_app`)
- [ ] Health check manual exitoso: `curl http://pideai.com/health`
  - Output esperado: `OK`

### Logs

- [ ] Logs visibles (`docker service logs pideai_app`)
- [ ] No hay errores cr\u00edticos en logs
- [ ] Nginx iniciado correctamente
- [ ] Build assets cargados

### Conectividad

- [ ] Puerto 80 responde: `curl -I http://pideai.com`
  - Debe redirigir a HTTPS (301/302)
- [ ] Puerto 443 responde: `curl -I https://pideai.com`
  - Output esperado: `HTTP/2 200`

### SSL/TLS

- [ ] Certificado SSL v\u00e1lido
- [ ] Sin warnings de certificado en navegador
- [ ] Candado verde visible en barra de direcciones
- [ ] Certificado emitido por Let's Encrypt
- [ ] Verificaci\u00f3n manual: `openssl s_client -connect pideai.com:443 -servername pideai.com < /dev/null | grep "Verify return code"`
  - Output esperado: `Verify return code: 0 (ok)`

### Routing de Subdominios

- [ ] Dominio principal funciona: `https://pideai.com`
- [ ] Subdominios funcionan: `https://tienda1.pideai.com`
- [ ] Subdominios din\u00e1micos funcionan: `https://cualquier-nombre.pideai.com`
- [ ] Todos los subdominios tienen certificado SSL v\u00e1lido

---

## Pruebas Funcionales

### Aplicaci\u00f3n Web

- [ ] P\u00e1gina principal carga sin errores
- [ ] No hay errores en consola del navegador (F12)
- [ ] Assets est\u00e1ticos cargan (CSS, JS, im\u00e1genes)
- [ ] Favicon visible
- [ ] Fonts cargan correctamente

### Multi-tenancy

- [ ] Acceder a `https://pideai.com` muestra tienda por defecto o landing
- [ ] Acceder a `https://tienda1.pideai.com` carga tienda espec\u00edfica
- [ ] Acceder a `https://restaurante.pideai.com` carga tienda diferente
- [ ] Cada subdomain muestra contenido correcto de la tienda

### Integraci\u00f3n con Supabase

- [ ] Aplicaci\u00f3n se conecta a Supabase
- [ ] Datos de tiendas cargan correctamente
- [ ] No hay errores de autenticaci\u00f3n en consola
- [ ] Realtime connections funcionan (si aplica)

### Analytics (PostHog)

Si PostHog est\u00e1 configurado:
- [ ] PostHog se inicializa correctamente
- [ ] No hay errores de PostHog en consola
- [ ] Eventos se env\u00edan a PostHog

---

## Performance y Optimizaci\u00f3n

### M\u00e9tricas de Performance

- [ ] Tiempo de carga inicial < 3 segundos
- [ ] Assets comprimidos con gzip
- [ ] Assets cacheados correctamente
- [ ] Im\u00e1genes optimizadas

### Resource Usage

- [ ] CPU usage < 50% en condiciones normales (`docker stats`)
- [ ] Memory usage dentro de l\u00edmites configurados
- [ ] No hay memory leaks
- [ ] Disk space adecuado

### Load Balancing

- [ ] M\u00faltiples r\u00e9plicas distribuyen carga
- [ ] Traefik hace round-robin correctamente
- [ ] Health checks detectan containers unhealthy

---

## Seguridad

### Configuraci\u00f3n de Seguridad

- [ ] Secrets usados para datos sensibles (no en env vars)
- [ ] HTTPS forzado (no permite HTTP)
- [ ] Security headers configurados:
  - [ ] `X-Frame-Options`
  - [ ] `X-Content-Type-Options`
  - [ ] `X-XSS-Protection`
  - [ ] `Strict-Transport-Security`
- [ ] CSP (Content Security Policy) configurado
- [ ] No hay secrets expuestos en c\u00f3digo fuente
- [ ] `.env.production` no incluido en imagen Docker

### Server Security

- [ ] Solo puertos necesarios abiertos (22, 80, 443)
- [ ] SSH con key-based auth (password auth deshabilitado)
- [ ] Firewall activo
- [ ] Docker daemon seguro
- [ ] Updates de sistema aplicados

---

## Monitoring y Logs

### Logging

- [ ] Logs accesibles: `docker service logs -f pideai_app`
- [ ] Log level apropiado (INFO en producci\u00f3n)
- [ ] Logs rotan autom\u00e1ticamente (max-size configurado)
- [ ] No hay logging de datos sensibles

### Monitoring

- [ ] Dashboard de Traefik funcional (opcional)
- [ ] M\u00e9tricas de Docker accesibles
- [ ] Alertas configuradas para:
  - [ ] Servicio ca\u00eddo
  - [ ] High CPU/memory
  - [ ] Certificado pr\u00f3ximo a expirar

---

## Backup y Disaster Recovery

### Backup

- [ ] Configuraci\u00f3n respaldada:
  - [ ] `docker-compose.swarm.yml`
  - [ ] `nginx.conf`
  - [ ] `.env.production` (en lugar seguro)
  - [ ] Scripts
- [ ] Documentaci\u00f3n de secrets (nombres y c\u00f3mo recrearlos)
- [ ] Procedimiento de backup documentado

### Disaster Recovery

- [ ] Procedimiento de rollback documentado
- [ ] Backup testeado (restore funciona)
- [ ] Plan de contingencia en caso de falla

---

## Documentaci\u00f3n

### Documentaci\u00f3n T\u00e9cnica

- [ ] README actualizado
- [ ] Deployment docs completas
- [ ] Runbooks para operaciones comunes
- [ ] Troubleshooting guide disponible

### Documentaci\u00f3n Operacional

- [ ] Credenciales documentadas (en lugar seguro)
- [ ] Contactos de emergencia
- [ ] SLAs definidos (si aplica)

---

## Post-Deployment

### Comunicaci\u00f3n

- [ ] Stakeholders notificados de deployment exitoso
- [ ] URL de producci\u00f3n compartida
- [ ] Credenciales de admin compartidas (si aplica)

### Monitoring Inicial

- [ ] Monitorear logs por 24 horas
- [ ] Verificar m\u00e9tricas de uso
- [ ] Verificar errores en producci\u00f3n

### Optimizaci\u00f3n

- [ ] Ajustar replicas si es necesario
- [ ] Ajustar resource limits basado en uso real
- [ ] Configurar caching adicional si es necesario

---

## Troubleshooting (si hay problemas)

Si encuentras problemas durante el deployment, marca aqu\u00ed:

### Problemas Comunes

- [ ] Servicio no inicia
  - Acci\u00f3n: Ver `docker service logs pideai_app`
  - Acci\u00f3n: Ver `docker service ps pideai_app --no-trunc`

- [ ] 502 Bad Gateway
  - Acci\u00f3n: Verificar health check
  - Acci\u00f3n: Verificar network
  - Acci\u00f3n: Revisar logs de Traefik

- [ ] Certificado SSL no se genera
  - Acci\u00f3n: Verificar DNS (`dig pideai.com +short`)
  - Acci\u00f3n: Verificar puerto 80 accesible
  - Acci\u00f3n: Ver logs de Traefik (`docker service logs traefik_traefik | grep acme`)

- [ ] Subdominios no funcionan
  - Acci\u00f3n: Verificar DNS wildcard
  - Acci\u00f3n: Verificar routing rules de Traefik

**Documentaci\u00f3n de troubleshooting completa**: `docs/PORTAINER_DEPLOYMENT.md` secci\u00f3n "Troubleshooting"

---

## Sign-off

### Deployment Team

- [ ] Developer sign-off: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Fecha: \_\_\_\_\_\_\_\_
- [ ] DevOps sign-off: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Fecha: \_\_\_\_\_\_\_\_
- [ ] QA sign-off: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_ Fecha: \_\_\_\_\_\_\_\_

### Notas Finales

Notas adicionales sobre el deployment:

```
[Espacio para notas]
```

---

**Deployment completado exitosamente**: \u2610 S\u00ed \u2610 No

**Fecha de deployment**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Versi\u00f3n deployada**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

**Deployado por**: \_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_

---

## Pr\u00f3ximos Pasos

Despu\u00e9s de un deployment exitoso:

1. [ ] Configurar CI/CD para deployments futuros
2. [ ] Setup de monitoring avanzado (Prometheus/Grafana)
3. [ ] Configurar backups autom\u00e1ticos
4. [ ] Documentar procedimientos de actualizaci\u00f3n
5. [ ] Training del equipo en operaciones

---

**Template version**: 1.0.0
**\u00daltima actualizaci\u00f3n**: 2025-11-30
