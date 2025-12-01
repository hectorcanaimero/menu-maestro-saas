#!/bin/bash

# ============================================================================
# Script para Crear Docker Swarm Secrets
# ============================================================================
#
# Este script crea todos los secrets necesarios para el stack de Menu Maestro
# Los secrets se crean desde el archivo .env.production
#
# IMPORTANTE:
# - Ejecutar este script EN EL MANAGER NODE del Docker Swarm
# - Solo necesitas ejecutarlo UNA VEZ (los secrets son permanentes)
# - Para actualizar un secret, debes eliminarlo primero y recrearlo
#
# Uso:
#   ./scripts/setup-swarm-secrets.sh
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

create_secret() {
    local secret_name=$1
    local secret_value=$2

    if [ -z "$secret_value" ]; then
        log_warning "Secret $secret_name tiene valor vac\u00edo, omitiendo..."
        return 0
    fi

    # Check if secret already exists
    if docker secret inspect "$secret_name" >/dev/null 2>&1; then
        log_warning "Secret $secret_name ya existe, omitiendo..."
        echo "         Para actualizarlo, primero elim\u00ednalo con: docker secret rm $secret_name"
        return 0
    fi

    # Create secret
    echo -n "$secret_value" | docker secret create "$secret_name" -
    if [ $? -eq 0 ]; then
        log_success "Secret creado: $secret_name"
    else
        log_error "Fall\u00f3 al crear secret: $secret_name"
        return 1
    fi
}

# ----------------------------------------------------------------------------
# Verificaciones previas
# ----------------------------------------------------------------------------
log_info "Configurando Docker Swarm Secrets para Menu Maestro..."
echo ""

# Verificar que estamos en un Swarm manager node
if ! docker info 2>/dev/null | grep -q "Swarm: active"; then
    log_error "Este nodo no es parte de un Docker Swarm activo"
    log_info "Inicializa Swarm primero con: docker swarm init"
    exit 1
fi

if ! docker info 2>/dev/null | grep -q "Is Manager: true"; then
    log_error "Este script debe ejecutarse en un manager node del Swarm"
    exit 1
fi

log_success "Docker Swarm manager node detectado"
echo ""

# Verificar que existe .env.production
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.production"

if [ ! -f "$ENV_FILE" ]; then
    log_error "No se encuentra $ENV_FILE"
    log_info "Por favor crea el archivo .env.production con las variables necesarias"
    exit 1
fi

log_info "Cargando variables desde .env.production..."
source "$ENV_FILE"
log_success "Variables cargadas"
echo ""

# ----------------------------------------------------------------------------
# Crear secrets
# ----------------------------------------------------------------------------
log_info "Creando secrets..."
echo ""

# Supabase secrets
create_secret "pideai_supabase_project_id" "${VITE_SUPABASE_PROJECT_ID:-}"
create_secret "pideai_supabase_key" "${VITE_SUPABASE_PUBLISHABLE_KEY:-}"
create_secret "pideai_supabase_url" "${VITE_SUPABASE_URL:-}"

echo ""

# PostHog secrets
create_secret "pideai_posthog_key" "${VITE_POSTHOG_KEY:-}"
create_secret "pideai_posthog_host" "${VITE_POSTHOG_HOST:-}"
create_secret "pideai_posthog_personal_key" "${VITE_POSTHOG_PERSONAL_KEY:-}"

echo ""

# ----------------------------------------------------------------------------
# Verificaci\u00f3n
# ----------------------------------------------------------------------------
log_info "Verificando secrets creados..."
echo ""
docker secret ls --filter "name=pideai_" --format "table {{.Name}}\t{{.CreatedAt}}\t{{.UpdatedAt}}"
echo ""

log_success "Setup de secrets completado!"
echo ""

# ----------------------------------------------------------------------------
# Siguientes pasos
# ----------------------------------------------------------------------------
log_info "Siguientes pasos:"
echo "  1. Crear la network de Traefik (si no existe):"
echo "     docker network create --driver=overlay traefik-public"
echo ""
echo "  2. Deployar el stack:"
echo "     docker stack deploy -c docker-compose.swarm.yml pideai"
echo ""
echo "  3. Verificar deployment:"
echo "     docker service ls"
echo "     docker service logs pideai_app"
echo ""

# ----------------------------------------------------------------------------
# Informaci\u00f3n adicional
# ----------------------------------------------------------------------------
log_info "Comandos \u00fatiles:"
echo "  - Listar secrets:      docker secret ls"
echo "  - Ver secret:          docker secret inspect pideai_supabase_url"
echo "  - Eliminar secret:     docker secret rm pideai_supabase_url"
echo "  - Recrear secret:      docker secret rm NAME && echo 'value' | docker secret create NAME -"
echo ""
