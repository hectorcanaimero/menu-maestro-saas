#!/bin/bash
# ============================================================================
# Script para Corregir Configuración SSL de Traefik
# ============================================================================
#
# Este script actualiza Traefik para usar Global API Key correctamente
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

# ============================================================================
# Configuración
# ============================================================================
CF_API_EMAIL="knaimero@gmail.com"
CF_API_KEY="8c5f6c41e9c14f791b1f2d24925d30d6bbb56"
ACME_EMAIL="knaimero@gmail.com"

print_header "Fixing Traefik SSL Configuration"

# ============================================================================
# 1. Backup actual
# ============================================================================
print_info "Step 1: Creating backup of current acme.json"
if [ -f /etc/traefik/letsencrypt/acme.json ]; then
    cp /etc/traefik/letsencrypt/acme.json /etc/traefik/letsencrypt/acme.json.backup.$(date +%Y%m%d_%H%M%S)
    print_success "Backup created"
fi

# ============================================================================
# 2. Limpiar acme.json
# ============================================================================
print_info "Step 2: Cleaning acme.json to force certificate regeneration"
rm -f /etc/traefik/letsencrypt/acme.json
rm -f /etc/traefik/letsencrypt/acme-http.json
touch /etc/traefik/letsencrypt/acme.json
chmod 600 /etc/traefik/letsencrypt/acme.json
touch /etc/traefik/letsencrypt/acme-http.json
chmod 600 /etc/traefik/letsencrypt/acme-http.json
print_success "acme.json cleaned and permissions set to 600"

# ============================================================================
# 3. Verificar servicio Traefik
# ============================================================================
print_info "Step 3: Checking Traefik service"
if docker service ls | grep -q traefik; then
    TRAEFIK_SERVICE=$(docker service ls | grep traefik | awk '{print $2}')
    print_success "Found Traefik service: $TRAEFIK_SERVICE"
else
    print_error "Traefik service not found!"
    exit 1
fi

# ============================================================================
# 4. Actualizar variables de entorno
# ============================================================================
print_info "Step 4: Updating Traefik environment variables"

echo "Removing old CF_DNS_API_TOKEN (if exists)..."
docker service update \
    --env-rm CF_DNS_API_TOKEN \
    $TRAEFIK_SERVICE 2>/dev/null || echo "  (variable didn't exist)"

echo "Adding CF_API_EMAIL and CF_API_KEY..."
docker service update \
    --env-add CF_API_EMAIL="$CF_API_EMAIL" \
    --env-add CF_API_KEY="$CF_API_KEY" \
    $TRAEFIK_SERVICE

print_success "Environment variables updated"

# ============================================================================
# 5. Verificar actualización
# ============================================================================
print_info "Step 5: Verifying new configuration"
sleep 5

if docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | grep -q "CF_API_EMAIL"; then
    print_success "CF_API_EMAIL configured"
else
    print_error "CF_API_EMAIL not found"
fi

if docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | grep -q "CF_API_KEY"; then
    print_success "CF_API_KEY configured"
else
    print_error "CF_API_KEY not found"
fi

# ============================================================================
# 6. Forzar recreación de containers
# ============================================================================
print_info "Step 6: Forcing Traefik container recreation"
docker service update --force $TRAEFIK_SERVICE
print_success "Traefik is restarting with new configuration"

# ============================================================================
# 7. Esperar y verificar
# ============================================================================
print_info "Step 7: Waiting for Traefik to start (30 seconds)..."
sleep 30

print_info "Checking Traefik logs for certificate generation..."
docker service logs $TRAEFIK_SERVICE --tail 50 2>&1 | grep -i "acme\|certificate" || echo "No certificate logs yet (wait a bit more)"

# ============================================================================
# 8. Instrucciones finales
# ============================================================================
print_header "Next Steps"

echo ""
echo "✅ Traefik has been reconfigured to use Global API Key"
echo ""
echo "📋 To monitor certificate generation:"
echo "   docker service logs traefik_traefik -f"
echo ""
echo "🔍 To check if certificate was generated (wait 2-3 minutes):"
echo "   cat /etc/traefik/letsencrypt/acme.json | jq ."
echo ""
echo "🌐 To test the certificate:"
echo "   curl -I https://www.artex.lat"
echo "   openssl s_client -connect www.artex.lat:443 -servername www.artex.lat 2>/dev/null | openssl x509 -noout -subject -issuer"
echo ""
echo "⏰ Certificate generation may take 2-5 minutes."
echo "   Watch the logs for: 'acme: Validations succeeded; requesting certificates'"
echo ""

print_success "Configuration update complete!"
