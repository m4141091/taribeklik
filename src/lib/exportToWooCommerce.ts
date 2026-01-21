import * as XLSX from 'xlsx';
import { Product } from '@/types/product';

interface ProductWithCategories {
  product: Product;
  categoryNames: string[];
}

const createSlug = (name: string): string => {
  return name.replace(/\s+/g, '-');
};

export const exportProductsToWooCommerce = (
  productsWithCategories: ProductWithCategories[],
  fileName: string = 'woocommerce-products'
) => {
  const rows: Record<string, string | number>[] = [];

  productsWithCategories.forEach(({ product, categoryNames }) => {
    const categoryString = categoryNames.join(', ');
    const slug = createSlug(product.name);
    
    // Row 1: Main product (מוצר עם וריאציות)
    rows.push({
      'מזהה': '',
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
      'קישור להורדה': '',
      'ברקוד': '',
      'מזהה כתובת (slug)': slug,
      'קטגוריות': categoryString,
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': '',
      'אורך': '',
      'רוחב': '',
      'גובה': '',
      'משקל': '',
      'סוג משלוח': '',
      'כמות': '',
    });

    // Row 2: Variation - price per kg (מחיר לקילו)
    rows.push({
      'מזהה': '',
      'שם מוצר': product.name,
      'מחיר': product.price_per_kg || '',
      'מחיר מבצע': '',
      'סטטוס': 'פרסם',
      'תמונה 1': product.image_url || '',
      'מק"ט': '',
      'תיאור מפורט': '',
      'תיאור קצר': '',
      'סוג': 'וריאציה',
      'ניתן להורדה': 'לא',
      'קישור להורדה': '',
      'ברקוד': '',
      'מזהה כתובת (slug)': `${slug}-קג`,
      'קטגוריות': '',
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': '',
      'אורך': '',
      'רוחב': '',
      'גובה': '',
      'משקל': '',
      'סוג משלוח': '',
      'כמות': 'kilo',
    });

    // Row 3: Variation - price per unit (מחיר ליחידה)
    rows.push({
      'מזהה': '',
      'שם מוצר': product.name,
      'מחיר': product.price_per_unit || '',
      'מחיר מבצע': '',
      'סטטוס': 'פרסם',
      'תמונה 1': product.image_url || '',
      'מק"ט': '',
      'תיאור מפורט': '',
      'תיאור קצר': '',
      'סוג': 'וריאציה',
      'ניתן להורדה': 'לא',
      'קישור להורדה': '',
      'ברקוד': '',
      'מזהה כתובת (slug)': `${slug}-יח`,
      'קטגוריות': '',
      'תת קטגוריה': '',
      'מותגים': '',
      'תגיות': '',
      'מלאי': '',
      'אורך': '',
      'רוחב': '',
      'גובה': '',
      'משקל': '',
      'סוג משלוח': '',
      'כמות': 'piece',
    });
  });

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Set column widths (A-Y, 25 columns)
  worksheet['!cols'] = [
    { wch: 8 },   // A - מזהה
    { wch: 30 },  // B - שם מוצר
    { wch: 10 },  // C - מחיר
    { wch: 12 },  // D - מחיר מבצע
    { wch: 10 },  // E - סטטוס
    { wch: 50 },  // F - תמונה 1
    { wch: 12 },  // G - מק"ט
    { wch: 20 },  // H - תיאור מפורט
    { wch: 15 },  // I - תיאור קצר
    { wch: 18 },  // J - סוג
    { wch: 12 },  // K - ניתן להורדה
    { wch: 15 },  // L - קישור להורדה
    { wch: 12 },  // M - ברקוד
    { wch: 20 },  // N - slug
    { wch: 20 },  // O - קטגוריות
    { wch: 15 },  // P - תת קטגוריה
    { wch: 12 },  // Q - מותגים
    { wch: 12 },  // R - תגיות
    { wch: 8 },   // S - מלאי
    { wch: 8 },   // T - אורך
    { wch: 8 },   // U - רוחב
    { wch: 8 },   // V - גובה
    { wch: 8 },   // W - משקל
    { wch: 12 },  // X - סוג משלוח
    { wch: 12 },  // Y - כמות
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'מוצרים');

  // Generate file and trigger download
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${fileName}-${date}.xlsx`);
};
