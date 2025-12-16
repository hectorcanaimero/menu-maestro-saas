import { Eye, TrendingUp, AlertTriangle, Infinity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useViewLimitStatus } from '@/hooks/useViewLimitStatus';
import { useStore } from '@/contexts/StoreContext';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Card component to display catalog view usage in admin dashboard
 * Shows current views, limit, and percentage used
 */
export function CatalogViewsCard() {
  const { store } = useStore();
  const queryClient = useQueryClient();

  // Check if catalog mode is enabled
  const isCatalogMode = (store as any)?.catalog_mode ?? false;

  const { data: viewStatus, isLoading, refetch } = useViewLimitStatus(
    store?.id,
    isCatalogMode // Only fetch if catalog mode is enabled
  );

  // Don't show if catalog mode is disabled
  if (!isCatalogMode) {
    return null;
  }

  const handleRefresh = async () => {
    await refetch();
    // Also invalidate view limit query
    queryClient.invalidateQueries({ queryKey: ['view-limit-status', store?.id] });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vistas de Catálogo
          </CardTitle>
          <CardDescription>Cargando estadísticas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-20 flex items-center justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!viewStatus) {
    return null;
  }

  const { exceeded, currentViews, limit, percentage, isUnlimited } = viewStatus;

  // Determine status color and message
  const getStatusColor = () => {
    if (isUnlimited) return 'text-green-600';
    if (exceeded) return 'text-red-600';
    if (percentage >= 80) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getStatusBadge = () => {
    if (isUnlimited) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Infinity className="h-3 w-3 mr-1" />
          Ilimitado
        </Badge>
      );
    }
    if (exceeded) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Límite Excedido
        </Badge>
      );
    }
    if (percentage >= 80) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Cerca del Límite
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Activo
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Vistas de Catálogo
            </CardTitle>
            <CardDescription>Consumo del mes actual</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            <Button variant="ghost" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* View Count */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold" style={{ color: getStatusColor() }}>
              {currentViews.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              {isUnlimited ? 'Vistas ilimitadas' : `de ${limit?.toLocaleString()} vistas`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-5 w-5" />
            <span className="text-lg font-medium">{percentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* Progress Bar */}
        {!isUnlimited && (
          <div className="space-y-2">
            <Progress
              value={Math.min(percentage, 100)}
              className="h-2"
              indicatorClassName={
                exceeded
                  ? 'bg-red-600'
                  : percentage >= 80
                  ? 'bg-yellow-600'
                  : 'bg-green-600'
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{limit?.toLocaleString()}</span>
            </div>
          </div>
        )}

        {/* Warning Messages */}
        {exceeded && !isUnlimited && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800 font-medium">
              ⚠️ Has excedido el límite de vistas gratuitas
            </p>
            <p className="text-xs text-red-600 mt-1">
              Actualiza tu plan para continuar mostrando tu catálogo sin restricciones
            </p>
          </div>
        )}

        {percentage >= 80 && !exceeded && !isUnlimited && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium">
              ⚠️ Estás cerca del límite de vistas
            </p>
            <p className="text-xs text-yellow-600 mt-1">
              Considera actualizar tu plan para evitar interrupciones en tu catálogo
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
