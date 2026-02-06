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
      chat_messages: {
        Row: {
          actions_taken: Json | null
          content: string
          created_at: string
          credits_used: number | null
          id: string
          image_url: string | null
          project_id: string
          role: string
          user_id: string
        }
        Insert: {
          actions_taken?: Json | null
          content: string
          created_at?: string
          credits_used?: number | null
          id?: string
          image_url?: string | null
          project_id: string
          role: string
          user_id: string
        }
        Update: {
          actions_taken?: Json | null
          content?: string
          created_at?: string
          credits_used?: number | null
          id?: string
          image_url?: string | null
          project_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_transactions: {
        Row: {
          created_at: string
          credits_used: number
          description: string | null
          id: string
          message_id: string | null
          model_used: string | null
          project_id: string | null
          user_id: string
          work_type: string | null
        }
        Insert: {
          created_at?: string
          credits_used: number
          description?: string | null
          id?: string
          message_id?: string | null
          model_used?: string | null
          project_id?: string | null
          user_id: string
          work_type?: string | null
        }
        Update: {
          created_at?: string
          credits_used?: number
          description?: string | null
          id?: string
          message_id?: string | null
          model_used?: string | null
          project_id?: string | null
          user_id?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      project_versions: {
        Row: {
          actions_taken: Json | null
          chat_messages: Json
          created_at: string
          credits_used: number | null
          files: Json
          id: string
          name: string | null
          project_id: string
          user_id: string
          version_number: number
        }
        Insert: {
          actions_taken?: Json | null
          chat_messages?: Json
          created_at?: string
          credits_used?: number | null
          files?: Json
          id?: string
          name?: string | null
          project_id: string
          user_id: string
          version_number: number
        }
        Update: {
          actions_taken?: Json | null
          chat_messages?: Json
          created_at?: string
          credits_used?: number | null
          files?: Json
          id?: string
          name?: string | null
          project_id?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "project_versions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          building_plan: string[] | null
          created_at: string
          description: string | null
          files: Json
          generated_name: string | null
          generation_status: string | null
          id: string
          is_public: boolean
          is_published: boolean
          name: string
          project_type: string
          published_slug: string | null
          updated_at: string
          user_id: string
          vercel_url: string | null
        }
        Insert: {
          building_plan?: string[] | null
          created_at?: string
          description?: string | null
          files?: Json
          generated_name?: string | null
          generation_status?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          name?: string
          project_type?: string
          published_slug?: string | null
          updated_at?: string
          user_id: string
          vercel_url?: string | null
        }
        Update: {
          building_plan?: string[] | null
          created_at?: string
          description?: string | null
          files?: Json
          generated_name?: string | null
          generation_status?: string | null
          id?: string
          is_public?: boolean
          is_published?: boolean
          name?: string
          project_type?: string
          published_slug?: string | null
          updated_at?: string
          user_id?: string
          vercel_url?: string | null
        }
        Relationships: []
      }
      user_integrations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          vercel_connected: boolean | null
          vercel_token: string | null
          vercel_username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          vercel_connected?: boolean | null
          vercel_token?: string | null
          vercel_username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          vercel_connected?: boolean | null
          vercel_token?: string | null
          vercel_username?: string | null
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          credits_used_today: number
          daily_credits: number
          id: string
          last_daily_reset: string | null
          max_daily_credits: number
          monthly_credits: number
          plan: Database["public"]["Enums"]["plan_type"]
          total_credits_used: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used_today?: number
          daily_credits?: number
          id?: string
          last_daily_reset?: string | null
          max_daily_credits?: number
          monthly_credits?: number
          plan?: Database["public"]["Enums"]["plan_type"]
          total_credits_used?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used_today?: number
          daily_credits?: number
          id?: string
          last_daily_reset?: string | null
          max_daily_credits?: number
          monthly_credits?: number
          plan?: Database["public"]["Enums"]["plan_type"]
          total_credits_used?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_reset_user_credits: {
        Args: { p_user_id: string }
        Returns: {
          credits_available: number
          should_reset: boolean
        }[]
      }
      delete_project_cascade: {
        Args: { p_project_id: string }
        Returns: undefined
      }
      reset_daily_credits: { Args: never; Returns: undefined }
    }
    Enums: {
      plan_type: "spark" | "builder" | "creator" | "scale"
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
      plan_type: ["spark", "builder", "creator", "scale"],
    },
  },
} as const
