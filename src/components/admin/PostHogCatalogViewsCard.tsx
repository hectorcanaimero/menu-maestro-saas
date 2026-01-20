import { Eye, TrendingUp, Users, RefreshCw, BarChart3, AlertCircle, Activity, Infinity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/contexts/StoreContext';
import { usePostHogCatalogViews } from '@/hooks/usePostHogCatalogViews';
import { isPostHogAPIConfigured, getPostHogAPIConfigInstructions } from '@/lib/posthog-api';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Card component to display PostHog catalog view analytics in admin dashboard
 * Shows real-time data from PostHog about catalog page visits
 */
export function PostHogCatalogViewsCard() {
  const { store } = useStore();
  const isCatalogMode = store?.catalog_mode ?? false;

  const { data, isLoading, refetch, isError } = usePostHogCatalogViews(
    store?.id,
    30, // Last 30 days
    true, // Only fetch if catalog mode is enabled
  );

  // Don't show if catalog mode is disabled
  // if (!isCatalogMode) {
  //   return null;
  // }

  // Show API configuration warning
  if (!isPostHogAPIConfigured()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics de la Tienda
          </CardTitle>
          <CardDescription>Datos en tiempo real de visitas a tu catálogo</CardDescription>
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
            <BarChart3 className="h-5 w-5" />
            Analytics de la tienda
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
            <BarChart3 className="h-5 w-5" />
            Analytics de Catálogo (PostHog)
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

  const { totalViews, uniqueVisitors, viewsPerVisitor } = data;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics de la Tienda
            </CardTitle>
            <CardDescription>
              <div className="mt-2 pt-2 border-t flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  <span>Actualizado automáticamente cada 5 minutos</span>
                </div>
              </div>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <Eye className="h-3 w-3 mr-1" />
              Últimos 30 días
            </Badge>
            <Button variant="ghost" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Views */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">Total de Vistas</span>
              <Eye className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-blue-900">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-blue-700 mt-1">Vistas totales del catálogo</p>
          </div>

          {/* Unique Visitors */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-900">Visitantes Únicos</span>
              <Users className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-green-900">{uniqueVisitors.toLocaleString()}</p>
            <p className="text-xs text-green-700 mt-1">Personas diferentes</p>
          </div>

          {/* Views per Visitor */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-900">Vistas por Visitante</span>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-purple-900">{viewsPerVisitor.toFixed(1)}</p>
            <p className="text-xs text-purple-700 mt-1">Promedio de vistas por usuario</p>
          </div>
        </div>
        {/* Info Footer */}
      </CardContent>
    </Card>
  );
}
