# Comandos Útiles para Docker Swarm

Referencia rápida de comandos para administrar el deployment de Menu Maestro en Docker Swarm.

## Comandos Básicos de Swarm

### Inicializar Swarm
```bash
# Inicializar en el nodo actual
docker swarm init

# Con IP específica (si hay múltiples interfaces)
docker swarm init --advertise-addr 192.168.1.100

# Ver token para unir workers
docker swarm join-token worker

# Ver token para unir managers
docker swarm join-token manager
```

### Gestión de Nodos
```bash
# Listar nodos del cluster
docker node ls

# Ver detalles de un nodo
docker node inspect self --pretty
docker node inspect node-name --pretty

# Promover worker a manager
docker node promote node-name

# Degradar manager a worker
docker node demote node-name

# Eliminar nodo del cluster
docker node rm node-name

# Drenar nodo (mover containers a otros nodos)
docker node update --availability drain node-name

# Activar nodo nuevamente
docker node update --availability active node-name
```

## Comandos de Stack

### Deploy y Gestión
```bash
# Deploy stack
docker stack deploy -c docker-compose.swarm.yml pideai

# Listar stacks
docker stack ls

# Ver servicios del stack
docker stack services pideai

# Ver tasks del stack
docker stack ps pideai

# Ver tasks incluyendo stopped
docker stack ps pideai -f "desired-state=running"
docker stack ps pideai -f "desired-state=shutdown"

# Remover stack
docker stack rm pideai
```

### Logs del Stack
```bash
# Ver logs de todos los servicios
docker stack ps pideai --no-trunc

# No hay comando directo de logs para stack,
# usar docker service logs en su lugar
```

## Comandos de Service

### Información del Servicio
```bash
# Listar servicios
docker service ls

# Ver detalles del servicio
docker service inspect pideai_app --pretty

# Ver detalles en formato JSON
docker service inspect pideai_app

# Ver tasks/replicas del servicio
docker service ps pideai_app

# Ver tasks con nombres completos
docker service ps pideai_app --no-trunc

# Ver solo tasks running
docker service ps pideai_app --filter "desired-state=running"
```

### Logs del Servicio
```bash
# Ver logs del servicio (todas las replicas)
docker service logs pideai_app

# Seguir logs en tiempo real
docker service logs pideai_app -f

# Últimas 100 líneas
docker service logs pideai_app --tail 100

# Logs con timestamps
docker service logs pideai_app -t

# Logs desde hace 1 hora
docker service logs pideai_app --since 1h

# Logs de una replica específica
docker service logs pideai_app.1
```

### Escalar Servicio
```bash
# Escalar a 5 replicas
docker service scale pideai_app=5

# Verificar escalado
docker service ls
docker service ps pideai_app
```

### Actualizar Servicio
```bash
# Update a nueva versión de imagen
docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.3 pideai_app

# Forzar re-pull de imagen (útil si usas :latest)
docker service update --force pideai_app

# Update con nueva imagen y confirmar
docker service update --image ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.3 \
  --update-parallelism 1 \
  --update-delay 15s \
  pideai_app

# Update environment variable
docker service update --env-add NEW_VAR=value pideai_app

# Update resource limits
docker service update --limit-cpu 1.0 --limit-memory 1024M pideai_app

# Update replicas
docker service update --replicas 5 pideai_app
```

### Rollback
```bash
# Rollback a versión anterior
docker service rollback pideai_app

# Ver historial de updates
docker service inspect pideai_app --pretty | grep -A 10 "Update Status"
```

## Comandos de Network

### Gestión de Networks
```bash
# Crear network overlay
docker network create --driver=overlay traefik-public

# Crear network con subnet específica
docker network create --driver=overlay \
  --subnet=10.0.9.0/24 \
  traefik-public

# Listar networks
docker network ls

# Ver detalles de network
docker network inspect traefik-public

# Remover network (debe estar sin uso)
docker network rm traefik-public

# Ver containers conectados a una network
docker network inspect traefik-public | jq '.[0].Containers'
```

## Comandos de Container (en Swarm)

### Inspeccionar Containers
```bash
# Listar todos los containers en el nodo actual
docker ps

# Ver containers del stack (en el nodo actual)
docker ps --filter "label=com.docker.stack.namespace=pideai"

# Ejecutar comando en un container
docker exec -it container_id sh

# Ver logs de un container específico
docker logs container_id -f --tail 100

# Ver stats de containers
docker stats

# Ver stats de containers del stack
docker stats $(docker ps --filter "label=com.docker.stack.namespace=pideai" -q)
```

## Comandos de Registry

### Push/Pull de Imágenes
```bash
# Login a GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Tag imagen
docker tag menu-maestro:latest ghcr.io/hectorcanaimero/menu-maestro-saas:latest
docker tag menu-maestro:latest ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.2

# Push imagen
docker push ghcr.io/hectorcanaimero/menu-maestro-saas:latest
docker push ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.2

# Pull imagen (en todos los nodos)
docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:latest

# Listar imágenes locales
docker images

# Limpiar imágenes no usadas
docker image prune -a
```

## Comandos de Debugging

### Health Checks
```bash
# Ver health status de un service
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.ContainerSpec.Healthcheck'

# Ver health logs de un container
docker inspect container_id | jq '.[0].State.Health'
```

### Network Debugging
```bash
# Ping entre containers (desde un container)
docker exec -it container_id ping other-container-name

# Resolver DNS (desde un container)
docker exec -it container_id nslookup pideai_app

# Ver routing de Traefik
# Acceder al dashboard de Traefik en http://traefik.pideai.com:8080

# Curl desde un container
docker exec -it container_id curl http://localhost/health
```

### Ver Configuración Efectiva
```bash
# Ver full config del service
docker service inspect pideai_app --pretty

# Ver labels de Traefik
docker service inspect pideai_app | jq '.[0].Spec.Labels'

# Ver environment variables
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.ContainerSpec.Env'

# Ver resource limits
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.Resources'

# Ver update config
docker service inspect pideai_app | jq '.[0].Spec.UpdateConfig'
```

### Performance y Recursos
```bash
# Ver uso de recursos del servicio
docker stats $(docker ps -q --filter "label=com.docker.swarm.service.name=pideai_app")

# Ver eventos del cluster
docker events --filter 'type=service'

# Ver eventos del service
docker events --filter 'type=service' --filter 'service=pideai_app'

# Ver system info
docker system info

# Ver disk usage
docker system df

# Ver disk usage detallado
docker system df -v
```

## Limpieza y Mantenimiento

### Limpiar Recursos No Usados
```bash
# Limpiar containers stopped
docker container prune

# Limpiar imágenes dangling
docker image prune

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar volumes no usados
docker volume prune

# Limpiar networks no usadas
docker network prune

# Limpiar TODO (cuidado!)
docker system prune -a --volumes

# Limpiar solo en el contexto de Swarm
docker stack rm pideai
docker system prune
```

### Mantenimiento de Logs
```bash
# Ver tamaño de logs
du -sh /var/lib/docker/containers/*/*-json.log

# Limpiar logs manualmente (en el host)
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Configurar logrotate para Docker
sudo nano /etc/docker/daemon.json
# Agregar:
# {
#   "log-driver": "json-file",
#   "log-opts": {
#     "max-size": "10m",
#     "max-file": "3"
#   }
# }

# Reiniciar Docker
sudo systemctl restart docker
```

## Troubleshooting Common Issues

### Service no inicia
```bash
# 1. Ver estado del service
docker service ps pideai_app --no-trunc

# 2. Ver logs
docker service logs pideai_app --tail 100

# 3. Inspeccionar el service
docker service inspect pideai_app --pretty

# 4. Verificar imagen existe
docker pull ghcr.io/hectorcanaimero/menu-maestro-saas:latest

# 5. Verificar network existe
docker network ls | grep traefik-public

# 6. Ver eventos
docker events --filter 'type=service' --filter 'service=pideai_app'
```

### Containers reiniciándose constantemente
```bash
# 1. Ver porque están reiniciando
docker service ps pideai_app --no-trunc

# 2. Ver logs de container que falló
docker logs container_id --tail 200

# 3. Verificar health check
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.ContainerSpec.Healthcheck'

# 4. Verificar resources limits
docker service inspect pideai_app | jq '.[0].Spec.TaskTemplate.Resources'

# 5. Test health check manualmente
docker exec -it container_id curl http://localhost/health
```

### Update no funciona
```bash
# 1. Ver status del update
docker service inspect pideai_app | jq '.[0].UpdateStatus'

# 2. Rollback
docker service rollback pideai_app

# 3. Intentar update con pause on failure
docker service update \
  --update-failure-action pause \
  --image ghcr.io/hectorcanaimero/menu-maestro-saas:latest \
  pideai_app

# 4. Si está en estado paused, continuar o rollback
docker service update pideai_app  # continuar
docker service rollback pideai_app  # rollback
```

## Scripts Útiles

### Ver estado completo del stack
```bash
#!/bin/bash
echo "=== STACK STATUS ==="
docker stack ls

echo -e "\n=== SERVICES ==="
docker stack services pideai

echo -e "\n=== TASKS ==="
docker stack ps pideai --no-trunc

echo -e "\n=== LOGS (last 50 lines) ==="
docker service logs pideai_app --tail 50
```

### Watch service status
```bash
# Monitorear estado en tiempo real
watch -n 2 'docker service ps pideai_app'

# O con más detalles
watch -n 2 'docker service ls && echo && docker service ps pideai_app'
```

### Test endpoint desde servidor
```bash
#!/bin/bash
DOMAINS=(
  "https://pideai.com"
  "https://www.pideai.com"
  "https://tienda1.pideai.com"
  "https://artex.lat"
  "https://www.artex.lat"
  "https://test.artex.lat"
)

for domain in "${DOMAINS[@]}"; do
  echo "Testing $domain"
  curl -I -s $domain | head -n 1
  echo
done
```

## Backup y Restore

### Backup de configuración
```bash
# Exportar stack config
docker stack config pideai > pideai-backup-$(date +%Y%m%d).yml

# Backup de volumes (si los hubiera)
docker run --rm \
  -v pideai_volume:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/pideai-volume-$(date +%Y%m%d).tar.gz /data

# Backup de Docker Swarm config
docker swarm ca > swarm-ca-$(date +%Y%m%d).pem
```

### Restore
```bash
# Restaurar stack
docker stack deploy -c pideai-backup-20250121.yml pideai

# Restaurar volume
docker volume create pideai_volume
docker run --rm \
  -v pideai_volume:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/pideai-volume-20250121.tar.gz -C /
```

## Cheatsheet One-Liners

```bash
# Ver todos los servicios running
docker service ls

# Ver logs en tiempo real de todos los services
docker service ls --format "{{.Name}}" | xargs -I {} sh -c 'docker service logs {} -f --tail 20 &'

# Forzar recreación de todos los containers
docker service ls --format "{{.Name}}" | xargs -I {} docker service update --force {}

# Ver uso de memoria de todos los containers
docker stats --no-stream --format "table {{.Container}}\t{{.MemUsage}}"

# Eliminar todos los services del stack
docker stack rm pideai

# Ver health status de todos los containers
docker ps --format "table {{.Names}}\t{{.Status}}"

# Pull latest images en todos los nodos
docker service update --force --image ghcr.io/hectorcanaimero/menu-maestro-saas:latest pideai_app
```

## Recursos Adicionales

- [Docker Swarm Docs](https://docs.docker.com/engine/swarm/)
- [Docker CLI Reference](https://docs.docker.com/engine/reference/commandline/docker/)
- [Docker Service Update](https://docs.docker.com/engine/reference/commandline/service_update/)
- [Docker Stack Deploy](https://docs.docker.com/engine/reference/commandline/stack_deploy/)
