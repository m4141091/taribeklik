import * as XLSX from 'xlsx';
import { Product } from '@/types/product';

interface ProductWithCategories {
  product: Product;
  categoryNames: string[];
}

export const exportProductsToCsv = (
  productsWithCategories: ProductWithCategories[],
  fileName: string = 'woocommerce-products'
) => {
  const rows: any[] = [];

  productsWithCategories.forEach(({ product, categoryNames }) => {
    const categoriesStr = categoryNames.join(' > ');
    
    // מוצר ראשי
    const mainRow: any = {
      'מזהה': product.id,
      'שם מוצר': product.name,
      'מחיר': '',
      'מחיר מבצע': '',
      'סטטוס': product.is_active ? 'פורסם' : 'טיוטה',
      'תמונה 1': product.image_url || '',
      'מק"ט': '',
      'תיאור מפורט': '',
      'תיאור קצר': '',
      'סוג': 'מוצר עם וריאציות',
      'ניתן להורדה': 'לא',
      'קישור הורדה': '',
      'קטגוריות': categoriesStr,
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': product.in_stock_this_week ? 'במלאי' : 'אזל',
      'צבע (a)': '',
      'תמונה 2': '',
      'תמונה 3': '',
      'תמונה 4': '',
    };
    rows.push(mainRow);

    // וריאציה לפי ק"ג
    if (product.price_per_kg) {
      const kgRow: any = {
        'מזהה': `${product.id}-kg`,
        'שם מוצר': `${product.name} - לפי ק"ג`,
        'מחיר': product.price_per_kg,
        'מחיר מבצע': '',
        'סטטוס': product.is_active ? 'פורסם' : 'טיוטה',
        'תמונה 1': product.image_url || '',
        'מק"ט': `${product.id}-kg`,
        'תיאור מפורט': '',
        'תיאור קצר': '',
        'סוג': 'וריאציה',
        'ניתן להורדה': 'לא',
        'קישור הורדה': '',
        'קטגוריות': categoriesStr,
        'תת קטגוריה': '',
        'מותגים': '',
        'תגיות': '',
        'מלאי': product.in_stock_this_week ? 'במלאי' : 'אזל',
        'צבע (a)': 'לפי ק"ג',
        'תמונה 2': '',
        'תמונה 3': '',
        'תמונה 4': '',
      };
      rows.push(kgRow);
    }

    // וריאציה לפי יחידה
    if (product.price_per_unit) {
      const unitRow: any = {
        'מזהה': `${product.id}-unit`,
        'שם מוצר': `${product.name} - לפי יחידה`,
        'מחיר': product.price_per_unit,
        'מחיר מבצע': '',
        'סטטוס': product.is_active ? 'פורסם' : 'טיוטה',
        'תמונה 1': product.image_url || '',
        'מק"ט': `${product.id}-unit`,
        'תיאור מפורט': '',
        'תיאור קצר': '',
        'סוג': 'וריאציה',
        'ניתן להורדה': 'לא',
        'קישור הורדה': '',
        'קטגוריות': categoriesStr,
        'תת קטגוריה': '',
        'מותגים': '',
        'תגיות': '',
        'מלאי': product.in_stock_this_week ? 'במלאי' : 'אזל',
        'צבע (a)': 'לפי יחידה',
        'תמונה 2': '',
        'תמונה 3': '',
        'תמונה 4': '',
      };
      rows.push(unitRow);
    }
  });

  // Create worksheet and convert to CSV
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const csv = XLSX.utils.sheet_to_csv(worksheet);

  // Add BOM for Hebrew support in Excel
  const bom = '\uFEFF';
  const csvWithBom = bom + csv;

  // Download as CSV file
  const blob = new Blob([csvWithBom], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  link.href = url;
  link.download = `${fileName}-${date}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
