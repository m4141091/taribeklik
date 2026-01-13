import React, { useState } from 'react';
import { Wand2, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ParsedProduct, getDefaultWeight } from '@/types/product';
import { ProductFormData } from '@/types/product';
import { Category } from '@/types/category';
import { generateBatchImages, uploadBase64Image } from '@/lib/productImageAI';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProductListInputDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (products: ProductFormData[], categoryId?: string) => Promise<void>;
  categories: Category[];
  defaultCategoryId?: string | null;
}

interface AIProduct {
  name: string;
  price?: number | null;
  pricing_type: 'kg' | 'unit';
}

const ProductListInputDialog: React.FC<ProductListInputDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  categories,
  defaultCategoryId,
}) => {
  const [inputText, setInputText] = useState('');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isGeneratingImages, setIsGeneratingImages] = useState(false);
  const [imageProgress, setImageProgress] = useState({ current: 0, total: 0, name: '' });
  const [productImages, setProductImages] = useState<Map<string, string>>(new Map());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId || '__none__');
  const { toast } = useToast();

  // Reset selected category when defaultCategoryId changes
  React.useEffect(() => {
    if (defaultCategoryId) {
      setSelectedCategoryId(defaultCategoryId);
    } else {
      setSelectedCategoryId('__none__');
    }
  }, [defaultCategoryId]);

  const handleParseWithAI = async () => {
    if (!inputText.trim()) {
      toast({ title: 'הזיני טקסט לזיהוי', variant: 'destructive' });
      return;
    }

    setIsParsing(true);
    try {
      const { data, error } = await supabase.functions.invoke('parse-products', {
        body: { text: inputText.trim() }
      });

      if (error) throw error;

      const products: ParsedProduct[] = (data.products as AIProduct[]).map((p: AIProduct) => {
        const product: ParsedProduct = {
          name: p.name,
          pricing_type: 'kg', // Default to kg as requested
        };

        if (p.price) {
          product.price_per_kg = p.price;
          product.average_weight_kg = getDefaultWeight(p.name);
          product.price_per_unit = p.price * product.average_weight_kg;
        }

        return product;
      });

      setParsedProducts(products);
      toast({ title: `זוהו ${products.length} מוצרים` });
    } catch (error) {
      console.error('Parse error:', error);
      toast({
        title: 'שגיאה בזיהוי',
        description: error instanceof Error ? error.message : 'נסי שוב',
        variant: 'destructive',
      });
    } finally {
      setIsParsing(false);
    }
  };

  const handleGenerateAllImages = async () => {
    if (parsedProducts.length === 0) return;

    setIsGeneratingImages(true);
    setImageProgress({ current: 0, total: parsedProducts.length, name: '' });

    try {
      const productNames = parsedProducts.map(p => p.name);
      const images = await generateBatchImages(
        productNames,
        (current, total, name) => setImageProgress({ current, total, name })
      );

      // Upload all images to Supabase storage
      const uploadedImages = new Map<string, string>();
      for (const [name, base64] of images) {
        try {
          const url = await uploadBase64Image(base64);
          uploadedImages.set(name, url);
        } catch (e) {
          console.error(`Failed to upload image for ${name}:`, e);
        }
      }

      setProductImages(uploadedImages);
      toast({ title: `נוצרו ${uploadedImages.size} תמונות` });
    } catch (error) {
      console.error('Image generation error:', error);
      toast({
        title: 'שגיאה ביצירת תמונות',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingImages(false);
      setImageProgress({ current: 0, total: 0, name: '' });
    }
  };

  const handleSubmit = async () => {
    if (parsedProducts.length === 0) return;

    setIsSubmitting(true);
    try {
      const productsData: ProductFormData[] = parsedProducts.map((p) => ({
        name: p.name,
        category: p.category,
        pricing_type: 'kg' as const, // Default to kg
        price_per_kg: p.price_per_kg,
        price_per_unit: p.price_per_unit,
        average_weight_kg: p.average_weight_kg,
        image_url: productImages.get(p.name),
        is_active: true,
        in_stock_this_week: true,
      }));

      await onSubmit(productsData, selectedCategoryId === '__none__' ? undefined : selectedCategoryId);
      handleClose();
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setInputText('');
    setParsedProducts([]);
    setProductImages(new Map());
    setImageProgress({ current: 0, total: 0, name: '' });
    setSelectedCategoryId(defaultCategoryId || '__none__');
    onOpenChange(false);
  };

  const handleBackToEdit = () => {
    setParsedProducts([]);
    setProductImages(new Map());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוספת רשימת מוצרים</DialogTitle>
        </DialogHeader>

        {parsedProducts.length === 0 ? (
          // Input mode
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>קטגוריה (אופציונלי)</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="בחר קטגוריה למוצרים" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">ללא קטגוריה</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">
                הזיני רשימת מוצרים (בכל פורמט שנוח לך):
              </label>
              <Textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="עגבניות מלפפונים גזר בצל תפוחי אדמה בננות 12 שקל לקילו תפוזים..."
                className="min-h-[150px] text-right"
                dir="rtl"
              />
            </div>

            <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
              <Sparkles className="w-4 h-4 inline-block ml-2 text-primary" />
              פשוט כתבי את המוצרים - המערכת תזהה אותם אוטומטית!
              <br />
              <span className="text-xs">
                כל המוצרים יוגדרו כברירת מחדל לפי ק"ג
              </span>
            </div>

            <DialogFooter className="flex justify-center">
              <Button
                onClick={handleParseWithAI}
                disabled={isParsing || !inputText.trim()}
                className="w-full sm:w-auto"
              >
                {isParsing ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    מזהה מוצרים...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 ml-2" />
                    זהה מוצרים 🤖
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Preview mode
          <div className="space-y-4 py-4">
            {selectedCategoryId && (
              <div className="text-sm text-muted-foreground">
                קטגוריה: <strong>{categories.find(c => c.id === selectedCategoryId)?.name}</strong>
              </div>
            )}

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateAllImages}
                disabled={isGeneratingImages}
              >
                {isGeneratingImages ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    {imageProgress.current}/{imageProgress.total}
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 ml-2" />
                    צור תמונות AI לכולם
                  </>
                )}
              </Button>

              {isGeneratingImages && (
                <span className="text-sm text-muted-foreground">
                  יוצר: {imageProgress.name}
                </span>
              )}
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right w-16">תמונה</TableHead>
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
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            —
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.price_per_kg
                          ? `₪${product.price_per_kg}/ק"ג`
                          : product.price_per_unit
                          ? `₪${product.price_per_unit}`
                          : '—'}
                      </TableCell>
                      <TableCell>ק"ג</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleBackToEdit}>
                <ArrowRight className="w-4 h-4 ml-2" />
                חזרה לעריכה
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isGeneratingImages}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : null}
                הוסף {parsedProducts.length} מוצרים
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProductListInputDialog;
