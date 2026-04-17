import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types/product';
import productCardBg from '@/assets/product-card-bg.png';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number, pricingType: 'kg' | 'unit') => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const [selectedPricing, setSelectedPricing] = useState<'kg' | 'unit'>(product.pricing_type);
  const [quantity, setQuantity] = useState(0);
  const [showStepper, setShowStepper] = useState(false);

  const price = selectedPricing === 'kg' ? product.price_per_kg : product.price_per_unit;
  const priceLabel = selectedPricing === 'kg' ? 'ק"ג' : 'יח\'';
  
  const hasUnitOption = product.price_per_unit !== null;
  const hasKgOption = product.price_per_kg !== null;

  const handleIncrement = () => {
    setQuantity(prev => prev + 1);
  };

  const handleDecrement = () => {
    if (quantity > 0) {
      setQuantity(prev => prev - 1);
    }
    if (quantity === 1) {
      setShowStepper(false);
    }
  };

  const handleAddClick = () => {
    if (!showStepper) {
      setShowStepper(true);
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    if (quantity > 0) {
      onAddToCart(product, quantity, selectedPricing);
      setQuantity(0);
      setShowStepper(false);
    }
  };

  return (
    <div 
      className="relative rounded-2xl p-4 flex flex-col items-center shadow-md transition-shadow hover:shadow-lg"
      style={{ backgroundColor: '#F7F2ED' }}
    >
      {/* Product Image */}
      <div
        className="w-full aspect-square flex items-center justify-center mb-3 overflow-hidden rounded-t-xl"
        style={{
          backgroundImage: `url(${productCardBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out hover:scale-125"
          />
        ) : (
          <div className="w-24 h-24 rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground text-sm">אין תמונה</span>
          </div>
        )}
      </div>

      {/* Product Name */}
      <h3 className="font-discovery font-bold text-foreground text-lg text-center mb-1">
        {product.name}
      </h3>

      {/* Price */}
      <p className="text-foreground font-discovery text-sm mb-3">
        {price ? `${price.toFixed(0)}₪ / ${priceLabel}` : 'מחיר לא זמין'}
      </p>

      {/* Pricing Type Toggle & Add Button */}
      <div className="flex items-center justify-between w-full gap-2">
        {/* Add/Stepper Button */}
        <div className="flex-shrink-0">
          {!showStepper ? (
            <Button
              onClick={handleAddClick}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-brand-orange-light to-brand-orange text-white p-0"
              disabled={!product.in_stock_this_week}
            >
              <Plus className="w-5 h-5" />
            </Button>
          ) : (
            <div className="flex items-center gap-1 bg-white rounded-full p-1 shadow-md">
              <Button
                onClick={handleDecrement}
                variant="ghost"
                className="w-8 h-8 rounded-full p-0 hover:bg-muted"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-8 text-center font-bold text-foreground">{quantity}</span>
              <Button
                onClick={handleIncrement}
                variant="ghost"
                className="w-8 h-8 rounded-full p-0 hover:bg-muted"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Pricing Toggle */}
        {hasUnitOption && hasKgOption && (
          <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setSelectedPricing('unit')}
              className="px-3 py-1 rounded-full text-sm font-discovery transition-colors text-foreground"
              style={{ 
                backgroundColor: selectedPricing === 'unit' ? '#F25F40' : '#F8DDC7',
                color: selectedPricing === 'unit' ? 'white' : undefined
              }}
            >
              יח'
            </button>
            <button
              onClick={() => setSelectedPricing('kg')}
              className="px-3 py-1 rounded-full text-sm font-discovery transition-colors text-foreground"
              style={{ 
                backgroundColor: selectedPricing === 'kg' ? '#F25F40' : '#F8DDC7',
                color: selectedPricing === 'kg' ? 'white' : undefined
              }}
            >
              ק"ג
            </button>
          </div>
        )}
      </div>

      {/* Add to Cart Button (shows when quantity > 0) */}
      {showStepper && quantity > 0 && (
        <Button
          onClick={handleAddToCart}
          className="w-full mt-3 bg-gradient-to-r from-brand-orange-light to-brand-orange text-white rounded-full"
        >
          הוסף לסל
        </Button>
      )}

      {/* Out of Stock Overlay */}
      {!product.in_stock_this_week && (
        <div className="absolute inset-0 bg-background/50 rounded-2xl flex items-center justify-center">
          <span className="bg-destructive text-destructive-foreground px-4 py-2 rounded-full font-bold">
            אזל מהמלאי
          </span>
        </div>
      )}
    </div>
  );
};

export default ProductCard;
