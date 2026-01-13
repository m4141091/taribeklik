import React, { useState, useCallback } from 'react';
import { Upload, FileSpreadsheet, FileText, Loader2, Wand2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { parseFile } from '@/lib/productParsers';
import { generateBatchImages, uploadBase64Image } from '@/lib/productImageAI';
import { ParsedProduct, ProductFormData } from '@/types/product';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ProductUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (products: ProductFormData[]) => Promise<void>;
}

const ProductUploadDialog: React.FC<ProductUploadDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
}) => {
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0, name: '' });
  const [productImages, setProductImages] = useState<Map<string, string>>(new Map());
  const { toast } = useToast();

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    try {
      const products = await parseFile(file);
      setParsedProducts(products);
      toast({ title: `נמצאו ${products.length} מוצרים` });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: error instanceof Error ? error.message : 'שגיאה בקריאת הקובץ',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  const handleGenerateAllImages = async () => {
    if (parsedProducts.length === 0) return;

    setIsGeneratingImages(true);
    try {
      const productNames = parsedProducts.map(p => p.name);
      const images = await generateBatchImages(
        productNames,
        (current, total, name) => {
          setImageProgress({ current, total, name });
        }
      );

      // Upload all images to storage
      const uploadedImages = new Map<string, string>();
      for (const [name, base64] of images) {
        try {
          const url = await uploadBase64Image(base64);
          uploadedImages.set(name, url);
        } catch (error) {
          console.error(`Failed to upload image for ${name}:`, error);
        }
      }

      setProductImages(uploadedImages);
      toast({ title: `נוצרו ${uploadedImages.size} תמונות בהצלחה!` });
    } catch (error) {
      toast({
        title: 'שגיאה',
        description: 'שגיאה ביצירת תמונות',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImages(false);
      setImageProgress({ current: 0, total: 0, name: '' });
    }
  };

  const handleSubmit = async () => {
    const productsToCreate: ProductFormData[] = parsedProducts.map(p => ({
      name: p.name,
      category: p.category,
      pricing_type: p.pricing_type,
      price_per_kg: p.price_per_kg,
      price_per_unit: p.price_per_unit,
      average_weight_kg: p.average_weight_kg,
      image_url: productImages.get(p.name),
      is_active: true,
      in_stock_this_week: true,
    }));

    await onSubmit(productsToCreate);
    setParsedProducts([]);
    setProductImages(new Map());
    onOpenChange(false);
  };

  const handleClose = () => {
    setParsedProducts([]);
    setProductImages(new Map());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>העלאת מוצרים מקובץ</DialogTitle>
        </DialogHeader>

        {parsedProducts.length === 0 ? (
          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors"
            >
              {isLoading ? (
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-primary animate-spin" />
              ) : (
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              )}
              <p className="text-lg font-medium mb-2">
                {isLoading ? 'קורא את הקובץ...' : 'גרור קובץ לכאן'}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                או לחץ על אחד הכפתורים למטה
              </p>
            </div>

            {/* File Type Buttons */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="excel-upload"
                />
                <label htmlFor="excel-upload">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <FileSpreadsheet className="w-4 h-4 ml-2" />
                      Excel
                    </span>
                  </Button>
                </label>
              </div>
              <div>
                <input
                  type="file"
                  accept=".docx,.doc,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="word-upload"
                />
                <label htmlFor="word-upload">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <FileText className="w-4 h-4 ml-2" />
                      Word
                    </span>
                  </Button>
                </label>
              </div>
              <div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="pdf-upload"
                />
                <label htmlFor="pdf-upload">
                  <Button variant="outline" className="w-full" asChild>
                    <span>
                      <FileText className="w-4 h-4 ml-2" />
                      PDF
                    </span>
                  </Button>
                </label>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">פורמט הקובץ:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>שורה ראשונה: כותרות (אופציונלי)</li>
                <li>עמודות: שם מוצר, מחיר, סוג תמחור (ק"ג/יחידה), קטגוריה</li>
                <li>או רשימה פשוטה: שם מוצר בכל שורה</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Generate Images Section */}
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div>
                <p className="font-medium">יצירת תמונות AI לכל המוצרים</p>
                <p className="text-sm text-muted-foreground">
                  {productImages.size > 0
                    ? `נוצרו ${productImages.size} מתוך ${parsedProducts.length} תמונות`
                    : 'לחץ ליצירת תמונות מקצועיות לכל המוצרים'}
                </p>
              </div>
              <Button
                onClick={handleGenerateAllImages}
                disabled={isGeneratingImages}
              >
                {isGeneratingImages ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 ml-2" />
                )}
                {isGeneratingImages ? 'יוצר...' : 'צור תמונות'}
              </Button>
            </div>

            {/* Progress Bar */}
            {isGeneratingImages && (
              <div className="space-y-2">
                <Progress value={(imageProgress.current / imageProgress.total) * 100} />
                <p className="text-sm text-center text-muted-foreground">
                  יוצר תמונה עבור: {imageProgress.name} ({imageProgress.current}/{imageProgress.total})
                </p>
              </div>
            )}

            {/* Products Table */}
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">תמונה</TableHead>
                    <TableHead className="text-right">שם</TableHead>
                    <TableHead className="text-right">מחיר</TableHead>
                    <TableHead className="text-right">סוג</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedProducts.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {productImages.get(product.name) ? (
                          <img
                            src={productImages.get(product.name)}
                            alt={product.name}
                            className="w-10 h-10 rounded object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <span className="text-xs text-muted-foreground">—</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.pricing_type === 'kg'
                          ? `₪${product.price_per_kg}/ק"ג`
                          : product.price_per_unit
                          ? `₪${product.price_per_unit}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        {product.pricing_type === 'kg' ? 'ק"ג' : 'יחידה'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            ביטול
          </Button>
          {parsedProducts.length > 0 && (
            <Button onClick={handleSubmit} disabled={isGeneratingImages}>
              הוסף {parsedProducts.length} מוצרים
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductUploadDialog;
