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

  return {
    settings,
    loading,
    testing,
    instanceName,
    updateSettings,
    testConnection,
    disconnect,
    refetch: fetchSettings,
  };
}
