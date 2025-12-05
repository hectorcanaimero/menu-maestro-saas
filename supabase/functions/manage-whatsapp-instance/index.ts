import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  action: 'create_instance' | 'get_qr_code' | 'check_connection' | 'delete_instance';
  instance_name: string;
  store_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      throw new Error('Evolution API credentials not configured');
    }

    const { action, instance_name, store_id } = await req.json() as RequestBody;

    if (!instance_name) {
      return new Response(
        JSON.stringify({ error: 'instance_name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[manage-whatsapp-instance] Action: ${action}, Instance: ${instance_name}`);

    let result;

    switch (action) {
      case 'create_instance':
        result = await createInstance(evolutionApiUrl, evolutionApiKey, instance_name);
        break;

      case 'get_qr_code':
        result = await getQRCode(evolutionApiUrl, evolutionApiKey, instance_name);
        break;

      case 'check_connection':
        result = await checkConnection(evolutionApiUrl, evolutionApiKey, instance_name, store_id);
        break;

      case 'delete_instance':
        result = await deleteInstance(evolutionApiUrl, evolutionApiKey, instance_name, store_id);
        break;

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[manage-whatsapp-instance] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Create a new WhatsApp instance in Evolution API
 */
async function createInstance(apiUrl: string, apiKey: string, instanceName: string) {
  console.log(`[createInstance] Creating instance: ${instanceName}`);

  try {
    const response = await fetch(`${apiUrl}/instance/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': apiKey,
      },
      body: JSON.stringify({
        instanceName: instanceName,
        qrcode: true,
        integration: 'WHATSAPP-BAILEYS',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[createInstance] Error response:`, errorText);

      // If instance already exists (409), return success
      // The frontend should have already checked this, but handle it gracefully
      if (response.status === 409 || errorText.includes('already exists')) {
        console.log(`[createInstance] Instance already exists (409 error)`);
        return {
          success: true,
          already_exists: true,
          message: 'Instance already exists'
        };
      }

      throw new Error(`Failed to create instance: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[createInstance] Instance created successfully:`, data);

    return {
      success: true,
      instance_name: instanceName,
      data: data,
    };

  } catch (error) {
    console.error(`[createInstance] Error:`, error);
    throw error;
  }
}

/**
 * Check connection status (lightweight version for internal use)
 */
async function checkConnectionStatus(apiUrl: string, apiKey: string, instanceName: string) {
  const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
    method: 'GET',
    headers: {
      'apikey': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return { connected: false, state: 'not_found' };
    }
    throw new Error(`Failed to check connection: ${await response.text()}`);
  }

  const data = await response.json();
  const isConnected = data?.instance?.state === 'open';
  const phoneNumber = data?.instance?.owner || null;

  return {
    connected: isConnected,
    state: data?.instance?.state,
    phone: phoneNumber,
  };
}

/**
 * Get QR Code for WhatsApp connection
 */
async function getQRCode(apiUrl: string, apiKey: string, instanceName: string) {
  console.log(`[getQRCode] Fetching QR code for: ${instanceName}`);

  try {
    const response = await fetch(`${apiUrl}/instance/connect/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[getQRCode] Error response:`, errorText);
      throw new Error(`Failed to get QR code: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[getQRCode] QR code fetched successfully`);

    // Evolution API returns QR code in base64 format
    return {
      success: true,
      qr_code: data.base64 || data.qrcode?.base64 || data.code,
      instance_name: instanceName,
    };

  } catch (error) {
    console.error(`[getQRCode] Error:`, error);
    throw error;
  }
}

/**
 * Check if instance is connected
 */
async function checkConnection(apiUrl: string, apiKey: string, instanceName: string, storeId?: string) {
  console.log(`[checkConnection] Checking connection for: ${instanceName}`);

  try {
    const response = await fetch(`${apiUrl}/instance/connectionState/${instanceName}`, {
      method: 'GET',
      headers: {
        'apikey': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[checkConnection] Error response:`, errorText);

      // Instance not found, return disconnected status
      if (response.status === 404) {
        return {
          connected: false,
          state: 'not_found',
          message: 'Instance not found, please create it first',
        };
      }

      throw new Error(`Failed to check connection: ${errorText}`);
    }

    const data = await response.json();
    console.log(`[checkConnection] Connection state:`, data);

    const isConnected = data?.instance?.state === 'open';
    const phoneNumber = data?.instance?.owner || null;

    // Update database if store_id is provided
    if (storeId && isConnected) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('whatsapp_settings')
          .update({
            is_connected: true,
            connected_phone: phoneNumber,
          })
          .eq('store_id', storeId);

        console.log(`[checkConnection] Database updated for store: ${storeId}`);
      } catch (dbError) {
        console.error(`[checkConnection] Database update error:`, dbError);
        // Don't throw, just log the error
      }
    }

    return {
      connected: isConnected,
      state: data?.instance?.state,
      phone: phoneNumber,
      instance_name: instanceName,
    };

  } catch (error) {
    console.error(`[checkConnection] Error:`, error);
    throw error;
  }
}

/**
 * Delete WhatsApp instance
 */
async function deleteInstance(apiUrl: string, apiKey: string, instanceName: string, storeId?: string) {
  console.log(`[deleteInstance] Deleting instance: ${instanceName}`);

  try {
    const response = await fetch(`${apiUrl}/instance/delete/${instanceName}`, {
      method: 'DELETE',
      headers: {
        'apikey': apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[deleteInstance] Error response:`, errorText);

      // Instance not found, consider it deleted
      if (response.status === 404) {
        console.log(`[deleteInstance] Instance not found, considering it deleted`);
        return { success: true, message: 'Instance already deleted' };
      }

      throw new Error(`Failed to delete instance: ${errorText}`);
    }

    console.log(`[deleteInstance] Instance deleted successfully`);

    // Update database if store_id is provided
    if (storeId) {
      try {
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        await supabase
          .from('whatsapp_settings')
          .update({
            is_connected: false,
            connected_phone: null,
          })
          .eq('store_id', storeId);

        console.log(`[deleteInstance] Database updated for store: ${storeId}`);
      } catch (dbError) {
        console.error(`[deleteInstance] Database update error:`, dbError);
        // Don't throw, just log the error
      }
    }

    return {
      success: true,
      message: 'Instance deleted successfully',
      instance_name: instanceName,
    };

  } catch (error) {
    console.error(`[deleteInstance] Error:`, error);
    throw error;
  }
}
