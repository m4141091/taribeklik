export type ElementType = 'heading' | 'text' | 'button' | 'image' | 'search';

export interface SectionElement {
  id: string;
  type: ElementType;
  position: {
    x: number; // percentage (0-100)
    y: number; // percentage (0-100)
  };
  size: {
    width: number;  // pixels
    height: number; // pixels
  };
  content: string;
  styles: {
    fontSize?: number;
    fontFamily?: 'discovery' | 'cooperative' | 'script';
    color?: string;
    backgroundColor?: string;
    borderRadius?: number;
    textAlign?: 'right' | 'center' | 'left';
  };
  link?: string;
  zIndex?: number;
}

export interface Section {
  id: string;
  name: string;
  slug: string;
  height: number;
  background_image_url: string | null;
  background_color: string;
  elements: SectionElement[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}
