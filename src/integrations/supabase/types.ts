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
      generation_jobs: {
        Row: {
          created_at: string
          credits_used: number | null
          error_message: string | null
          id: string
          messages: Json
          mode: string
          project_id: string
          result_actions: Json | null
          result_files: Json | null
          result_message: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          error_message?: string | null
          id?: string
          messages?: Json
          mode?: string
          project_id: string
          result_actions?: Json | null
          result_files?: Json | null
          result_message?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          error_message?: string | null
          id?: string
          messages?: Json
          mode?: string
          project_id?: string
          result_actions?: Json | null
          result_files?: Json | null
          result_message?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      inbox_notifications: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          link_url: string | null
          target_plan: string | null
          title: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          target_plan?: string | null
          title: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          link_url?: string | null
          target_plan?: string | null
          title?: string
        }
        Relationships: []
      }
      oauth_pkce_store: {
        Row: {
          code_verifier: string
          created_at: string
          id: string
          state: string
        }
        Insert: {
          code_verifier: string
          created_at?: string
          id?: string
          state: string
        }
        Update: {
          code_verifier?: string
          created_at?: string
          id?: string
          state?: string
        }
        Relationships: []
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
          supabase_anon_key: string | null
          supabase_url: string | null
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
          supabase_anon_key?: string | null
          supabase_url?: string | null
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
          supabase_anon_key?: string | null
          supabase_url?: string | null
          updated_at?: string
          user_id?: string
          vercel_url?: string | null
        }
        Relationships: []
      }
      templates: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          prompt: string
          sort_order: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          prompt: string
          sort_order?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          prompt?: string
          sort_order?: number | null
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
      user_notification_reads: {
        Row: {
          id: string
          notification_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          notification_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          notification_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_notification_reads_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "inbox_notifications"
            referencedColumns: ["id"]
          },
        ]
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vivora_deployments: {
        Row: {
          cloudflare_deployment_id: string | null
          created_at: string
          id: string
          status: string
          subdomain: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          cloudflare_deployment_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subdomain: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          cloudflare_deployment_id?: string | null
          created_at?: string
          id?: string
          status?: string
          subdomain?: string
          updated_at?: string
          url?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reset_daily_credits: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
      plan_type: ["spark", "builder", "creator", "scale"],
    },
  },
} as const
