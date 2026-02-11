export type HomepageElementType = 'heading' | 'text' | 'button' | 'image' | 'search' | 'separator' | 'card' | 'icon' | 'product_grid';

export interface HomepageElement {
  id: string;
  element_type: HomepageElementType;
  position_x: number;
  position_y: number;
  width: string;
  height: string;
  content: string | null;
  font_size: number;
  font_family: 'discovery' | 'discovery-fs' | 'cooperative' | 'script';
  color: string;
  background_color: string | null;
  border_radius: number;
  text_align: 'right' | 'center' | 'left';
  object_fit: 'cover' | 'contain' | 'fill' | 'none';
  object_position: string;
  opacity: number;
  line_height: number;
  typewriter_enabled: boolean;
  typewriter_speed: number;
  typewriter_delay: number;
  link_url: string | null;
  icon_url: string | null;
  icon_size: number;
  icon_offset_x: number;
  icon_offset_y: number;
  z_index: number;
  is_visible: boolean;
  display_order: number;
  name: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  category_id: string | null;
}
