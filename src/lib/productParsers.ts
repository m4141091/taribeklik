import { ParsedProduct, getDefaultWeight } from '@/types/product';
import * as XLSX from 'xlsx';

export const parseExcelFile = async (file: File): Promise<ParsedProduct[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as unknown[][];
        
        const products: ParsedProduct[] = [];
        
        // Skip header row
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || !row[0]) continue;
          
          const name = String(row[0]).trim();
          const priceValue = row[1] ? parseFloat(String(row[1])) : undefined;
          const pricingType = row[2] ? (String(row[2]).includes('ק') ? 'kg' : 'unit') : 'unit';
          const category = row[3] ? String(row[3]).trim() : undefined;
          
          const product: ParsedProduct = {
            name,
            category,
            pricing_type: pricingType,
          };
          
          if (pricingType === 'kg' && priceValue) {
            product.price_per_kg = priceValue;
            product.average_weight_kg = getDefaultWeight(name);
            product.price_per_unit = priceValue * product.average_weight_kg;
          } else if (priceValue) {
            product.price_per_unit = priceValue;
          }
          
          products.push(product);
        }
        
        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseTextContent = (text: string): ParsedProduct[] => {
  const lines = text.split('\n').filter(line => line.trim());
  const products: ParsedProduct[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    // Try to parse: name - price or name, price or just name
    const parts = trimmed.split(/[-,\t]/).map(p => p.trim());
    const name = parts[0];
    
    if (!name) continue;
    
    const product: ParsedProduct = {
      name,
      pricing_type: 'unit',
    };
    
    if (parts[1]) {
      const priceMatch = parts[1].match(/[\d.]+/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0]);
        if (parts[1].includes('ק"ג') || parts[1].includes('קג') || parts[1].includes('kg')) {
          product.pricing_type = 'kg';
          product.price_per_kg = price;
          product.average_weight_kg = getDefaultWeight(name);
          product.price_per_unit = price * product.average_weight_kg;
        } else {
          product.price_per_unit = price;
        }
      }
    }
    
    products.push(product);
  }
  
  return products;
};

export const parseWordOrPdfFile = async (file: File): Promise<ParsedProduct[]> => {
  // For Word and PDF, we'll extract text and parse it
  // This is a simplified version - in production you might want to use a dedicated library
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const products = parseTextContent(text);
        resolve(products);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('שגיאה בקריאת הקובץ'));
    reader.readAsText(file);
  });
};

export const parseFile = async (file: File): Promise<ParsedProduct[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    case 'docx':
    case 'doc':
    case 'pdf':
    case 'txt':
      return parseWordOrPdfFile(file);
    default:
      throw new Error('סוג קובץ לא נתמך');
  }
};
