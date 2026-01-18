import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1PebfUSiCNPfQHMtHIPIwhfKwxjPK7vMN503xx4k6B3w';

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

// Read existing sheet data
async function readSheet(accessToken: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:U`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Read sheet error:', error);
    throw new Error(`Failed to read sheet: ${error}`);
  }
  
  const data = await response.json();
  console.log(`Read ${data.values?.length || 0} rows from sheet`);
  return data.values || [];
}

// Update specific cells in batch
async function batchUpdateCells(accessToken: string, updates: Array<{range: string, value: string}>): Promise<void> {
  if (updates.length === 0) {
    console.log('No updates to make');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`;
  
  const data = updates.map(u => ({
    range: u.range,
    values: [[u.value]]
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: data
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Batch update error:', error);
    throw new Error(`Failed to batch update: ${error}`);
  }
  
  console.log(`Updated ${updates.length} cells`);
}

// Append new rows at the end of the sheet
async function appendRows(accessToken: string, values: string[][]): Promise<void> {
  if (values.length === 0) {
    console.log('No rows to append');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:U:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Append rows error:', error);
    throw new Error(`Failed to append rows: ${error}`);
  }
  
  console.log(`Appended ${values.length} rows`);
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting smart export to Google Sheets...');
    
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

    // Fetch all active products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (productsError) {
      console.error('Products fetch error:', productsError);
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    console.log(`Fetched ${products?.length || 0} products from database`);

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

    // Read existing sheet data
    console.log('Reading existing sheet data...');
    const existingData = await readSheet(accessToken);
    console.log(`Found ${existingData.length} existing rows`);

    // Create map of existing products by name (column B - index 1)
    // Map: productName -> array of row numbers (1-indexed for Google Sheets)
    const existingProductRows = new Map<string, number[]>();
    let maxExistingId = 0;
    
    existingData.forEach((row, index) => {
      const productName = row[1]?.trim(); // Column B (index 1)
      if (productName && index > 0) { // Skip header row
        const rows = existingProductRows.get(productName) || [];
        rows.push(index + 1); // 1-indexed for Google Sheets
        existingProductRows.set(productName, rows);
        
        // Track max ID from column A
        const idValue = parseInt(row[0], 10);
        if (!isNaN(idValue) && idValue > maxExistingId) {
          maxExistingId = idValue;
        }
      }
    });

    console.log(`Mapped ${existingProductRows.size} unique product names in sheet, max ID: ${maxExistingId}`);

    // Prepare updates and new rows
    const cellUpdates: Array<{range: string, value: string}> = [];
    const newRows: string[][] = [];
    let nextId = maxExistingId + 1;

    // Create a set to track products we've processed from the database
    const processedProducts = new Set<string>();

    products?.forEach(product => {
      const productName = product.name.trim();
      const kgVariationName = `${productName} - מחיר לקילו`;
      const unitVariationName = `${productName} - מחיר ליחידה`;
      
      processedProducts.add(productName);
      processedProducts.add(kgVariationName);
      processedProducts.add(unitVariationName);

      const categoryNames = productCategoriesMap.get(product.id) || [];
      const categoryString = categoryNames.join(', ');

      // Check if main product exists in sheet
      const mainProductRows = existingProductRows.get(productName);
      if (mainProductRows && mainProductRows.length > 0) {
        // Update existing row - only columns E (status) and J (type)
        const rowNum = mainProductRows[0];
        cellUpdates.push({ range: `E${rowNum}`, value: 'פרסם' });
        cellUpdates.push({ range: `J${rowNum}`, value: 'מוצר עם וריאציות' });
        console.log(`Updating main product "${productName}" at row ${rowNum}`);
      } else {
        // Add new main product row with sequential ID
        newRows.push([
          String(nextId++),           // A - מזהה
          productName,                // B - שם
          '',                         // C - מחיר רגיל
          '',                         // D - מחיר מבצע
          'פרסם',                     // E - פורסם
          product.image_url || '',    // F - תמונות
          '',                         // G
          '',                         // H
          '',                         // I
          'מוצר עם וריאציות',          // J - סוג
          'לא',                       // K
          '',                         // L
          '',                         // M - ברקוד (ריק)
          productName.replace(/\s+/g, '-'),  // N - slug
          categoryString,             // O - קטגוריות
          '',                         // P
          '',                         // Q
          '',                         // R
          '',                         // S
          '',                         // T
          ''                          // U
        ]);
        console.log(`Adding new main product: "${productName}" with ID ${nextId - 1}`);
      }

      // Check if kg variation exists
      const kgRows = existingProductRows.get(kgVariationName);
      if (kgRows && kgRows.length > 0) {
        const rowNum = kgRows[0];
        cellUpdates.push({ range: `E${rowNum}`, value: 'פרסם' });
        cellUpdates.push({ range: `J${rowNum}`, value: 'וריאציה' });
        console.log(`Updating kg variation "${kgVariationName}" at row ${rowNum}`);
      } else {
        // Add new kg variation row with sequential ID
        newRows.push([
          String(nextId++),           // A - מזהה
          kgVariationName,            // B - שם
          product.price_per_kg ? String(product.price_per_kg) : '',  // C - מחיר רגיל
          '',                         // D - מחיר מבצע
          'פרסם',                     // E - פורסם
          product.image_url || '',    // F - תמונות
          '',                         // G
          '',                         // H
          '',                         // I
          'וריאציה',                  // J - סוג
          'לא',                       // K
          '',                         // L
          '',                         // M - ברקוד (ריק)
          kgVariationName.replace(/\s+/g, '-'),  // N - slug
          categoryString,             // O - קטגוריות
          '',                         // P
          '100',                      // Q - משקל
          'מחיר לקילו',               // R - שם תכונה
          '',                         // S
          '',                         // T
          ''                          // U
        ]);
        console.log(`Adding new kg variation: "${kgVariationName}" with ID ${nextId - 1}`);
      }

      // Check if unit variation exists
      const unitRows = existingProductRows.get(unitVariationName);
      if (unitRows && unitRows.length > 0) {
        const rowNum = unitRows[0];
        cellUpdates.push({ range: `E${rowNum}`, value: 'פרסם' });
        cellUpdates.push({ range: `J${rowNum}`, value: 'וריאציה' });
        console.log(`Updating unit variation "${unitVariationName}" at row ${rowNum}`);
      } else {
        // Add new unit variation row with sequential ID
        newRows.push([
          String(nextId++),           // A - מזהה
          unitVariationName,          // B - שם
          product.price_per_unit ? String(product.price_per_unit) : '',  // C - מחיר רגיל
          '',                         // D - מחיר מבצע
          'פרסם',                     // E - פורסם
          product.image_url || '',    // F - תמונות
          '',                         // G
          '',                         // H
          '',                         // I
          'וריאציה',                  // J - סוג
          'לא',                       // K
          '',                         // L
          '',                         // M - ברקוד (ריק)
          unitVariationName.replace(/\s+/g, '-'),  // N - slug
          categoryString,             // O - קטגוריות
          '',                         // P
          '100',                      // Q - משקל
          'מחיר ליחידה',              // R - שם תכונה
          '',                         // S
          '',                         // T
          ''                          // U
        ]);
        console.log(`Adding new unit variation: "${unitVariationName}" with ID ${nextId - 1}`);
      }
    });

    // Execute batch updates for existing products
    if (cellUpdates.length > 0) {
      console.log(`Executing ${cellUpdates.length} cell updates...`);
      await batchUpdateCells(accessToken, cellUpdates);
    }

    // Append new rows
    if (newRows.length > 0) {
      console.log(`Appending ${newRows.length} new rows...`);
      // Log first row structure to verify columns
      console.log('First new row structure:', JSON.stringify(newRows[0]));
      console.log('First row column A (ID):', newRows[0][0]);
      console.log('First row column B (Name):', newRows[0][1]);
      console.log('First row column O (Categories):', newRows[0][14]);
      await appendRows(accessToken, newRows);
    }

    const result = {
      success: true,
      totalProducts: products?.length || 0,
      updatedCells: cellUpdates.length,
      newRowsAdded: newRows.length,
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
