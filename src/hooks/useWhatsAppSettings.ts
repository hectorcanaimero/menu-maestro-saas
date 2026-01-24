import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

export interface WhatsAppSettings {
  id: string;
  store_id: string;
  connected_phone: string | null;
  is_connected: boolean;
  is_enabled: boolean;
  subscription_status: 'active' | 'inactive' | 'trial';
  trial_ends_at: string | null;
  auto_order_confirmation: boolean;
  auto_order_ready: boolean;
  auto_order_preparing: boolean;
  auto_order_out_for_delivery: boolean;
  auto_order_delivered: boolean;
  auto_order_cancelled: boolean;
  auto_abandoned_cart: boolean;
  abandoned_cart_delay_minutes: number;
  created_at: string;
  updated_at: string;
}

export function useWhatsAppSettings() {
  const { store } = useStore();
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [creatingInstance, setCreatingInstance] = useState(false);
  const [fetchingQR, setFetchingQR] = useState(false);

  // Instance name is derived from store subdomain
  const instanceName = store?.subdomain || null;

  const fetchSettings = useCallback(async () => {
    if (!store?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_settings')
        .select('*')
        .eq('store_id', store.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching WhatsApp settings:', error);
        return;
      }

      if (data) {
        setSettings(data as WhatsAppSettings);
      } else {
        // Create default settings
        const { data: newSettings, error: createError } = await supabase
          .from('whatsapp_settings')
          .insert({ store_id: store.id })
          .select()
          .single();

        if (createError) {
          console.error('Error creating WhatsApp settings:', createError);
        } else {
          setSettings(newSettings as WhatsAppSettings);
          // Initialize templates
          await supabase.rpc('initialize_whatsapp_templates', { p_store_id: store.id });
        }
      }
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchSettings();

    // Subscribe to realtime updates
    if (!store?.id) return;

    const channel = supabase
      .channel('whatsapp_settings_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'whatsapp_settings',
          filter: `store_id=eq.${store.id}`,
        },
        (payload) => {
          console.log('[useWhatsAppSettings] Realtime update received:', payload);
          console.log('[useWhatsAppSettings] Previous state:', settings);
          console.log('[useWhatsAppSettings] New state:', payload.new);
          setSettings(payload.new as WhatsAppSettings);
        }
      )
      .subscribe((status) => {
        console.log('[useWhatsAppSettings] Subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings, store?.id]);

  const updateSettings = async (updates: Partial<WhatsAppSettings>, skipToast = false) => {
    if (!store?.id || !settings?.id) return false;

    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) {
        console.error('Error updating WhatsApp settings:', error);
        if (!skipToast) toast.error('Error al guardar la configuración');
        return false;
      }

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      if (!skipToast) toast.success('Configuración guardada');
      return true;
    } catch (error) {
      console.error('Error:', error);
      if (!skipToast) toast.error('Error al guardar la configuración');
      return false;
    }
  };

  const testConnection = async () => {
    if (!instanceName) {
      toast.error('No se encontró el subdomain de la tienda');
      return false;
    }

    setTesting(true);
    try {
      // Call edge function to test connection using env secrets
      const { data, error } = await supabase.functions.invoke('whatsapp-webhook', {
        body: { 
          action: 'test_connection',
          instance_name: instanceName 
        },
      });

      if (error) {
        console.error('Connection test error:', error);
        await updateSettings({ is_connected: false, connected_phone: null }, true);
        toast.error('Error al probar la conexión');
        return false;
      }

      if (data?.connected) {
        await updateSettings({
          is_connected: true,
          connected_phone: data.phone || null,
        }, true);
        toast.success('Conexión exitosa');
        return true;
      } else {
        await updateSettings({ is_connected: false, connected_phone: null }, true);
        toast.error(data?.error || 'No se pudo conectar');
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      await updateSettings({ is_connected: false, connected_phone: null }, true);
      toast.error('Error al probar la conexión');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    if (!instanceName || !store?.id) {
      toast.error('No se encontró el subdomain de la tienda');
      return false;
    }

    console.log('[disconnect] Starting disconnect for instance:', instanceName);
    console.log('[disconnect] Current settings:', settings);

    try {
      // Call Edge Function to logout from Evolution API
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-instance', {
        body: {
          action: 'logout_instance',
          instance_name: instanceName,
          store_id: store.id,
        },
      });

      console.log('[disconnect] Edge Function response:', { data, error });

      if (error) {
        console.error('Disconnect error:', error);
        toast.error('Error al desconectar');
        return false;
      }

      if (data?.success) {
        console.log('[disconnect] Logout successful, updating local state...');
        // The Edge Function already updated the database
        // Update local state immediately for instant UI feedback
        // The realtime subscription will also update it (no conflict)
        setSettings(prev => {
          const newSettings = prev ? {
            ...prev,
            is_connected: false,
            connected_phone: null,
          } : null;
          console.log('[disconnect] New local settings:', newSettings);
          return newSettings;
        });
        toast.success('Desconectado correctamente');
        return true;
      }

      toast.error(data?.error || 'No se pudo desconectar');
      return false;
    } catch (error) {
      console.error('Disconnect error:', error);
      toast.error('Error al desconectar');
      return false;
    }
  };

  /**
   * Create WhatsApp instance in Evolution API
   */
  const createInstance = async () => {
    if (!instanceName || !store?.id) {
      toast.error('No se encontró el subdomain de la tienda');
      return { success: false };
    }

    setCreatingInstance(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-instance', {
        body: {
          action: 'create_instance',
          instance_name: instanceName,
          store_id: store.id,
        },
      });

      if (error) {
        console.error('Create instance error:', error);
        toast.error('Error al crear la instancia');
        return { success: false, error };
      }

      if (data?.success) {
        // If instance already exists and is connected, update local settings
        if (data.already_exists && data.is_connected) {
          await updateSettings({
            is_connected: true,
            connected_phone: data.phone || null,
          }, true);
          toast.success('Instancia ya está conectada');
        } else {
          toast.success(data.already_exists ? 'Instancia ya existe' : 'Instancia creada correctamente');
        }

        return {
          success: true,
          already_exists: data.already_exists,
          is_connected: data.is_connected,
          phone: data.phone,
          state: data.state
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Create instance error:', error);
      toast.error('Error al crear la instancia');
      return { success: false, error };
    } finally {
      setCreatingInstance(false);
    }
  };

  /**
   * Get QR Code for WhatsApp connection
   */
  const getQRCode = async (): Promise<{ success: boolean; qr_code?: string; error?: any }> => {
    if (!instanceName) {
      toast.error('No se encontró el subdomain de la tienda');
      return { success: false };
    }

    setFetchingQR(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-instance', {
        body: {
          action: 'get_qr_code',
          instance_name: instanceName,
        },
      });

      if (error) {
        console.error('Get QR code error:', error);
        toast.error('Error al obtener el código QR');
        return { success: false, error };
      }

      if (data?.success && data?.qr_code) {
        return { success: true, qr_code: data.qr_code };
      }

      toast.error('No se pudo obtener el código QR');
      return { success: false };
    } catch (error) {
      console.error('Get QR code error:', error);
      toast.error('Error al obtener el código QR');
      return { success: false, error };
    } finally {
      setFetchingQR(false);
    }
  };

  /**
   * Check connection status (polling-friendly)
   */
  const checkConnectionStatus = async (): Promise<{ connected: boolean; phone?: string; state?: string }> => {
    if (!instanceName || !store?.id) {
      return { connected: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-instance', {
        body: {
          action: 'check_connection',
          instance_name: instanceName,
          store_id: store.id,
        },
      });

      if (error) {
        console.error('Check connection error:', error);
        return { connected: false };
      }

      if (data?.connected) {
        // Update local settings state
        setSettings(prev => prev ? {
          ...prev,
          is_connected: true,
          connected_phone: data.phone || null,
        } : null);

        return {
          connected: true,
          phone: data.phone,
          state: data.state,
        };
      }

      return { connected: false, state: data?.state };
    } catch (error) {
      console.error('Check connection error:', error);
      return { connected: false };
    }
  };

  /**
   * Delete WhatsApp instance
   */
  const deleteInstance = async () => {
    if (!instanceName || !store?.id) {
      toast.error('No se encontró el subdomain de la tienda');
      return { success: false };
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-whatsapp-instance', {
        body: {
          action: 'delete_instance',
          instance_name: instanceName,
          store_id: store.id,
        },
      });

      if (error) {
        console.error('Delete instance error:', error);
        toast.error('Error al eliminar la instancia');
        return { success: false, error };
      }

      if (data?.success) {
        // The Edge Function already updated the database
        // Update local state immediately for instant UI feedback
        setSettings(prev => prev ? {
          ...prev,
          is_connected: false,
          connected_phone: null,
        } : null);
        toast.success('Instancia eliminada correctamente');
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Delete instance error:', error);
      toast.error('Error al eliminar la instancia');
      return { success: false, error };
    }
  };

  return {
    settings,
    loading,
    testing,
    creatingInstance,
    fetchingQR,
    instanceName,
    updateSettings,
    testConnection,
    disconnect,
    createInstance,
    getQRCode,
    checkConnectionStatus,
    deleteInstance,
    refetch: fetchSettings,
  };
}
