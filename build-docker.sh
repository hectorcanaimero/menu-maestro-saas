#!/bin/bash

# Script para construir la imagen Docker con variables de entorno de .env.production

set -e

# Cargar variables del archivo .env.production
if [ ! -f .env.production ]; then
  echo "Error: .env.production no encontrado"
  exit 1
fi

# Exportar variables
export $(grep -v '^#' .env.production | xargs)

# Construir imagen
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_POSTHOG_KEY="$VITE_POSTHOG_KEY" \
  --build-arg VITE_POSTHOG_HOST="$VITE_POSTHOG_HOST" \
  --build-arg VITE_POSTHOG_PERSONAL_KEY="$VITE_POSTHOG_PERSONAL_KEY" \
  --build-arg VITE_POSTHOG_API_KEY="$VITE_POSTHOG_API_KEY" \
  -t pideai-app:latest \
  -t pideai-app:v3.0.8 \
  .

echo "✅ Imagen construida exitosamente: pideai-app:v3.0.8"
