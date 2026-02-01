import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import Header from '@/components/Header';
import SearchBar from '@/components/shop/SearchBar';
import CategoryFilter from '@/components/shop/CategoryFilter';
import ProductGrid from '@/components/shop/ProductGrid';
import { usePublicProducts } from '@/hooks/usePublicProducts';
import { usePublicCategories } from '@/hooks/usePublicCategories';
import { usePublicProductCategories } from '@/hooks/usePublicProductCategories';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category');
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryParam);
  
  const { products, loading: productsLoading } = usePublicProducts();
  const { categories, loading: categoriesLoading } = usePublicCategories();
  const { productCategories, getProductsByCategory } = usePublicProductCategories();
  const { addToCart, totalItems } = useCart();

  const handleSearchChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    const newParams = new URLSearchParams(searchParams);
    if (categoryId) {
      newParams.set('category', categoryId);
    } else {
      newParams.delete('category');
    }
    setSearchParams(newParams);
  };

  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by category
    if (selectedCategory) {
      const productIdsInCategory = getProductsByCategory(selectedCategory);
      result = result.filter(product => productIdsInCategory.includes(product.id));
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product =>
        product.name.toLowerCase().includes(query) ||
        (product.category && product.category.toLowerCase().includes(query))
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery, getProductsByCategory]);

  const handleAddToCart = (product: any, quantity: number, pricingType: 'kg' | 'unit') => {
    addToCart(product, quantity, pricingType);
    toast({
      title: 'נוסף לסל',
      description: `${quantity} ${pricingType === 'kg' ? 'ק"ג' : 'יח\''} ${product.name}`,
    });
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <main className="min-h-screen" style={{ backgroundColor: '#F0E8DF' }}>
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-[60px]" />
      
      {/* Hero Section */}
      <section className="pt-[12vh] md:pt-[18vh] pb-8 px-4">
        <div className="container mx-auto text-center">
          <h1 className="font-cooperative text-3xl md:text-5xl text-foreground mb-4">
            החנות שלנו
          </h1>
          <p className="text-muted-foreground font-discovery text-lg mb-8">
            פירות וירקות טריים מהשדה לבית
          </p>
          
          {/* Search Bar */}
          <div className="flex justify-center mb-8">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="חיפוש מוצרים..."
            />
          </div>
          
          {/* Category Filter */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategoryChange}
          />
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
                {filteredProducts.length} מוצרים
                {searchQuery && ` עבור "${searchQuery}"`}
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

export default Shop;
