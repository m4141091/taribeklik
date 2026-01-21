import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normalize name for flexible matching (remove quotes/gershayim)
const normalizeName = (name: string): string => {
  return name
    .trim()
    .replace(/[״"'׳]/g, '') // Remove gershayim and quotes
    .toLowerCase();
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { mappings } = await req.json();
    
    console.log(`Received ${mappings.length} mappings to import`);

    // First, get all products to create a name -> id map with normalized names
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name');

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    // Create a map of normalized names to product records
    const productMap = new Map<string, { id: string; name: string }>();
    for (const product of products || []) {
      productMap.set(normalizeName(product.name), product);
    }

    console.log(`Found ${productMap.size} products in database`);

    let updated = 0;
    const notFound: string[] = [];
    const updatedProducts: string[] = [];

    for (const { name, imageUrl } of mappings) {
      if (!name || !imageUrl) continue;
      
      const normalizedName = normalizeName(name);
      const product = productMap.get(normalizedName);
      
      if (!product) {
        notFound.push(name);
        console.log(`Product not found: "${name}" (normalized: "${normalizedName}")`);
        continue;
      }

      const { error: updateError } = await supabase
        .from('products')
        .update({ wordpress_image_url: imageUrl })
        .eq('id', product.id);
      
      if (updateError) {
        console.error(`Failed to update product "${name}": ${updateError.message}`);
      } else {
        updated++;
        updatedProducts.push(product.name);
      }
    }

    console.log(`Updated ${updated} products, ${notFound.length} not found`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated, 
        notFound,
        updatedProducts: updatedProducts.slice(0, 10) // Return first 10 for confirmation
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Import error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
