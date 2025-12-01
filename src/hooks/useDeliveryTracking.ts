import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DeliveryAssignment {
  id: string;
  order_id: string;
  driver_id: string;
  store_id: string;
  status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
  assigned_at: string;
  picked_up_at: string | null;
  delivered_at: string | null;
  distance_km: number | null;
  estimated_minutes: number | null;
  actual_minutes: number | null;
  route_polyline: string | null;
  delivery_notes: string | null;
  driver?: {
    id: string;
    name: string;
    phone: string;
    photo_url: string | null;
    current_lat: number | null;
    current_lng: number | null;
    vehicle_type: string;
  };
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  recorded_at: string;
}

export function useDeliveryTracking(orderId: string | undefined) {
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  // Fetch delivery assignment with driver info
  const { data: assignment, isLoading, error, refetch } = useQuery({
    queryKey: ['delivery-assignment', orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from('delivery_assignments')
        .select(`
          *,
          driver:drivers (
            id,
            name,
            phone,
            photo_url,
            current_lat,
            current_lng,
            vehicle_type
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as DeliveryAssignment | null;
    },
    enabled: !!orderId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Subscribe to realtime location updates
  useEffect(() => {
    if (!assignment?.driver_id) return;

    // Subscribe to driver location updates
    const channel = supabase
      .channel(`driver-location:${assignment.driver_id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_locations',
          filter: `driver_id=eq.${assignment.driver_id}`,
        },
        (payload) => {
          const newLocation = payload.new as any;
          setDriverLocation({
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
            speed: newLocation.speed,
            heading: newLocation.heading,
            recorded_at: newLocation.recorded_at,
          });
        }
      )
      .subscribe();

    // Also subscribe to assignment status changes
    const assignmentChannel = supabase
      .channel(`assignment:${assignment.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `id=eq.${assignment.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(assignmentChannel);
    };
  }, [assignment?.driver_id, assignment?.id, refetch]);

  // Get current driver location (from realtime or from assignment)
  const currentDriverLocation = driverLocation || (assignment?.driver ? {
    latitude: assignment.driver.current_lat ?? 0,
    longitude: assignment.driver.current_lng ?? 0,
    speed: null,
    heading: null,
    recorded_at: new Date().toISOString(),
  } : null);

  // Calculate ETA
  const calculateETA = () => {
    if (!assignment?.estimated_minutes) return null;
    
    const assignedAt = new Date(assignment.assigned_at);
    const elapsedMinutes = (Date.now() - assignedAt.getTime()) / 60000;
    const remainingMinutes = Math.max(0, assignment.estimated_minutes - elapsedMinutes);
    
    return Math.ceil(remainingMinutes);
  };

  return {
    assignment,
    driver: assignment?.driver ?? null,
    driverLocation: currentDriverLocation,
    estimatedMinutesRemaining: calculateETA(),
    isLoading,
    error,
    refetch,
  };
}

// Hook for assigning driver to order
export function useAssignDriver() {
  const assignDriver = async (
    orderId: string,
    driverId: string,
    distanceKm?: number,
    estimatedMinutes?: number
  ) => {
    const { data, error } = await (supabase.rpc as any)('assign_driver_to_order', {
      p_order_id: orderId,
      p_driver_id: driverId,
      p_distance_km: distanceKm ?? null,
      p_estimated_minutes: estimatedMinutes ?? null,
    });

    if (error) throw error;
    
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) {
      throw new Error(result?.error_message || 'Error al asignar motorista');
    }

    return result;
  };

  return { assignDriver };
}

// Hook for updating delivery status
export function useUpdateDeliveryStatus() {
  const updateStatus = async (
    assignmentId: string,
    status: 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled',
    deliveryPhotoUrl?: string,
    customerSignatureUrl?: string,
    deliveryNotes?: string
  ) => {
    const { data, error } = await (supabase.rpc as any)('update_delivery_status', {
      p_assignment_id: assignmentId,
      p_status: status,
      p_delivery_photo_url: deliveryPhotoUrl ?? null,
      p_customer_signature_url: customerSignatureUrl ?? null,
      p_delivery_notes: deliveryNotes ?? null,
    });

    if (error) throw error;
    
    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.success) {
      throw new Error(result?.error_message || 'Error al actualizar estado');
    }

    return result;
  };

  return { updateStatus };
}