import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const payload = await req.json();
    console.log('[WhatsApp Webhook] Received:', JSON.stringify(payload));

    // Handle test connection request from frontend
    if (payload.action === 'test_connection') {
      const instanceName = payload.instance_name;

      if (!evolutionApiUrl || !evolutionApiKey) {
        return new Response(JSON.stringify({ 
          connected: false, 
          error: 'Evolution API not configured in environment' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!instanceName) {
        return new Response(JSON.stringify({ 
          connected: false, 
          error: 'Instance name required' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      try {
        console.log(`[WhatsApp Webhook] Testing connection for instance: ${instanceName}`);
        const response = await fetch(
          `${evolutionApiUrl}/instance/connectionState/${instanceName}`,
          {
            method: 'GET',
            headers: {
              'apikey': evolutionApiKey,
            },
          }
        );

        const result = await response.json();
        console.log('[WhatsApp Webhook] Connection test result:', result);

        if (response.ok && result?.instance?.state === 'open') {
          return new Response(JSON.stringify({ 
            connected: true, 
            phone: result?.instance?.phoneNumber || null 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          return new Response(JSON.stringify({ 
            connected: false, 
            error: result?.message || 'Instance not connected or not found' 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        console.error('[WhatsApp Webhook] Connection test error:', error);
        return new Response(JSON.stringify({ 
          connected: false, 
          error: 'Failed to connect to Evolution API' 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Evolution API webhook events
    const { event, data } = payload;

    if (!data?.key?.id) {
      console.log('[WhatsApp Webhook] No message ID in payload, skipping');
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const messageId = data.key.id;
    let newStatus: string | null = null;
    let updateData: Record<string, unknown> = {};

    // Map Evolution API events to our status
    switch (event) {
      case 'messages.update':
        if (data.status === 'DELIVERY_ACK' || data.status === 'delivered') {
          newStatus = 'delivered';
          updateData.delivered_at = new Date().toISOString();
        } else if (data.status === 'READ' || data.status === 'read') {
          newStatus = 'read';
          updateData.read_at = new Date().toISOString();
        } else if (data.status === 'ERROR' || data.status === 'failed') {
          newStatus = 'failed';
          updateData.error_message = data.message || 'Delivery failed';
        }
        break;

      case 'send.message':
        newStatus = 'sent';
        updateData.sent_at = new Date().toISOString();
        break;

      default:
        console.log(`[WhatsApp Webhook] Unhandled event type: ${event}`);
    }

    if (newStatus) {
      updateData.status = newStatus;

      const { error } = await supabase
        .from('whatsapp_messages')
        .update(updateData)
        .eq('evolution_message_id', messageId);

      if (error) {
        console.error('[WhatsApp Webhook] Error updating message:', error);
      } else {
        console.log(`[WhatsApp Webhook] Updated message ${messageId} to status: ${newStatus}`);
      }

      // If this is a campaign message, update campaign stats
      const { data: message } = await supabase
        .from('whatsapp_messages')
        .select('campaign_id')
        .eq('evolution_message_id', messageId)
        .single();

      if (message?.campaign_id) {
        const statField = newStatus === 'delivered' ? 'messages_delivered' 
          : newStatus === 'failed' ? 'messages_failed' : null;

        if (statField) {
          await supabase.rpc('increment_campaign_stat', {
            p_campaign_id: message.campaign_id,
            p_field: statField
          });
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[WhatsApp Webhook] Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
