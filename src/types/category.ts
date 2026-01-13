export interface Category {
  id: string;
  name: string;
  display_order: number;
  created_at: string;
}

export interface ProductCategory {
  id: string;
  product_id: string;
  category_id: string;
  created_at: string;
}
