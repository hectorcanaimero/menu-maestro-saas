import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, RefreshCw, TrendingUp, AlertTriangle, Store as StoreIcon, Infinity, ExternalLink } from 'lucide-react';
import { H1, Body } from '@/components/ui/typography';
import posthog from 'posthog-js';

interface StoreWithViews {
  id: string;
  name: string;
  subdomain: string;
  owner_email: string;
  current_views: number;
  view_limit: number | null;
  percentage: number;
  exceeded: boolean;
  is_unlimited: boolean;
  catalog_mode: boolean;
}

/**
 * Platform Admin page to manage catalog views for all stores
 * Shows stores in catalog mode with their view counts and limits
 */
export default function CatalogViewsManager() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch all stores in catalog mode with their view stats
  const {
    data: stores,
    isLoading,
    error: queryError,
    refetch,
  } = useQuery({
    queryKey: ['catalog-stores-views'],
    queryFn: async (): Promise<StoreWithViews[]> => {
      console.log('🔍 Fetching catalog stores...');

      // Get all stores in catalog mode with owner profile
      const { data: catalogStores, error: storesError } = await supabase
        .from('stores')
        .select(
          `
          id,
          name,
          subdomain,
          catalog_mode,
          owner_id,
          profiles!stores_owner_id_fkey (
            email
          )
        `,
        )
        .eq('catalog_mode', true);

      if (storesError) {
        console.error('❌ Error fetching catalog stores:', storesError);
        throw storesError;
      }

      console.log(`✅ Found ${catalogStores?.length || 0} stores in catalog mode:`, catalogStores);

      if (!catalogStores || catalogStores.length === 0) {
        console.log('⚠️ No stores found with catalog_mode = true');
        return [];
      }

      // For each store, get view limit status
      const storesWithViews = await Promise.all(
        (catalogStores || []).map(async (store) => {
          console.log(`📊 Checking view limit for store: ${store.name} (${store.id})`);

          const { data: limitStatus, error: limitError } = await supabase.rpc('check_catalog_view_limit', {
            p_store_id: store.id,
          });

          if (limitError) {
            console.error(`❌ Error checking limit for ${store.name}:`, limitError);
            return null;
          }

          console.log(`✅ Limit status for ${store.name}:`, limitStatus);

          const status = limitStatus as any;
          const ownerEmail = (store as any).profiles?.email || 'Unknown';

          return {
            id: store.id,
            name: store.name,
            subdomain: store.subdomain,
            owner_email: ownerEmail,
            current_views: status.current_views || 0,
            view_limit: status.limit,
            percentage: status.percentage || 0,
            exceeded: status.exceeded || false,
            is_unlimited: status.is_unlimited || false,
            catalog_mode: store.catalog_mode || false,
          } as StoreWithViews;
        }),
      );

      const validStores = storesWithViews.filter((s) => s !== null) as StoreWithViews[];
      console.log(`✅ Successfully processed ${validStores.length} stores:`, validStores);

      return validStores;
    },
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getStatusBadge = (store: StoreWithViews) => {
    if (store.is_unlimited) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <Infinity className="h-3 w-3 mr-1" />
          Ilimitado
        </Badge>
      );
    }
    if (store.exceeded) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Excedido
        </Badge>
      );
    }
    if (store.percentage >= 80) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {store.percentage.toFixed(0)}%
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
        Activo
      </Badge>
    );
  };

  const totalStores = stores?.length || 0;
  const exceededStores = stores?.filter((s) => s.exceeded).length || 0;
  const warningStores = stores?.filter((s) => !s.exceeded && s.percentage >= 80).length || 0;
  const totalViews = stores?.reduce((sum, s) => sum + s.current_views, 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <H1 className="text-3xl font-bold">Gestión de Catálogos</H1>
        <Body className="text-muted-foreground">
          Monitorea las vistas de catálogo de todas las tiendas en modo catálogo
        </Body>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tiendas</CardTitle>
            <StoreIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStores}</div>
            <p className="text-xs text-muted-foreground">En modo catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Vistas</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Este mes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Límite Excedido</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{exceededStores}</div>
            <p className="text-xs text-muted-foreground">Tiendas bloqueadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cerca del Límite</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningStores}</div>
            <p className="text-xs text-muted-foreground">&gt;80% del límite</p>
          </CardContent>
        </Card>
      </div>

      {/* Stores Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tiendas en Modo Catálogo</CardTitle>
              <CardDescription>Lista de todas las tiendas con catálogo activo</CardDescription>
            </div>
            <Button onClick={handleRefresh} disabled={isRefreshing || isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {queryError && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800 font-medium">Error al cargar datos:</p>
              <p className="text-xs text-red-600 mt-1">{(queryError as Error).message}</p>
            </div>
          )}
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stores && stores.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tienda</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Vistas Actuales</TableHead>
                    <TableHead>Límite</TableHead>
                    <TableHead>Porcentaje</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stores.map((store) => (
                    <TableRow key={store.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{store.name}</div>
                          <div className="text-sm text-muted-foreground">{store.subdomain}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{store.owner_email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{store.current_views.toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {store.is_unlimited ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <Infinity className="h-4 w-4" />
                            <span className="text-sm font-medium">Ilimitado</span>
                          </div>
                        ) : (
                          <span className="font-medium">{store.view_limit?.toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden" style={{ minWidth: '80px' }}>
                              <div
                                className={`h-full transition-all ${
                                  store.exceeded
                                    ? 'bg-red-600'
                                    : store.percentage >= 80
                                    ? 'bg-yellow-600'
                                    : 'bg-green-600'
                                }`}
                                style={{ width: `${Math.min(store.percentage, 100)}%` }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-medium whitespace-nowrap">{store.percentage.toFixed(1)}%</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(store)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const url = `https://${store.subdomain}.pideai.com`;
                            window.open(url, '_blank');
                          }}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No hay tiendas en modo catálogo</p>
              <p className="text-sm mt-2">
                Para que una tienda aparezca aquí, debe tener <code className="bg-gray-100 px-2 py-1 rounded text-xs">catalog_mode = true</code>
              </p>
              <div className="mt-4 text-xs text-left max-w-md mx-auto bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="font-semibold text-blue-900 mb-2">💡 Para habilitar el modo catálogo:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-800">
                  <li>Ve a la configuración de la tienda</li>
                  <li>Busca "Modo de Operación"</li>
                  <li>Selecciona "Catálogo Digital"</li>
                  <li>Guarda los cambios</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
