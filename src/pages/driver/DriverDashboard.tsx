import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  Bike,
  LogOut,
  MapPin,
  Clock,
  Package,
  Navigation,
  Activity,
  ActivitySquare,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { H1, H2, H3, Body, Caption } from '@/components/ui/typography';
import { useDriverLocation } from '@/hooks/useDriverLocation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface DeliveryAssignment {
  id: string;
  order_id: string;
  status: string;
  assigned_at: string;
  estimated_minutes: number | null;
  distance_km: number | null;
  orders: {
    id: string;
    customer_name: string;
    customer_phone: string;
    delivery_address: string;
    total_amount: number;
  };
}

export default function DriverDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [driverId] = useState(() => localStorage.getItem('driver_id'));
  const [driverName] = useState(() => localStorage.getItem('driver_name'));
  const [isOnline, setIsOnline] = useState(() => {
    // Restore online status from localStorage
    const savedStatus = localStorage.getItem('driver_online_status');
    return savedStatus === 'true';
  });

  // Geolocation tracking
  const { isTracking, error: locationError } = useDriverLocation({
    driverId: driverId || '',
    enabled: isOnline,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!driverId) {
      navigate('/driver/login');
    }
  }, [driverId, navigate]);

  // Get driver info
  const { data: driver, isLoading: isLoadingDriver } = useQuery({
    queryKey: ['driver', driverId],
    queryFn: async () => {
      if (!driverId) return null;

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', driverId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!driverId,
  });

  // Get assigned deliveries
  const { data: deliveries, isLoading: isLoadingDeliveries } = useQuery({
    queryKey: ['driver-deliveries', driverId],
    queryFn: async () => {
      if (!driverId) return [];

      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          orders (
            id,
            customer_name,
            customer_phone,
            delivery_address,
            total_amount
          )
        `)
        .eq('driver_id', driverId)
        .in('status', ['assigned', 'picked_up', 'in_transit'])
        .order('assigned_at', { ascending: true });

      if (error) {
        console.error('Error fetching driver deliveries:', error);
        throw error;
      }
      console.log('Driver deliveries fetched:', { driverId, deliveries: data });
      return data as DeliveryAssignment[];
    },
    enabled: !!driverId,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  // Update driver status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'available' | 'busy' | 'offline') => {
      if (!driverId) throw new Error('No driver ID');

      const { error } = await supabase
        .from('drivers')
        .update({ status })
        .eq('id', driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver', driverId] });
    },
  });

  // Sync online status with database on mount
  useEffect(() => {
    if (driver) {
      const dbIsOnline = driver.status === 'available' || driver.status === 'busy';
      const localIsOnline = localStorage.getItem('driver_online_status') === 'true';

      // If local storage says online but DB says offline, sync with local storage
      if (localIsOnline && !dbIsOnline) {
        updateStatusMutation.mutate('available');
      }

      setIsOnline(localIsOnline);
    }
  }, [driver]);

  // Handle online/offline toggle
  const handleOnlineToggle = async (checked: boolean) => {
    setIsOnline(checked);
    localStorage.setItem('driver_online_status', String(checked));

    const newStatus = checked ? 'available' : 'offline';
    try {
      await updateStatusMutation.mutateAsync(newStatus);
      toast.success(checked ? 'Ahora estás disponible' : 'Ahora estás offline');
    } catch (error) {
      toast.error('Error al cambiar estado');
      setIsOnline(!checked); // Revert on error
      localStorage.setItem('driver_online_status', String(!checked));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    // Set driver offline before logout
    if (driverId) {
      try {
        await updateStatusMutation.mutateAsync('offline');
      } catch (error) {
        console.error('Error setting driver offline:', error);
      }
    }

    localStorage.removeItem('driver_id');
    localStorage.removeItem('driver_name');
    localStorage.removeItem('driver_phone');
    localStorage.removeItem('driver_online_status');
    navigate('/driver/login');
  };

  // Handle start delivery
  const handleStartDelivery = (assignmentId: string) => {
    navigate(`/driver/delivery/${assignmentId}`);
  };

  if (!driverId) {
    return null;
  }

  if (isLoadingDriver) {
    return (
      <div className="min-h-screen bg-background p-4">
        <Skeleton className="h-12 w-64 mb-6" />
        <Skeleton className="h-32 mb-4" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4">
        <div className="container max-w-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary-foreground/10 rounded-full flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <H2 className="text-xl text-primary-foreground">{driverName}</H2>
              <Caption className="text-primary-foreground/80">
                {driver?.vehicle_type ? (
                  <span className="capitalize">{driver.vehicle_type}</span>
                ) : (
                  'Motorista'
                )}
              </Caption>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container max-w-2xl py-6 space-y-6">
        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Online/Offline Toggle */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <ActivitySquare
                  className={`h-5 w-5 ${isOnline ? 'text-green-600' : 'text-muted-foreground'}`}
                />
                <div>
                  <Label htmlFor="online-toggle" className="font-semibold">
                    {isOnline ? 'En Línea' : 'Desconectado'}
                  </Label>
                  <Caption className="text-muted-foreground block">
                    {isOnline ? 'Recibirás nuevas entregas' : 'No recibirás entregas'}
                  </Caption>
                </div>
              </div>
              <Switch
                id="online-toggle"
                checked={isOnline}
                onCheckedChange={handleOnlineToggle}
              />
            </div>

            {/* GPS Status */}
            {isOnline && (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <Navigation
                  className={`h-4 w-4 ${isTracking ? 'text-green-600 animate-pulse' : 'text-muted-foreground'}`}
                />
                <Caption className="text-green-700 dark:text-green-400">
                  {isTracking ? 'GPS activo - Compartiendo ubicación' : 'Activando GPS...'}
                </Caption>
              </div>
            )}

            {/* Location Error */}
            {locationError && (
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <Caption className="text-destructive">{locationError}</Caption>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Deliveries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Entregas Activas ({deliveries?.length || 0})
            </CardTitle>
            <CardDescription>Tus pedidos asignados</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingDeliveries ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : deliveries && deliveries.length > 0 ? (
              <div className="space-y-3">
                {deliveries.map((delivery) => (
                  <Card key={delivery.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Body size="small" className="font-semibold">
                            {delivery.orders.customer_name}
                          </Body>
                          <Caption className="text-muted-foreground">
                            {formatDistanceToNow(new Date(delivery.assigned_at), {
                              addSuffix: true,
                              locale: es,
                            })}
                          </Caption>
                        </div>
                        <Badge
                          variant={
                            delivery.status === 'in_transit' ? 'default' : 'secondary'
                          }
                        >
                          {delivery.status === 'assigned' && 'Asignado'}
                          {delivery.status === 'picked_up' && 'Recogido'}
                          {delivery.status === 'in_transit' && 'En camino'}
                        </Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <Caption className="flex-1">
                            {delivery.orders.delivery_address}
                          </Caption>
                        </div>

                        {delivery.estimated_minutes && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <Caption>~{delivery.estimated_minutes} min</Caption>
                          </div>
                        )}
                      </div>

                      <Button
                        className="w-full"
                        onClick={() => handleStartDelivery(delivery.id)}
                      >
                        {delivery.status === 'assigned' && 'Iniciar Entrega'}
                        {delivery.status === 'picked_up' && 'Continuar'}
                        {delivery.status === 'in_transit' && 'Ver Detalles'}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <Body>No tienes entregas asignadas</Body>
                <Caption>
                  {isOnline
                    ? 'Espera a que te asignen un pedido'
                    : 'Actívate para recibir entregas'}
                </Caption>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
