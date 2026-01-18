import * as XLSX from 'xlsx';
import { Product } from '@/types/product';

interface ProductWithCategories {
  product: Product;
  categoryNames: string[];
}

export const exportProductsToWooCommerce = (
  productsWithCategories: ProductWithCategories[],
  fileName: string = 'woocommerce-products'
) => {
  const rows: Record<string, string | number>[] = [];
  let idCounter = 1;

  productsWithCategories.forEach(({ product, categoryNames }) => {
    const parentId = idCounter;
    const categoryString = categoryNames.join(', ');
    
    // Row 1: Main product (מוצר עם וריאציות)
    rows.push({
      'מזהה': idCounter++,
      'שם מוצר': product.name,
      'מחיר': '',
      'מחיר מבצע': '',
      'סטטוס': 'פרסם',
      'תמונה 1': product.image_url || '',
      'מק"ט': '',
      'תיאור מפורט': '',
      'תיאור קצר': '',
      'סוג': 'מוצר עם וריאציות',
      'ניתן להורדה': 'לא',
      'קישור הורדה': '',
      'קטגוריות': categoryString,
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': '',
      'צבע (a)': '',
      'תמונה 2': '',
      'תמונה 3': '',
      'תמונה 4': '',
    });

    // Row 2: Variation - price per kg (מחיר לקילו)
    rows.push({
      'מזהה': idCounter++,
      'שם מוצר': `${product.name} - מחיר לקילו`,
      'מחיר': product.price_per_kg || '',
      'מחיר מבצע': '',
      'סטטוס': 'פרסם',
      'תמונה 1': product.image_url || '',
      'מק"ט': `${parentId}-kg`,
      'תיאור מפורט': '',
      'תיאור קצר': '',
      'סוג': 'וריאציה',
      'ניתן להורדה': 'לא',
      'קישור הורדה': '',
      'קטגוריות': '',
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': 100,
      'צבע (a)': 'מחיר לקילו',
      'תמונה 2': '',
      'תמונה 3': '',
      'תמונה 4': '',
    });

    // Row 3: Variation - price per unit (מחיר ליחידה)
    rows.push({
      'מזהה': idCounter++,
      'שם מוצר': `${product.name} - מחיר ליחידה`,
      'מחיר': product.price_per_unit || '',
      'מחיר מבצע': '',
      'סטטוס': 'פרסם',
      'תמונה 1': product.image_url || '',
      'מק"ט': `${parentId}-unit`,
      'תיאור מפורט': '',
      'תיאור קצר': '',
      'סוג': 'וריאציה',
      'ניתן להורדה': 'לא',
      'קישור הורדה': '',
      'קטגוריות': '',
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': 100,
      'צבע (a)': 'מחיר ליחידה',
      'תמונה 2': '',
      'תמונה 3': '',
      'תמונה 4': '',
    });
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },   // מזהה
    { wch: 30 },  // שם מוצר
    { wch: 10 },  // מחיר
    { wch: 12 },  // מחיר מבצע
    { wch: 10 },  // סטטוס
    { wch: 50 },  // תמונה 1
    { wch: 12 },  // מק"ט
    { wch: 20 },  // תיאור מפורט
    { wch: 15 },  // תיאור קצר
    { wch: 18 },  // סוג
    { wch: 12 },  // ניתן להורדה
    { wch: 15 },  // קישור הורדה
    { wch: 20 },  // קטגוריות
    { wch: 15 },  // תת קטגוריה
    { wch: 12 },  // מותגים
    { wch: 12 },  // תגיות
    { wch: 8 },   // מלאי
    { wch: 15 },  // צבע (a)
    { wch: 50 },  // תמונה 2
    { wch: 50 },  // תמונה 3
    { wch: 50 },  // תמונה 4
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'מוצרים');

  // Generate file and trigger download
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${fileName}-${date}.xlsx`);
};
