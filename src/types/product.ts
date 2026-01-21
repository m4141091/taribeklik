export interface Product {
  id: string;
  name: string;
  category?: string | null;
  price_per_kg?: number | null;
  price_per_unit?: number | null;
  average_weight_kg?: number | null;
  pricing_type: 'kg' | 'unit';
  image_url?: string | null;
  wordpress_image_url?: string | null;
  is_active: boolean;
  in_stock_this_week: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string | null;
}

export interface ProductFormData {
  name: string;
  category?: string;
  pricing_type: 'kg' | 'unit';
  price_per_kg?: number;
  price_per_unit?: number;
  average_weight_kg?: number;
  image_url?: string;
  wordpress_image_url?: string;
  is_active: boolean;
  in_stock_this_week: boolean;
}

export interface ParsedProduct {
  name: string;
  category?: string;
  price_per_kg?: number;
  price_per_unit?: number;
  average_weight_kg?: number;
  pricing_type: 'kg' | 'unit';
}

// משקלים ממוצעים לירקות ופירות נפוצים (בק"ג)
export const DEFAULT_WEIGHTS: Record<string, number> = {
  'עגבניה': 0.15,
  'עגבניות': 0.15,
  'עגבניות שרי': 0.02,
  'מלפפון': 0.2,
  'מלפפונים': 0.2,
  'גזר': 0.1,
  'תפוח אדמה': 0.15,
  'בצל': 0.15,
  'פלפל': 0.15,
  'חציל': 0.3,
  'קישוא': 0.25,
  'תפוח': 0.18,
  'בננה': 0.12,
  'תפוז': 0.2,
  'לימון': 0.1,
  'אבוקדו': 0.2,
  'מנגו': 0.35,
  'אננס': 1.5,
  'אבטיח': 8,
  'מלון': 1.5,
};

export const getDefaultWeight = (productName: string): number => {
  const lowerName = productName.toLowerCase();
  for (const [key, weight] of Object.entries(DEFAULT_WEIGHTS)) {
    if (lowerName.includes(key.toLowerCase())) {
      return weight;
    }
  }
  return 0.15; // ברירת מחדל - 150 גרם
};
