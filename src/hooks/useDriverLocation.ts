import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number | null;
}

interface UseDriverLocationOptions {
  driverId: string;
  enabled?: boolean;
  updateInterval?: number; // milliseconds
}

export function useDriverLocation({
  driverId,
  enabled = false,
  updateInterval = 30000, // 30 seconds default
}: UseDriverLocationOptions) {
  const [location, setLocation] = useState<LocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    speed: null,
    heading: null,
    timestamp: null,
  });
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Update driver location in Supabase
  const updateLocation = useCallback(
    async (position: GeolocationPosition) => {
      if (!driverId) return;

      const { coords } = position;

      try {
        const { error } = await (supabase.rpc as any)('update_driver_location', {
          p_driver_id: driverId,
          p_latitude: coords.latitude,
          p_longitude: coords.longitude,
          p_speed: coords.speed || null,
          p_heading: coords.heading || null,
          p_accuracy: coords.accuracy || null,
        });

        if (error) {
          console.error('Error updating location:', error);
          toast.error('Error al actualizar ubicación');
          return;
        }

        setLocation({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy,
          speed: coords.speed,
          heading: coords.heading,
          timestamp: position.timestamp,
        });

        setError(null);
      } catch (err: any) {
        console.error('Failed to update location:', err);
        setError(err.message);
      }
    },
    [driverId]
  );

  // Handle geolocation errors
  const handleError = useCallback((err: GeolocationPositionError) => {
    let errorMessage = 'Error al obtener ubicación';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        errorMessage = 'Permiso de ubicación denegado. Por favor actívalo en la configuración.';
        break;
      case err.POSITION_UNAVAILABLE:
        errorMessage = 'Ubicación no disponible';
        break;
      case err.TIMEOUT:
        errorMessage = 'Tiempo de espera agotado';
        break;
    }

    setError(errorMessage);
    toast.error(errorMessage);
  }, []);

  // Start tracking
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      const msg = 'Tu navegador no soporta geolocalización';
      setError(msg);
      toast.error(msg);
      return;
    }

    if (watchId !== null) {
      // Already tracking
      return;
    }

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    };

    // Watch position continuously
    const id = navigator.geolocation.watchPosition(
      updateLocation,
      handleError,
      options
    );

    setWatchId(id);
    setIsTracking(true);
    toast.success('Rastreo GPS activado');
  }, [watchId, updateLocation, handleError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      setIsTracking(false);
      toast.info('Rastreo GPS desactivado');
    }
  }, [watchId]);

  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (enabled && !isTracking) {
      startTracking();
    } else if (!enabled && isTracking) {
      stopTracking();
    }

    // Cleanup on unmount
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [enabled]); // Only depend on enabled to avoid infinite loops

  // Request permission on mount
  useEffect(() => {
    if (enabled && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'denied') {
          setError('Permiso de ubicación denegado');
        }
      });
    }
  }, [enabled]);

  return {
    location,
    isTracking,
    error,
    startTracking,
    stopTracking,
  };
}
