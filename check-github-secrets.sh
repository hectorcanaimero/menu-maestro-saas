#!/bin/bash

# Script para verificar que todos los secretos necesarios estén configurados en GitHub

set -e

echo "🔍 Verificando secretos de GitHub Actions..."
echo ""

# Lista de secretos requeridos
REQUIRED_SECRETS=(
  "VITE_SUPABASE_PROJECT_ID"
  "VITE_SUPABASE_PUBLISHABLE_KEY"
  "VITE_SUPABASE_URL"
  "VITE_POSTHOG_KEY"
  "VITE_POSTHOG_HOST"
  "VITE_POSTHOG_PERSONAL_KEY"
  "VITE_POSTHOG_API_KEY"
  "VITE_GOOGLE_MAPS"
)

# Verificar si gh CLI está instalado
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI (gh) no está instalado"
  echo ""
  echo "Instálalo con:"
  echo "  brew install gh"
  echo ""
  echo "O descárgalo de: https://cli.github.com/"
  exit 1
fi

# Verificar autenticación
if ! gh auth status &> /dev/null; then
  echo "❌ No estás autenticado en GitHub CLI"
  echo ""
  echo "Autentícate con:"
  echo "  gh auth login"
  exit 1
fi

echo "✅ GitHub CLI instalado y autenticado"
echo ""

# Obtener lista de secretos actuales
echo "📋 Secretos configurados actualmente:"
CURRENT_SECRETS=$(gh secret list --json name -q '.[].name')

if [ -z "$CURRENT_SECRETS" ]; then
  echo "⚠️  No se encontraron secretos configurados"
  echo ""
else
  echo "$CURRENT_SECRETS" | while read -r secret; do
    echo "  ✓ $secret"
  done
  echo ""
fi

# Verificar secretos requeridos
echo "🔍 Verificando secretos requeridos..."
echo ""

MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  if echo "$CURRENT_SECRETS" | grep -q "^${secret}$"; then
    echo "  ✅ $secret"
  else
    echo "  ❌ $secret (FALTANTE)"
    MISSING_SECRETS+=("$secret")
  fi
done

echo ""

# Resumen
if [ ${#MISSING_SECRETS[@]} -eq 0 ]; then
  echo "🎉 ¡Todos los secretos están configurados correctamente!"
else
  echo "⚠️  Faltan ${#MISSING_SECRETS[@]} secreto(s):"
  echo ""
  for secret in "${MISSING_SECRETS[@]}"; do
    echo "  - $secret"
  done
  echo ""
  echo "📖 Para agregar secretos, consulta: GITHUB-SECRETS.md"
  echo ""
  echo "O agrégalos manualmente en:"
  echo "  https://github.com/$(gh repo view --json nameWithOwner -q .nameWithOwner)/settings/secrets/actions"
  exit 1
fi
