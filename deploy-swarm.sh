#!/bin/bash
# ============================================================================
# Script de Deployment para Docker Swarm + Traefik
# ============================================================================
#
# Este script facilita el build y deployment de Menu Maestro en Docker Swarm
#
# Uso:
#   ./deploy-swarm.sh build   - Build y push de la imagen
#   ./deploy-swarm.sh deploy  - Deploy del stack en Swarm
#   ./deploy-swarm.sh update  - Update del stack (redeploy)
#   ./deploy-swarm.sh logs    - Ver logs del servicio
#   ./deploy-swarm.sh status  - Ver estado del stack
#   ./deploy-swarm.sh remove  - Remover el stack
#
# ============================================================================

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuración
STACK_NAME="pideai"
IMAGE_NAME="ghcr.io/hectorcanaimero/menu-maestro-saas"
IMAGE_TAG="latest"
DOCKERFILE="Dockerfile.production"
COMPOSE_FILE="docker-compose.swarm.yml"

# Variables de entorno (reemplazar con tus valores reales)
VITE_SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID:-wdpexjymbiyjqwdttqhz}"
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-https://wdpexjymbiyjqwdttqhz.supabase.co}"
VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}"
VITE_POSTHOG_KEY="${VITE_POSTHOG_KEY}"
VITE_POSTHOG_HOST="${VITE_POSTHOG_HOST:-https://us.i.posthog.com}"
VITE_POSTHOG_PERSONAL_KEY="${VITE_POSTHOG_PERSONAL_KEY}"

# Funciones
print_header() {
    echo -e "${GREEN}============================================${NC}"
    echo -e "${GREEN}$1${NC}"
    echo -e "${GREEN}============================================${NC}"
}

print_error() {
    echo -e "${RED}ERROR: $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}WARNING: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

check_env_vars() {
    if [ -z "$VITE_SUPABASE_PUBLISHABLE_KEY" ]; then
        print_error "VITE_SUPABASE_PUBLISHABLE_KEY no está configurado"
        echo "Exporta las variables de entorno antes de ejecutar:"
        echo "export VITE_SUPABASE_PUBLISHABLE_KEY=tu_key"
        exit 1
    fi
}

build_image() {
    print_header "Building Docker Image"

    check_env_vars

    echo "Building ${IMAGE_NAME}:${IMAGE_TAG}..."

    docker build \
        --build-arg VITE_SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID}" \
        --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="${VITE_SUPABASE_PUBLISHABLE_KEY}" \
        --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL}" \
        --build-arg VITE_POSTHOG_KEY="${VITE_POSTHOG_KEY}" \
        --build-arg VITE_POSTHOG_HOST="${VITE_POSTHOG_HOST}" \
        --build-arg VITE_POSTHOG_PERSONAL_KEY="${VITE_POSTHOG_PERSONAL_KEY}" \
        -f "${DOCKERFILE}" \
        -t "${IMAGE_NAME}:${IMAGE_TAG}" \
        -t "${IMAGE_NAME}:v3.0.2" \
        .

    print_success "Image built successfully"

    # Preguntar si hacer push
    read -p "¿Deseas hacer push al registry? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        push_image
    fi
}

push_image() {
    print_header "Pushing Image to Registry"

    echo "Pushing ${IMAGE_NAME}:${IMAGE_TAG}..."
    docker push "${IMAGE_NAME}:${IMAGE_TAG}"

    echo "Pushing ${IMAGE_NAME}:v3.0.2..."
    docker push "${IMAGE_NAME}:v3.0.2"

    print_success "Image pushed successfully"
}

deploy_stack() {
    print_header "Deploying Stack to Swarm"

    # Verificar que estamos en un manager node
    if ! docker node ls &> /dev/null; then
        print_error "No estás en un Swarm manager node"
        echo "Inicializa Swarm primero: docker swarm init"
        exit 1
    fi

    # Verificar que la network existe
    if ! docker network ls | grep -q "network_public"; then
        print_warning "La network 'network_public' no existe"
        echo "Creando network..."
        docker network create --driver=overlay network_public
        print_success "Network creada"
    fi

    # Deploy del stack
    echo "Deploying stack ${STACK_NAME}..."
    docker stack deploy -c "${COMPOSE_FILE}" "${STACK_NAME}"

    print_success "Stack deployed successfully"

    echo ""
    echo "Verificando servicios..."
    sleep 3
    docker stack services "${STACK_NAME}"
}

update_stack() {
    print_header "Updating Stack"

    echo "Forzando actualización del servicio..."
    docker service update --force "${STACK_NAME}_app"

    print_success "Service updated"

    echo ""
    echo "Estado del servicio:"
    docker service ps "${STACK_NAME}_app"
}

show_logs() {
    print_header "Service Logs"

    docker service logs "${STACK_NAME}_app" -f --tail 100
}

show_status() {
    print_header "Stack Status"

    echo "Stack services:"
    docker stack services "${STACK_NAME}"

    echo ""
    echo "Service tasks:"
    docker service ps "${STACK_NAME}_app" --no-trunc

    echo ""
    echo "Service details:"
    docker service inspect "${STACK_NAME}_app" --pretty
}

remove_stack() {
    print_header "Removing Stack"

    read -p "¿Estás seguro de que quieres remover el stack ${STACK_NAME}? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker stack rm "${STACK_NAME}"
        print_success "Stack removed"
    else
        echo "Operación cancelada"
    fi
}

show_help() {
    echo "Uso: $0 {build|deploy|update|logs|status|remove|help}"
    echo ""
    echo "Comandos:"
    echo "  build   - Build y push de la imagen Docker"
    echo "  deploy  - Deploy del stack en Docker Swarm"
    echo "  update  - Forzar update del servicio"
    echo "  logs    - Ver logs del servicio"
    echo "  status  - Ver estado del stack"
    echo "  remove  - Remover el stack"
    echo "  help    - Mostrar esta ayuda"
    echo ""
    echo "Variables de entorno requeridas:"
    echo "  VITE_SUPABASE_PUBLISHABLE_KEY"
    echo ""
    echo "Variables de entorno opcionales:"
    echo "  VITE_SUPABASE_PROJECT_ID (default: wdpexjymbiyjqwdttqhz)"
    echo "  VITE_SUPABASE_URL (default: https://wdpexjymbiyjqwdttqhz.supabase.co)"
    echo "  VITE_POSTHOG_KEY"
    echo "  VITE_POSTHOG_HOST (default: https://us.i.posthog.com)"
    echo "  VITE_POSTHOG_PERSONAL_KEY"
}

# Main
case "${1:-help}" in
    build)
        build_image
        ;;
    deploy)
        deploy_stack
        ;;
    update)
        update_stack
        ;;
    logs)
        show_logs
        ;;
    status)
        show_status
        ;;
    remove)
        remove_stack
        ;;
    help|*)
        show_help
        ;;
esac
