import React from 'react';
import { ImageIcon } from 'lucide-react';
import productCardBg from '@/assets/product-card-bg.png';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-24 h-24',
  lg: 'max-h-[400px] max-w-full',
};

const ProductImage: React.FC<ProductImageProps> = ({ 
  src, 
  alt, 
  size = 'sm',
  className = '' 
}) => {
  const sizeClass = sizeClasses[size];
  
  if (!src) {
    return (
      <div 
        className={`${sizeClass} rounded-lg bg-muted flex items-center justify-center ${className}`}
        style={{
          backgroundImage: `url(${productCardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <ImageIcon className="w-5 h-5 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div 
      className={`${sizeClass} rounded-lg overflow-hidden relative ${className}`}
      style={{
        backgroundImage: `url(${productCardBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain relative z-10"
      />
    </div>
  );
};

export default ProductImage;
