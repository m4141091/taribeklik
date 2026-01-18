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
  let currentId = 1001;

  productsWithCategories.forEach(({ product, categoryNames }) => {
    const categoriesStr = categoryNames.join(' > ');
    const parentId = currentId;
    
    // Check which variations exist
    const hasKg = !!product.price_per_kg;
    const hasUnit = !!product.price_per_unit;
    const variationCount = (hasKg ? 1 : 0) + (hasUnit ? 1 : 0);
    
    // Build attribute values string
    const attributeValues: string[] = [];
    if (hasUnit) attributeValues.push("יח'");
    if (hasKg) attributeValues.push("ק\"ג");
    const attributeValuesStr = attributeValues.join(', ');

    // Main product row (variable type)
    const mainRow: any = {
      'מזהה': currentId,
      'סוג': variationCount > 0 ? 'variable' : 'simple',
      'מק"ט': '',
      'שם': product.name,
      'פורסם': product.is_active ? 1 : 0,
      'האם מומלץ?': 0,
      'נראות בקטלוג': 'visible',
      'תיאור קצר': '',
      'תיאור': '',
      'סטטוס מס': 'taxable',
      'סוג מס': '',
      'במלאי?': product.in_stock_this_week ? 1 : 0,
      'מלאי': '',
      'כמות חסר במלאי נמוך': '',
      'האם הזמנה חוזרת מותרת?': 0,
      'נמכר בנפרד?': '',
      'משקל (kg)': product.average_weight_kg || '',
      'אורך (cm)': '',
      'רוחב (cm)': '',
      'גובה (cm)': '',
      'האם לאפשר ביקורות מלקוחות?': 0,
      'הערת רכישה': '',
      'מחיר מבצע': '',
      'מחיר רגיל': '',
      'קטגוריות': categoriesStr,
      'תגיות': '',
      'סוג משלוח': '',
      'תמונות': product.image_url || '',
      'מגבלת הורדות': '',
      'ימי תפוגת הורדה': '',
      'אב': '',
      'מוצרי Cross-sells': '',
      'מוצרים משודרגים': '',
      'שיוך 1 שמות': variationCount > 0 ? 'Unit' : '',
      'שיוך 1 ערכים': attributeValuesStr,
      'שיוך 1 פריטים מוצגים': variationCount > 0 ? 1 : '',
      'שיוך 1 פריטים גלובליים': variationCount > 0 ? 1 : '',
      'GTIN, UPC, EAN, or ISBN': '',
    };
    rows.push(mainRow);
    currentId++;

    // Variation for unit price
    if (hasUnit) {
      const unitRow: any = {
        'מזהה': currentId,
        'סוג': 'variation',
        'מק"ט': '',
        'שם': `${product.name} - יח'`,
        'פורסם': product.is_active ? 1 : 0,
        'האם מומלץ?': 0,
        'נראות בקטלוג': 'visible',
        'תיאור קצר': '',
        'תיאור': '',
        'סטטוס מס': 'taxable',
        'סוג מס': '',
        'במלאי?': product.in_stock_this_week ? 1 : 0,
        'מלאי': '',
        'כמות חסר במלאי נמוך': '',
        'האם הזמנה חוזרת מותרת?': 0,
        'נמכר בנפרד?': '',
        'משקל (kg)': product.average_weight_kg || '',
        'אורך (cm)': '',
        'רוחב (cm)': '',
        'גובה (cm)': '',
        'האם לאפשר ביקורות מלקוחות?': 0,
        'הערת רכישה': '',
        'מחיר מבצע': '',
        'מחיר רגיל': product.price_per_unit,
        'קטגוריות': categoriesStr,
        'תגיות': '',
        'סוג משלוח': '',
        'תמונות': product.image_url || '',
        'מגבלת הורדות': '',
        'ימי תפוגת הורדה': '',
        'אב': `id:${parentId}`,
        'מוצרי Cross-sells': '',
        'מוצרים משודרגים': '',
        'שיוך 1 שמות': 'Unit',
        'שיוך 1 ערכים': "יח'",
        'שיוך 1 פריטים מוצגים': '',
        'שיוך 1 פריטים גלובליים': 1,
        'GTIN, UPC, EAN, or ISBN': '',
      };
      rows.push(unitRow);
      currentId++;
    }

    // Variation for kg price
    if (hasKg) {
      const kgRow: any = {
        'מזהה': currentId,
        'סוג': 'variation',
        'מק"ט': '',
        'שם': `${product.name} - ק"ג`,
        'פורסם': product.is_active ? 1 : 0,
        'האם מומלץ?': 0,
        'נראות בקטלוג': 'visible',
        'תיאור קצר': '',
        'תיאור': '',
        'סטטוס מס': 'taxable',
        'סוג מס': '',
        'במלאי?': product.in_stock_this_week ? 1 : 0,
        'מלאי': '',
        'כמות חסר במלאי נמוך': '',
        'האם הזמנה חוזרת מותרת?': 0,
        'נמכר בנפרד?': '',
        'משקל (kg)': product.average_weight_kg || '',
        'אורך (cm)': '',
        'רוחב (cm)': '',
        'גובה (cm)': '',
        'האם לאפשר ביקורות מלקוחות?': 0,
        'הערת רכישה': '',
        'מחיר מבצע': '',
        'מחיר רגיל': product.price_per_kg,
        'קטגוריות': categoriesStr,
        'תגיות': '',
        'סוג משלוח': '',
        'תמונות': product.image_url || '',
        'מגבלת הורדות': '',
        'ימי תפוגת הורדה': '',
        'אב': `id:${parentId}`,
        'מוצרי Cross-sells': '',
        'מוצרים משודרגים': '',
        'שיוך 1 שמות': 'Unit',
        'שיוך 1 ערכים': 'ק"ג',
        'שיוך 1 פריטים מוצגים': '',
        'שיוך 1 פריטים גלובליים': 1,
        'GTIN, UPC, EAN, or ISBN': '',
      };
      rows.push(kgRow);
      currentId++;
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
