import React, { useState, useMemo } from 'react';
import { Plus, Upload, Download, Edit, Trash2, Eye, EyeOff, Package, List, Folder, FolderOpen, Images, FileSpreadsheet, FileText, Search, ImageIcon } from 'lucide-react';
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
import { exportProductsToCsv } from '@/lib/exportToCsv';
import { downloadProductImages, downloadSingleImage } from '@/lib/downloadProductImages';
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
  const [isImportingWordpressImages, setIsImportingWordpressImages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
    
    exportProductsToCsv(productsWithCategories);
    toast({ title: 'קובץ CSV הורד בהצלחה!' });
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

  const handleExportToGoogleSheets = async () => {
    if (products.length === 0) {
      toast({
        title: 'אין מוצרים לייצוא',
        variant: 'destructive',
      });
      return;
    }

    setIsExportingToSheets(true);
    // Open window immediately to avoid popup blocker
    const newWindow = window.open('', '_blank');
    
    try {
      const { data, error } = await supabase.functions.invoke('export-to-sheets');
      
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

  const handleImportWordpressImages = async () => {
    // CSV data with product name and WordPress image URL
    const csvData = `שם מוצר,כתובת תמונה בוורדפרס
אבטיח,https://taribeclic.shop/wp-content/uploads/2026/01/אבטיח.png
אבוקדו,https://taribeclic.shop/wp-content/uploads/2026/01/אבוקדו.png
אגוזי מלך,https://taribeclic.shop/wp-content/uploads/2026/01/אגוזי-מלך.png
אגוזי קשיו,https://taribeclic.shop/wp-content/uploads/2026/01/אגוזי-קשיו.png
אגס,https://taribeclic.shop/wp-content/uploads/2026/01/אגס.png
אננס,https://taribeclic.shop/wp-content/uploads/2026/01/אננס.png
אפרסמון,https://taribeclic.shop/wp-content/uploads/2026/01/אפרסמון.png
אפרסק,https://taribeclic.shop/wp-content/uploads/2026/01/אפרסק.png
אשכולית אדומה,https://taribeclic.shop/wp-content/uploads/2026/01/אשכולית-אדומה.png
אשכולית לבנה,https://taribeclic.shop/wp-content/uploads/2026/01/אשכולית-לבנה.png
בוטנים,https://taribeclic.shop/wp-content/uploads/2026/01/בוטנים.png
בטטה,https://taribeclic.shop/wp-content/uploads/2026/01/בטטה.png
בננה,https://taribeclic.shop/wp-content/uploads/2026/01/בננה.png
בצל,https://taribeclic.shop/wp-content/uploads/2026/01/בצל.png
בצל ירוק,https://taribeclic.shop/wp-content/uploads/2026/01/בצל-ירוק.png
בצל סגול,https://taribeclic.shop/wp-content/uploads/2026/01/בצל-סגול.png
ברוקולי,https://taribeclic.shop/wp-content/uploads/2026/01/ברוקולי.png
גוייבה,https://taribeclic.shop/wp-content/uploads/2026/01/גוייבה.png
גזר,https://taribeclic.shop/wp-content/uploads/2026/01/גזר.png
גרייפ פרוט,https://taribeclic.shop/wp-content/uploads/2026/01/גרייפ-פרוט.png
דובדבן,https://taribeclic.shop/wp-content/uploads/2026/01/דובדבן.png
דלורית,https://taribeclic.shop/wp-content/uploads/2026/01/דלורית.png
דלעת ערמונים,https://taribeclic.shop/wp-content/uploads/2026/01/דלעת-ערמונים.png
זנגוויל,https://taribeclic.shop/wp-content/uploads/2026/01/זנגויל.png
חזרת,https://taribeclic.shop/wp-content/uploads/2026/01/חזרת.png
חסה,https://taribeclic.shop/wp-content/uploads/2026/01/חסה.png
חסה סלנובה,https://taribeclic.shop/wp-content/uploads/2026/01/חסה-סלנובה.png
חציל,https://taribeclic.shop/wp-content/uploads/2026/01/חציל.png
כוסברה,https://taribeclic.shop/wp-content/uploads/2026/01/כוסברה.png
כרוב לבן,https://taribeclic.shop/wp-content/uploads/2026/01/כרוב-לבן.png
כרוב סגול,https://taribeclic.shop/wp-content/uploads/2026/01/כרוב-סגול.png
כרישה,https://taribeclic.shop/wp-content/uploads/2026/01/כרישה.png
כרפס,https://taribeclic.shop/wp-content/uploads/2026/01/כרפס.png
לוביה,https://taribeclic.shop/wp-content/uploads/2026/01/לוביה.png
לימון,https://taribeclic.shop/wp-content/uploads/2026/01/לימון.png
ליצ'י,https://taribeclic.shop/wp-content/uploads/2026/01/ליצי.png
מיני גזר,https://taribeclic.shop/wp-content/uploads/2026/01/מיני-גזר.png
מלון,https://taribeclic.shop/wp-content/uploads/2026/01/מלון.png
מלפפון,https://taribeclic.shop/wp-content/uploads/2026/01/מלפפון.png
מלפפון בייבי,https://taribeclic.shop/wp-content/uploads/2026/01/מלפפון-בייבי.png
מנגו,https://taribeclic.shop/wp-content/uploads/2026/01/מנגו.png
מנדרינה,https://taribeclic.shop/wp-content/uploads/2026/01/מנדרינה.png
מרווה,https://taribeclic.shop/wp-content/uploads/2026/01/מרווה.png
נבטים,https://taribeclic.shop/wp-content/uploads/2026/01/נבטים.png
נענע,https://taribeclic.shop/wp-content/uploads/2026/01/נענע.png
נקטרינה,https://taribeclic.shop/wp-content/uploads/2026/01/נקטרינה.png
סלק אדום,https://taribeclic.shop/wp-content/uploads/2026/01/סלק-אדום.png
סלרי,https://taribeclic.shop/wp-content/uploads/2026/01/סלרי.png
עגבניה,https://taribeclic.shop/wp-content/uploads/2026/01/עגבניה.png
עגבניות שרי,https://taribeclic.shop/wp-content/uploads/2026/01/עגבניות-שרי.png
עגבניות שרי מיקס צבעוניות,https://taribeclic.shop/wp-content/uploads/2026/01/עגבניות-שרי-מיקס.png
ענבים לבנים,https://taribeclic.shop/wp-content/uploads/2026/01/ענבים-לבנים.png
ענבים שחורים,https://taribeclic.shop/wp-content/uploads/2026/01/ענבים-שחורים.png
פאפאיה,https://taribeclic.shop/wp-content/uploads/2026/01/פאפאיה.png
פומלה,https://taribeclic.shop/wp-content/uploads/2026/01/פומלה.png
פומלית,https://taribeclic.shop/wp-content/uploads/2026/01/פומלית.png
פטל,https://taribeclic.shop/wp-content/uploads/2026/01/פטל.png
פטריות שיטאקי,https://taribeclic.shop/wp-content/uploads/2026/01/פטריות-שיטאקי.png
פטריות שמפיניון,https://taribeclic.shop/wp-content/uploads/2026/01/פטריות-שמפיניון.png
פטרוזיליה,https://taribeclic.shop/wp-content/uploads/2026/01/פטרוזיליה.png
פלפל אדום,https://taribeclic.shop/wp-content/uploads/2026/01/פלפל-אדום.png
פלפל ירוק,https://taribeclic.shop/wp-content/uploads/2026/01/פלפל-ירוק.png
פלפל כתום,https://taribeclic.shop/wp-content/uploads/2026/01/פלפל-כתום.png
פלפל צהוב,https://taribeclic.shop/wp-content/uploads/2026/01/פלפל-צהוב.png
פלפל חריף אדום,https://taribeclic.shop/wp-content/uploads/2026/01/פלפל-חריף-אדום.png
פלפל חריף ירוק,https://taribeclic.shop/wp-content/uploads/2026/01/פלפל-חריף-ירוק.png
פלפל חריף ירוק ג'לפניו,https://taribeclic.shop/wp-content/uploads/2026/01/ג׳לפניו.png
פסיפלורה,https://taribeclic.shop/wp-content/uploads/2026/01/פסיפלורה.png
קולורבי,https://taribeclic.shop/wp-content/uploads/2026/01/קולורבי.png
קיווי,https://taribeclic.shop/wp-content/uploads/2026/01/קיווי.png
קישוא,https://taribeclic.shop/wp-content/uploads/2026/01/קישוא.png
קלמנטינה,https://taribeclic.shop/wp-content/uploads/2026/01/קלמנטינה.png
קרמבולה,https://taribeclic.shop/wp-content/uploads/2026/01/קרמבולה.png
רימון,https://taribeclic.shop/wp-content/uploads/2026/01/רימון.png
רוזמרין,https://taribeclic.shop/wp-content/uploads/2026/01/רוזמרין.png
רוקט,https://taribeclic.shop/wp-content/uploads/2026/01/רוקט.png
שום,https://taribeclic.shop/wp-content/uploads/2026/01/שום.png
שומר,https://taribeclic.shop/wp-content/uploads/2026/01/שומר.png
שזיף,https://taribeclic.shop/wp-content/uploads/2026/01/שזיף.png
שמיר,https://taribeclic.shop/wp-content/uploads/2026/01/שמיר.png
שעועית ירוקה,https://taribeclic.shop/wp-content/uploads/2026/01/שעועית-ירוקה.png
תאנה,https://taribeclic.shop/wp-content/uploads/2026/01/תאנה.png
תות,https://taribeclic.shop/wp-content/uploads/2026/01/תות.png
תירס,https://taribeclic.shop/wp-content/uploads/2026/01/תירס.png
תמר מג'הול,https://taribeclic.shop/wp-content/uploads/2026/01/תמר-מג׳הול.png
תפוז,https://taribeclic.shop/wp-content/uploads/2026/01/תפוז.png
תפו"ע גולדן דלישס,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-גולדן-דלישס.png
תפו"ע גרנד סמיט,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-גרנד-סמיט.png
תפו"ע יונתן,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-יונתן.png
תפו"ע ירוק,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-ירוק.png
תפו"ע פינק ליידי,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-פינק-ליידי.png
תפו"ע פינק ליידי ישראלי,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-פינק-ליידי-ישראלי.png
תפו"ע פינק ליידי מובחר,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-פינק-ליידי-מובחר.png
תפו"ע פינק ליידי רגיל,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-פינק-ליידי-רגיל.png
תפו"ע פינק ליידי - יח',https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-פינק-ליידי-יח.png
תפו"ע קנדי,https://taribeclic.shop/wp-content/uploads/2026/01/תפוע-קנדי.png
תפו"א,https://taribeclic.shop/wp-content/uploads/2026/01/תפוא.png
תפו"א אדום,https://taribeclic.shop/wp-content/uploads/2026/01/תפוא-אדום.png
תרד,https://taribeclic.shop/wp-content/uploads/2026/01/תרד.png`;

    const lines = csvData.split('\n').slice(1); // Skip header
    const mappings = lines.map(line => {
      const parts = line.split(',');
      return {
        name: parts[0]?.trim(),
        imageUrl: parts[1]?.trim()
      };
    }).filter(m => m.name && m.imageUrl);

    setIsImportingWordpressImages(true);
    try {
      const { data, error } = await supabase.functions.invoke('import-wordpress-images', {
        body: { mappings }
      });

      if (error) throw error;

      if (data.success) {
        toast({
          title: 'הייבוא הושלם!',
          description: `עודכנו ${data.updated} מוצרים${data.notFound?.length > 0 ? `, ${data.notFound.length} לא נמצאו` : ''}`,
        });
      } else {
        throw new Error(data.error || 'שגיאה לא ידועה');
      }
    } catch (error) {
      console.error('Import WordPress images error:', error);
      toast({
        title: 'שגיאה בייבוא',
        description: error instanceof Error ? error.message : 'שגיאה לא ידועה',
        variant: 'destructive',
      });
    } finally {
      setIsImportingWordpressImages(false);
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

        <Button variant="outline" onClick={handleExportCsv}>
          <FileText className="w-4 h-4 ml-2" />
          ייצוא WooCommerce (CSV)
        </Button>

        <Button 
          variant="outline" 
          onClick={handleDownloadImages}
          disabled={isDownloadingImages}
        >
          <Images className="w-4 h-4 ml-2" />
          {isDownloadingImages ? 'מוריד...' : 'הורד תמונות'}
        </Button>

        <Button 
          variant="outline" 
          onClick={handleExportToGoogleSheets}
          disabled={isExportingToSheets}
        >
          <FileSpreadsheet className="w-4 h-4 ml-2" />
          {isExportingToSheets ? 'מייצא...' : 'מלא Google Sheets'}
        </Button>

        <Button 
          variant="outline" 
          onClick={handleImportWordpressImages}
          disabled={isImportingWordpressImages}
        >
          <ImageIcon className="w-4 h-4 ml-2" />
          {isImportingWordpressImages ? 'מייבא...' : 'ייבוא תמונות WordPress'}
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
    </div>
  );
};

export default ProductsTab;
