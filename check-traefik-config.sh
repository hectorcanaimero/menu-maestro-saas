#!/bin/bash
# ============================================================================
# Script para Diagnosticar Configuración de Traefik
# ============================================================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}============================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# ============================================================================
# 1. Encontrar servicio de Traefik
# ============================================================================
print_header "1. Finding Traefik Service"

TRAEFIK_SERVICE=$(docker service ls | grep traefik | awk '{print $2}' | head -n 1)

if [ -z "$TRAEFIK_SERVICE" ]; then
    print_error "No Traefik service found!"
    exit 1
fi

print_success "Found service: $TRAEFIK_SERVICE"

# ============================================================================
# 2. Ver Command Arguments
# ============================================================================
print_header "2. Traefik Command Arguments"

echo "Checking log configuration..."
docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Args}}' | jq -r '.[]' | grep -E "log|access" || echo "No log configuration found in args"

# ============================================================================
# 3. Ver Environment Variables
# ============================================================================
print_header "3. Environment Variables"

echo "Current environment:"
docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq -r '.[]'

# ============================================================================
# 4. Ver Labels
# ============================================================================
print_header "4. Service Labels"

echo "Service labels:"
docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.Labels}}' | jq '.'

# ============================================================================
# 5. Estado del Container
# ============================================================================
print_header "5. Container Status"

CONTAINER_ID=$(docker ps -q --filter "name=traefik" | head -n 1)

if [ -z "$CONTAINER_ID" ]; then
    print_error "No Traefik container running!"
else
    print_success "Container ID: $CONTAINER_ID"

    echo ""
    echo "Container details:"
    docker inspect $CONTAINER_ID --format '{{.Name}}: {{.State.Status}} ({{.State.Health.Status}})'
fi

# ============================================================================
# 6. Intentar obtener logs directamente del container
# ============================================================================
print_header "6. Container Logs (Direct)"

if [ -n "$CONTAINER_ID" ]; then
    echo "Last 20 lines from container:"
    docker logs $CONTAINER_ID --tail 20 2>&1 || print_error "Cannot read container logs"
else
    print_error "No container to read logs from"
fi

# ============================================================================
# 7. Verificar volumen de logs
# ============================================================================
print_header "7. Log Files on Disk"

if [ -d /var/lib/docker/containers/$CONTAINER_ID ]; then
    echo "Container log file:"
    ls -lh /var/lib/docker/containers/$CONTAINER_ID/*.log 2>/dev/null || echo "No log files found"
fi

# ============================================================================
# 8. Configuración de logging del servicio
# ============================================================================
print_header "8. Service Logging Configuration"

echo "Logging driver:"
docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.LogDriver}}' | jq '.'

# ============================================================================
# 9. Sugerencias
# ============================================================================
print_header "9. Recommendations"

echo ""
echo "To enable proper logging in Traefik, ensure these command args exist:"
echo "  --log.level=INFO"
echo "  --accesslog=true"
echo ""
echo "To add them to your service:"
echo "  docker service update \\"
echo "    --args '--log.level=INFO' \\"
echo "    --args '--accesslog=true' \\"
echo "    $TRAEFIK_SERVICE"
echo ""
echo "Or redeploy your stack with these args in the YAML file."
echo ""
