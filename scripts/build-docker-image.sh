#!/bin/bash

# ============================================================================
# Script de Build de Imagen Docker para Menu Maestro
# ============================================================================
#
# Este script:
# - Carga variables de entorno desde .env.production
# - Construye la imagen Docker con multi-stage build
# - Tagea la imagen con version y latest
# - Opcionalmente hace push al registry
#
# Uso:
#   ./scripts/build-docker-image.sh [OPTIONS]
#
# Opciones:
#   --push              Push autom\u00e1tico al registry despu\u00e9s de build
#   --tag VERSION       Tag personalizado (default: latest)
#   --registry URL      URL del registry (default: ghcr.io/hectorcanaimero)
#   --no-cache          Build sin usar cache
#
# Ejemplos:
#   ./scripts/build-docker-image.sh
#   ./scripts/build-docker-image.sh --push --tag v1.0.0
#   ./scripts/build-docker-image.sh --registry registry.tudominio.com --push
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
# Configuraci\u00f3n por defecto
# ----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.production"
DOCKERFILE="$PROJECT_ROOT/Dockerfile.production"

# Registry configuration
DEFAULT_REGISTRY="ghcr.io/hectorcanaimero"
DEFAULT_IMAGE_NAME="menu-maestro"
DEFAULT_TAG="latest"

# Parse command line arguments
REGISTRY="$DEFAULT_REGISTRY"
IMAGE_NAME="$DEFAULT_IMAGE_NAME"
TAG="$DEFAULT_TAG"
PUSH=false
NO_CACHE=""

# ----------------------------------------------------------------------------
# Parsear argumentos
# ----------------------------------------------------------------------------
while [[ $# -gt 0 ]]; do
    case $1 in
        --push)
            PUSH=true
            shift
            ;;
        --tag)
            TAG="$2"
            shift 2
            ;;
        --registry)
            REGISTRY="$2"
            shift 2
            ;;
        --image-name)
            IMAGE_NAME="$2"
            shift 2
            ;;
        --no-cache)
            NO_CACHE="--no-cache"
            shift
            ;;
        --help)
            head -n 30 "$0" | grep "^#" | sed 's/^# //'
            exit 0
            ;;
        *)
            log_error "Opci\u00f3n desconocida: $1"
            echo "Usa --help para ver opciones disponibles"
            exit 1
            ;;
    esac
done

# Full image name
FULL_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:$TAG"
LATEST_IMAGE_NAME="$REGISTRY/$IMAGE_NAME:latest"

# ----------------------------------------------------------------------------
# Verificaciones previas
# ----------------------------------------------------------------------------
log_info "Iniciando build de imagen Docker..."
log_info "Registry: $REGISTRY"
log_info "Imagen: $IMAGE_NAME"
log_info "Tag: $TAG"
echo ""

# Verificar que existe .env.production
if [ ! -f "$ENV_FILE" ]; then
    log_error "No se encuentra $ENV_FILE"
    log_info "Por favor crea el archivo .env.production con las variables necesarias"
    exit 1
fi

# Verificar que existe Dockerfile
if [ ! -f "$DOCKERFILE" ]; then
    log_error "No se encuentra $DOCKERFILE"
    exit 1
fi

# Cargar variables de entorno
log_info "Cargando variables de entorno desde .env.production..."
source "$ENV_FILE"

# Validar variables requeridas
REQUIRED_VARS=(
    "VITE_SUPABASE_URL"
    "VITE_SUPABASE_PUBLISHABLE_KEY"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        log_error "Variable requerida no encontrada: $var"
        log_info "Por favor configura $var en .env.production"
        exit 1
    fi
done

log_success "Variables de entorno validadas"
echo ""

# ----------------------------------------------------------------------------
# Build de la imagen
# ----------------------------------------------------------------------------
log_info "Construyendo imagen Docker..."
log_info "Esto puede tomar varios minutos..."
echo ""

# Build command
docker build \
    $NO_CACHE \
    -f "$DOCKERFILE" \
    -t "$FULL_IMAGE_NAME" \
    --build-arg VITE_SUPABASE_PROJECT_ID="${VITE_SUPABASE_PROJECT_ID:-}" \
    --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
    --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    --build-arg VITE_POSTHOG_KEY="${VITE_POSTHOG_KEY:-}" \
    --build-arg VITE_POSTHOG_HOST="${VITE_POSTHOG_HOST:-}" \
    --build-arg VITE_POSTHOG_PERSONAL_KEY="${VITE_POSTHOG_PERSONAL_KEY:-}" \
    "$PROJECT_ROOT"

if [ $? -eq 0 ]; then
    log_success "Imagen construida exitosamente: $FULL_IMAGE_NAME"
else
    log_error "Fall\u00f3 el build de la imagen"
    exit 1
fi

# Tagear como latest si no es latest
if [ "$TAG" != "latest" ]; then
    log_info "Tageando imagen como latest..."
    docker tag "$FULL_IMAGE_NAME" "$LATEST_IMAGE_NAME"
    log_success "Imagen tageada: $LATEST_IMAGE_NAME"
fi

echo ""

# ----------------------------------------------------------------------------
# Informaci\u00f3n de la imagen
# ----------------------------------------------------------------------------
log_info "Informaci\u00f3n de la imagen:"
docker images "$REGISTRY/$IMAGE_NAME" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"
echo ""

# ----------------------------------------------------------------------------
# Push al registry (opcional)
# ----------------------------------------------------------------------------
if [ "$PUSH" = true ]; then
    log_info "Haciendo push al registry..."

    # Login check
    log_info "Verificando autenticaci\u00f3n con registry..."

    # Push de la imagen con tag
    docker push "$FULL_IMAGE_NAME"
    if [ $? -eq 0 ]; then
        log_success "Push exitoso: $FULL_IMAGE_NAME"
    else
        log_error "Fall\u00f3 el push de $FULL_IMAGE_NAME"
        exit 1
    fi

    # Push de latest si no es latest
    if [ "$TAG" != "latest" ]; then
        docker push "$LATEST_IMAGE_NAME"
        if [ $? -eq 0 ]; then
            log_success "Push exitoso: $LATEST_IMAGE_NAME"
        else
            log_warning "Fall\u00f3 el push de $LATEST_IMAGE_NAME"
        fi
    fi

    echo ""
    log_success "Im\u00e1genes disponibles en el registry:"
    echo "  - $FULL_IMAGE_NAME"
    [ "$TAG" != "latest" ] && echo "  - $LATEST_IMAGE_NAME"
else
    log_info "Skip push (usa --push para hacer push autom\u00e1tico)"
    echo ""
    log_info "Para hacer push manual:"
    echo "  docker push $FULL_IMAGE_NAME"
    [ "$TAG" != "latest" ] && echo "  docker push $LATEST_IMAGE_NAME"
fi

echo ""
log_success "Build completado exitosamente!"
echo ""

# ----------------------------------------------------------------------------
# Siguientes pasos
# ----------------------------------------------------------------------------
log_info "Siguientes pasos:"
echo "  1. Probar la imagen localmente:"
echo "     docker run -p 8080:80 $FULL_IMAGE_NAME"
echo ""
echo "  2. Hacer push al registry (si no usaste --push):"
echo "     docker push $FULL_IMAGE_NAME"
echo ""
echo "  3. Deployar en Swarm:"
echo "     docker stack deploy -c docker-compose.swarm.yml pideai"
echo ""
