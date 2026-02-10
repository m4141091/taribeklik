export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      homepage_elements: {
        Row: {
          background_color: string | null
          border_radius: number | null
          color: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          element_type: string
          font_family: string | null
          font_size: number | null
          height: string
          icon_offset_x: number | null
          icon_offset_y: number | null
          icon_size: number | null
          icon_url: string | null
          id: string
          is_visible: boolean | null
          line_height: number | null
          link_url: string | null
          name: string | null
          object_fit: string | null
          object_position: string | null
          opacity: number | null
          position_x: number
          position_y: number
          text_align: string | null
          typewriter_delay: number | null
          typewriter_enabled: boolean | null
          typewriter_speed: number | null
          updated_at: string | null
          width: string
          z_index: number | null
        }
        Insert: {
          background_color?: string | null
          border_radius?: number | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          element_type: string
          font_family?: string | null
          font_size?: number | null
          height?: string
          icon_offset_x?: number | null
          icon_offset_y?: number | null
          icon_size?: number | null
          icon_url?: string | null
          id?: string
          is_visible?: boolean | null
          line_height?: number | null
          link_url?: string | null
          name?: string | null
          object_fit?: string | null
          object_position?: string | null
          opacity?: number | null
          position_x?: number
          position_y?: number
          text_align?: string | null
          typewriter_delay?: number | null
          typewriter_enabled?: boolean | null
          typewriter_speed?: number | null
          updated_at?: string | null
          width?: string
          z_index?: number | null
        }
        Update: {
          background_color?: string | null
          border_radius?: number | null
          color?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          element_type?: string
          font_family?: string | null
          font_size?: number | null
          height?: string
          icon_offset_x?: number | null
          icon_offset_y?: number | null
          icon_size?: number | null
          icon_url?: string | null
          id?: string
          is_visible?: boolean | null
          line_height?: number | null
          link_url?: string | null
          name?: string | null
          object_fit?: string | null
          object_position?: string | null
          opacity?: number | null
          position_x?: number
          position_y?: number
          text_align?: string | null
          typewriter_delay?: number | null
          typewriter_enabled?: boolean | null
          typewriter_speed?: number | null
          updated_at?: string | null
          width?: string
          z_index?: number | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          average_weight_kg: number | null
          category: string | null
          created_at: string
          created_by: string | null
          has_unit_variation: boolean | null
          id: string
          image_url: string | null
          in_stock_this_week: boolean
          is_active: boolean
          name: string
          price_per_kg: number | null
          price_per_unit: number | null
          pricing_type: string
          updated_at: string
          wordpress_image_url: string | null
        }
        Insert: {
          average_weight_kg?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          has_unit_variation?: boolean | null
          id?: string
          image_url?: string | null
          in_stock_this_week?: boolean
          is_active?: boolean
          name: string
          price_per_kg?: number | null
          price_per_unit?: number | null
          pricing_type?: string
          updated_at?: string
          wordpress_image_url?: string | null
        }
        Update: {
          average_weight_kg?: number | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          has_unit_variation?: boolean | null
          id?: string
          image_url?: string | null
          in_stock_this_week?: boolean
          is_active?: boolean
          name?: string
          price_per_kg?: number | null
          price_per_unit?: number | null
          pricing_type?: string
          updated_at?: string
          wordpress_image_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          background_position: string | null
          background_size: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          elements: Json | null
          height: number
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          background_position?: string | null
          background_size?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          elements?: Json | null
          height?: number
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          background_position?: string | null
          background_size?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          elements?: Json | null
          height?: number
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      sections_public: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          background_position: string | null
          background_size: string | null
          created_at: string | null
          display_order: number | null
          elements: Json | null
          height: number | null
          id: string | null
          is_active: boolean | null
          name: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          background_position?: string | null
          background_size?: string | null
          created_at?: string | null
          display_order?: number | null
          elements?: Json | null
          height?: number | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          background_position?: string | null
          background_size?: string | null
          created_at?: string | null
          display_order?: number | null
          elements?: Json | null
          height?: number | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
