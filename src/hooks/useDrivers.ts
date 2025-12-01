import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

export interface Driver {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  email: string | null;
  vehicle_type: string;
  license_plate: string | null;
  status: 'available' | 'busy' | 'offline';
  is_active: boolean;
  current_lat: number | null;
  current_lng: number | null;
  last_location_update: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDriverInput {
  name: string;
  phone: string;
  email?: string;
  vehicle_type?: string;
  license_plate?: string;
  photo_url?: string;
}

export interface UpdateDriverInput extends Partial<CreateDriverInput> {
  id: string;
  status?: 'available' | 'busy' | 'offline';
  is_active?: boolean;
}

export function useDrivers() {
  const { store } = useStore();
  const queryClient = useQueryClient();

  // Fetch all drivers for the store
  const { data: drivers = [], isLoading, error, refetch } = useQuery({
    queryKey: ['drivers', store?.id],
    queryFn: async () => {
      if (!store?.id) return [];

      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('store_id', store.id)
        .order('name');

      if (error) throw error;
      return data as Driver[];
    },
    enabled: !!store?.id,
  });

  // Subscribe to realtime updates
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`drivers:${store.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'drivers',
          filter: `store_id=eq.${store.id}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id, refetch]);

  // Create driver mutation
  const createDriver = useMutation({
    mutationFn: async (input: CreateDriverInput) => {
      if (!store?.id) throw new Error('Store not found');

      const { data, error } = await supabase
        .from('drivers')
        .insert({
          store_id: store.id,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          vehicle_type: input.vehicle_type || 'motorcycle',
          license_plate: input.license_plate || null,
          photo_url: input.photo_url || null,
          status: 'offline',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', store?.id] });
      toast.success('Motorista creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al crear motorista: ${error.message}`);
    },
  });

  // Update driver mutation
  const updateDriver = useMutation({
    mutationFn: async (input: UpdateDriverInput) => {
      const { id, ...updateData } = input;

      const { data, error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', store?.id] });
      toast.success('Motorista actualizado');
    },
    onError: (error: Error) => {
      toast.error(`Error al actualizar motorista: ${error.message}`);
    },
  });

  // Delete driver mutation
  const deleteDriver = useMutation({
    mutationFn: async (driverId: string) => {
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', driverId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['drivers', store?.id] });
      toast.success('Motorista eliminado');
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar motorista: ${error.message}`);
    },
  });

  // Get available drivers
  const availableDrivers = drivers.filter(d => d.status === 'available' && d.is_active);

  return {
    drivers,
    availableDrivers,
    isLoading,
    error,
    refetch,
    createDriver,
    updateDriver,
    deleteDriver,
  };
}