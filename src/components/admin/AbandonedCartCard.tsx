import { ShoppingCart, DollarSign, TrendingDown, RefreshCw, AlertCircle, BarChart3, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/contexts/StoreContext';
import { usePostHogAbandonedCartStats } from '@/hooks/usePostHogAbandonedCart';
import { isPostHogAPIConfigured, getPostHogAPIConfigInstructions } from '@/lib/posthog-api';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Card component to display abandoned cart analytics from PostHog
 * Shows carts that were started but not completed
 */
export function AbandonedCartCard() {
  const { store } = useStore();

  const { data, isLoading, refetch, isError } = usePostHogAbandonedCartStats(
    store?.id,
    30, // Last 30 days
  );

  // Show API configuration warning
  if (!isPostHogAPIConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carritos Abandonados
          </CardTitle>
          <CardDescription>Análisis de carritos no completados</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-2">PostHog API no configurada</p>
              <p className="text-xs text-muted-foreground whitespace-pre-line">{getPostHogAPIConfigInstructions()}</p>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carritos Abandonados
          </CardTitle>
          <CardDescription>Cargando datos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Carritos Abandonados
          </CardTitle>
          <CardDescription>Error al cargar datos</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No se pudieron cargar los datos de PostHog. Verifica tu API key y conexión.
            </AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { totalAbandoned, totalValue, averageCartValue, recoveryRate } = data;

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Carritos Abandonados
            </CardTitle>
            <CardDescription>
              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Actualizado automáticamente cada 5 minutos</span>
                </div>
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              <TrendingDown className="h-3 w-3 mr-1" />
              Últimos 30 días
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Abandoned */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-900">Carritos Abandonados</span>
              <ShoppingCart className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-900">{totalAbandoned}</p>
            <p className="text-xs text-orange-700 mt-1">Últimos 30 días</p>
          </div>

          {/* Total Value Lost */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-red-900">Valor Perdido</span>
              <DollarSign className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-red-700 mt-1">Total en carritos abandonados</p>
          </div>

          {/* Average Cart Value */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-yellow-900">Valor Promedio</span>
              <DollarSign className="h-4 w-4 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-yellow-900">{formatCurrency(averageCartValue)}</p>
            <p className="text-xs text-yellow-700 mt-1">Por carrito abandonado</p>
          </div>

          {/* Recovery Rate */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Tasa de Recuperación</span>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{recoveryRate.toFixed(1)}%</p>
            <p className="text-xs text-blue-700 mt-1">Carritos recuperados</p>
          </div>
        </div>

        {/* Insights */}
        {totalAbandoned > 0 && (
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              Oportunidad de Recuperación
            </h4>
            <p className="text-sm text-muted-foreground">
              Tienes <strong>{totalAbandoned} carritos abandonados</strong> con un valor total de{' '}
              <strong>{formatCurrency(totalValue)}</strong>. Implementar recordatorios por email o WhatsApp podría
              recuperar hasta el 30% de estos carritos.
            </p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href="/admin/whatsapp" className="flex items-center gap-1">
                  Configurar WhatsApp
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        )}

        {totalAbandoned === 0 && (
          <div className="mt-4 bg-green-50 rounded-lg p-4 border border-green-200">
            <p className="text-sm text-green-800 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              ¡Excelente! No tienes carritos abandonados en los últimos 30 días.
            </p>
          </div>
        )}
        {/* Info Footer */}
      </CardContent>
    </Card>
  );
}
