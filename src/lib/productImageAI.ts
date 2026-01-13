import { supabase } from '@/integrations/supabase/client';

const AI_GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';

const getApiKey = async (): Promise<string> => {
  const { data } = await supabase.functions.invoke('get-ai-key');
  return data?.key || '';
};

export const generateProductImage = async (productName: string): Promise<string> => {
  const apiKey = await getApiKey();
  
  const prompt = `צור תמונת מוצר מקצועית עבור "${productName}".
הדרישות:
- יחס 1:1 (ריבועי)
- רקע לבן נקי לחלוטין
- כמה יחידות מהמוצר ביחד (לא יחידה בודדת)
- תאורה מקצועית של סטודיו
- איכות גבוהה כמו צילום לקטלוג
- ללא טקסט או לוגו
- המוצר במרכז התמונה
- צבעים חיים וטבעיים`;

  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate image');
  }

  const data = await response.json();
  const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!imageUrl) {
    throw new Error('No image generated');
  }

  return imageUrl;
};

export const editProductImage = async (imageUrl: string, instruction: string): Promise<string> => {
  const apiKey = await getApiKey();
  
  const response = await fetch(AI_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image-preview',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: instruction,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
              },
            },
          ],
        },
      ],
      modalities: ['image', 'text'],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to edit image');
  }

  const data = await response.json();
  const editedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  
  if (!editedImageUrl) {
    throw new Error('No edited image generated');
  }

  return editedImageUrl;
};

export const generateBatchImages = async (
  productNames: string[],
  onProgress: (current: number, total: number, productName: string) => void
): Promise<Map<string, string>> => {
  const results = new Map<string, string>();
  
  for (let i = 0; i < productNames.length; i++) {
    const name = productNames[i];
    onProgress(i + 1, productNames.length, name);
    
    try {
      const imageUrl = await generateProductImage(name);
      results.set(name, imageUrl);
    } catch (error) {
      console.error(`Failed to generate image for ${name}:`, error);
      // Continue with other products
    }
    
    // Small delay between requests to avoid rate limiting
    if (i < productNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
};

export const base64ToBlob = (base64: string): Blob => {
  const base64Data = base64.replace(/^data:image\/\w+;base64,/, '');
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: 'image/png' });
};

export const uploadBase64Image = async (base64: string): Promise<string> => {
  const blob = base64ToBlob(base64);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
  
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, blob);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
};
