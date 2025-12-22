#!/bin/bash
# ============================================================================
# Script de Diagnóstico para Wildcard SSL Certificate
# ============================================================================
#
# Este script diagnostica por qué Traefik no está generando certificados SSL
#
# Uso:
#   chmod +x diagnose-ssl.sh
#   ./diagnose-ssl.sh
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

print_check() {
    echo -e "${YELLOW}⏳ Checking: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# ============================================================================
# 1. Verificar DNS
# ============================================================================
print_header "1. DNS Configuration Check"

print_check "Resolving artex.lat"
if dig artex.lat @1.1.1.1 +short | grep -q .; then
    IP=$(dig artex.lat @1.1.1.1 +short | head -n 1)
    print_success "artex.lat resolves to: $IP"
else
    print_error "artex.lat does not resolve"
fi

print_check "Resolving www.artex.lat"
if dig www.artex.lat @1.1.1.1 +short | grep -q .; then
    IP=$(dig www.artex.lat @1.1.1.1 +short | head -n 1)
    print_success "www.artex.lat resolves to: $IP"
else
    print_error "www.artex.lat does not resolve"
fi

print_check "Resolving wildcard *.artex.lat"
if dig test.artex.lat @1.1.1.1 +short | grep -q .; then
    IP=$(dig test.artex.lat @1.1.1.1 +short | head -n 1)
    print_success "*.artex.lat resolves to: $IP"
else
    print_error "Wildcard *.artex.lat does not resolve"
    print_info "Add A record in Cloudflare: *.artex.lat → YOUR_SERVER_IP"
fi

# ============================================================================
# 2. Verificar Traefik
# ============================================================================
print_header "2. Traefik Service Check"

print_check "Traefik service status"
if docker service ls | grep -q traefik; then
    TRAEFIK_SERVICE=$(docker service ls | grep traefik | awk '{print $2}')
    print_success "Traefik service found: $TRAEFIK_SERVICE"

    REPLICAS=$(docker service ls | grep traefik | awk '{print $4}')
    if [[ $REPLICAS == "1/1" ]]; then
        print_success "Traefik is running (1/1 replicas)"
    else
        print_error "Traefik replicas: $REPLICAS (expected 1/1)"
    fi
else
    print_error "Traefik service not found"
    print_info "Deploy Traefik first: docker stack deploy -c traefik-v2-global-key.yaml traefik"
    exit 1
fi

# ============================================================================
# 3. Verificar acme.json
# ============================================================================
print_header "3. ACME Configuration Check"

print_check "acme.json file exists"
if [ -f /etc/traefik/letsencrypt/acme.json ]; then
    print_success "acme.json exists"

    print_check "acme.json permissions"
    PERMS=$(stat -c %a /etc/traefik/letsencrypt/acme.json 2>/dev/null || stat -f %A /etc/traefik/letsencrypt/acme.json)
    if [ "$PERMS" == "600" ]; then
        print_success "Permissions are correct (600)"
    else
        print_error "Permissions are $PERMS (should be 600)"
        print_info "Fix with: chmod 600 /etc/traefik/letsencrypt/acme.json"
    fi

    print_check "acme.json content"
    SIZE=$(wc -c < /etc/traefik/letsencrypt/acme.json)
    if [ $SIZE -gt 10 ]; then
        print_success "acme.json has content ($SIZE bytes)"

        if command -v jq &> /dev/null; then
            CERTS=$(cat /etc/traefik/letsencrypt/acme.json | jq '.cloudflare.Certificates // [] | length')
            if [ "$CERTS" != "null" ] && [ $CERTS -gt 0 ]; then
                print_success "Found $CERTS certificate(s) in acme.json"
                cat /etc/traefik/letsencrypt/acme.json | jq -r '.cloudflare.Certificates[].domain.main'
            else
                print_error "No certificates found in acme.json"
            fi
        fi
    else
        print_error "acme.json is empty"
        print_info "Traefik hasn't generated certificates yet"
    fi
else
    print_error "acme.json not found"
    print_info "Create with: touch /etc/traefik/letsencrypt/acme.json && chmod 600 /etc/traefik/letsencrypt/acme.json"
fi

# ============================================================================
# 4. Verificar Environment Variables
# ============================================================================
print_header "4. Cloudflare API Configuration"

print_check "Traefik environment variables"
if docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | grep -q "CF_API"; then
    print_success "Cloudflare environment variables found"

    if docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | grep -q "CF_API_EMAIL"; then
        EMAIL=$(docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | jq -r '.[] | select(startswith("CF_API_EMAIL")) | split("=")[1]')
        print_success "CF_API_EMAIL: $EMAIL"
    else
        print_error "CF_API_EMAIL not found"
    fi

    if docker service inspect $TRAEFIK_SERVICE --format '{{json .Spec.TaskTemplate.ContainerSpec.Env}}' | grep -q "CF_API_KEY"; then
        print_success "CF_API_KEY: *** (configured)"
    else
        print_error "CF_API_KEY not found"
        print_info "You need CF_API_KEY (not CF_DNS_API_TOKEN) when using Global API Key"
    fi
else
    print_error "No Cloudflare environment variables found"
    print_info "Add CF_API_EMAIL and CF_API_KEY to Traefik service"
fi

# ============================================================================
# 5. Verificar Logs de Traefik
# ============================================================================
print_header "5. Traefik Logs Analysis"

print_check "Recent ACME errors"
if docker service logs $TRAEFIK_SERVICE --tail 100 2>&1 | grep -i "error.*acme\|error.*certificate\|error.*cloudflare" | grep -v "grep"; then
    print_error "Found ACME errors in logs (shown above)"
else
    print_success "No ACME errors in recent logs"
fi

print_check "Certificate generation attempts"
if docker service logs $TRAEFIK_SERVICE --tail 200 2>&1 | grep -i "obtaining.*certificate\|acme.*artex" | tail -5; then
    print_info "Certificate generation logs (shown above)"
else
    print_info "No certificate generation attempts found"
fi

# ============================================================================
# 6. Verificar Certificado Actual
# ============================================================================
print_header "6. Current Certificate Check"

print_check "Certificate from www.artex.lat"
if timeout 5 openssl s_client -connect www.artex.lat:443 -servername www.artex.lat 2>/dev/null | openssl x509 -noout -subject -issuer 2>/dev/null; then
    SUBJECT=$(timeout 5 openssl s_client -connect www.artex.lat:443 -servername www.artex.lat 2>/dev/null | openssl x509 -noout -subject 2>/dev/null)

    if echo "$SUBJECT" | grep -q "TRAEFIK DEFAULT CERT"; then
        print_error "Using TRAEFIK DEFAULT CERT (self-signed)"
    elif echo "$SUBJECT" | grep -q "Let's Encrypt"; then
        print_success "Using Let's Encrypt certificate"
    else
        print_info "Certificate: $SUBJECT"
    fi
else
    print_error "Cannot connect to www.artex.lat:443"
fi

# ============================================================================
# 7. Verificar Puertos
# ============================================================================
print_header "7. Port Check"

print_check "Port 80 is listening"
if netstat -tuln | grep -q ":80 "; then
    print_success "Port 80 is open"
else
    print_error "Port 80 is not listening"
fi

print_check "Port 443 is listening"
if netstat -tuln | grep -q ":443 "; then
    print_success "Port 443 is open"
else
    print_error "Port 443 is not listening"
fi

# ============================================================================
# 8. Verificar Labels del Servicio
# ============================================================================
print_header "8. Service Labels Check"

print_check "pideai service labels"
if docker service ls | grep -q pideai; then
    if docker service inspect pideai_app --format '{{json .Spec.Labels}}' | jq -r 'to_entries[] | select(.key | contains("certresolver")) | "\(.key)=\(.value)"'; then
        print_success "Certificate resolver labels found (shown above)"
    else
        print_error "No certresolver labels found in pideai_app service"
        print_info "Add label: traefik.http.routers.pideai-https.tls.certresolver=cloudflare"
    fi
else
    print_info "pideai service not deployed yet"
fi

# ============================================================================
# 9. Resumen
# ============================================================================
print_header "9. Summary & Recommendations"

echo ""
echo "Common issues and fixes:"
echo ""
echo "1. TRAEFIK DEFAULT CERT:"
echo "   → Traefik couldn't get Let's Encrypt certificate"
echo "   → Check CF_API_KEY and CF_API_EMAIL are correct"
echo "   → Check acme.json permissions (must be 600)"
echo ""
echo "2. Empty acme.json:"
echo "   → Wait 2-3 minutes after deploy"
echo "   → Check Traefik logs for errors"
echo "   → Verify DNS is resolving"
echo ""
echo "3. Authentication failed:"
echo "   → Test Cloudflare API manually:"
echo "   → curl -X GET 'https://api.cloudflare.com/client/v4/user' \\"
echo "     -H 'X-Auth-Email: YOUR_EMAIL' \\"
echo "     -H 'X-Auth-Key: YOUR_GLOBAL_KEY'"
echo ""
echo "Next steps:"
echo "1. Review logs: docker service logs ${TRAEFIK_SERVICE} -f"
echo "2. Check full guide: WILDCARD_SSL_TROUBLESHOOTING.md"
echo "3. If still failing, try HTTP-01 challenge instead of DNS-01"
echo ""

print_info "Diagnosis complete!"
