#!/bin/bash
# ============================================================================
# Script para Habilitar Logs en Traefik
# ============================================================================
#
# Este script habilita logging en el servicio de Traefik existente
#
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

print_header "Enabling Traefik Logs"

# ============================================================================
# 1. Encontrar servicio
# ============================================================================
print_info "Step 1: Finding Traefik service"

TRAEFIK_SERVICE=$(docker service ls | grep traefik | awk '{print $2}' | head -n 1)

if [ -z "$TRAEFIK_SERVICE" ]; then
    print_error "No Traefik service found!"
    echo "Available services:"
    docker service ls
    exit 1
fi

print_success "Found service: $TRAEFIK_SERVICE"

# ============================================================================
# 2. Obtener configuración actual
# ============================================================================
print_info "Step 2: Getting current configuration"

echo "Current command args:"
docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Args}}' | jq -r '.[]' | head -10

# ============================================================================
# 3. Guardar configuración en archivo temporal
# ============================================================================
print_info "Step 3: Extracting current configuration"

# Obtener args actuales
CURRENT_ARGS=$(docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Args}}' | jq -r '.[]')

# Crear archivo temporal con configuración nueva
cat > /tmp/traefik-update.yml << 'EOFYAML'
version: '3.8'

networks:
  network_public:
    external: true

services:
  traefik:
    image: traefik:v2.10

    command:
      # API y Dashboard
      - "--api.dashboard=true"
      - "--api.insecure=true"

      # Providers
      - "--providers.docker=true"
      - "--providers.docker.swarmMode=true"
      - "--providers.docker.exposedbydefault=false"
      - "--providers.docker.network=network_public"

      # Entrypoints
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"

      # Logging (ENABLED)
      - "--log.level=INFO"
      - "--log.format=common"
      - "--accesslog=true"
      - "--accesslog.format=common"

      # Certificate Resolver - Cloudflare DNS Challenge (Global API Key)
      - "--certificatesresolvers.cloudflare.acme.dnschallenge=true"
      - "--certificatesresolvers.cloudflare.acme.dnschallenge.provider=cloudflare"
      - "--certificatesresolvers.cloudflare.acme.dnschallenge.resolvers=1.1.1.1:53,8.8.8.8:53"
      - "--certificatesresolvers.cloudflare.acme.email=knaimero@gmail.com"
      - "--certificatesresolvers.cloudflare.acme.storage=/etc/traefik/letsencrypt/acme.json"

      # Certificate Resolver - HTTP Challenge (Fallback)
      - "--certificatesresolvers.letsencryptresolver.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencryptresolver.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencryptresolver.acme.email=knaimero@gmail.com"
      - "--certificatesresolvers.letsencryptresolver.acme.storage=/etc/traefik/letsencrypt/acme-http.json"

    environment:
      - CF_API_EMAIL=knaimero@gmail.com
      - CF_API_KEY=8c5f6c41e9c14f791b1f2d24925d30d6bbb56
      - TZ=America/Caracas

    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"

    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - /etc/traefik/letsencrypt:/etc/traefik/letsencrypt

    networks:
      - network_public

    deploy:
      mode: replicated
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      labels:
        - "traefik.enable=true"
        - "traefik.http.routers.api.rule=Host(\`traefik.artex.lat\`)"
        - "traefik.http.routers.api.entrypoints=websecure"
        - "traefik.http.routers.api.service=api@internal"
        - "traefik.http.routers.api.tls.certresolver=cloudflare"
        - "traefik.http.services.api.loadbalancer.server.port=8080"
EOFYAML

print_success "Configuration file created at /tmp/traefik-update.yml"

# ============================================================================
# 4. Preguntar si redeploy
# ============================================================================
print_header "Ready to Update Traefik"

echo ""
echo "This will:"
echo "  1. Enable logging (--log.level=INFO)"
echo "  2. Enable access logs (--accesslog=true)"
echo "  3. Fix Cloudflare API configuration (CF_API_EMAIL + CF_API_KEY)"
echo "  4. Redeploy Traefik service"
echo ""

read -p "Do you want to proceed? (y/n) " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled by user"
    exit 0
fi

# ============================================================================
# 5. Remover stack actual
# ============================================================================
print_info "Step 4: Removing current Traefik stack"

STACK_NAME=$(docker service inspect $TRAEFIK_SERVICE --format '{{index .Spec.Labels "com.docker.stack.namespace"}}' 2>/dev/null || echo "traefik")

echo "Stack name: $STACK_NAME"
docker stack rm $STACK_NAME

print_success "Stack removed, waiting for cleanup..."
sleep 15

# ============================================================================
# 6. Deploy nueva configuración
# ============================================================================
print_info "Step 5: Deploying Traefik with logging enabled"

docker stack deploy -c /tmp/traefik-update.yml $STACK_NAME

print_success "Traefik deployed with new configuration"

# ============================================================================
# 7. Esperar que inicie
# ============================================================================
print_info "Step 6: Waiting for Traefik to start (20 seconds)..."
sleep 20

# ============================================================================
# 8. Verificar logs
# ============================================================================
print_info "Step 7: Checking if logs are now visible"

echo ""
echo "Service status:"
docker service ls | grep traefik

echo ""
echo "Recent logs (should be visible now):"
docker service logs ${STACK_NAME}_traefik --tail 20 2>&1 || print_error "Still cannot read logs"

# ============================================================================
# 9. Instrucciones finales
# ============================================================================
print_header "Complete!"

echo ""
echo "✅ Traefik has been redeployed with logging enabled"
echo ""
echo "📋 To view logs:"
echo "   docker service logs ${STACK_NAME}_traefik -f"
echo ""
echo "🔍 To monitor certificate generation:"
echo "   docker service logs ${STACK_NAME}_traefik -f | grep -i acme"
echo ""
echo "⏰ Wait 2-3 minutes for certificate generation"
echo ""

print_success "Setup complete!"
