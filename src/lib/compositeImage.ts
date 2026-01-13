import productCardBg from '@/assets/product-card-bg.png';

const CANVAS_SIZE = 512; // Output image size

/**
 * Load an image from a URL or Blob
 */
const loadImage = (source: string | Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    
    if (source instanceof Blob) {
      img.src = URL.createObjectURL(source);
    } else {
      img.src = source;
    }
  });
};

/**
 * Composite a product image (with transparent background) onto the pink dotted background
 */
export const compositeProductOnBackground = async (
  productBlob: Blob
): Promise<Blob> => {
  console.log('Starting image compositing...');
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_SIZE;
  canvas.height = CANVAS_SIZE;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Load background image
  console.log('Loading background image...');
  const bgImage = await loadImage(productCardBg);
  
  // Draw background scaled to fill canvas
  ctx.drawImage(bgImage, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
  
  // Load product image (with transparent background)
  console.log('Loading product image...');
  const productImage = await loadImage(productBlob);
  
  // Calculate size and position to center the product
  // Product should fill about 80% of the canvas
  const maxProductSize = CANVAS_SIZE * 0.8;
  const scale = Math.min(
    maxProductSize / productImage.width,
    maxProductSize / productImage.height
  );
  
  const productWidth = productImage.width * scale;
  const productHeight = productImage.height * scale;
  const x = (CANVAS_SIZE - productWidth) / 2;
  const y = (CANVAS_SIZE - productHeight) / 2;
  
  // Draw product centered on background
  console.log('Compositing product on background...');
  ctx.drawImage(productImage, x, y, productWidth, productHeight);
  
  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          console.log('Compositing completed successfully');
          resolve(blob);
        } else {
          reject(new Error('Failed to create composite image blob'));
        }
      },
      'image/png',
      1.0
    );
  });
};

/**
 * Convert a data URL (base64) to Blob
 */
export const dataUrlToBlob = async (dataUrl: string): Promise<Blob> => {
  const response = await fetch(dataUrl);
  return response.blob();
};
