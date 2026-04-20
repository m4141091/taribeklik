import React, { useState, useMemo } from 'react';
import { Plus, Upload, Download, Edit, Trash2, Eye, EyeOff, Package, List, Folder, FolderOpen, Images, FileSpreadsheet, FileText, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { useProductCategories } from '@/hooks/useProductCategories';
import { Product, ProductFormData } from '@/types/product';
import { exportProductsToExcel } from '@/lib/exportToExcel';
import { exportProductsToWooCommerce } from '@/lib/exportToWooCommerce';
import { downloadProductImages, downloadSingleImage } from '@/lib/downloadProductImages';
import { composeImageWithBackground } from '@/lib/composeImageWithBackground';
import ProductFormDialog from './ProductFormDialog';
import ProductUploadDialog from './ProductUploadDialog';
import ProductListInputDialog from './ProductListInputDialog';
import ImageLightbox from './ImageLightbox';
import ProductImage from './ProductImage';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    addProductsToCategories,
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
  const [isExportingToSheets, setIsExportingToSheets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSheetsDialog, setShowSheetsDialog] = useState(false);
  const [sheetsUrl, setSheetsUrl] = useState('https://docs.google.com/spreadsheets/d/1RQn7643GslymPVDBxoctmx3YlHFU4ikPCbAn3_fK34g/edit?gid=0#gid=0');
  const [sheetsExportCategoryId, setSheetsExportCategoryId] = useState<string | null>(null);
  const [showDownloadImagesDialog, setShowDownloadImagesDialog] = useState(false);
  const [downloadImagesCategoryId, setDownloadImagesCategoryId] = useState<string | null>(null);
  const [isBakingBackgrounds, setIsBakingBackgrounds] = useState(false);
  const [bakeProgress, setBakeProgress] = useState({ done: 0, total: 0 });
  const [showBakeDialog, setShowBakeDialog] = useState(false);
  const [bakeCategoryId, setBakeCategoryId] = useState<string | null>(null);

  const loading = productsLoading || categoriesLoading || productCategoriesLoading;

  // Get products for selected category and search
  const filteredProducts = useMemo(() => {
    let result = products;
    
    // Filter by category
    if (selectedCategoryId === 'uncategorized') {
      result = result.filter(product => {
        const categoryIds = getProductCategoryIds(product.id);
        return categoryIds.length === 0;
      });
    } else if (selectedCategoryId !== null) {
      result = result.filter(product => {
        const categoryIds = getProductCategoryIds(product.id);
        return categoryIds.includes(selectedCategoryId);
      });
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, selectedCategoryId, productCategories, getProductCategoryIds, searchQuery]);

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
        // Single batch call instead of loop - prevents flickering!
        await addProductsToCategories(
          createdProducts.map(p => ({ productId: p.id, categoryIds: [categoryId] }))
        );
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

  const handleExportCsv = () => {
    if (products.length === 0) {
      toast({
        title: 'אין מוצרים לייצוא',
        variant: 'destructive',
      });
      return;
    }
    
    const productsWithCategories = products.map(product => {
      const categoryIds = getProductCategoryIds(product.id);
      const categoryNames = categories
        .filter(c => categoryIds.includes(c.id))
        .map(c => c.name);
      return { product, categoryNames };
    });
    
    exportProductsToWooCommerce(productsWithCategories);
    toast({ title: 'קובץ WooCommerce הורד בהצלחה!' });
  };

  const handleDownloadImages = async () => {
    let productsToDownload = products;
    if (downloadImagesCategoryId === 'uncategorized') {
      productsToDownload = products.filter(p => getProductCategoryIds(p.id).length === 0);
    } else if (downloadImagesCategoryId) {
      productsToDownload = products.filter(p =>
        getProductCategoryIds(p.id).includes(downloadImagesCategoryId)
      );
    }

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

    setShowDownloadImagesDialog(false);
    setIsDownloadingImages(true);
    try {
      await downloadProductImages(productsToDownload, () => {});
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

  const handleBakeBackgrounds = async () => {
    const targetProducts = bakeCategoryId === 'uncategorized'
      ? products.filter(p => getProductCategoryIds(p.id).length === 0)
      : bakeCategoryId
        ? products.filter(p => getProductCategoryIds(p.id).includes(bakeCategoryId))
        : products;

    const withImages = targetProducts.filter(p => p.image_url && p.image_url.includes('/storage/v1/object/public/product-images/'));

    if (withImages.length === 0) {
      toast({ title: 'אין תמונות לעדכון', variant: 'destructive' });
      return;
    }

    setShowBakeDialog(false);
    if (!confirm(`לאפות רקע נקודות ל-${withImages.length} תמונות? הפעולה תיקח זמן.`)) return;

    setIsBakingBackgrounds(true);
    setBakeProgress({ done: 0, total: withImages.length });

    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < withImages.length; i++) {
      const product = withImages[i];
      try {
        // Add cache-buster to force fresh fetch
        const composed = await composeImageWithBackground(`${product.image_url}?cb=${Date.now()}`);
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.png`;
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, composed, { contentType: 'image/png' });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
        await updateProduct(product.id, { image_url: data.publicUrl });
        successCount++;
      } catch (err) {
        console.error('Bake failed for', product.name, err);
        failCount++;
      }
      setBakeProgress({ done: i + 1, total: withImages.length });
    }

    setIsBakingBackgrounds(false);
    toast({
      title: 'סיום אפיית רקעים',
      description: `הצליחו: ${successCount}${failCount ? `, נכשלו: ${failCount}` : ''}`,
    });
  };

  const extractSpreadsheetId = (url: string): string | null => {
    // Supports: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit...
    const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const handleOpenSheetsDialog = () => {
    if (products.length === 0) {
      toast({
        title: 'אין מוצרים לייצוא',
        variant: 'destructive',
      });
      return;
    }
    setShowSheetsDialog(true);
  };

  const handleExportToGoogleSheets = async () => {
    const spreadsheetId = extractSpreadsheetId(sheetsUrl);
    
    if (!spreadsheetId) {
      toast({
        title: 'כתובת לא תקינה',
        description: 'יש להזין כתובת תקינה של Google Sheets',
        variant: 'destructive',
      });
      return;
    }

    setShowSheetsDialog(false);
    setIsExportingToSheets(true);
    // Open window immediately to avoid popup blocker
    const newWindow = window.open('', '_blank');
    
    try {
      const { data, error } = await supabase.functions.invoke('export-to-sheets', {
        body: { spreadsheetId, categoryId: sheetsExportCategoryId }
      });
      
      if (error) {
        if (newWindow) newWindow.close();
        throw error;
      }
      
      if (data.success) {
        toast({ 
          title: 'הייצוא הושלם בהצלחה!',
          description: `${data.totalProducts} מוצרים (${data.totalRows} שורות) נוספו לגיליון`,
        });
        // Navigate the already-open window to the spreadsheet URL
        if (newWindow) {
          newWindow.location.href = data.spreadsheetUrl;
        }
      } else {
        if (newWindow) newWindow.close();
        throw new Error(data.error || 'שגיאה לא ידועה');
      }
    } catch (error) {
      console.error('Export to sheets error:', error);
      toast({
        title: 'שגיאה בייצוא ל-Google Sheets',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setIsExportingToSheets(false);
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

  const isValidCategoryId = (id?: string) =>
    !!id && id !== 'uncategorized' && id !== '__none__';

  const handleOpenListInput = (categoryId?: string) => {
    setDefaultCategoryId(isValidCategoryId(categoryId) ? categoryId! : null);
    setShowListInputDialog(true);
  };

  const handleOpenUpload = (categoryId?: string) => {
    setDefaultCategoryId(isValidCategoryId(categoryId) ? categoryId! : null);
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

        <Button variant="outline" onClick={handleExportCsv}>
          <FileText className="w-4 h-4 ml-2" />
          ייצוא WooCommerce (CSV)
        </Button>

        <Button 
          variant="outline" 
          onClick={() => setShowDownloadImagesDialog(true)}
          disabled={isDownloadingImages}
        >
          <Images className="w-4 h-4 ml-2" />
          {isDownloadingImages ? 'מוריד...' : 'הורד תמונות'}
        </Button>

        <Button 
          variant="outline" 
          onClick={handleOpenSheetsDialog}
          disabled={isExportingToSheets}
        >
          <FileSpreadsheet className="w-4 h-4 ml-2" />
          {isExportingToSheets ? 'מייצא...' : 'מלא Google Sheets'}
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowBakeDialog(true)}
          disabled={isBakingBackgrounds}
        >
          <Images className="w-4 h-4 ml-2" />
          {isBakingBackgrounds
            ? `אופה רקעים... ${bakeProgress.done}/${bakeProgress.total}`
            : 'אפה רקע נקודות לתמונות קיימות'}
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="חפש מוצר..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
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
                      <div className="flex items-center gap-1">
                        <div 
                          className="cursor-pointer hover:ring-2 hover:ring-primary rounded-lg transition-all"
                          onClick={() => setLightboxProduct(product)}
                        >
                          <ProductImage src={product.image_url} alt={product.name} size="sm" />
                        </div>
                        {product.image_url && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => downloadSingleImage(product.image_url!, product.name)}
                            title="הורד תמונה"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
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

      <Dialog open={showSheetsDialog} onOpenChange={setShowSheetsDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>ייצוא ל-Google Sheets</DialogTitle>
            <DialogDescription>
              הזיני את כתובת הגיליון שאליו תרצי לייצא את המוצרים.
              <br />
              <span className="text-xs text-muted-foreground">
                שימי לב: יש לוודא שלחשבון השירות יש הרשאת עריכה לגיליון.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Input
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={sheetsUrl}
              onChange={(e) => setSheetsUrl(e.target.value)}
              dir="ltr"
            />
            <div>
              <label className="text-sm font-medium mb-1 block">קטגוריה (אופציונלי)</label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={sheetsExportCategoryId || ''}
                onChange={(e) => setSheetsExportCategoryId(e.target.value || null)}
              >
                <option value="">כל המוצרים</option>
                <option value="uncategorized">ללא קטגוריה</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowSheetsDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleExportToGoogleSheets} disabled={!sheetsUrl.trim()}>
              ייצוא
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDownloadImagesDialog} onOpenChange={setShowDownloadImagesDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>הורדת תמונות מוצרים</DialogTitle>
            <DialogDescription>
              ניתן להוריד את כל התמונות או לבחור קטגוריה מסוימת בלבד.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1 block">קטגוריה</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={downloadImagesCategoryId || ''}
              onChange={(e) => setDownloadImagesCategoryId(e.target.value || null)}
            >
              <option value="">כל המוצרים</option>
              <option value="uncategorized">ללא קטגוריה</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowDownloadImagesDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleDownloadImages} disabled={isDownloadingImages}>
              {isDownloadingImages ? 'מוריד...' : 'הורד'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showBakeDialog} onOpenChange={setShowBakeDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>אפיית רקע נקודות לתמונות קיימות</DialogTitle>
            <DialogDescription>
              בחרי קטגוריה כדי לעדכן רק תמונות בקטגוריה זו, או "כל המוצרים" לעדכן הכול.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-1 block">קטגוריה</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={bakeCategoryId || ''}
              onChange={(e) => setBakeCategoryId(e.target.value || null)}
            >
              <option value="">כל המוצרים</option>
              <option value="uncategorized">ללא קטגוריה</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowBakeDialog(false)}>
              ביטול
            </Button>
            <Button onClick={handleBakeBackgrounds} disabled={isBakingBackgrounds}>
              {isBakingBackgrounds ? 'אופה...' : 'התחל'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductsTab;
