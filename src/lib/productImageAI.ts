import { supabase } from '@/integrations/supabase/client';
import { removeBackground, uploadBackgroundRemovedImage } from './removeBackground';
import { compositeProductOnBackground, dataUrlToBlob } from './compositeImage';

/**
 * Generate a product image with AI, remove background, and composite on pink dotted background
 */
export const generateProductImage = async (productName: string): Promise<string> => {
  console.log(`Generating product image for: ${productName}`);
  
  // Step 1: Call AI to generate product on white background
  console.log('Step 1: Calling AI to generate product on white background...');
  const { data, error } = await supabase.functions.invoke('generate-product-image', {
    body: { action: 'generate', productName },
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

  const aiGeneratedImageUrl = data.imageUrl;
  console.log('AI generated image URL:', aiGeneratedImageUrl);
  
  // Step 2: Remove background from AI-generated image
  console.log('Step 2: Removing background...');
  const transparentBlob = await removeBackground(aiGeneratedImageUrl);
  
  // Step 3: Composite transparent product on pink dotted background
  console.log('Step 3: Compositing on background...');
  const compositeBlob = await compositeProductOnBackground(transparentBlob);
  
  // Step 4: Upload the final composite image
  console.log('Step 4: Uploading final image...');
  const finalUrl = await uploadBackgroundRemovedImage(compositeBlob);
  
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
