import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  storeId: string;
  customerPhone: string;
  customerName?: string;
  messageType: 'order_confirmation' | 'order_ready' | 'order_preparing' | 'order_out_for_delivery' | 'order_delivered' | 'order_cancelled' | 'abandoned_cart' | 'promotion' | 'campaign' | 'manual';
  orderId?: string;
  campaignId?: string;
  imageUrl?: string;
  // Template variables
  variables?: {
    order_number?: string;
    order_total?: string;
    estimated_time?: string;
    store_name?: string;
    delivery_message?: string;
    delivery_address?: string;
    order_type?: string;
    cart_total?: string;
    recovery_link?: string;
    promotion_message?: string;
    store_link?: string;
    custom_message?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const request: SendMessageRequest = await req.json();
    const { storeId, customerPhone, customerName, messageType, orderId, campaignId, imageUrl, variables } = request;

    console.log(`[WhatsApp] Sending ${messageType} message to ${customerPhone} for store ${storeId}`);

    // Get Evolution API credentials from environment
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('[WhatsApp] Evolution API credentials not configured');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Evolution API not configured' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Get WhatsApp settings and store subdomain
    const { data: settings, error: settingsError } = await supabase
      .from('whatsapp_settings')
      .select('*, stores!inner(subdomain)')
      .eq('store_id', storeId)
      .single();

    if (settingsError || !settings) {
      console.error('[WhatsApp] Settings not found:', settingsError);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'WhatsApp not configured for this store' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use store subdomain as instance name
    const instanceName = (settings as any).stores?.subdomain;

    if (!instanceName) {
      console.error('[WhatsApp] Store subdomain not found');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Store subdomain not found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!settings.is_enabled || !settings.is_connected) {
      console.error('[WhatsApp] Module not enabled or not connected');
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'WhatsApp module is not enabled or not connected' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Check and use credits
    const { data: creditResult, error: creditError } = await supabase
      .rpc('use_whatsapp_credit', { p_store_id: storeId });

    if (creditError || !creditResult?.[0]?.success) {
      console.error('[WhatsApp] Credit error:', creditError || creditResult?.[0]?.error_message);
      return new Response(JSON.stringify({ 
        success: false, 
        error: creditResult?.[0]?.error_message || 'No credits available' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const creditType = creditResult[0].credit_type;

    // 3. Get message template
    const { data: template, error: templateError } = await supabase
      .from('whatsapp_message_templates')
      .select('*')
      .eq('store_id', storeId)
      .eq('template_type', messageType)
      .eq('is_active', true)
      .single();

    let messageContent: string;

    if (messageType === 'manual' || messageType === 'campaign') {
      messageContent = variables?.custom_message || '';
    } else if (template) {
      // Replace variables in template
      messageContent = template.message_body;
      if (variables) {
        Object.entries(variables).forEach(([key, value]) => {
          messageContent = messageContent.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '');
        });
      }
      // Replace customer_name
      messageContent = messageContent.replace(/\{customer_name\}/g, customerName || 'Cliente');
    } else {
      console.error('[WhatsApp] Template not found for type:', messageType);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Message template not found' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Format phone number (remove non-digits, ensure country code)
    let formattedPhone = customerPhone.replace(/\D/g, '');
    console.log(`[WhatsApp] Original phone number: ${customerPhone}`);
    console.log(`[WhatsApp] Cleaned phone number: ${formattedPhone}`);

    // Brazilian area codes (DDD - Discagem Direta à Distância)
    const brazilianDDDs = [
      '11', '12', '13', '14', '15', '16', '17', '18', '19', // São Paulo
      '21', '22', '24', // Rio de Janeiro
      '27', '28', // Espírito Santo
      '31', '32', '33', '34', '35', '37', '38', // Minas Gerais
      '41', '42', '43', '44', '45', '46', // Paraná
      '47', '48', '49', // Santa Catarina
      '51', '53', '54', '55', // Rio Grande do Sul
      '61', // Distrito Federal
      '62', '64', // Goiás
      '63', // Tocantins
      '65', '66', // Mato Grosso
      '67', // Mato Grosso do Sul
      '68', // Acre
      '69', // Rondônia
      '71', '73', '74', '75', '77', // Bahia
      '79', // Sergipe
      '81', '87', // Pernambuco
      '82', // Alagoas
      '83', // Paraíba
      '84', // Rio Grande do Norte
      '85', '88', // Ceará
      '86', '89', // Piauí
      '91', '93', '94', // Pará
      '92', '97', // Amazonas
      '95', // Roraima
      '96', // Amapá
      '98', '99', // Maranhão
    ];

    // Detect and format based on country
    if (formattedPhone.startsWith('55')) {
      // Brazil: already has country code +55
      console.log(`[WhatsApp] Brazilian number detected (already has +55 prefix)`);
    } else if (formattedPhone.startsWith('58')) {
      // Venezuela: already has country code +58
      console.log(`[WhatsApp] Venezuelan number detected (already has +58 prefix)`);
    } else if (formattedPhone.length === 11) {
      // Check if it's a Brazilian number (11 digits with known DDD)
      const ddd = formattedPhone.substring(0, 2);
      if (brazilianDDDs.includes(ddd)) {
        formattedPhone = '55' + formattedPhone;
        console.log(`[WhatsApp] Adding Brazil country code +55 (DDD: ${ddd}): ${formattedPhone}`);
      } else {
        console.log(`[WhatsApp] 11 digits but unknown DDD (${ddd}), using as-is: ${formattedPhone}`);
      }
    } else if (formattedPhone.length === 10) {
      // Probably Venezuela without country code (10 digits)
      formattedPhone = '58' + formattedPhone;
      console.log(`[WhatsApp] Adding Venezuela country code +58: ${formattedPhone}`);
    } else {
      console.log(`[WhatsApp] Unknown format (length: ${formattedPhone.length}), using as-is: ${formattedPhone}`);
    }

    console.log(`[WhatsApp] Final formatted phone: ${formattedPhone}`);

    // 5. Send via Evolution API
    const evolutionUrl = `${evolutionApiUrl}/message/sendText/${instanceName}`;
    
    const evolutionPayload: any = {
      number: formattedPhone,
      text: messageContent,
    };

    // If there's an image, use sendMedia instead
    const endpoint = imageUrl 
      ? `${evolutionApiUrl}/message/sendMedia/${instanceName}`
      : evolutionUrl;

    if (imageUrl) {
      evolutionPayload.mediatype = 'image';
      evolutionPayload.media = imageUrl;
      evolutionPayload.caption = messageContent;
      delete evolutionPayload.text;
    }

    console.log(`[WhatsApp] Calling Evolution API: ${endpoint}`);

    const evolutionResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify(evolutionPayload),
    });

    const evolutionResult = await evolutionResponse.json();
    console.log('[WhatsApp] Evolution API response:', JSON.stringify(evolutionResult));

    const success = evolutionResponse.ok && evolutionResult?.key?.id;
    const evolutionMessageId = evolutionResult?.key?.id || null;

    // 6. Log message in history
    const { error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        store_id: storeId,
        customer_phone: customerPhone,
        customer_name: customerName,
        message_type: messageType,
        message_content: messageContent,
        image_url: imageUrl,
        status: success ? 'sent' : 'failed',
        error_message: success ? null : (evolutionResult?.message || 'Unknown error'),
        order_id: orderId,
        campaign_id: campaignId,
        evolution_message_id: evolutionMessageId,
        credit_type: creditType,
        sent_at: success ? new Date().toISOString() : null,
      });

    if (logError) {
      console.error('[WhatsApp] Error logging message:', logError);
    }

    return new Response(JSON.stringify({ 
      success,
      messageId: evolutionMessageId,
      creditType,
      remainingCredits: creditResult[0].remaining_credits,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[WhatsApp] Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
