import React, { useState, useMemo } from 'react';
import { Plus, Upload, Download, Edit, Trash2, Eye, EyeOff, Package, List, Folder, FolderOpen, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductCategories } from '@/hooks/useProductCategories';
import { Product, ProductFormData } from '@/types/product';
import { exportProductsToExcel } from '@/lib/exportToExcel';
import { downloadProductImages } from '@/lib/downloadProductImages';
import ProductFormDialog from './ProductFormDialog';
import ProductUploadDialog from './ProductUploadDialog';
import ProductListInputDialog from './ProductListInputDialog';
import ImageLightbox from './ImageLightbox';
import ProductImage from './ProductImage';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ProductsTab: React.FC = () => {
  const {
    products,
    loading: productsLoading,
    createProduct,
    createProducts,
    updateProduct,
    deleteProduct,
    toggleInStock,
    toggleActive,
  } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();
  const { 
    productCategories, 
    loading: productCategoriesLoading,
    getProductCategoryIds,
    setProductCategoryIds,
    addProductToCategories,
  } = useProductCategories();
  const { toast } = useToast();

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showListInputDialog, setShowListInputDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [lightboxProduct, setLightboxProduct] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);
  const [isDownloadingImages, setIsDownloadingImages] = useState(false);

  const loading = productsLoading || categoriesLoading || productCategoriesLoading;

  // Get products for selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategoryId === null) {
      // Show all products
      return products;
    }
    
    if (selectedCategoryId === 'uncategorized') {
      // Show products without any category
      return products.filter(product => {
        const categoryIds = getProductCategoryIds(product.id);
        return categoryIds.length === 0;
      });
    }

    // Show products in selected category
    return products.filter(product => {
      const categoryIds = getProductCategoryIds(product.id);
      return categoryIds.includes(selectedCategoryId);
    });
  }, [products, selectedCategoryId, productCategories, getProductCategoryIds]);

  // Count products per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    let uncategorized = 0;

    products.forEach(product => {
      const categoryIds = getProductCategoryIds(product.id);
      if (categoryIds.length === 0) {
        uncategorized++;
      } else {
        categoryIds.forEach(catId => {
          counts[catId] = (counts[catId] || 0) + 1;
        });
      }
    });

    return { ...counts, uncategorized };
  }, [products, productCategories, getProductCategoryIds]);

  const handleImageUpdate = async (productId: string, newImageUrl: string) => {
    await updateProduct(productId, { image_url: newImageUrl });
  };

  const handleCreateProduct = async (data: ProductFormData, categoryIds?: string[]) => {
    try {
      const product = await createProduct(data);
      if (categoryIds && categoryIds.length > 0) {
        await addProductToCategories(product.id, categoryIds);
      }
      toast({ title: 'המוצר נוצר בהצלחה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה ביצירת המוצר',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateProduct = async (data: ProductFormData, categoryIds?: string[]) => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, data);
      if (categoryIds !== undefined) {
        await setProductCategoryIds(editingProduct.id, categoryIds);
      }
      setEditingProduct(null);
      toast({ title: 'המוצר עודכן בהצלחה!' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון המוצר',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleBulkCreate = async (productsData: ProductFormData[], categoryId?: string) => {
    try {
      const createdProducts = await createProducts(productsData);
      if (categoryId) {
        for (const product of createdProducts) {
          await addProductToCategories(product.id, [categoryId]);
        }
      }
      toast({ title: `נוספו ${productsData.length} מוצרים בהצלחה!` });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בהוספת המוצרים',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`האם למחוק את "${product.name}"?`)) return;
    try {
      await deleteProduct(product.id);
      toast({ title: 'המוצר נמחק' });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה במחיקת המוצר',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStock = async (product: Product) => {
    try {
      await toggleInStock(product.id, product.in_stock_this_week);
      toast({
        title: product.in_stock_this_week ? 'המוצר סומן כלא במלאי' : 'המוצר סומן כבמלאי',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון סטטוס המלאי',
        variant: 'destructive',
      });
    }
  };

  const handleToggleActive = async (product: Product) => {
    try {
      await toggleActive(product.id, product.is_active);
      toast({
        title: product.is_active ? 'המוצר הוסתר' : 'המוצר פורסם',
      });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה בעדכון סטטוס המוצר',
        variant: 'destructive',
      });
    }
  };

  const handleExport = () => {
    if (products.length === 0) {
      toast({
        title: 'אין מוצרים לייצוא',
        variant: 'destructive',
      });
      return;
    }
    exportProductsToExcel(products);
    toast({ title: 'הקובץ הורד בהצלחה!' });
  };

  const handleDownloadImages = async () => {
    const productsToDownload = selectedCategoryId === null ? products : filteredProducts;
    
    if (productsToDownload.length === 0) {
      toast({
        title: 'אין מוצרים להורדה',
        variant: 'destructive',
      });
      return;
    }

    const productsWithImages = productsToDownload.filter(p => p.image_url);
    if (productsWithImages.length === 0) {
      toast({
        title: 'אין מוצרים עם תמונות להורדה',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloadingImages(true);
    try {
      await downloadProductImages(productsToDownload, (current, total) => {
        // Could add progress UI here in the future
      });
      toast({ title: `הורדו ${productsWithImages.length} תמונות בהצלחה!` });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה בהורדת התמונות',
        variant: 'destructive',
      });
    } finally {
      setIsDownloadingImages(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowFormDialog(true);
  };

  const handleFormClose = (open: boolean) => {
    setShowFormDialog(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  const handleOpenListInput = (categoryId?: string) => {
    setDefaultCategoryId(categoryId || null);
    setShowListInputDialog(true);
  };

  const handleOpenUpload = (categoryId?: string) => {
    setDefaultCategoryId(categoryId || null);
    setShowUploadDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">טוען מוצרים...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Upload className="w-4 h-4 ml-2" />
              העלאת קובץ
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => handleOpenUpload(selectedCategoryId || undefined)}>
              Excel / Word / PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => setShowFormDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          הוספה ידנית
        </Button>

        <Button variant="outline" onClick={() => handleOpenListInput(selectedCategoryId || undefined)}>
          <List className="w-4 h-4 ml-2" />
          הוספת רשימה
        </Button>

        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 ml-2" />
          ייצוא ל-Excel
        </Button>

        <Button 
          variant="outline" 
          onClick={handleDownloadImages}
          disabled={isDownloadingImages}
        >
          <Images className="w-4 h-4 ml-2" />
          {isDownloadingImages ? 'מוריד...' : 'הורד תמונות'}
        </Button>
      </div>

      {/* Category Folders */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategoryId === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategoryId(null)}
          className="gap-2"
        >
          {selectedCategoryId === null ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          כל המוצרים ({products.length})
        </Button>

        {categories.map((category) => (
          <Button
            key={category.id}
            variant={selectedCategoryId === category.id ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategoryId(category.id)}
            className="gap-2"
          >
            {selectedCategoryId === category.id ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
            {category.name} ({categoryCounts[category.id] || 0})
          </Button>
        ))}

        <Button
          variant={selectedCategoryId === 'uncategorized' ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedCategoryId('uncategorized')}
          className="gap-2"
        >
          {selectedCategoryId === 'uncategorized' ? <FolderOpen className="w-4 h-4" /> : <Folder className="w-4 h-4" />}
          ללא קטגוריה ({categoryCounts.uncategorized || 0})
        </Button>
      </div>

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">
            {selectedCategoryId === null 
              ? 'אין מוצרים עדיין' 
              : selectedCategoryId === 'uncategorized'
              ? 'אין מוצרים ללא קטגוריה'
              : 'אין מוצרים בקטגוריה זו'}
          </p>
          <Button onClick={() => setShowFormDialog(true)}>
            <Plus className="w-4 h-4 ml-2" />
            הוסף מוצר ראשון
          </Button>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right w-16">תמונה</TableHead>
                <TableHead className="text-right">שם מוצר</TableHead>
                <TableHead className="text-right">קטגוריות</TableHead>
                <TableHead className="text-right">מחיר/ק"ג</TableHead>
                <TableHead className="text-right">מחיר/יח'</TableHead>
                <TableHead className="text-right w-24">במלאי</TableHead>
                <TableHead className="text-right w-32">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const productCategoryIds = getProductCategoryIds(product.id);
                const productCategoryNames = categories
                  .filter(c => productCategoryIds.includes(c.id))
                  .map(c => c.name);

                return (
                  <TableRow key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                    <TableCell>
                      <div 
                        className="cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all"
                        onClick={() => setLightboxProduct(product)}
                      >
                        <ProductImage src={product.image_url} alt={product.name} size="sm" />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {productCategoryNames.length > 0 
                        ? productCategoryNames.join(', ') 
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell>
                      {product.price_per_kg ? `₪${product.price_per_kg}` : '—'}
                    </TableCell>
                    <TableCell>
                      {product.price_per_unit ? `₪${product.price_per_unit.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={product.in_stock_this_week}
                        onCheckedChange={() => handleToggleStock(product)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleActive(product)}
                          title={product.is_active ? 'הסתר' : 'פרסם'}
                        >
                          {product.is_active ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(product)}
                          title="ערוך"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(product)}
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <ProductFormDialog
        open={showFormDialog}
        onOpenChange={handleFormClose}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        product={editingProduct}
        categories={categories}
        getProductCategoryIds={getProductCategoryIds}
      />

      <ProductUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSubmit={handleBulkCreate}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
      />

      <ProductListInputDialog
        open={showListInputDialog}
        onOpenChange={setShowListInputDialog}
        onSubmit={handleBulkCreate}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
      />

      <ImageLightbox
        open={!!lightboxProduct}
        onOpenChange={(open) => !open && setLightboxProduct(null)}
        imageUrl={lightboxProduct?.image_url}
        productName={lightboxProduct?.name || ''}
        productId={lightboxProduct?.id || ''}
        onImageUpdate={handleImageUpdate}
      />
    </div>
  );
};

export default ProductsTab;
