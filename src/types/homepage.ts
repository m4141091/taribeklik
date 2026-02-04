export type HomepageElementType = 'heading' | 'text' | 'button' | 'image' | 'search' | 'separator' | 'card' | 'icon';

export interface HomepageElement {
  id: string;
  element_type: HomepageElementType;
  position_x: number;
  position_y: number;
  width: string;
  height: string;
  content: string | null;
  font_size: number;
  font_family: 'discovery' | 'cooperative' | 'script';
  color: string;
  background_color: string | null;
  border_radius: number;
  text_align: 'right' | 'center' | 'left';
  object_fit: 'cover' | 'contain' | 'fill' | 'none';
  object_position: string;
  opacity: number;
  typewriter_enabled: boolean;
  typewriter_speed: number;
  typewriter_delay: number;
  link_url: string | null;
  z_index: number;
  is_visible: boolean;
  display_order: number;
  name: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}
