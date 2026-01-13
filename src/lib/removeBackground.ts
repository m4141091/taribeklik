import { removeBackground as imglyRemoveBackground, preload, Config } from '@imgly/background-removal';
import { supabase } from '@/integrations/supabase/client';

const bgRemovalConfig: Config = {
  publicPath: 'https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/',
  debug: false,
  proxyToWorker: true,
  model: 'isnet',
};

let isModelLoading = false;
let modelLoadPromise: Promise<void> | null = null;

// Pre-load the model to speed up subsequent uses
export const preloadBackgroundRemovalModel = async (): Promise<void> => {
  if (modelLoadPromise) return modelLoadPromise;
  
  isModelLoading = true;
  modelLoadPromise = (async () => {
    try {
      console.log('Pre-loading background removal model...');
      await preload(bgRemovalConfig);
      console.log('Background removal model loaded successfully');
    } catch (error) {
      console.error('Failed to pre-load model:', error);
      modelLoadPromise = null;
    } finally {
      isModelLoading = false;
    }
  })();
  
  return modelLoadPromise;
};

export const removeBackground = async (
  imageSource: HTMLImageElement | Blob | string
): Promise<Blob> => {
  try {
    console.log('Starting background removal with @imgly/background-removal...');
    
    let inputBlob: Blob;
    
    if (imageSource instanceof Blob) {
      inputBlob = imageSource;
    } else if (imageSource instanceof HTMLImageElement) {
      // Convert HTMLImageElement to Blob
      const canvas = document.createElement('canvas');
      canvas.width = imageSource.naturalWidth;
      canvas.height = imageSource.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(imageSource, 0, 0);
      inputBlob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image to blob'));
        }, 'image/png');
      });
    } else {
      // It's a URL string - fetch it
      const response = await fetch(imageSource);
      inputBlob = await response.blob();
    }
    
    console.log('Processing image for background removal...');
    
    const resultBlob = await imglyRemoveBackground(inputBlob, {
      ...bgRemovalConfig,
      progress: (key, current, total) => {
        const percent = Math.round((current / total) * 100);
        console.log(`Background removal: ${key} - ${percent}%`);
      },
    });
    
    console.log('Background removal completed successfully');
    return resultBlob;
  } catch (error) {
    console.error('Error removing background:', error);
    throw error;
  }
};

export const loadImageFromUrl = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
};

export const uploadBackgroundRemovedImage = async (blob: Blob): Promise<string> => {
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}-nobg.png`;
  
  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(fileName, blob);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('product-images')
    .getPublicUrl(fileName);

  return data.publicUrl;
};

export const removeBackgroundFromUrl = async (imageUrl: string): Promise<string> => {
  const blob = await removeBackground(imageUrl);
  const newUrl = await uploadBackgroundRemovedImage(blob);
  return newUrl;
};
