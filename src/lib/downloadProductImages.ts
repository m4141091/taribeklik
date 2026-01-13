import { Product } from '@/types/product';
import JSZip from 'jszip';

// Sanitize filename to be safe for file systems
const sanitizeFilename = (name: string): string => {
  return name
    .replace(/[/\\?%*:|"<>]/g, '-') // Replace invalid chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
};

// Get file extension from URL or default to jpg
const getFileExtension = (url: string): string => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
      return ext;
    }
  } catch {
    // URL parsing failed
  }
  return 'jpg';
};

export const downloadProductImages = async (
  products: Product[],
  onProgress?: (current: number, total: number) => void
): Promise<void> => {
  const productsWithImages = products.filter(p => p.image_url);
  
  if (productsWithImages.length === 0) {
    throw new Error('אין מוצרים עם תמונות להורדה');
  }

  const zip = new JSZip();
  const folder = zip.folder('product-images');
  
  if (!folder) {
    throw new Error('שגיאה ביצירת תיקייה');
  }

  let successCount = 0;
  const total = productsWithImages.length;

  for (let i = 0; i < productsWithImages.length; i++) {
    const product = productsWithImages[i];
    onProgress?.(i + 1, total);

    try {
      const response = await fetch(product.image_url!);
      if (!response.ok) continue;
      
      const blob = await response.blob();
      const ext = getFileExtension(product.image_url!);
      const filename = `${sanitizeFilename(product.name)}.${ext}`;
      
      folder.file(filename, blob);
      successCount++;
    } catch (error) {
      console.error(`Failed to download image for ${product.name}:`, error);
      // Continue with other images
    }
  }

  if (successCount === 0) {
    throw new Error('לא הצלחנו להוריד אף תמונה');
  }

  // Generate and download the zip
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = `product-images-${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
