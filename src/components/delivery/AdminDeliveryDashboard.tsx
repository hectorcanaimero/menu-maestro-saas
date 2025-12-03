import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Truck, MapPin, Clock } from 'lucide-react';
import { DeliveryMap } from './DeliveryMap';
import { DriverLocationMarker } from './DriverLocationMarker';
import { useDrivers } from '@/hooks/useDrivers';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { Body, Caption } from '@/components/ui/typography';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeliveryWithOrder {
  id: string;
  order_id: string;
  status: string;
  assigned_at: string;
  estimated_minutes: number | null;
  driver: {
    id: string;
    name: string;
    phone: string;
    photo_url: string | null;
    current_lat: number | null;
    current_lng: number | null;
    vehicle_type: string;
  };
  orders: {
    id: string;
    customer_name: string;
    delivery_address: string;
    delivery_lat: number | null;
    delivery_lng: number | null;
  };
}

export function AdminDeliveryDashboard() {
  const { store } = useStore();
  const { drivers, isLoading: isLoadingDrivers } = useDrivers();

  // Debug: Log store info
  console.log('[AdminDeliveryDashboard] Store:', store?.id, store?.name);

  // Get active deliveries
  const { data: activeDeliveries, isLoading: isLoadingDeliveries, error: deliveriesError } = useQuery({
    queryKey: ['active-deliveries', store?.id],
    queryFn: async () => {
      console.log('[AdminDeliveryDashboard] Fetching active deliveries for store:', store?.id);

      if (!store?.id) {
        console.log('[AdminDeliveryDashboard] No store ID, returning empty array');
        return [];
      }

      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          id,
          order_id,
          status,
          assigned_at,
          estimated_minutes,
          driver:drivers (
            id,
            name,
            phone,
            photo_url,
            current_lat,
            current_lng,
            vehicle_type
          ),
          orders (
            id,
            customer_name,
            delivery_address,
            delivery_lat,
            delivery_lng
          )
        `)
        .eq('store_id', store.id)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('assigned_at', { ascending: false });

      if (error) {
        console.error('[AdminDeliveryDashboard] Error fetching active deliveries:', error);
        throw error;
      }
      console.log('[AdminDeliveryDashboard] Active deliveries fetched:', data);
      console.log('[AdminDeliveryDashboard] Number of active deliveries:', data?.length || 0);
      return data as DeliveryWithOrder[];
    },
    enabled: !!store?.id,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Get statistics
  const { data: stats } = useQuery({
    queryKey: ['delivery-stats', store?.id],
    queryFn: async () => {
      if (!store?.id) return { today: 0, in_transit: 0, completed: 0 };

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Count deliveries today
      const { count: todayCount } = await supabase
        .from('delivery_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .gte('assigned_at', today.toISOString());

      // Count in transit
      const { count: inTransitCount } = await supabase
        .from('delivery_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'in_transit');

      // Count completed today
      const { count: completedCount } = await supabase
        .from('delivery_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', store.id)
        .eq('status', 'delivered')
        .gte('delivered_at', today.toISOString());

      return {
        today: todayCount || 0,
        in_transit: inTransitCount || 0,
        completed: completedCount || 0,
      };
    },
    enabled: !!store?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const activeDrivers = drivers?.filter((d) => d.status === 'available' || d.status === 'busy') || [];
  const driversWithLocation = activeDrivers.filter((d) => d.current_lat && d.current_lng);

  // Calculate map center (average of all driver locations or store location)
  const mapCenter = driversWithLocation.length > 0
    ? {
        lat: driversWithLocation.reduce((sum, d) => sum + (d.current_lat || 0), 0) / driversWithLocation.length,
        lng: driversWithLocation.reduce((sum, d) => sum + (d.current_lng || 0), 0) / driversWithLocation.length,
      }
    : store?.store_lat && store?.store_lng
    ? { lat: store.store_lat, lng: store.store_lng }
    : { lat: 10.4806, lng: -66.9036 }; // Default to Caracas

  // Debug: Log loading and error states
  console.log('[AdminDeliveryDashboard] Loading states:', {
    isLoadingDrivers,
    isLoadingDeliveries,
    hasError: !!deliveriesError,
    driversCount: drivers?.length,
    deliveriesCount: activeDeliveries?.length
  });

  if (isLoadingDrivers || isLoadingDeliveries) {
    console.log('[AdminDeliveryDashboard] Still loading...');
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-[500px]" />
      </div>
    );
  }

  if (deliveriesError) {
    console.error('[AdminDeliveryDashboard] Error in query:', deliveriesError);
  }

  const getStatusBadge = (status: string) => {
    const config = {
      assigned: { label: 'Asignado', variant: 'secondary' as const },
      picked_up: { label: 'Recogido', variant: 'default' as const },
      in_transit: { label: 'En camino', variant: 'default' as const },
    };
    const statusConfig = config[status] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Entregas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Camino</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.in_transit || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Motoristas Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{activeDrivers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Map */}
      {driversWithLocation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa de Entregas en Tiempo Real</CardTitle>
            <CardDescription>Ubicación de motoristas y entregas activas</CardDescription>
          </CardHeader>
          <CardContent>
            <DeliveryMap center={mapCenter} zoom={13} height="500px">
              {/* Show all drivers with location */}
              {driversWithLocation.map((driver) => (
                <DriverLocationMarker
                  key={driver.id}
                  location={{
                    lat: driver.current_lat!,
                    lng: driver.current_lng!,
                  }}
                  driver={{
                    name: driver.name,
                    vehicle_type: driver.vehicle_type as any,
                    phone: driver.phone,
                    photo_url: driver.photo_url,
                  }}
                  showPopup={true}
                  autoCenter={false}
                />
              ))}
            </DeliveryMap>
          </CardContent>
        </Card>
      )}

      {/* Active Deliveries List */}
      <Card>
        <CardHeader>
          <CardTitle>Entregas Activas</CardTitle>
          <CardDescription>Pedidos de delivery en proceso</CardDescription>
        </CardHeader>
        <CardContent>
          {activeDeliveries && activeDeliveries.length > 0 ? (
            <div className="space-y-4">
              {activeDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Driver Avatar */}
                  <div className="flex-shrink-0">
                    {delivery.driver.photo_url ? (
                      <img
                        src={delivery.driver.photo_url}
                        alt={delivery.driver.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Truck className="h-6 w-6 text-primary" />
                      </div>
                    )}
                  </div>

                  {/* Delivery Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Body size="small" className="font-semibold">
                        {delivery.orders.customer_name}
                      </Body>
                      {getStatusBadge(delivery.status)}
                    </div>
                    <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <Caption className="line-clamp-1">{delivery.orders.delivery_address}</Caption>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        {delivery.driver.name}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(delivery.assigned_at), {
                          addSuffix: true,
                          locale: es,
                        })}
                      </span>
                      {delivery.estimated_minutes && (
                        <span className="font-medium text-primary">
                          ETA: {delivery.estimated_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <Body>No hay entregas activas</Body>
              <Caption>Las entregas en progreso aparecerán aquí</Caption>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
