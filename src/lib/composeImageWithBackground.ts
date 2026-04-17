import productCardBg from '@/assets/product-card-bg.png';

let cachedBgImage: HTMLImageElement | null = null;

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const getBackgroundImage = async (): Promise<HTMLImageElement> => {
  if (cachedBgImage) return cachedBgImage;
  cachedBgImage = await loadImage(productCardBg);
  return cachedBgImage;
};

/**
 * Compose a product image on top of the dotted background and return as Blob (PNG).
 * The product image is drawn with object-contain semantics (preserving aspect ratio).
 */
export const composeImageWithBackground = async (
  productImageUrl: string,
  size = 800
): Promise<Blob> => {
  const [bgImg, productImg] = await Promise.all([
    getBackgroundImage(),
    loadImage(productImageUrl),
  ]);

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get canvas context');

  // Draw background (cover)
  const bgRatio = bgImg.width / bgImg.height;
  const canvasRatio = canvas.width / canvas.height;
  let bgW: number, bgH: number, bgX: number, bgY: number;
  if (bgRatio > canvasRatio) {
    bgH = canvas.height;
    bgW = bgH * bgRatio;
    bgX = (canvas.width - bgW) / 2;
    bgY = 0;
  } else {
    bgW = canvas.width;
    bgH = bgW / bgRatio;
    bgX = 0;
    bgY = (canvas.height - bgH) / 2;
  }
  ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);

  // Draw product image (contain)
  const pRatio = productImg.width / productImg.height;
  let pW: number, pH: number;
  if (pRatio > 1) {
    pW = canvas.width;
    pH = pW / pRatio;
  } else {
    pH = canvas.height;
    pW = pH * pRatio;
  }
  const pX = (canvas.width - pW) / 2;
  const pY = (canvas.height - pH) / 2;
  ctx.drawImage(productImg, pX, pY, pW, pH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Failed to create blob'))),
      'image/png'
    );
  });
};
