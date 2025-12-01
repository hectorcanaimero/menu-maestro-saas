#!/bin/bash

# ============================================================================
# Script de Deployment a Docker Swarm
# ============================================================================
#
# Este script:
# - Verifica prerequisitos de deployment
# - Crea networks necesarias si no existen
# - Deploya el stack a Docker Swarm
# - Monitorea el deployment
#
# Uso:
#   ./scripts/deploy-to-swarm.sh [STACK_NAME]
#
# Argumentos:
#   STACK_NAME    Nombre del stack (default: pideai)
#
# Ejemplos:
#   ./scripts/deploy-to-swarm.sh
#   ./scripts/deploy-to-swarm.sh pideai-prod
#
# ============================================================================

set -e # Exit on error
set -u # Exit on undefined variable

# ----------------------------------------------------------------------------
# Colores para output
# ----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ----------------------------------------------------------------------------
# Funciones de utilidad
# ----------------------------------------------------------------------------
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ----------------------------------------------------------------------------
# Configuraci\u00f3n
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.swarm.yml"
STACK_NAME="${1:-pideai}"

# ----------------------------------------------------------------------------
# Verificaciones previas
# ----------------------------------------------------------------------------
log_info "Iniciando deployment de Menu Maestro a Docker Swarm..."
log_info "Stack name: $STACK_NAME"
echo ""

# Verificar que estamos en un Swarm
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    log_error "Este nodo no es parte de un Docker Swarm activo"
    log_info "Inicializa Swarm primero con: docker swarm init"
    exit 1
fi

log_success "Docker Swarm detectado"

# Verificar que estamos en manager node
if ! docker info 2>/dev/null | grep -q "Is Manager: true"; then
    log_error "Este script debe ejecutarse en un manager node del Swarm"
    exit 1
fi

log_success "Manager node confirmado"
echo ""

# Verificar que existe docker-compose.swarm.yml
if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "No se encuentra $COMPOSE_FILE"
    exit 1
fi

log_success "Archivo de compose encontrado: $COMPOSE_FILE"
echo ""

# ----------------------------------------------------------------------------
# Verificar secrets
# ----------------------------------------------------------------------------
log_info "Verificando secrets requeridos..."

REQUIRED_SECRETS=(
    "pideai_supabase_project_id"
    "pideai_supabase_key"
    "pideai_supabase_url"
)

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! docker secret inspect "$secret" >/dev/null 2>&1; then
        MISSING_SECRETS+=("$secret")
    fi
done

if [ ${#MISSING_SECRETS[@]} -ne 0 ]; then
    log_error "Faltan secrets requeridos:"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  - $secret"
    done
    echo ""
    log_info "Crea los secrets con: ./scripts/setup-swarm-secrets.sh"
    exit 1
fi

log_success "Todos los secrets requeridos est\u00e1n disponibles"
echo ""

# ----------------------------------------------------------------------------
# Verificar/Crear network
# ----------------------------------------------------------------------------
log_info "Verificando network de Traefik..."

NETWORK_NAME="traefik-public"

if ! docker network inspect "$NETWORK_NAME" >/dev/null 2>&1; then
    log_warning "Network $NETWORK_NAME no existe, cre\u00e1ndola..."
    docker network create --driver=overlay "$NETWORK_NAME"
    log_success "Network $NETWORK_NAME creada"
else
    log_success "Network $NETWORK_NAME ya existe"
fi

echo ""

# ----------------------------------------------------------------------------
# Verificar Traefik
# ----------------------------------------------------------------------------
log_info "Verificando si Traefik est\u00e1 corriendo..."

if docker service ls --filter "name=traefik" --format "{{.Name}}" | grep -q "traefik"; then
    log_success "Traefik est\u00e1 corriendo"
else
    log_warning "No se detect\u00f3 Traefik corriendo"
    log_warning "Aseg\u00farate de tener Traefik deployado antes de continuar"
    echo ""
    read -p "Continuar de todas formas? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Deployment cancelado"
        exit 0
    fi
fi

echo ""

# ----------------------------------------------------------------------------
# Deploy del stack
# ----------------------------------------------------------------------------
log_info "Deploying stack: $STACK_NAME"
echo ""

docker stack deploy \
    --compose-file "$COMPOSE_FILE" \
    --with-registry-auth \
    "$STACK_NAME"

if [ $? -eq 0 ]; then
    log_success "Stack deployado exitosamente!"
else
    log_error "Fall\u00f3 el deployment del stack"
    exit 1
fi

echo ""

# ----------------------------------------------------------------------------
# Monitorear deployment
# ----------------------------------------------------------------------------
log_info "Esperando a que los servicios inicien..."
sleep 5
echo ""

log_info "Estado de los servicios:"
docker service ls --filter "label=com.docker.stack.namespace=$STACK_NAME"
echo ""

log_info "Detalles del servicio app:"
docker service ps "${STACK_NAME}_app" --no-trunc
echo ""

# ----------------------------------------------------------------------------
# Verificar health
# ----------------------------------------------------------------------------
log_info "Verificando health de los servicios (esto puede tomar 30-60 segundos)..."
echo ""

RETRIES=12
RETRY_DELAY=5

for i in $(seq 1 $RETRIES); do
    REPLICAS_RUNNING=$(docker service ls --filter "name=${STACK_NAME}_app" --format "{{.Replicas}}" | awk -F'/' '{print $1}')
    REPLICAS_DESIRED=$(docker service ls --filter "name=${STACK_NAME}_app" --format "{{.Replicas}}" | awk -F'/' '{print $2}')

    if [ "$REPLICAS_RUNNING" = "$REPLICAS_DESIRED" ] && [ "$REPLICAS_RUNNING" != "0" ]; then
        log_success "Todas las r\u00e9plicas est\u00e1n corriendo ($REPLICAS_RUNNING/$REPLICAS_DESIRED)"
        break
    else
        log_info "R\u00e9plicas: $REPLICAS_RUNNING/$REPLICAS_DESIRED - Esperando... ($i/$RETRIES)"
        sleep $RETRY_DELAY
    fi
done

echo ""

# ----------------------------------------------------------------------------
# Informaci\u00f3n final
# ----------------------------------------------------------------------------
log_success "Deployment completado!"
echo ""

log_info "Comandos \u00fatiles:"
echo "  - Ver logs:              docker service logs -f ${STACK_NAME}_app"
echo "  - Ver servicios:         docker service ls"
echo "  - Ver tareas:            docker service ps ${STACK_NAME}_app"
echo "  - Escalar servicio:      docker service scale ${STACK_NAME}_app=3"
echo "  - Actualizar servicio:   docker service update --image nueva-imagen ${STACK_NAME}_app"
echo "  - Remover stack:         docker stack rm $STACK_NAME"
echo ""

log_info "URLs de acceso (ajustar seg\u00fan tu dominio):"
echo "  - https://pideai.com"
echo "  - https://tienda1.pideai.com"
echo "  - https://restaurante.pideai.com"
echo ""

log_info "Verificar logs en tiempo real:"
echo "  docker service logs -f ${STACK_NAME}_app"
echo ""
