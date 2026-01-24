import React, { useState, useMemo } from 'react';
import { RefreshCw, Upload, Edit3, FileSpreadsheet, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/types/product';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

// Column definitions with Hebrew labels
const UPDATABLE_COLUMNS = [
  { key: 'name', label: 'שם מוצר', type: 'text' },
  { key: 'price_per_kg', label: 'מחיר לק"ג', type: 'number' },
  { key: 'price_per_unit', label: 'מחיר ליחידה', type: 'number' },
  { key: 'average_weight_kg', label: 'משקל ממוצע (ק"ג)', type: 'number' },
  { key: 'image_url', label: 'כתובת תמונה', type: 'text' },
  { key: 'in_stock_this_week', label: 'במלאי השבוע', type: 'boolean' },
  { key: 'is_active', label: 'פעיל', type: 'boolean' },
] as const;

type ColumnKey = typeof UPDATABLE_COLUMNS[number]['key'];

interface ProductUpdate {
  productId: string;
  productName: string;
  currentValue: string | number | boolean | null;
  newValue: string | number | boolean;
}

const ProductUpdateTab: React.FC = () => {
  const { products, loading, updateProduct, fetchProducts } = useProducts();
  const { toast } = useToast();

  const [selectedColumn, setSelectedColumn] = useState<ColumnKey | ''>('');
  const [updateMethod, setUpdateMethod] = useState<'file' | 'manual' | ''>('');
  const [fileContent, setFileContent] = useState<File | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<ProductUpdate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [manualProductId, setManualProductId] = useState<string>('');
  const [manualNewValue, setManualNewValue] = useState<string>('');

  const selectedColumnInfo = useMemo(() => {
    return UPDATABLE_COLUMNS.find(c => c.key === selectedColumn);
  }, [selectedColumn]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileContent(file);

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast({
          title: 'קובץ לא תקין',
          description: 'הקובץ חייב להכיל לפחות שורת כותרת ושורת נתונים אחת',
          variant: 'destructive',
        });
        return;
      }

      // Parse CSV/TSV (auto-detect delimiter)
      const delimiter = lines[0].includes('\t') ? '\t' : ',';
      const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
      
      // Find name column and value column
      const nameColIndex = headers.findIndex(h => 
        h === 'name' || h === 'שם' || h === 'שם מוצר' || h === 'product_name'
      );
      const valueColIndex = headers.findIndex(h => 
        h === selectedColumn || h === selectedColumnInfo?.label
      );

      if (nameColIndex === -1) {
        toast({
          title: 'עמודת שם מוצר לא נמצאה',
          description: 'הקובץ חייב להכיל עמודה עם שם מוצר (name, שם, שם מוצר)',
          variant: 'destructive',
        });
        return;
      }

      if (valueColIndex === -1) {
        toast({
          title: 'עמודת ערך לא נמצאה',
          description: `הקובץ חייב להכיל עמודה "${selectedColumnInfo?.label || selectedColumn}"`,
          variant: 'destructive',
        });
        return;
      }

      const updates: ProductUpdate[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
        const productName = values[nameColIndex];
        const newValueStr = values[valueColIndex];

        if (!productName || !newValueStr) continue;

        // Find matching product by name
        const product = products.find(p => 
          p.name.trim().toLowerCase() === productName.trim().toLowerCase()
        );

        if (!product) {
          console.log(`Product not found: ${productName}`);
          continue;
        }

        // Parse value based on column type
        let newValue: string | number | boolean;
        if (selectedColumnInfo?.type === 'number') {
          newValue = parseFloat(newValueStr) || 0;
        } else if (selectedColumnInfo?.type === 'boolean') {
          newValue = newValueStr === 'true' || newValueStr === 'כן' || newValueStr === '1';
        } else {
          newValue = newValueStr;
        }

        const currentValue = product[selectedColumn as keyof Product];

        updates.push({
          productId: product.id,
          productName: product.name,
          currentValue: currentValue as string | number | boolean | null,
          newValue,
        });
      }

      if (updates.length === 0) {
        toast({
          title: 'לא נמצאו מוצרים לעדכון',
          description: 'בדקי שהשמות בקובץ תואמים לשמות המוצרים במערכת',
          variant: 'destructive',
        });
        return;
      }

      setPendingUpdates(updates);
      setShowConfirmDialog(true);

    } catch (error) {
      console.error('File parse error:', error);
      toast({
        title: 'שגיאה בקריאת הקובץ',
        variant: 'destructive',
      });
    }
  };

  const handleManualUpdate = () => {
    if (!manualProductId || !manualNewValue) {
      toast({
        title: 'יש למלא את כל השדות',
        variant: 'destructive',
      });
      return;
    }

    const product = products.find(p => p.id === manualProductId);
    if (!product) return;

    let newValue: string | number | boolean;
    if (selectedColumnInfo?.type === 'number') {
      newValue = parseFloat(manualNewValue) || 0;
    } else if (selectedColumnInfo?.type === 'boolean') {
      newValue = manualNewValue === 'true' || manualNewValue === 'כן';
    } else {
      newValue = manualNewValue;
    }

    const currentValue = product[selectedColumn as keyof Product];

    setPendingUpdates([{
      productId: product.id,
      productName: product.name,
      currentValue: currentValue as string | number | boolean | null,
      newValue,
    }]);
    setShowConfirmDialog(true);
  };

  const executeUpdates = async () => {
    if (pendingUpdates.length === 0) return;

    setIsProcessing(true);
    setShowConfirmDialog(false);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const update of pendingUpdates) {
        try {
          await updateProduct(update.productId, {
            [selectedColumn]: update.newValue,
          });
          successCount++;
        } catch (error) {
          console.error(`Failed to update ${update.productName}:`, error);
          errorCount++;
        }
      }

      await fetchProducts();

      toast({
        title: 'העדכון הושלם!',
        description: `עודכנו ${successCount} מוצרים${errorCount > 0 ? `, ${errorCount} נכשלו` : ''}`,
      });

      // Reset state
      setPendingUpdates([]);
      setFileContent(null);
      setManualProductId('');
      setManualNewValue('');

    } catch (error) {
      toast({
        title: 'שגיאה בעדכון',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatValue = (value: string | number | boolean | null) => {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'כן' : 'לא';
    return String(value);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">טוען...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <RefreshCw className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">עדכון מוצרים</h2>
      </div>

      <p className="text-muted-foreground">
        עדכון עמודה ספציפית בטבלת המוצרים. הנתונים המקוריים יישמרו, רק העמודה שתבחרי תתעדכן.
      </p>

      {/* Step 1: Select Column */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
            בחירת עמודה לעדכון
          </CardTitle>
          <CardDescription>באיזו עמודה תרצי לעדכן את הערכים?</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedColumn} onValueChange={(val) => setSelectedColumn(val as ColumnKey)}>
            <SelectTrigger className="w-full max-w-xs">
              <SelectValue placeholder="בחרי עמודה..." />
            </SelectTrigger>
            <SelectContent>
              {UPDATABLE_COLUMNS.map((col) => (
                <SelectItem key={col.key} value={col.key}>
                  {col.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Step 2: Select Update Method */}
      {selectedColumn && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
              בחירת שיטת עדכון
            </CardTitle>
            <CardDescription>איך תרצי לעדכן את העמודה "{selectedColumnInfo?.label}"?</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button
              variant={updateMethod === 'file' ? 'default' : 'outline'}
              onClick={() => setUpdateMethod('file')}
              className="flex-1 h-auto py-4 flex-col gap-2"
            >
              <Upload className="w-6 h-6" />
              <span>עדכון מקובץ</span>
              <span className="text-xs opacity-70">CSV / Excel</span>
            </Button>
            <Button
              variant={updateMethod === 'manual' ? 'default' : 'outline'}
              onClick={() => setUpdateMethod('manual')}
              className="flex-1 h-auto py-4 flex-col gap-2"
            >
              <Edit3 className="w-6 h-6" />
              <span>עדכון ידני</span>
              <span className="text-xs opacity-70">מוצר בודד</span>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: File Upload */}
      {selectedColumn && updateMethod === 'file' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              העלאת קובץ
            </CardTitle>
            <CardDescription>
              הקובץ צריך להכיל עמודה עם שם המוצר ועמודה עם הערך החדש "{selectedColumnInfo?.label}"
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
              <Label htmlFor="update-file" className="cursor-pointer">
                <span className="text-primary hover:underline">בחרי קובץ</span>
                <span className="text-muted-foreground"> או גררי לכאן</span>
              </Label>
              <Input
                id="update-file"
                type="file"
                accept=".csv,.tsv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground mt-2">
                CSV, TSV (מופרד בפסיקים או טאבים)
              </p>
            </div>

            {fileContent && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-green-600" />
                <span>נבחר: {fileContent.name}</span>
              </div>
            )}

            <div className="bg-muted/50 rounded-lg p-4 text-sm">
              <p className="font-medium mb-2">דוגמה לפורמט הקובץ:</p>
              <pre className="text-xs bg-background p-2 rounded border overflow-x-auto" dir="ltr">
{`שם מוצר,${selectedColumnInfo?.label}
עגבניות,${selectedColumnInfo?.type === 'number' ? '15.5' : selectedColumnInfo?.type === 'boolean' ? 'כן' : 'ערך חדש'}
מלפפונים,${selectedColumnInfo?.type === 'number' ? '12.0' : selectedColumnInfo?.type === 'boolean' ? 'לא' : 'ערך אחר'}`}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Manual Update */}
      {selectedColumn && updateMethod === 'manual' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
              עדכון ידני
            </CardTitle>
            <CardDescription>בחרי מוצר והזיני ערך חדש</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>בחירת מוצר</Label>
                <Select value={manualProductId} onValueChange={setManualProductId}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחרי מוצר..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>ערך חדש ל-{selectedColumnInfo?.label}</Label>
                {selectedColumnInfo?.type === 'boolean' ? (
                  <Select value={manualNewValue} onValueChange={setManualNewValue}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחרי..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">כן</SelectItem>
                      <SelectItem value="false">לא</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={selectedColumnInfo?.type === 'number' ? 'number' : 'text'}
                    value={manualNewValue}
                    onChange={(e) => setManualNewValue(e.target.value)}
                    placeholder={`הזיני ${selectedColumnInfo?.label}...`}
                  />
                )}
              </div>
            </div>

            {manualProductId && (
              <div className="text-sm text-muted-foreground">
                ערך נוכחי: {formatValue(products.find(p => p.id === manualProductId)?.[selectedColumn as keyof Product] as string | number | boolean | null)}
              </div>
            )}

            <Button 
              onClick={handleManualUpdate}
              disabled={!manualProductId || !manualNewValue}
            >
              המשך לאישור
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>אישור עדכון</DialogTitle>
            <DialogDescription>
              {pendingUpdates.length} מוצרים יתעדכנו. בדקי את השינויים לפני האישור:
            </DialogDescription>
          </DialogHeader>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">מוצר</TableHead>
                  <TableHead className="text-right">ערך נוכחי</TableHead>
                  <TableHead className="text-right">ערך חדש</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUpdates.slice(0, 20).map((update, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-medium">{update.productName}</TableCell>
                    <TableCell className="text-muted-foreground">{formatValue(update.currentValue)}</TableCell>
                    <TableCell className="text-primary font-medium">{formatValue(update.newValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {pendingUpdates.length > 20 && (
              <div className="p-2 text-center text-sm text-muted-foreground border-t">
                ועוד {pendingUpdates.length - 20} מוצרים נוספים...
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              ביטול
            </Button>
            <Button onClick={executeUpdates} disabled={isProcessing}>
              {isProcessing ? 'מעדכן...' : `עדכן ${pendingUpdates.length} מוצרים`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductUpdateTab;
