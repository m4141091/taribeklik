import { supabase } from '@/integrations/supabase/client';
import productBackground from '@/assets/product-background.png';
import { composeImageWithBackground } from '@/lib/composeImageWithBackground';

/**
 * Convert an image URL to base64
 */
const imageToBase64 = async (imageUrl: string): Promise<string> => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Cache the background image base64 to avoid re-fetching
let cachedBackgroundBase64: string | null = null;

const getBackgroundBase64 = async (): Promise<string> => {
  if (cachedBackgroundBase64) {
    return cachedBackgroundBase64;
  }
  
  cachedBackgroundBase64 = await imageToBase64(productBackground);
  return cachedBackgroundBase64;
};

/**
 * Generate a product image with AI directly on the pink dotted background
 */
export const generateProductImage = async (productName: string): Promise<string> => {
  console.log(`Generating product image for: ${productName}`);
  
  // Get background image as base64
  const backgroundImageBase64 = await getBackgroundBase64();
  console.log('Background image loaded, calling AI...');
  
  // Call AI to generate product directly on the background
  const { data, error } = await supabase.functions.invoke('generate-product-image', {
    body: { 
      action: 'generate', 
      productName,
      backgroundImageBase64 
    },
  });

  if (error) {
    console.error('Error generating image:', error);
    throw new Error(error.message || 'Failed to generate image');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.imageUrl) {
    throw new Error('No image generated');
  }

  // Upload the generated image to storage
  const generatedImageUrl = data.imageUrl;
  console.log('AI generated image, uploading to storage...');
  
  const finalUrl = await uploadBase64Image(generatedImageUrl);
  console.log('Final image URL:', finalUrl);
  
  return finalUrl;
};

export const editProductImage = async (imageUrl: string, instruction: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke('generate-product-image', {
    body: { action: 'edit', imageUrl, instruction },
  });

  if (error) {
    console.error('Error editing image:', error);
    throw new Error(error.message || 'Failed to edit image');
  }

  if (data?.error) {
    throw new Error(data.error);
  }

  if (!data?.imageUrl) {
    throw new Error('No edited image generated');
  }

  return data.imageUrl;
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
  const rawBlob = base64ToBlob(base64);
  // Bake the dotted background into the image before uploading
  const composedBlob = await composeImageWithBackground(rawBlob);
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, composedBlob, { contentType: 'image/png' });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
};
