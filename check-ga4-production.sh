#!/bin/bash

# Script para verificar Google Analytics en producción
# Uso: ./check-ga4-production.sh <URL_DE_PRODUCCION>

PROD_URL="${1:-https://pideai.com}"

echo "🔍 Verificando Google Analytics 4 en producción"
echo "URL: $PROD_URL"
echo ""

# 1. Verificar si hay referencias a Google Analytics en el HTML/JS
echo "📄 Verificando referencias a Google Analytics en el código..."
RESPONSE=$(curl -s "$PROD_URL")

if echo "$RESPONSE" | grep -q "googletagmanager.com\|google-analytics.com"; then
    echo "✅ Se encontraron referencias a Google Analytics"
else
    echo "❌ NO se encontraron referencias a Google Analytics"
    echo ""
    echo "⚠️  Posibles causas:"
    echo "   1. La imagen Docker no tiene la variable VITE_GA4_MEASUREMENT_ID"
    echo "   2. La aplicación no está usando la versión v3.0.37"
    echo "   3. El build no incluyó el código de Google Analytics"
fi

echo ""

# 2. Verificar si el Measurement ID está en el código
echo "🔑 Buscando Measurement ID en el código..."
if echo "$RESPONSE" | grep -q "G-[A-Z0-9]\{10\}"; then
    MEASUREMENT_ID=$(echo "$RESPONSE" | grep -o 'G-[A-Z0-9]\{10\}' | head -1)
    echo "✅ Measurement ID encontrado: $MEASUREMENT_ID"
else
    echo "❌ NO se encontró el Measurement ID"
    echo ""
    echo "⚠️  Esto indica que VITE_GA4_MEASUREMENT_ID no está disponible en el build"
fi

echo ""

# 3. Verificar peticiones a Google Analytics
echo "🌐 Verificando si se envían peticiones a Google Analytics..."
echo "(Esto requiere que visites el sitio manualmente)"
echo ""
echo "📋 Pasos para verificar manualmente:"
echo ""
echo "1. Abre tu sitio en producción: $PROD_URL"
echo "2. Abre las DevTools (F12)"
echo "3. Ve a la pestaña 'Network'"
echo "4. Filtra por 'google-analytics.com' o 'gtag'"
echo "5. Recarga la página"
echo ""
echo "✅ Deberías ver peticiones como:"
echo "   - https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
echo "   - https://www.google-analytics.com/g/collect?..."
echo ""
echo "❌ Si NO ves peticiones:"
echo "   - Verifica que el secret VITE_GA4_MEASUREMENT_ID esté configurado"
echo "   - Asegúrate de que el contenedor esté usando la imagen v3.0.37"
echo ""

# 4. Verificar la consola del navegador
echo "🖥️  Para verificar en la consola del navegador:"
echo ""
echo "1. Abre la consola (F12 → Console)"
echo "2. Escribe: window.gtag"
echo "3. Si devuelve una función, GA está inicializado"
echo "4. Escribe: window.dataLayer"
echo "5. Si devuelve un array, GA está cargado"
echo ""

# 5. Verificar en GA4 Real-Time
echo "📊 Para verificar en Google Analytics:"
echo ""
echo "1. Ve a https://analytics.google.com/"
echo "2. Selecciona tu propiedad"
echo "3. Reports → Realtime"
echo "4. Visita tu sitio en producción: $PROD_URL"
echo "5. Deberías ver actividad en 30-60 segundos"
echo ""

echo "═══════════════════════════════════════════════════"
echo ""
echo "🔧 Si no funciona, ejecuta estos comandos:"
echo ""
echo "# Ver el valor del secret"
echo "gh secret list | grep GA4"
echo ""
echo "# Ver detalles del último build"
echo "gh run list --workflow=docker-publish.yml --limit 1"
echo ""
echo "# Forzar un nuevo build (si es necesario)"
echo "git tag -d v3.0.37"
echo "git push origin :refs/tags/v3.0.37"
echo "git tag v3.0.37"
echo "git push --tags"
echo ""
echo "═══════════════════════════════════════════════════"
