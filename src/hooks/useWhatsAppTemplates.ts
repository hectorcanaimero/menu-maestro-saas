import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

export interface WhatsAppTemplate {
  id: string;
  store_id: string;
  template_type: 'order_confirmation' | 'order_ready' | 'abandoned_cart' | 'promotion';
  template_name: string;
  message_body: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const TEMPLATE_VARIABLES: Record<string, string[]> = {
  order_confirmation: [
    '{customer_name}',
    '{order_number}',
    '{order_total}',
    '{estimated_time}',
    '{store_name}',
  ],
  order_ready: [
    '{customer_name}',
    '{order_number}',
    '{delivery_message}',
    '{store_name}',
  ],
  abandoned_cart: [
    '{customer_name}',
    '{cart_total}',
    '{recovery_link}',
    '{store_name}',
  ],
  promotion: [
    '{customer_name}',
    '{promotion_message}',
    '{store_link}',
    '{store_name}',
  ],
};

export function useWhatsAppTemplates() {
  const { store } = useStore();
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    if (!store?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('whatsapp_message_templates')
        .select('*')
        .eq('store_id', store.id)
        .order('template_type');

      if (error) {
        console.error('Error fetching WhatsApp templates:', error);
        return;
      }

      setTemplates(data as WhatsAppTemplate[]);
    } finally {
      setLoading(false);
    }
  }, [store?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const updateTemplate = async (templateId: string, updates: Partial<WhatsAppTemplate>) => {
    try {
      const { error } = await supabase
        .from('whatsapp_message_templates')
        .update(updates)
        .eq('id', templateId);

      if (error) {
        console.error('Error updating template:', error);
        toast.error('Error al guardar la plantilla');
        return false;
      }

      setTemplates(prev => 
        prev.map(t => t.id === templateId ? { ...t, ...updates } : t)
      );
      toast.success('Plantilla guardada');
      return true;
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar la plantilla');
      return false;
    }
  };

  const toggleTemplate = async (templateId: string, isActive: boolean) => {
    return updateTemplate(templateId, { is_active: isActive });
  };

  const getTemplateByType = (type: string) => {
    return templates.find(t => t.template_type === type);
  };

  return {
    templates,
    loading,
    updateTemplate,
    toggleTemplate,
    getTemplateByType,
    refetch: fetchTemplates,
  };
}
