export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      downloads: {
        Row: {
          count: number | null
          id: number
          resource_id: number | null
        }
        Insert: {
          count?: number | null
          id?: number
          resource_id?: number | null
        }
        Update: {
          count?: number | null
          id?: number
          resource_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "downloads_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string
          theme_config?: Json
          links?: Json
          bio?: string | null
          social_links?: Json
          verified?: boolean
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string
          theme_config?: Json
          links?: Json
          bio?: string | null
          social_links?: Json
          verified?: boolean
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string
          theme_config?: Json
          links?: Json
          bio?: string | null
          social_links?: Json
          verified?: boolean
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at: string | null
          credit: string | null
          description: string | null
          download_url: string | null
          filetype: string | null
          id: number
          image_url: string | null
          preview_url: string | null
          software: string | null
          subcategory:
          | Database["public"]["Enums"]["resource_subcategory"]
          | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          created_at?: string | null
          credit?: string | null
          description?: string | null
          download_url?: string | null
          filetype?: string | null
          id?: number
          image_url?: string | null
          preview_url?: string | null
          software?: string | null
          subcategory?:
          | Database["public"]["Enums"]["resource_subcategory"]
          | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          created_at?: string | null
          credit?: string | null
          description?: string | null
          download_url?: string | null
          filetype?: string | null
          id?: number
          image_url?: string | null
          preview_url?: string | null
          software?: string | null
          subcategory?:
          | Database["public"]["Enums"]["resource_subcategory"]
          | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          resource_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          resource_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          resource_url?: string
          user_id?: string
        }
        Relationships: []
      }
      creator_packs: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          small_description: string
          description: string
          cover_image_url: string | null
          external_link: string
          tags: string[]
          status: 'pending' | 'approved' | 'rejected'
          review_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          small_description: string
          description: string
          cover_image_url?: string | null
          external_link: string
          tags?: string[]
          status?: 'pending' | 'approved' | 'rejected'
          review_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          small_description?: string
          description?: string
          cover_image_url?: string | null
          external_link?: string
          tags?: string[]
          status?: 'pending' | 'approved' | 'rejected'
          review_reason?: string | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      resource_category:
      | "music"
      | "sfx"
      | "images"
      | "animations"
      | "fonts"
      | "presets"
      resource_subcategory: "davinci" | "adobe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      resource_category: [
        "music",
        "sfx",
        "images",
        "animations",
        "fonts",
        "presets",
      ],
      resource_subcategory: ["davinci", "adobe"],
    },
  },
} as const
