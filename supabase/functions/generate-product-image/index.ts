import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, productName, imageUrl, instruction, backgroundImageBase64 } = await req.json();
    
    console.log(`Processing ${action} request for: ${productName || 'image edit'}`);
    console.log(`Background image provided: ${!!backgroundImageBase64}`);

    const apiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!apiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let messages;

    if (action === 'generate') {
      if (!productName) {
        return new Response(
          JSON.stringify({ error: 'Product name is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (!backgroundImageBase64) {
        return new Response(
          JSON.stringify({ error: 'Background image is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate product directly on the provided background
      const prompt = `Place "${productName}" (Israeli fresh produce) on this pink dotted background.

CRITICAL Requirements:
- The product should be CENTERED and fill approximately 70% of the image
- Arrange multiple units of the product attractively
- Professional studio lighting on the product
- Photorealistic, high quality, sharp and detailed
- Vivid, natural colors for the produce
- KEEP THE EXACT SAME BACKGROUND PATTERN - do not change the pink dotted background at all
- No text or logos
- The product should look like it's photographed on this exact background`;

      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: backgroundImageBase64 } }
          ]
        }
      ];
    } else if (action === 'edit') {
      if (!imageUrl || !instruction) {
        return new Response(
          JSON.stringify({ error: 'Image URL and instruction are required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: instruction },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ];
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use "generate" or "edit"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try up to 3 times to generate an image
    const maxRetries = 3;
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Calling AI Gateway... (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(AI_GATEWAY_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash-image-preview',
          messages,
          modalities: ['image', 'text'],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`AI Gateway error: ${response.status} - ${errorText}`);
        
        if (response.status === 429) {
          return new Response(
            JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        if (response.status === 402) {
          return new Response(
            JSON.stringify({ error: 'Insufficient credits. Please check your account.' }),
            { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        lastError = 'Failed to generate image';
        continue;
      }

      const data = await response.json();
      const generatedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (generatedImageUrl) {
        console.log('Image generated successfully');
        return new Response(
          JSON.stringify({ imageUrl: generatedImageUrl }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log(`Attempt ${attempt}: No image in response, retrying...`);
      lastError = 'Model did not generate an image';
      
      // Small delay before retry
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    console.error(`Failed after ${maxRetries} attempts`);
    return new Response(
      JSON.stringify({ error: lastError || 'No image generated after multiple attempts' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );


  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error in generate-product-image:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
