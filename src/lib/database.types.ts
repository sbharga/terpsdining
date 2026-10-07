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
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      favorites: {
        Row: {
          created_at: string
          item_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          user_id?: string
        }
        Update: {
          created_at?: string
          item_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      halls: {
        Row: {
          id: number
          name: string
          sheet_name: string
          slug: string
        }
        Insert: {
          id: number
          name: string
          sheet_name: string
          slug: string
        }
        Update: {
          id?: number
          name?: string
          sheet_name?: string
          slug?: string
        }
        Relationships: []
      }
      hours: {
        Row: {
          closes: string | null
          date: string
          hall_id: number
          label: string
          meal: Database["public"]["Enums"]["meal"]
          opens: string | null
          status: Database["public"]["Enums"]["hours_status"]
        }
        Insert: {
          closes?: string | null
          date: string
          hall_id: number
          label: string
          meal: Database["public"]["Enums"]["meal"]
          opens?: string | null
          status: Database["public"]["Enums"]["hours_status"]
        }
        Update: {
          closes?: string | null
          date?: string
          hall_id?: number
          label?: string
          meal?: Database["public"]["Enums"]["meal"]
          opens?: string | null
          status?: Database["public"]["Enums"]["hours_status"]
        }
        Relationships: [
          {
            foreignKeyName: "hours_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          allergens: string[]
          created_at: string
          dietary: string[]
          first_seen: string | null
          id: string
          image_checked_at: string | null
          image_path: string | null
          ingredients: string | null
          label_allergens: string | null
          label_url: string | null
          last_seen: string | null
          name: string
          nutrition: Json | null
          nutrition_checked_at: string | null
          rating_avg: number | null
          rating_count: number
          rating_sum: number
        }
        Insert: {
          allergens?: string[]
          created_at?: string
          dietary?: string[]
          first_seen?: string | null
          id: string
          image_checked_at?: string | null
          image_path?: string | null
          ingredients?: string | null
          label_allergens?: string | null
          label_url?: string | null
          last_seen?: string | null
          name: string
          nutrition?: Json | null
          nutrition_checked_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          rating_sum?: number
        }
        Update: {
          allergens?: string[]
          created_at?: string
          dietary?: string[]
          first_seen?: string | null
          id?: string
          image_checked_at?: string | null
          image_path?: string | null
          ingredients?: string | null
          label_allergens?: string | null
          label_url?: string | null
          last_seen?: string | null
          name?: string
          nutrition?: Json | null
          nutrition_checked_at?: string | null
          rating_avg?: number | null
          rating_count?: number
          rating_sum?: number
        }
        Relationships: []
      }
      offerings: {
        Row: {
          date: string
          hall_id: number
          item_id: string
          meal: Database["public"]["Enums"]["meal"]
          portion: string | null
          station: string
        }
        Insert: {
          date: string
          hall_id: number
          item_id: string
          meal: Database["public"]["Enums"]["meal"]
          portion?: string | null
          station: string
        }
        Update: {
          date?: string
          hall_id?: number
          item_id?: string
          meal?: Database["public"]["Enums"]["meal"]
          portion?: string | null
          station?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerings_hall_id_fkey"
            columns: ["hall_id"]
            isOneToOne: false
            referencedRelation: "halls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offerings_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          item_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          item_id: string
          rating: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          item_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_account: { Args: never; Returns: undefined }
      favorite_items: {
        Args: { p_date: string }
        Returns: {
          allergens: string[]
          dietary: string[]
          halls: Json
          id: string
          image_path: string
          name: string
          rating_avg: number
          rating_count: number
        }[]
      }
      item_histories: {
        Args: { p_ids: string[] }
        Returns: {
          history: Json
          item_id: string
        }[]
      }
      popular_items: {
        Args: { p_date: string; p_hall?: number; p_limit?: number }
        Returns: {
          allergens: string[]
          dietary: string[]
          halls: Json
          id: string
          image_path: string
          name: string
          rating_avg: number
          rating_count: number
        }[]
      }
      prune_history: { Args: never; Returns: number }
      replace_offerings: {
        Args: {
          p_date: string
          p_hall: number
          p_meal: Database["public"]["Enums"]["meal"]
          p_rows: Json
        }
        Returns: undefined
      }
      search_items: {
        Args: {
          p_date: string
          p_limit?: number
          p_offset?: number
          p_query: string
        }
        Returns: {
          allergens: string[]
          dietary: string[]
          halls: Json
          id: string
          image_path: string
          last_seen: string
          name: string
          rating_avg: number
          rating_count: number
          total_count: number
        }[]
      }
    }
    Enums: {
      hours_status: "open" | "closed" | "tbd"
      meal: "Breakfast" | "Lunch" | "Dinner"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      hours_status: ["open", "closed", "tbd"],
      meal: ["Breakfast", "Lunch", "Dinner"],
    },
  },
} as const
