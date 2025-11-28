#!/bin/bash
# Script para construir imagen Docker custom con variables de producción

set -e

echo "🔧 Building custom Docker image with production environment variables..."

# Load .env.production
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.production not found"
    exit 1
fi

# Build image with build arguments
docker build \
    -f Dockerfile.custom \
    --build-arg VITE_SUPABASE_PROJECT_ID="$VITE_SUPABASE_PROJECT_ID" \
    --build-arg VITE_SUPABASE_PUBLISHABLE_KEY="$VITE_SUPABASE_PUBLISHABLE_KEY" \
    --build-arg VITE_SUPABASE_URL="$VITE_SUPABASE_URL" \
    --build-arg VITE_POSTHOG_KEY="$VITE_POSTHOG_KEY" \
    --build-arg VITE_POSTHOG_HOST="$VITE_POSTHOG_HOST" \
    --build-arg VITE_POSTHOG_PERSONAL_KEY="$VITE_POSTHOG_PERSONAL_KEY" \
    -t pideai-custom:latest \
    -t pideai-custom:$(date +%Y%m%d-%H%M%S) \
    .

echo "✅ Build complete!"
echo ""
echo "📦 Image tags:"
echo "   - pideai-custom:latest"
echo "   - pideai-custom:$(date +%Y%m%d-%H%M%S)"
echo ""
echo "🚀 Next steps:"
echo "   1. Test locally:"
echo "      docker run -p 80:80 pideai-custom:latest"
echo ""
echo "   2. Tag for your registry:"
echo "      docker tag pideai-custom:latest YOUR_REGISTRY/pideai:latest"
echo ""
echo "   3. Push to registry:"
echo "      docker push YOUR_REGISTRY/pideai:latest"
echo ""
echo "   4. Update portainer-stack.yml:"
echo "      image: YOUR_REGISTRY/pideai:latest"
