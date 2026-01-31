import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import ProductGrid from '@/components/shop/ProductGrid';
import { usePublicProducts } from '@/hooks/usePublicProducts';
import { usePublicCategories } from '@/hooks/usePublicCategories';
import { usePublicProductCategories } from '@/hooks/usePublicProductCategories';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CategoryPage = () => {
  const { id: categoryId } = useParams<{ id: string }>();
  
  const { products, loading: productsLoading } = usePublicProducts();
  const { categories, loading: categoriesLoading } = usePublicCategories();
  const { getProductsByCategory } = usePublicProductCategories();
  const { addToCart } = useCart();

  const category = categories.find(c => c.id === categoryId);

  const filteredProducts = useMemo(() => {
    if (!categoryId) return [];
    const productIdsInCategory = getProductsByCategory(categoryId);
    return products.filter(product => productIdsInCategory.includes(product.id));
  }, [products, categoryId, getProductsByCategory]);

  const handleAddToCart = (product: any, quantity: number, pricingType: 'kg' | 'unit') => {
    addToCart(product, quantity, pricingType);
    toast({
      title: 'נוסף לסל',
      description: `${quantity} ${pricingType === 'kg' ? 'ק"ג' : 'יח\''} ${product.name}`,
    });
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-[60px]" />
      
      {/* Hero Section */}
      <section className="pt-[12vh] md:pt-[18vh] pb-8 px-4">
        <div className="container mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/shop" className="hover:text-foreground transition-colors">
              החנות
            </Link>
            <ChevronRight className="w-4 h-4 rotate-180" />
            <span className="text-foreground">{category?.name || 'קטגוריה'}</span>
          </div>
          
          <h1 className="font-cooperative text-3xl md:text-5xl text-foreground mb-4 text-center">
            {category?.name || 'קטגוריה'}
          </h1>
          
          <div className="flex justify-center">
            <Link to="/shop">
              <Button variant="outline" className="rounded-full">
                לכל המוצרים
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="pb-16 px-4">
        <div className="container mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <p className="text-muted-foreground text-sm mb-4 text-center">
                {filteredProducts.length} מוצרים בקטגוריה
              </p>
              <ProductGrid
                products={filteredProducts}
                onAddToCart={handleAddToCart}
              />
            </>
          )}
        </div>
      </section>
    </main>
  );
};

export default CategoryPage;
