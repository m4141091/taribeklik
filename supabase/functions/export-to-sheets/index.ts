import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Authentication and authorization helper
async function verifyAdminAccess(req: Request): Promise<{ error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
  
  if (claimsError || !claimsData?.claims) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  const userId = claimsData.claims.sub;

  // Verify admin role
  const { data: roleData, error: roleError } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .maybeSingle();

  if (roleError || !roleData) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    };
  }

  return { error: null };
}

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
async function readSheet(accessToken: string, spreadsheetId: string): Promise<string[][]> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z`;
  
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

// Template header matching the user's Google Sheets format
const TEMPLATE_HEADER = [
  'מזהה',         // A
  'שם מוצר',      // B
  'מחיר',         // C
  'מחיר מבצע',    // D
  'סטטוס',        // E
  'תמונה 1',      // F
  'מק"ט',         // G
  'תיאור מפורט',  // H
  'תיאור קצר',    // I
  'סוג',          // J
  'ניתן להורדה',  // K
  'קישור הורדה',  // L
  'קטגוריות',     // M
  'תת קטגוריה',   // N
  'מותגים',       // O
  'תגיות',        // P
  'מלאי',         // Q
  'צבע (a)',      // R
  'תמונה 2',      // S
  'תמונה 3',      // T
  'תמונה 4',      // U
];

// Clear all data except header row
async function clearSheetData(accessToken: string, spreadsheetId: string, sheetName: string): Promise<void> {
  // Use values:clear API to clear content from row 2 onwards (keep header)
  const range = encodeURIComponent(`${sheetName}!A2:Z10000`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`;
  
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
  
  console.log('Cleared sheet data (kept header row)');
}

// Clear all formatting from the sheet (set white background)
async function clearSheetFormatting(accessToken: string, spreadsheetId: string, sheetId: number): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        repeatCell: {
          range: {
            sheetId: sheetId,
            startRowIndex: 1, // Skip header row
            endRowIndex: 10000,
            startColumnIndex: 0,
            endColumnIndex: 26 // Columns A-Z
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: {
                red: 1.0,
                green: 1.0,
                blue: 1.0
              }
            }
          },
          fields: 'userEnteredFormat.backgroundColor'
        }
      }]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Clear formatting error:', error);
  }
  
  console.log('Cleared sheet formatting (set white background)');
}

// Add dropdown validation to columns E, J, K
async function addDropdownValidation(accessToken: string, spreadsheetId: string, sheetId: number): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [
        // Column E (index 4) - סטטוס: פרסם / טיוטה
        {
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 10000,
              startColumnIndex: 4,
              endColumnIndex: 5
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [{ userEnteredValue: 'פרסם' }, { userEnteredValue: 'טיוטה' }]
              },
              showCustomUi: true,
              strict: false
            }
          }
        },
        // Column J (index 9) - סוג: מוצר עם וריאציות / וריאציה
        {
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 10000,
              startColumnIndex: 9,
              endColumnIndex: 10
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [
                  { userEnteredValue: 'מוצר עם וריאציות' },
                  { userEnteredValue: 'וריאציה' }
                ]
              },
              showCustomUi: true,
              strict: false
            }
          }
        },
        // Column K (index 10) - ניתן להורדה: לא / כן
        {
          setDataValidation: {
            range: {
              sheetId: sheetId,
              startRowIndex: 1,
              endRowIndex: 10000,
              startColumnIndex: 10,
              endColumnIndex: 11
            },
            rule: {
              condition: {
                type: 'ONE_OF_LIST',
                values: [{ userEnteredValue: 'לא' }, { userEnteredValue: 'כן' }]
              },
              showCustomUi: true,
              strict: false
            }
          }
        }
      ]
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Add validation error:', error);
  }
  
  console.log('Added dropdown validation to columns E, J, K');
}

// Get the name of the first sheet and its sheetId
async function getFirstSheetInfo(accessToken: string, spreadsheetId: string): Promise<{name: string, sheetId: number}> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Get sheet info error:', error);
    throw new Error(`Failed to get sheet info: ${error}`);
  }
  
  const data = await response.json();
  const sheetProps = data.sheets?.[0]?.properties;
  const sheetName = sheetProps?.title || 'Sheet1';
  const sheetId = sheetProps?.sheetId || 0;
  console.log(`First sheet: "${sheetName}" (id: ${sheetId})`);
  return { name: sheetName, sheetId };
}

// Update specific cells in batch
async function batchUpdateCells(accessToken: string, spreadsheetId: string, updates: Array<{range: string, value: string}>): Promise<void> {
  if (updates.length === 0) {
    console.log('No updates to make');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`;
  
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
      valueInputOption: 'USER_ENTERED',
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

// Insert a new row at a specific index and write data to it
async function insertRowAt(
  accessToken: string,
  spreadsheetId: string,
  sheetId: number,
  sheetName: string,
  rowIndex: number, 
  rowData: string[]
): Promise<void> {
  // Step 1: Insert an empty row at the specified index
  const insertUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`;
  
  const insertResponse = await fetch(insertUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      requests: [{
        insertDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex - 1, // 0-indexed
            endIndex: rowIndex        // 0-indexed, exclusive
          },
          inheritFromBefore: false
        }
      }]
    }),
  });

  if (!insertResponse.ok) {
    const error = await insertResponse.text();
    console.error('Insert row error:', error);
    throw new Error(`Failed to insert row: ${error}`);
  }

  // Step 2: Write data to the new row
  const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${sheetName}'!A${rowIndex}:Z${rowIndex}?valueInputOption=USER_ENTERED`;
  
  const writeResponse = await fetch(writeUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values: [rowData]
    }),
  });

  if (!writeResponse.ok) {
    const error = await writeResponse.text();
    console.error('Write row error:', error);
    throw new Error(`Failed to write row data: ${error}`);
  }

  console.log(`Inserted row at position ${rowIndex}`);
}

// Append new rows at the end of the sheet
async function appendRows(accessToken: string, spreadsheetId: string, values: string[][]): Promise<void> {
  if (values.length === 0) {
    console.log('No rows to append');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:Z:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
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
    // Verify admin access before proceeding
    const { error: authError } = await verifyAdminAccess(req);
    if (authError) {
      return authError;
    }

    // Parse request body to get spreadsheetId
    const body = await req.json().catch(() => ({}));
    const spreadsheetId = body.spreadsheetId;
    
    if (!spreadsheetId) {
      throw new Error('spreadsheetId is required');
    }
    
    console.log(`Starting smart export to Google Sheets (${spreadsheetId})...`);
    
    // Get credentials from environment
    const credentialsJson = Deno.env.get('GOOGLE_SHEETS_CREDENTIALS');
    if (!credentialsJson) {
      throw new Error('GOOGLE_SHEETS_CREDENTIALS not configured');
    }

    const credentials = JSON.parse(credentialsJson);
    console.log('Credentials loaded for:', credentials.client_email);

    // Create Supabase client with service role for data access
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

    // Get first sheet info (name and sheetId)
    console.log('Getting first sheet info...');
    const { name: sheetName, sheetId } = await getFirstSheetInfo(accessToken, spreadsheetId);

    // Clear all existing data (except header)
    console.log('Clearing existing sheet data...');
    await clearSheetData(accessToken, spreadsheetId, sheetName);

    // Clear existing formatting
    console.log('Clearing existing formatting...');
    await clearSheetFormatting(accessToken, spreadsheetId, sheetId);

    // Prepare all product rows
    const productRows: string[][] = [];
    
    for (const product of products || []) {
      // Get categories for this product
      const productCats = productCategoriesMap.get(product.id) || [];
      const categoriesStr = productCats.join(', ');

      // Calculate base price and sale price (if kg pricing with unit variation)
      let regularPrice = '';
      let salePrice = '';
      
      if (product.pricing_type === 'kg' && product.price_per_kg) {
        regularPrice = product.price_per_kg.toString();
        if (product.has_unit_variation && product.average_weight_kg && product.price_per_unit) {
          salePrice = product.price_per_unit.toString();
        }
      } else if (product.pricing_type === 'unit' && product.price_per_unit) {
        regularPrice = product.price_per_unit.toString();
      }

      // Format image URL for WooCommerce
      const imageUrl = product.wordpress_image_url || product.image_url || '';

      // Determine product type and variation info
      const hasVariation = product.pricing_type === 'kg' && product.has_unit_variation;
      
      if (hasVariation) {
        // Parent product row (variable product)
        const parentRow = [
          product.id,                           // A: מזהה
          'מוצר עם וריאציות',                  // B: סוג
          product.name,                         // C: שם
          'פרסם',                               // D: סטטוס
          categoriesStr,                        // E: קטגוריות
          imageUrl,                             // F: תמונה
          '',                                   // G: מחיר רגיל (parent has no price)
          '',                                   // H: מחיר מבצע
          'weight',                             // I: שם תכונה 1
          'יחידה | קילו',                       // J: ערכים תכונה 1
          '1',                                  // K: גלוי בעמוד מוצר תכונה 1
          '1',                                  // L: גלובלי תכונה 1
        ];
        productRows.push(parentRow);

        // Unit variation row
        const unitRow = [
          `${product.id}-unit`,                 // A: מזהה
          'וריאציה',                            // B: סוג
          `${product.name} - יחידה`,           // C: שם
          'פרסם',                               // D: סטטוס
          '',                                   // E: קטגוריות (empty for variation)
          '',                                   // F: תמונה (empty for variation)
          product.price_per_unit?.toString() || '', // G: מחיר רגיל
          '',                                   // H: מחיר מבצע
          'weight',                             // I: שם תכונה 1
          'יחידה',                              // J: ערך תכונה 1
          '',                                   // K: גלוי בעמוד מוצר (empty for variation)
          '',                                   // L: גלובלי (empty for variation)
          product.id,                           // M: Parent ID
        ];
        productRows.push(unitRow);

        // Kg variation row
        const kgRow = [
          `${product.id}-kg`,                   // A: מזהה
          'וריאציה',                            // B: סוג
          `${product.name} - קילו`,            // C: שם
          'פרסם',                               // D: סטטוס
          '',                                   // E: קטגוריות (empty for variation)
          '',                                   // F: תמונה (empty for variation)
          product.price_per_kg?.toString() || '', // G: מחיר רגיל
          '',                                   // H: מחיר מבצע
          'weight',                             // I: שם תכונה 1
          'קילו',                               // J: ערך תכונה 1
          '',                                   // K: גלוי בעמוד מוצר (empty for variation)
          '',                                   // L: גלובלי (empty for variation)
          product.id,                           // M: Parent ID
        ];
        productRows.push(kgRow);
      } else {
        // Simple product row
        const row = [
          product.id,                           // A: מזהה
          'מוצר פשוט',                          // B: סוג
          product.name,                         // C: שם
          'פרסם',                               // D: סטטוס
          categoriesStr,                        // E: קטגוריות
          imageUrl,                             // F: תמונה
          regularPrice,                         // G: מחיר רגיל
          salePrice,                            // H: מחיר מבצע
          '',                                   // I: שם תכונה 1
          '',                                   // J: ערכים תכונה 1
          '',                                   // K: גלוי בעמוד מוצר תכונה 1
          '',                                   // L: גלובלי תכונה 1
        ];
        productRows.push(row);
      }
    }

    // Append all product rows
    console.log(`Appending ${productRows.length} rows...`);
    await appendRows(accessToken, spreadsheetId, productRows);

    // Add dropdown validations
    console.log('Adding dropdown validations...');
    await addDropdownValidation(accessToken, spreadsheetId, sheetId);

    console.log('Export completed successfully!');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Exported ${products?.length || 0} products (${productRows.length} rows including variations)`,
        productsCount: products?.length || 0,
        rowsCount: productRows.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Export error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
