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
  }, [fetchSettings]);

  const updateSettings = async (updates: Partial<WhatsAppSettings>) => {
    if (!store?.id || !settings?.id) return false;

    try {
      const { error } = await supabase
        .from('whatsapp_settings')
        .update(updates)
        .eq('id', settings.id);

      if (error) {
        console.error('Error updating WhatsApp settings:', error);
        toast.error('Error al guardar la configuración');
        return false;
      }

      setSettings(prev => prev ? { ...prev, ...updates } : null);
      toast.success('Configuración guardada');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la configuración');
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
        await updateSettings({ is_connected: false, connected_phone: null });
        toast.error('Error al probar la conexión');
        return false;
      }

      if (data?.connected) {
        await updateSettings({
          is_connected: true,
          connected_phone: data.phone || null,
        });
        toast.success('Conexión exitosa');
        return true;
      } else {
        await updateSettings({ is_connected: false, connected_phone: null });
        toast.error(data?.error || 'No se pudo conectar');
        return false;
      }
    } catch (error) {
      console.error('Connection test error:', error);
      await updateSettings({ is_connected: false, connected_phone: null });
      toast.error('Error al probar la conexión');
      return false;
    } finally {
      setTesting(false);
    }
  };

  const disconnect = async () => {
    await updateSettings({
      is_connected: false,
      connected_phone: null,
    });
    toast.success('Desconectado');
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
        toast.success(data.already_exists ? 'Instancia ya existe' : 'Instancia creada correctamente');
        return { success: true, already_exists: data.already_exists };
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
        await updateSettings({
          is_connected: false,
          connected_phone: null,
        });
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
