#!/bin/bash

# Script para construir y desplegar la aplicación en Docker Swarm
# Incluye todas las variables de entorno necesarias para PostHog

set -e

echo "🚀 Iniciando proceso de build y deploy..."

# Cargar variables del archivo .env.production
if [ ! -f .env.production ]; then
  echo "❌ Error: .env.production no encontrado"
  exit 1
fi

echo "📦 Cargando variables de entorno..."
export $(grep -v '^#' .env.production | xargs)

# Construir imagen con todas las variables
echo "🔨 Construyendo imagen Docker..."
docker build \
  --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
  --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
  --build-arg VITE_POSTHOG_KEY="$VITE_POSTHOG_KEY" \
  --build-arg VITE_POSTHOG_HOST="$VITE_POSTHOG_HOST" \
  --build-arg VITE_POSTHOG_PERSONAL_KEY="$VITE_POSTHOG_PERSONAL_KEY" \
  --build-arg VITE_POSTHOG_API_KEY="$VITE_POSTHOG_API_KEY" \
  -t pideai-app:v3.0.8 \
  -t ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.8 \
  -t ghcr.io/hectorcanaimero/menu-maestro-saas:latest \
  .

echo "✅ Imagen construida exitosamente"

# Preguntar si desea subir a GitHub Container Registry
read -p "¿Deseas subir la imagen a GitHub Container Registry? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "📤 Subiendo imagen a ghcr.io..."
  docker push ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.8
  docker push ghcr.io/hectorcanaimero/menu-maestro-saas:latest
  echo "✅ Imagen subida exitosamente"

  # Preguntar si desea actualizar Docker Swarm
  read -p "¿Deseas actualizar el servicio en Docker Swarm? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 Actualizando servicio en Docker Swarm..."
    docker stack deploy -c docker-compose.swarm.yml pideai
    echo "✅ Servicio actualizado"

    echo ""
    echo "📊 Verificando estado del servicio..."
    docker service ls | grep pideai
    echo ""
    echo "🎉 Deploy completado exitosamente!"
  fi
else
  echo "ℹ️  Imagen construida pero no subida. Puedes subirla manualmente con:"
  echo "   docker push ghcr.io/hectorcanaimero/menu-maestro-saas:v3.0.8"
  echo "   docker push ghcr.io/hectorcanaimero/menu-maestro-saas:latest"
fi
