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

    // First, get all products
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, name');

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    console.log(`Found ${products?.length || 0} products in database`);

    let updated = 0;
    const notFound: string[] = [];
    const updatedProducts: string[] = [];

    for (const { name, imageUrl } of mappings) {
      if (!name || !imageUrl) continue;
      
      const normalizedCsvName = normalizeName(name);
      
      // Find all products that START with the CSV name (prefix matching)
      const matchingProducts = (products || []).filter(product => 
        normalizeName(product.name).startsWith(normalizedCsvName)
      );
      
      if (matchingProducts.length === 0) {
        notFound.push(name);
        console.log(`No products found for: "${name}" (normalized: "${normalizedCsvName}")`);
        continue;
      }

      console.log(`Found ${matchingProducts.length} products matching "${name}": ${matchingProducts.map(p => p.name).join(', ')}`);

      // Update all matching products with the same WordPress image URL
      for (const product of matchingProducts) {
        const { error: updateError } = await supabase
          .from('products')
          .update({ wordpress_image_url: imageUrl })
          .eq('id', product.id);
        
        if (updateError) {
          console.error(`Failed to update product "${product.name}": ${updateError.message}`);
        } else {
          updated++;
          updatedProducts.push(product.name);
        }
      }
    }

    console.log(`Updated ${updated} products total, ${notFound.length} CSV names not matched`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated, 
        notFound,
        updatedProducts: updatedProducts.slice(0, 20) // Return first 20 for confirmation
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
