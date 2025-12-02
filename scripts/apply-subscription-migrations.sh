#!/bin/bash
# Script para aplicar solo las migraciones del sistema de suscripción
# Esto evita aplicar todas las 46 migraciones pendientes

echo "🚀 Aplicando migraciones del sistema de suscripción..."
echo ""

# Aplicar solo las 4 migraciones de suscripción
echo "📦 Aplicando migración 1/4: subscription_system.sql"
npx supabase db push --include-all=false \
  supabase/migrations/20251202000001_subscription_system.sql

echo ""
echo "📦 Aplicando migración 2/4: subscription_functions.sql"
npx supabase db push --include-all=false \
  supabase/migrations/20251202000002_subscription_functions.sql

echo ""
echo "📦 Aplicando migración 3/4: subscription_security.sql"
npx supabase db push --include-all=false \
  supabase/migrations/20251202000003_subscription_security.sql

echo ""
echo "📦 Aplicando migración 4/4: integrate_subscription_limits.sql"
npx supabase db push --include-all=false \
  supabase/migrations/20251202000004_integrate_subscription_limits.sql

echo ""
echo "✅ Migraciones de suscripción aplicadas"
echo ""
echo "📋 Ejecuta el script de setup para verificar:"
echo "   psql -f docs/setup-subscription-system.sql"
