import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1VZZYMqRyrTwtuX4ZIg332WJlRCo2xHdwsO0KOSHyTtY';

async function getAccessToken(credentials: any): Promise<string> {
  const header = {
    alg: 'RS256',
    typ: 'JWT',
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  // Base64url encode
  const encode = (obj: any) => {
    const str = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(str);
    return btoa(String.fromCharCode(...bytes))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  };

  const headerB64 = encode(header);
  const claimB64 = encode(claim);
  const signatureInput = `${headerB64}.${claimB64}`;

  // Import private key
  const pemContents = credentials.private_key
    .replace('-----BEGIN PRIVATE KEY-----', '')
    .replace('-----END PRIVATE KEY-----', '')
    .replace(/\s/g, '');
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  // Sign
  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    console.error('Token response:', tokenData);
    throw new Error('Failed to get access token: ' + JSON.stringify(tokenData));
  }

  return tokenData.access_token;
}

async function clearSheet(accessToken: string): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:U:clear`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Clear sheet error:', error);
    throw new Error(`Failed to clear sheet: ${error}`);
  }
  
  console.log('Sheet cleared successfully');
}

async function writeToSheet(accessToken: string, values: string[][]): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A1:U${values.length}?valueInputOption=RAW`;
  
  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Write sheet error:', error);
    throw new Error(`Failed to write to sheet: ${error}`);
  }
  
  console.log(`Written ${values.length} rows to sheet`);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting export to Google Sheets...');
    
    // Get credentials from environment
    const credentialsJson = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS');
    if (!credentialsJson) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS not configured');
    }

    const credentials = JSON.parse(credentialsJson);
    console.log('Credentials loaded for:', credentials.client_email);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      console.error('Products fetch error:', productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    console.log(`Fetched ${products?.length || 0} products`);

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('*');

    if (categoriesError) {
      console.error('Categories fetch error:', categoriesError);
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Fetch product-category relationships
    const { data: productCategories, error: pcError } = await supabase
      .from('product_categories')
      .select('*');

    if (pcError) {
      console.error('Product categories fetch error:', pcError);
      throw new Error(`Failed to fetch product categories: ${pcError.message}`);
    }

    // Create category lookup map
    const categoryMap = new Map(categories?.map(c => [c.id, c.name]) || []);
    
    // Create product to categories lookup
    const productCategoriesMap = new Map<string, string[]>();
    productCategories?.forEach(pc => {
      const existing = productCategoriesMap.get(pc.product_id) || [];
      const categoryName = categoryMap.get(pc.category_id);
      if (categoryName) {
        existing.push(categoryName);
        productCategoriesMap.set(pc.product_id, existing);
      }
    });

    // Get access token
    console.log('Getting Google access token...');
    const accessToken = await getAccessToken(credentials);
    console.log('Access token obtained');

    // Clear existing content
    console.log('Clearing existing sheet content...');
    await clearSheet(accessToken);

    // Prepare data rows
    const headers = [
      'מזהה', 'שם מוצר', 'מחיר', 'מחיר מבצע', 'סטטוס', 'תמונה 1', 'מק"ט',
      'תיאור מפורט', 'תיאור קצר', 'סוג', 'ניתן להורדה', 'קישור הורדה',
      'קטגוריות', 'תת קטגוריה', 'מותגים', 'תגיות', 'מלאי', 'צבע (a)',
      'תמונה 2', 'תמונה 3', 'תמונה 4'
    ];

    const rows: string[][] = [headers];
    let idCounter = 1;

    products?.forEach(product => {
      const parentId = idCounter;
      const categoryNames = productCategoriesMap.get(product.id) || [];
      const categoryString = categoryNames.join(', ');

      // Row 1: Main product
      rows.push([
        String(idCounter++),
        product.name,
        '',
        '',
        'פרסם',
        product.image_url || '',
        '',
        '',
        '',
        'מוצר עם וריאציות',
        'לא',
        '',
        categoryString,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);

      // Row 2: Variation - price per kg
      rows.push([
        String(idCounter++),
        `${product.name} - מחיר לקילו`,
        product.price_per_kg ? String(product.price_per_kg) : '',
        '',
        'פרסם',
        product.image_url || '',
        `${parentId}-kg`,
        '',
        '',
        'וריאציה',
        'לא',
        '',
        '',
        '',
        '',
        '',
        '100',
        'מחיר לקילו',
        '',
        '',
        ''
      ]);

      // Row 3: Variation - price per unit
      rows.push([
        String(idCounter++),
        `${product.name} - מחיר ליחידה`,
        product.price_per_unit ? String(product.price_per_unit) : '',
        '',
        'פרסם',
        product.image_url || '',
        `${parentId}-unit`,
        '',
        '',
        'וריאציה',
        'לא',
        '',
        '',
        '',
        '',
        '',
        '100',
        'מחיר ליחידה',
        '',
        '',
        ''
      ]);
    });

    // Write to sheet
    console.log(`Writing ${rows.length} rows to sheet...`);
    await writeToSheet(accessToken, rows);

    const result = {
      success: true,
      totalProducts: products?.length || 0,
      totalRows: rows.length - 1, // Exclude header
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
    };

    console.log('Export completed:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
