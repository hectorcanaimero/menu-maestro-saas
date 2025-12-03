import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeocodeRequest {
  address: string;
}

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address: string;
  place_id?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');

    if (!GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: GeocodeRequest = await req.json();
    console.log('Geocode request:', body);

    const { address } = body;

    // Validate address
    if (!address || address.trim() === '') {
      return new Response(
        JSON.stringify({ error: 'Address is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Geocoding API
    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&language=es&key=${GOOGLE_MAPS_API_KEY}`;

    console.log('Calling Geocoding API...');
    const geocodeResponse = await fetch(geocodeUrl);
    const geocodeData = await geocodeResponse.json();

    console.log('Geocoding response:', JSON.stringify(geocodeData));

    if (geocodeData.status !== 'OK') {
      console.error('Geocoding API error:', geocodeData.status);

      let errorMessage = 'No se pudo geocodificar la dirección';
      if (geocodeData.status === 'ZERO_RESULTS') {
        errorMessage = 'No se encontró la dirección especificada';
      } else if (geocodeData.status === 'INVALID_REQUEST') {
        errorMessage = 'La dirección es inválida';
      }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const firstResult = geocodeData.results[0];

    if (!firstResult) {
      return new Response(
        JSON.stringify({ error: 'No se encontraron resultados' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result: GeocodeResult = {
      lat: firstResult.geometry.location.lat,
      lng: firstResult.geometry.location.lng,
      formatted_address: firstResult.formatted_address,
      place_id: firstResult.place_id,
    };

    console.log('Geocoding result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error geocoding address:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
