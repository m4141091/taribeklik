import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductImageUploader from './ProductImageUploader';
import { Product, ProductFormData, getDefaultWeight } from '@/types/product';

const formSchema = z.object({
  name: z.string().min(1, 'שם המוצר הוא שדה חובה'),
  category: z.string().optional(),
  pricing_type: z.enum(['kg', 'unit']),
  price_per_kg: z.number().optional(),
  price_per_unit: z.number().optional(),
  average_weight_kg: z.number().optional(),
  image_url: z.string().optional(),
  is_active: z.boolean(),
  in_stock_this_week: z.boolean(),
});

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  product?: Product | null;
}

const categories = [
  'ירקות',
  'פירות',
  'עלים ירוקים',
  'תבלינים',
  'קטניות',
  'אחר',
];

const ProductFormDialog: React.FC<ProductFormDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  product,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      pricing_type: 'unit',
      price_per_kg: undefined,
      price_per_unit: undefined,
      average_weight_kg: undefined,
      image_url: '',
      is_active: true,
      in_stock_this_week: true,
    },
  });

  const pricingType = form.watch('pricing_type');
  const pricePerKg = form.watch('price_per_kg');
  const averageWeight = form.watch('average_weight_kg');
  const productName = form.watch('name');

  // Calculate price per unit when pricing by kg
  useEffect(() => {
    if (pricingType === 'kg' && pricePerKg && averageWeight) {
      const calculatedPrice = pricePerKg * averageWeight;
      form.setValue('price_per_unit', Math.round(calculatedPrice * 100) / 100);
    }
  }, [pricingType, pricePerKg, averageWeight, form]);

  // Set default weight when product name changes
  useEffect(() => {
    if (productName && pricingType === 'kg' && !averageWeight) {
      form.setValue('average_weight_kg', getDefaultWeight(productName));
    }
  }, [productName, pricingType, averageWeight, form]);

  // Reset form when product changes
  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        category: product.category || '',
        pricing_type: product.pricing_type,
        price_per_kg: product.price_per_kg || undefined,
        price_per_unit: product.price_per_unit || undefined,
        average_weight_kg: product.average_weight_kg || undefined,
        image_url: product.image_url || '',
        is_active: product.is_active,
        in_stock_this_week: product.in_stock_this_week,
      });
    } else {
      form.reset({
        name: '',
        category: '',
        pricing_type: 'unit',
        price_per_kg: undefined,
        price_per_unit: undefined,
        average_weight_kg: undefined,
        image_url: '',
        is_active: true,
        in_stock_this_week: true,
      });
    }
  }, [product, form, open]);

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values as ProductFormData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle>{product ? 'עריכת מוצר' : 'הוספת מוצר חדש'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>שם המוצר</FormLabel>
                  <FormControl>
                    <Input placeholder="למשל: עגבניות שרי" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>קטגוריה</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="בחר קטגוריה" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="pricing_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>תמחור לפי</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="kg">ק"ג</SelectItem>
                      <SelectItem value="unit">יחידה</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {pricingType === 'kg' ? (
              <>
                <FormField
                  control={form.control}
                  name="price_per_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>מחיר לק"ג (₪)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="average_weight_kg"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>משקל ממוצע ליחידה (ק"ג)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.15"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {pricePerKg && averageWeight && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">
                      מחיר ליחידה מחושב: ₪{(pricePerKg * averageWeight).toFixed(2)}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <FormField
                control={form.control}
                name="price_per_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחיר ליחידה (₪)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <ProductImageUploader
              imageUrl={form.watch('image_url')}
              productName={productName}
              onImageChange={(url) => form.setValue('image_url', url)}
            />

            <div className="flex items-center justify-between">
              <Label htmlFor="in_stock">במלאי השבוע</Label>
              <Switch
                id="in_stock"
                checked={form.watch('in_stock_this_week')}
                onCheckedChange={(checked) => form.setValue('in_stock_this_week', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">פעיל</Label>
              <Switch
                id="is_active"
                checked={form.watch('is_active')}
                onCheckedChange={(checked) => form.setValue('is_active', checked)}
              />
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                ביטול
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'שומר...' : product ? 'עדכן' : 'הוסף'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
