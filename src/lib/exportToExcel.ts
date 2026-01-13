import * as XLSX from 'xlsx';
import { Product } from '@/types/product';

export const exportProductsToExcel = (products: Product[], fileName: string = 'products') => {
  // Transform products to Hebrew column headers
  const data = products.map(product => ({
    'שם המוצר': product.name,
    'קטגוריה': product.category || '',
    'סוג תמחור': product.pricing_type === 'kg' ? 'לפי ק"ג' : 'ליחידה',
    'מחיר לק"ג': product.price_per_kg || '',
    'מחיר ליחידה': product.price_per_unit || '',
    'משקל ממוצע (גרם)': product.average_weight_kg ? product.average_weight_kg * 1000 : '',
    'במלאי השבוע': product.in_stock_this_week ? 'כן' : 'לא',
    'פעיל': product.is_active ? 'כן' : 'לא',
    'קישור לתמונה': product.image_url || '',
    'תאריך יצירה': new Date(product.created_at).toLocaleDateString('he-IL'),
  }));

  // Create workbook and worksheet
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 20 }, // שם המוצר
    { wch: 15 }, // קטגוריה
    { wch: 12 }, // סוג תמחור
    { wch: 12 }, // מחיר לק"ג
    { wch: 12 }, // מחיר ליחידה
    { wch: 15 }, // משקל ממוצע
    { wch: 12 }, // במלאי השבוע
    { wch: 8 },  // פעיל
    { wch: 50 }, // קישור לתמונה
    { wch: 15 }, // תאריך יצירה
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, 'מוצרים');

  // Generate file and trigger download
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${fileName}-${date}.xlsx`);
};
