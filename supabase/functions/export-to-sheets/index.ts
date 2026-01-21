/**
 * IMPORTANT: Smart Sync Mode - Selective Update
 * ----------------------------------------------
 * לא לשנות נתונים קיימים! רק לעדכן עמודה Y (ערך תכונה) בוריאציות
 * 
 * כללים:
 * - עמודה J (סוג) - לא לגעת! הנתונים בגיליון נכונים
 * - עמודה Y - לעדכן רק אם ריקה בוריאציה
 * - שורות חדשות - להוסיף רק אם המוצר לא קיים
 * - לפני מחיקה - לשאול את המשתמש
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SPREADSHEET_ID = '1600GHPosM1lNaWE9SdGMS0AFZiXEEJuN9P7Han5081g';

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
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:Z`;
  
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

// Get the name of the first sheet and its sheetId
async function getFirstSheetInfo(accessToken: string): Promise<{name: string, sheetId: number}> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?fields=sheets.properties`;
  
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

// Update specific rows in batch
async function batchUpdateRows(accessToken: string, updates: Array<{range: string, values: string[][]}>): Promise<void> {
  if (updates.length === 0) {
    console.log('No rows to update');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values:batchUpdate`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: updates
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Batch update error:', error);
    throw new Error(`Failed to batch update: ${error}`);
  }
  
  console.log(`Updated ${updates.length} rows`);
}

// Append new rows at the end of the sheet
async function appendRows(accessToken: string, values: string[][]): Promise<void> {
  if (values.length === 0) {
    console.log('No rows to append');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/A:Z:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  
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

// Add dropdown validation to columns E, J, K
async function addDropdownValidation(accessToken: string, sheetId: number): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}:batchUpdate`;
  
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

/**
 * Check if Column Y needs to be updated for a variation row
 * Only returns true if Column Y is empty and this is a variation
 */
function needsColumnYUpdate(existing: string[]): boolean {
  const existingY = (existing[24] || '').trim();
  return !existingY; // Return true if Column Y is empty
}

/**
 * Build product rows for a single product
 */
function buildProductRows(
  product: any, 
  categoryString: string
): string[][] {
  const productName = product.name.trim();
  const kgVariationName = `${productName} ק"ג`;
  const unitVariationName = `${productName} יח'`;

  const rows: string[][] = [];

  // Main product row
  rows.push([
    '',                                  // A - ריק
    productName,                         // B - שם ✅
    '',                                  // C - ריק
    '',                                  // D - ריק
    'פרסם',                              // E - פורסם ✅
    product.image_url || '',             // F - תמונות ✅
    '',                                  // G - ריק
    '',                                  // H - ריק
    '',                                  // I - ריק
    'מוצר עם וריאציות',                  // J - סוג ✅
    'לא',                                // K ✅
    '',                                  // L - ריק
    '',                                  // M - ריק
    productName.replace(/\s+/g, '-'),    // N - slug ✅
    categoryString,                      // O - קטגוריות ✅
    '',                                  // P - ריק
    '',                                  // Q - ריק
    '',                                  // R - ריק
    '',                                  // S - ריק
    '',                                  // T - ריק
    '',                                  // U - ריק
    '',                                  // V - ריק
    '',                                  // W - ריק
    '',                                  // X - ריק
    '',                                  // Y - ריק (ערכים רק בוריאציות)
    ''                                   // Z - ריק
  ]);

  // Kg variation row
  rows.push([
    '',                                  // A - ריק
    kgVariationName,                     // B - שם ✅
    product.price_per_kg ? String(product.price_per_kg) : '',  // C - מחיר ✅
    '',                                  // D - ריק
    'פרסם',                              // E - פורסם ✅
    product.image_url || '',             // F - תמונות ✅
    '',                                  // G - ריק
    '',                                  // H - ריק
    '',                                  // I - ריק
    'וריאציה',                           // J - סוג ✅
    'לא',                                // K ✅
    '',                                  // L - ריק
    '',                                  // M - ריק
    kgVariationName.replace(/\s+/g, '-'),// N - slug ✅
    '',                                  // O - ריק (קטגוריה רק במוצר ראשי)
    '',                                  // P - ריק
    '',                                  // Q - ריק
    '',                                  // R - ריק
    '',                                  // S - ריק
    '',                                  // T - ריק
    '',                                  // U - ריק
    '',                                  // V - ריק
    '',                                  // W - ריק
    '',                                  // X - ריק
    'kilo',                              // Y - ערך תכונה ✅
    ''                                   // Z - ריק
  ]);

  // Unit variation row
  rows.push([
    '',                                  // A - ריק
    unitVariationName,                   // B - שם ✅
    product.price_per_unit ? String(product.price_per_unit) : '',  // C - מחיר ✅
    '',                                  // D - ריק
    'פרסם',                              // E - פורסם ✅
    product.image_url || '',             // F - תמונות ✅
    '',                                  // G - ריק
    '',                                  // H - ריק
    '',                                  // I - ריק
    'וריאציה',                           // J - סוג ✅
    'לא',                                // K ✅
    '',                                  // L - ריק
    '',                                  // M - ריק
    unitVariationName.replace(/\s+/g, '-'),// N - slug ✅
    '',                                  // O - ריק (קטגוריה רק במוצר ראשי)
    '',                                  // P - ריק
    '',                                  // Q - ריק
    '',                                  // R - ריק
    '',                                  // S - ריק
    '',                                  // T - ריק
    '',                                  // U - ריק
    '',                                  // V - ריק
    '',                                  // W - ריק
    '',                                  // X - ריק
    'piece',                             // Y - ערך תכונה ✅
    ''                                   // Z - ריק
  ]);

  return rows;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting SMART SYNC export to Google Sheets...');
    console.log('Mode: Update only what is missing or different - DO NOT delete all data!');
    
    // קבלת פרמטרים מהבקשה
    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    
    if (productId) {
      console.log(`Exporting single product: ${productId}`);
    }
    
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

    // Fetch products - all active or specific one
    let productsQuery = supabase
      .from('products')
      .select('*')
      .eq('is_active', true);
    
    // אם יש productId, לסנן רק אותו
    if (productId) {
      productsQuery = productsQuery.eq('id', productId);
    }
    
    const { data: products, error: productsError } = await productsQuery.order('name');

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
    const { name: sheetName, sheetId } = await getFirstSheetInfo(accessToken);

    // ==========================================
    // SMART SYNC: Read existing data first
    // ==========================================
    console.log('Reading existing sheet data for smart sync...');
    const existingRows = await readSheet(accessToken);
    console.log(`Found ${existingRows.length} existing rows in sheet (including header)`);

    // Build map of existing products by name (Column B)
    // Format: productName -> { rowIndex: number, data: string[] }
    const existingProductsMap = new Map<string, { rowIndex: number, data: string[] }>();
    
    existingRows.forEach((row, index) => {
      if (index === 0) return; // Skip header row
      const productName = (row[1] || '').trim().toLowerCase(); // Column B
      if (productName) {
        existingProductsMap.set(productName, {
          rowIndex: index + 1, // 1-based row number for Google Sheets
          data: row
        });
      }
    });

    console.log(`Mapped ${existingProductsMap.size} existing product rows`);

    // Filter duplicate products by name
    const seenProducts = new Set<string>();
    const uniqueProducts = products?.filter(product => {
      const key = product.name.toLowerCase().trim();
      if (seenProducts.has(key)) {
        console.log(`Skipping duplicate product: ${product.name}`);
        return false;
      }
      seenProducts.add(key);
      return true;
    }) || [];

    console.log(`Processing ${uniqueProducts.length} unique products from database`);

    // Track what we need to do
    const rowsToUpdate: Array<{ range: string, values: string[][] }> = [];
    const rowsToAdd: string[][] = [];
    const processedNames = new Set<string>();

    // Process each product from database
    uniqueProducts.forEach(product => {
      const categoryNames = productCategoriesMap.get(product.id) || [];
      const categoryString = categoryNames.join(', ');
      
      // Build the 3 rows for this product
      const productRows = buildProductRows(product, categoryString);
      
      const productName = product.name.trim();
      const kgVariationName = `${productName} ק"ג`;
      const unitVariationName = `${productName} יח'`;
      
      const rowNames = [
        productName.toLowerCase(),
        kgVariationName.toLowerCase(),
        unitVariationName.toLowerCase()
      ];

      rowNames.forEach((name, idx) => {
        processedNames.add(name);
        const existing = existingProductsMap.get(name);
        
        if (existing) {
          // Row exists - check if Column Y needs updating (only for variations)
          const isVariation = idx > 0; // 0 = parent, 1 = kg, 2 = unit
          
          if (isVariation && needsColumnYUpdate(existing.data)) {
            // Column Y is empty - update ONLY Column Y
            const yValue = idx === 1 ? 'kilo' : 'piece';
            console.log(`Updating Column Y for "${name}" to "${yValue}"`);
            rowsToUpdate.push({
              range: `${sheetName}!Y${existing.rowIndex}`,  // Only Column Y!
              values: [[yValue]]
            });
          }
          // Do NOT update anything else - existing data is correct!
        } else {
          // Row doesn't exist - add it
          console.log(`Row "${name}" is new, will be added`);
          rowsToAdd.push(productRows[idx]);
        }
      });
    });

    // Find rows that exist in sheet but not in our database
    const rowsOnlyInSheet: string[] = [];
    existingProductsMap.forEach((value, name) => {
      if (!processedNames.has(name)) {
        rowsOnlyInSheet.push(name);
      }
    });

    console.log(`Summary: ${rowsToUpdate.length} rows to update, ${rowsToAdd.length} rows to add, ${rowsOnlyInSheet.length} rows only in sheet`);

    // Execute updates
    if (rowsToUpdate.length > 0) {
      console.log(`Updating ${rowsToUpdate.length} existing rows...`);
      await batchUpdateRows(accessToken, rowsToUpdate);
    }

    // Execute additions
    if (rowsToAdd.length > 0) {
      console.log(`Adding ${rowsToAdd.length} new rows...`);
      await appendRows(accessToken, rowsToAdd);
    }

    // Add dropdown validation
    console.log('Ensuring dropdown validation...');
    await addDropdownValidation(accessToken, sheetId);

    const result = {
      success: true,
      mode: 'smart_sync',
      summary: {
        totalProductsInDb: uniqueProducts.length,
        rowsUpdated: rowsToUpdate.length,
        rowsAdded: rowsToAdd.length,
        rowsUnchanged: (uniqueProducts.length * 3) - rowsToUpdate.length - rowsToAdd.length,
        rowsOnlyInSheet: rowsOnlyInSheet.length
      },
      // If there are rows only in sheet, return them for user decision
      requiresConfirmation: rowsOnlyInSheet.length > 0,
      productsOnlyInSheet: rowsOnlyInSheet.length > 0 ? rowsOnlyInSheet.slice(0, 20) : [], // Limit to 20 for display
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
    };

    console.log('Smart sync completed:', result);

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
