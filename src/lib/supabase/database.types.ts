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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      app_downloads: {
        Row: {
          app_id: string
          downloaded_at: string
          id: string
          user_id: string | null
        }
        Insert: {
          app_id: string
          downloaded_at?: string
          id?: string
          user_id?: string | null
        }
        Update: {
          app_id?: string
          downloaded_at?: string
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_downloads_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_downloads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      app_reports: {
        Row: {
          admin_note: string | null
          app_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          app_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          app_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_reports_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          apk_path: string | null
          category_slug: string
          created_at: string
          description: string
          developer_id: string
          downloads_count: number
          featured: boolean
          icon_color: string
          id: string
          name: string
          rating: number
          rating_count: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshots_count: number
          short_description: string
          size: string
          slug: string
          status: Database["public"]["Enums"]["app_status"]
          updated_at: string
          version: string
        }
        Insert: {
          apk_path?: string | null
          category_slug: string
          created_at?: string
          description: string
          developer_id: string
          downloads_count?: number
          featured?: boolean
          icon_color?: string
          id?: string
          name: string
          rating?: number
          rating_count?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots_count?: number
          short_description: string
          size?: string
          slug: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          version?: string
        }
        Update: {
          apk_path?: string | null
          category_slug?: string
          created_at?: string
          description?: string
          developer_id?: string
          downloads_count?: number
          featured?: boolean
          icon_color?: string
          id?: string
          name?: string
          rating?: number
          rating_count?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots_count?: number
          short_description?: string
          size?: string
          slug?: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "apps_category_slug_fkey"
            columns: ["category_slug"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "apps_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apps_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string
          created_at: string
          icon: string
          name: string
          slug: string
        }
        Insert: {
          color: string
          created_at?: string
          icon: string
          name: string
          slug: string
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_note: string | null
          amount_sdg: number
          amount_usd: number
          created_at: string
          developer_id: string
          exchange_rate: number
          id: string
          note: string | null
          payer_name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          proof_path: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["payment_status"]
          subscription_id: string | null
          transaction_reference: string
          transfer_date: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          amount_sdg: number
          amount_usd: number
          created_at?: string
          developer_id: string
          exchange_rate: number
          id?: string
          note?: string | null
          payer_name: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          proof_path: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_reference: string
          transfer_date: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          amount_sdg?: number
          amount_usd?: number
          created_at?: string
          developer_id?: string
          exchange_rate?: number
          id?: string
          note?: string | null
          payer_name?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          proof_path?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          subscription_id?: string | null
          transaction_reference?: string
          transfer_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_requests_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_requests_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_settings: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          basic_max_apps: number
          basic_price_usd: number
          free_trial_days: number
          free_trial_max_developers: number
          grace_period_days: number
          iban: string
          id: number
          payment_instructions: string
          payment_method_name: string
          phone: string
          pro_price_usd: number
          updated_at: string
          updated_by: string | null
          usd_to_sdg_rate: number
        }
        Insert: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          basic_max_apps?: number
          basic_price_usd?: number
          free_trial_days?: number
          free_trial_max_developers?: number
          grace_period_days?: number
          iban?: string
          id?: number
          payment_instructions?: string
          payment_method_name?: string
          phone?: string
          pro_price_usd?: number
          updated_at?: string
          updated_by?: string | null
          usd_to_sdg_rate?: number
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          basic_max_apps?: number
          basic_price_usd?: number
          free_trial_days?: number
          free_trial_max_developers?: number
          grace_period_days?: number
          iban?: string
          id?: number
          payment_instructions?: string
          payment_method_name?: string
          phone?: string
          pro_price_usd?: number
          updated_at?: string
          updated_by?: string | null
          usd_to_sdg_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          app_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          app_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          app_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          developer_id: string
          expires_at: string | null
          id: string
          is_free_trial: boolean
          max_apps: number | null
          plan: Database["public"]["Enums"]["subscription_plan"] | null
          started_at: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          trial_slot: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          developer_id: string
          expires_at?: string | null
          id?: string
          is_free_trial?: boolean
          max_apps?: number | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_slot?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          developer_id?: string
          expires_at?: string | null
          id?: string
          is_free_trial?: boolean
          max_apps?: number | null
          plan?: Database["public"]["Enums"]["subscription_plan"] | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_slot?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_payment_request: {
        Args: { p_admin_note?: string; p_request_id: string }
        Returns: undefined
      }
      create_payment_request: {
        Args: {
          p_note?: string
          p_payer_name: string
          p_plan: Database["public"]["Enums"]["subscription_plan"]
          p_proof_path: string
          p_transaction_reference: string
          p_transfer_date: string
        }
        Returns: string
      }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      developer_can_add_app: {
        Args: { p_developer_id: string }
        Returns: boolean
      }
      reject_payment_request: {
        Args: { p_admin_note: string; p_request_id: string }
        Returns: undefined
      }
      sync_subscription_status: {
        Args: { p_developer_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_status: "pending" | "approved" | "rejected"
      payment_status: "pending" | "approved" | "rejected" | "cancelled"
      subscription_plan: "trial" | "basic" | "pro"
      subscription_status: "trial" | "active" | "expired" | "suspended"
      user_role: "user" | "developer" | "admin"
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
      app_status: ["pending", "approved", "rejected"],
      payment_status: ["pending", "approved", "rejected", "cancelled"],
      subscription_plan: ["trial", "basic", "pro"],
      subscription_status: ["trial", "active", "expired", "suspended"],
      user_role: ["user", "developer", "admin"],
    },
  },
} as const
