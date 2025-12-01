import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalculateDistanceRequest {
  store_lat: number;
  store_lng: number;
  delivery_lat: number;
  delivery_lng: number;
  delivery_address?: string;
  base_delivery_price: number;
  price_per_km: number;
  max_delivery_distance_km?: number;
}

interface DistanceResult {
  distance_km: number;
  duration_minutes: number;
  delivery_price: number;
  formatted_distance: string;
  formatted_duration: string;
  route_polyline?: string;
  within_delivery_range: boolean;
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

    const body: CalculateDistanceRequest = await req.json();
    console.log('Calculate distance request:', body);

    const {
      store_lat,
      store_lng,
      delivery_lat,
      delivery_lng,
      base_delivery_price = 2.00,
      price_per_km = 0.50,
      max_delivery_distance_km = 15,
    } = body;

    // Validate coordinates
    if (!store_lat || !store_lng || !delivery_lat || !delivery_lng) {
      return new Response(
        JSON.stringify({ error: 'Missing required coordinates' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Google Distance Matrix API
    const origins = `${store_lat},${store_lng}`;
    const destinations = `${delivery_lat},${delivery_lng}`;
    
    const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&mode=driving&language=es&key=${GOOGLE_MAPS_API_KEY}`;
    
    console.log('Calling Distance Matrix API...');
    const distanceResponse = await fetch(distanceMatrixUrl);
    const distanceData = await distanceResponse.json();
    
    console.log('Distance Matrix response:', JSON.stringify(distanceData));

    if (distanceData.status !== 'OK') {
      console.error('Distance Matrix API error:', distanceData.status);
      return new Response(
        JSON.stringify({ error: `Google Maps API error: ${distanceData.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const element = distanceData.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      console.error('No route found:', element?.status);
      return new Response(
        JSON.stringify({ error: 'No se pudo calcular la ruta' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract distance and duration
    const distanceMeters = element.distance.value;
    const durationSeconds = element.duration.value;
    
    const distance_km = distanceMeters / 1000;
    const duration_minutes = Math.ceil(durationSeconds / 60);

    // Calculate delivery price
    const delivery_price = base_delivery_price + (distance_km * price_per_km);
    const within_delivery_range = distance_km <= max_delivery_distance_km;

    // Get directions for polyline (optional)
    let route_polyline: string | undefined;
    try {
      const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origins}&destination=${destinations}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
      const directionsResponse = await fetch(directionsUrl);
      const directionsData = await directionsResponse.json();
      
      if (directionsData.status === 'OK' && directionsData.routes[0]) {
        route_polyline = directionsData.routes[0].overview_polyline?.points;
      }
    } catch (e) {
      console.warn('Could not get route polyline:', e);
    }

    const result: DistanceResult = {
      distance_km: Math.round(distance_km * 100) / 100,
      duration_minutes,
      delivery_price: Math.round(delivery_price * 100) / 100,
      formatted_distance: element.distance.text,
      formatted_duration: element.duration.text,
      route_polyline,
      within_delivery_range,
    };

    console.log('Calculation result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error calculating distance:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});