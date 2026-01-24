#!/bin/bash

# ============================================================================
# Script de Verificación de PostHog en Producción
# ============================================================================
#
# Este script verifica que PostHog esté configurado correctamente en producción
#
# Uso:
#   ./scripts/verify-posthog-production.sh [DOMAIN]
#
# Ejemplo:
#   ./scripts/verify-posthog-production.sh pideai.com
#   ./scripts/verify-posthog-production.sh tienda1.pideai.com
#
# ============================================================================

set -e

# ----------------------------------------------------------------------------
# Colores para output
# ----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# ----------------------------------------------------------------------------
# Configuración
# ----------------------------------------------------------------------------
DOMAIN="${1:-pideai.com}"
URL="https://${DOMAIN}"

echo ""
log_info "Verificando PostHog en: $URL"
echo ""

# ----------------------------------------------------------------------------
# Test 1: Verificar que el sitio esté accesible
# ----------------------------------------------------------------------------
log_info "Test 1: Verificando accesibilidad del sitio..."

if curl -s -f -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
    log_success "Sitio accesible (HTTP 200)"
else
    log_error "Sitio no accesible o devolvió error"
    exit 1
fi

# ----------------------------------------------------------------------------
# Test 2: Buscar código de PostHog en el HTML
# ----------------------------------------------------------------------------
log_info "Test 2: Buscando código de PostHog en el HTML..."

HTML=$(curl -s "$URL")

if echo "$HTML" | grep -q "posthog"; then
    log_success "Código de PostHog encontrado en el HTML"
else
    log_warning "No se encontró referencia a 'posthog' en el HTML"
fi

# ----------------------------------------------------------------------------
# Test 3: Buscar la key de PostHog en los archivos JS
# ----------------------------------------------------------------------------
log_info "Test 3: Buscando PostHog key en archivos JavaScript..."

# Obtener el index.html y buscar archivos JS
JS_FILES=$(echo "$HTML" | grep -oE 'src="[^"]+\.js"' | sed 's/src="//;s/"//' | head -5)

FOUND_KEY=false
for js_file in $JS_FILES; do
    # Construir URL completa si es relativa
    if [[ $js_file == /* ]]; then
        JS_URL="$URL$js_file"
    elif [[ $js_file == http* ]]; then
        JS_URL="$js_file"
    else
        JS_URL="$URL/$js_file"
    fi

    # Buscar la key de PostHog en el archivo JS
    if curl -s "$JS_URL" | grep -q "phc_"; then
        KEY=$(curl -s "$JS_URL" | grep -oE "phc_[a-zA-Z0-9]{43}" | head -1)
        log_success "PostHog key encontrada: ${KEY:0:20}..."
        FOUND_KEY=true
        break
    fi
done

if [ "$FOUND_KEY" = false ]; then
    log_warning "No se encontró la key de PostHog en los archivos JS"
    log_info "Esto puede significar que las variables de entorno no se compilaron en el build"
fi

# ----------------------------------------------------------------------------
# Test 4: Verificar requests a PostHog (requiere navegador)
# ----------------------------------------------------------------------------
log_info "Test 4: Verificación de requests a PostHog"
log_warning "Este test requiere verificación manual en el navegador:"
echo ""
echo "  1. Abre $URL en tu navegador"
echo "  2. Abre DevTools (F12) → Network tab"
echo "  3. Filtra por 'posthog' o 'us.i.posthog.com'"
echo "  4. Recarga la página"
echo "  5. Deberías ver requests POST a us.i.posthog.com/e/"
echo ""

# ----------------------------------------------------------------------------
# Test 5: Verificar en consola del navegador
# ----------------------------------------------------------------------------
log_info "Test 5: Verificación en consola del navegador"
log_warning "Este test requiere verificación manual:"
echo ""
echo "  1. Abre $URL en tu navegador"
echo "  2. Abre la consola (F12) → Console tab"
echo "  3. Ejecuta: window.posthog"
echo "  4. Debería mostrar un objeto, NO 'undefined'"
echo "  5. Ejecuta: window.posthog?.get_distinct_id()"
echo "  6. Debería devolver un ID, NO 'undefined'"
echo ""

# ----------------------------------------------------------------------------
# Test 6: Verificar en PostHog Dashboard
# ----------------------------------------------------------------------------
log_info "Test 6: Verificación en PostHog Dashboard"
log_warning "Verifica en PostHog Dashboard:"
echo ""
echo "  1. Ve a: https://us.posthog.com/project/88656/events"
echo "  2. Busca eventos recientes (últimos 5 minutos)"
echo "  3. Filtra por: event = 'catalog_page_view'"
echo "  4. Filtra por: \$host contains '$DOMAIN'"
echo "  5. Deberías ver eventos de tu dominio"
echo ""

# ----------------------------------------------------------------------------
# Resumen
# ----------------------------------------------------------------------------
echo ""
log_info "==================================================================="
log_info "RESUMEN DE VERIFICACIÓN"
log_info "==================================================================="
echo ""

if [ "$FOUND_KEY" = true ]; then
    log_success "PostHog parece estar configurado correctamente"
    log_info "Completa las verificaciones manuales (Tests 4-6) para confirmar"
else
    log_error "PostHog NO está configurado correctamente"
    log_info "Posibles causas:"
    echo "  - El build no incluyó las variables VITE_POSTHOG_*"
    echo "  - No se hizo deploy de la nueva imagen"
    echo "  - Cache del navegador mostrando versión antigua"
    echo ""
    log_info "Soluciones:"
    echo "  1. Verifica .env.production tiene las variables PostHog"
    echo "  2. Rebuild: ./scripts/build-docker-image.sh --push --tag v3.0.49"
    echo "  3. Deploy: ./scripts/deploy-to-swarm.sh"
    echo "  4. Limpia cache del navegador (Ctrl+Shift+R)"
fi

echo ""
