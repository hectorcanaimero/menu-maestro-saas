/**
 * Enhanced Product Image Generator - Gemini 2.5 Flash Image (Nano Banana)
 *
 * Migrated from Lovable AI Gateway to Google Gemini API
 * Uses Gemini 2.5 Flash Image for fast, cost-effective image generation
 *
 * @version 2.0.0
 * @date 2025-12-06
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Gemini model to use (optimized for speed and cost)
const GEMINI_MODEL = 'gemini-2.5-flash-image';

const STYLE_PROMPTS: Record<string, string> = {
  realistic: "Transform this food product into a professional studio photograph with realistic studio lighting, clean neutral background, high detail, sharp focus, appetizing presentation, commercial food photography style.",
  premium: "Transform this food product into a luxury premium photograph with elegant golden warm lighting, sophisticated dark background, high-end restaurant presentation, fine dining aesthetic, professional food styling.",
  animated: "Transform this food product into a colorful illustrated cartoon style, fun vibrant colors, playful presentation, appealing to all ages, digital art style, clean vector-like illustration.",
  minimalist: "Transform this food product into a minimalist photograph with soft natural shadows, neutral muted tones, clean aesthetic, modern Scandinavian style, simple elegant composition.",
  white_bg: "Transform this food product into a pure white background e-commerce style photo, studio product shot, clean professional presentation, no shadows, isolated product, online store ready.",
  dark_mode: "Transform this food product into a dark moody photograph with dramatic lighting, dark elegant background, professional food photography, high contrast, premium feel.",
  top_view: "Transform this food product into a stunning top-down 360-degree flat lay photograph, bird's eye view, overhead shot showing the complete dish presentation, professional food photography, edge-to-edge composition filling the entire frame, no white margins or borders, full bleed image, perfect for restaurant menus and food apps, appetizing presentation from above.",
};

// Aspect ratios compatible with Instagram and common use cases
const ASPECT_RATIO_CONFIG: Record<string, string> = {
  '1:1': 'Create a perfectly square image with 1:1 aspect ratio, ideal for Instagram feed posts.',
  '4:5': 'Create a portrait image with 4:5 aspect ratio, ideal for Instagram feed with maximum visibility.',
  '9:16': 'Create a vertical image with 9:16 aspect ratio, ideal for Instagram Stories and Reels.',
  '16:9': 'Create a landscape image with 16:9 aspect ratio, ideal for wide displays and presentations.',
};

/**
 * Convert image URL to base64
 * Gemini API requires images as base64-encoded inline data
 */
async function imageUrlToBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/jpeg';

  // Validate image format - only accept PNG, JPG, JPEG
  const allowedFormats = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedFormats.includes(contentType.toLowerCase())) {
    throw new Error(`Formato de imagen no soportado: ${contentType}. Solo se aceptan PNG, JPG, JPEG.`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Convert to base64 in chunks to avoid stack overflow
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: contentType,
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      imageUrl,
      style,
      menuItemId,
      menuItemName,
      storeId,
      aspectRatio,
    } = await req.json();

    console.log(`[Gemini 2.5 Flash] Processing: ${menuItemName}, style: ${style}, ratio: ${aspectRatio || '1:1'}`);

    // Validate required parameters
    if (!imageUrl || !style || !storeId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: imageUrl, style, storeId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Gemini API Key
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build prompt
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.realistic;
    const aspectSpec = ASPECT_RATIO_CONFIG[aspectRatio] || ASPECT_RATIO_CONFIG['1:1'];
    const fullPrompt = `${aspectSpec} ${stylePrompt} Product name: ${menuItemName}. Keep the food item recognizable but enhance its presentation with professional photography techniques. IMPORTANT: Do not add any text, letters, words, labels, or written elements to the image. The image must be pure photography without any text overlay.`;

    console.log(`Prompt: ${fullPrompt.substring(0, 150)}...`);

    // Convert image to base64
    console.log('Converting image to base64...');
    const { data: base64Image, mimeType } = await imageUrlToBase64(imageUrl);

    // Call Gemini API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

    console.log(`Calling Gemini API: ${GEMINI_MODEL}`);

    const aiResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'x-goog-api-key': GEMINI_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: fullPrompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Image,
              },
            },
          ],
        }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: {
            aspectRatio: aspectRatio || '1:1',
          },
        },
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Gemini API error:', aiResponse.status, errorText);

      // Handle specific error codes
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error: 'Rate limit exceeded. Please try again in a moment.',
            status: 429,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 400) {
        return new Response(
          JSON.stringify({
            error: 'Invalid request. Please check your image format.',
            status: 400,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (aiResponse.status === 403) {
        return new Response(
          JSON.stringify({
            error: 'API key invalid or quota exceeded. Please check your Gemini API configuration.',
            status: 403,
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to generate image with Gemini API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    console.log('Gemini API response received');

    // Extract generated image from response
    const generatedImagePart = aiData.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData
    );

    if (!generatedImagePart?.inlineData?.data) {
      console.error('No image in Gemini response:', JSON.stringify(aiData).substring(0, 500));
      return new Response(
        JSON.stringify({ error: 'No image generated by AI' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const generatedImageBase64 = generatedImagePart.inlineData.data;
    const generatedMimeType = generatedImagePart.inlineData.mimeType || 'image/png';

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Convert base64 to Uint8Array for upload
    const imageBuffer = Uint8Array.from(atob(generatedImageBase64), c => c.charCodeAt(0));

    // Generate filename
    const aspectSuffix = aspectRatio ? `-${aspectRatio.replace(':', 'x')}` : '';
    const fileName = `ai-enhanced/${storeId}/${menuItemId}-${style}${aspectSuffix}-${Date.now()}.png`;

    console.log(`Uploading to storage: ${fileName}`);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-images')
      .upload(fileName, imageBuffer, {
        contentType: generatedMimeType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return new Response(
        JSON.stringify({ error: 'Failed to save enhanced image' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('menu-images')
      .getPublicUrl(fileName);

    console.log('Enhanced image uploaded:', publicUrl);

    // Record in history
    await supabase.from('ai_enhancement_history').insert({
      store_id: storeId,
      menu_item_id: menuItemId,
      original_image_url: imageUrl,
      enhanced_image_url: publicUrl,
      style: style,
      prompt_used: fullPrompt,
      credit_type: 'monthly',
      model_used: GEMINI_MODEL,
      aspect_ratio: aspectRatio || '1:1',
      resolution: '1K', // Gemini 2.5 Flash generates up to 1K
    });

    return new Response(
      JSON.stringify({
        success: true,
        enhancedImageUrl: publicUrl,
        model: 'Gemini 2.5 Flash Image',
        cost: 0.039, // $0.039 per image
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhance-product-image:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
