import React, { useState } from 'react';
import { Plus, Upload, Download, Edit, Trash2, Eye, EyeOff, Package, ImageIcon, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { Product, ProductFormData } from '@/types/product';
import { exportProductsToExcel } from '@/lib/exportToExcel';
import ProductFormDialog from './ProductFormDialog';
import ProductUploadDialog from './ProductUploadDialog';
import ProductListInputDialog from './ProductListInputDialog';
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
    loading,
    createProduct,
    createProducts,
    updateProduct,
    deleteProduct,
    toggleInStock,
    toggleActive,
  } = useProducts();
  const { toast } = useToast();

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showListInputDialog, setShowListInputDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleCreateProduct = async (data: ProductFormData) => {
    try {
      await createProduct(data);
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

  const handleUpdateProduct = async (data: ProductFormData) => {
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, data);
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

  const handleBulkCreate = async (productsData: ProductFormData[]) => {
    try {
      await createProducts(productsData);
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
            <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
              Excel / Word / PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button onClick={() => setShowFormDialog(true)}>
          <Plus className="w-4 h-4 ml-2" />
          הוספה ידנית
        </Button>

        <Button variant="outline" onClick={() => setShowListInputDialog(true)}>
          <List className="w-4 h-4 ml-2" />
          הוספת רשימה
        </Button>

        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 ml-2" />
          ייצוא ל-Excel
        </Button>
      </div>

      {/* Products Table */}
      {products.length === 0 ? (
        <div className="bg-card rounded-lg border border-border p-8 text-center">
          <Package className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">אין מוצרים עדיין</p>
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
                <TableHead className="text-right">קטגוריה</TableHead>
                <TableHead className="text-right">מחיר/ק"ג</TableHead>
                <TableHead className="text-right">מחיר/יח'</TableHead>
                <TableHead className="text-right w-24">במלאי</TableHead>
                <TableHead className="text-right w-32">פעולות</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className={!product.is_active ? 'opacity-50' : ''}>
                  <TableCell>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.category || '—'}</TableCell>
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
              ))}
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
      />

      <ProductUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSubmit={handleBulkCreate}
      />

      <ProductListInputDialog
        open={showListInputDialog}
        onOpenChange={setShowListInputDialog}
        onSubmit={handleBulkCreate}
      />
    </div>
  );
};

export default ProductsTab;
