import React from 'react';
import { usePublicProducts } from '@/hooks/usePublicProducts';
import { usePublicProductCategories } from '@/hooks/usePublicProductCategories';
import { HomepageElement } from '@/types/homepage';

interface ProductGridElementProps {
  element: HomepageElement;
}

export const ProductGridElement: React.FC<ProductGridElementProps> = ({ element }) => {
  const { products } = usePublicProducts();
  const { productCategories } = usePublicProductCategories();

  const filteredProducts = React.useMemo(() => {
    if (!element.category_id) return products.slice(0, 4);
    
    const categoryProductIds = productCategories
      .filter(pc => pc.category_id === element.category_id)
      .map(pc => pc.product_id);
    
    return products
      .filter(p => categoryProductIds.includes(p.id) && p.in_stock_this_week)
      .slice(0, 4);
  }, [products, productCategories, element.category_id]);

  if (filteredProducts.length === 0) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: '16px' }}>
        <span style={{ color: '#999', fontFamily: "'Discovery', sans-serif" }}>אין מוצרים להצגה</span>
      </div>
    );
  }

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '12px',
      direction: 'rtl',
    }}>
      {filteredProducts.map((product) => (
        <div
          key={product.id}
          style={{
            backgroundColor: '#F7F2ED',
            borderRadius: '16px',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <div style={{ width: '100%', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', overflow: 'hidden', borderRadius: '12px' }}>
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ width: '60px', height: '60px', backgroundColor: '#e5e5e5', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#999', fontSize: '10px' }}>אין תמונה</span>
              </div>
            )}
          </div>
          <span style={{ fontFamily: "'Discovery', sans-serif", fontWeight: 'bold', fontSize: '14px', textAlign: 'center', color: '#162E14' }}>
            {product.name}
          </span>
          {product.price_per_kg && (
            <span style={{ fontFamily: "'Discovery', sans-serif", fontSize: '12px', color: '#162E14', marginTop: '4px' }}>
              {product.price_per_kg.toFixed(0)}₪ / ק"ג
            </span>
          )}
        </div>
      ))}
    </div>
  );
};
