import { useState, useCallback } from 'react';
import { Product } from '@/types/product';

export interface CartItem {
  product: Product;
  quantity: number;
  pricingType: 'kg' | 'unit';
}

export const useCart = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = useCallback((product: Product, quantity: number, pricingType: 'kg' | 'unit') => {
    setItems((prevItems) => {
      const existingItemIndex = prevItems.findIndex(
        (item) => item.product.id === product.id && item.pricingType === pricingType
      );

      if (existingItemIndex !== -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + quantity,
        };
        return newItems;
      }

      return [...prevItems, { product, quantity, pricingType }];
    });
  }, []);

  const updateQuantity = useCallback((productId: string, pricingType: 'kg' | 'unit', quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter(
          (item) => !(item.product.id === productId && item.pricingType === pricingType)
        );
      }

      return prevItems.map((item) =>
        item.product.id === productId && item.pricingType === pricingType
          ? { ...item, quantity }
          : item
      );
    });
  }, []);

  const removeFromCart = useCallback((productId: string, pricingType: 'kg' | 'unit') => {
    setItems((prevItems) =>
      prevItems.filter(
        (item) => !(item.product.id === productId && item.pricingType === pricingType)
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const price = item.pricingType === 'kg' 
      ? item.product.price_per_kg 
      : item.product.price_per_unit;
    return sum + (price || 0) * item.quantity;
  }, 0);

  return {
    items,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItems,
    totalPrice,
  };
};
