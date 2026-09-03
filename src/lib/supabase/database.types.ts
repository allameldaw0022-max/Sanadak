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
      dealer_subscription_requests: {
        Row: {
          amount_sdg: number
          created_at: string
          dealer_id: string
          id: string
          max_devices_snapshot: number
          payment_method_id: string | null
          payment_proof_path: string
          plan_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["dealer_subscription_request_status"]
        }
        Insert: {
          amount_sdg: number
          created_at?: string
          dealer_id: string
          id?: string
          max_devices_snapshot: number
          payment_method_id?: string | null
          payment_proof_path: string
          plan_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["dealer_subscription_request_status"]
        }
        Update: {
          amount_sdg?: number
          created_at?: string
          dealer_id?: string
          id?: string
          max_devices_snapshot?: number
          payment_method_id?: string | null
          payment_proof_path?: string
          plan_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["dealer_subscription_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "dealer_subscription_requests_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscription_requests_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscription_requests_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscription_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dealer_subscriptions: {
        Row: {
          dealer_id: string
          expires_at: string
          id: string
          max_devices_snapshot: number
          plan_id: string
          started_at: string
          status: Database["public"]["Enums"]["dealer_subscription_status"]
          updated_at: string
        }
        Insert: {
          dealer_id: string
          expires_at: string
          id?: string
          max_devices_snapshot: number
          plan_id: string
          started_at?: string
          status?: Database["public"]["Enums"]["dealer_subscription_status"]
          updated_at?: string
        }
        Update: {
          dealer_id?: string
          expires_at?: string
          id?: string
          max_devices_snapshot?: number
          plan_id?: string
          started_at?: string
          status?: Database["public"]["Enums"]["dealer_subscription_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dealer_subscriptions_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dealer_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      device_certificates: {
        Row: {
          device_id: string
          id: string
          issued_at: string
          issued_to: string
        }
        Insert: {
          device_id: string
          id?: string
          issued_at?: string
          issued_to: string
        }
        Update: {
          device_id?: string
          id?: string
          issued_at?: string
          issued_to?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_certificates_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_certificates_issued_to_fkey"
            columns: ["issued_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_imeis: {
        Row: {
          created_at: string
          device_id: string
          id: string
          imei_hash: string
          imei_normalized: string
          kind: Database["public"]["Enums"]["imei_kind"]
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          imei_hash: string
          imei_normalized: string
          kind: Database["public"]["Enums"]["imei_kind"]
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          imei_hash?: string
          imei_normalized?: string
          kind?: Database["public"]["Enums"]["imei_kind"]
        }
        Relationships: [
          {
            foreignKeyName: "device_imeis_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_reports: {
        Row: {
          admin_note: string | null
          created_at: string
          details: string | null
          device_id: string
          id: string
          report_type: Database["public"]["Enums"]["device_report_type"]
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["device_report_status"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          device_id: string
          id?: string
          report_type: Database["public"]["Enums"]["device_report_type"]
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["device_report_status"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          details?: string | null
          device_id?: string
          id?: string
          report_type?: Database["public"]["Enums"]["device_report_type"]
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["device_report_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_reports_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_status_history: {
        Row: {
          actor_id: string | null
          created_at: string
          device_id: string
          id: string
          new_status: Database["public"]["Enums"]["device_status"]
          old_status: Database["public"]["Enums"]["device_status"] | null
          reason: string | null
          source: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          device_id: string
          id?: string
          new_status: Database["public"]["Enums"]["device_status"]
          old_status?: Database["public"]["Enums"]["device_status"] | null
          reason?: string | null
          source: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          device_id?: string
          id?: string
          new_status?: Database["public"]["Enums"]["device_status"]
          old_status?: Database["public"]["Enums"]["device_status"] | null
          reason?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_status_history_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          brand: string
          color: string | null
          created_at: string
          current_status: Database["public"]["Enums"]["device_status"]
          id: string
          model: string
          owner_id: string
          serial_number: string | null
          updated_at: string
        }
        Insert: {
          brand: string
          color?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["device_status"]
          id?: string
          model: string
          owner_id: string
          serial_number?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          color?: string | null
          created_at?: string
          current_status?: Database["public"]["Enums"]["device_status"]
          id?: string
          model?: string
          owner_id?: string
          serial_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          related_id: string | null
          related_table: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          related_id?: string | null
          related_table?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_claims: {
        Row: {
          claimant_id: string
          created_at: string
          device_id: string
          id: string
          note: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["ownership_claim_status"]
          updated_at: string
        }
        Insert: {
          claimant_id: string
          created_at?: string
          device_id: string
          id?: string
          note?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ownership_claim_status"]
          updated_at?: string
        }
        Update: {
          claimant_id?: string
          created_at?: string
          device_id?: string
          id?: string
          note?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["ownership_claim_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_claims_claimant_id_fkey"
            columns: ["claimant_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_claims_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_claims_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ownership_evidence: {
        Row: {
          claim_id: string
          created_at: string
          id: string
          storage_path: string
          uploader_id: string
        }
        Insert: {
          claim_id: string
          created_at?: string
          id?: string
          storage_path: string
          uploader_id: string
        }
        Update: {
          claim_id?: string
          created_at?: string
          id?: string
          storage_path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ownership_evidence_claim_id_fkey"
            columns: ["claim_id"]
            isOneToOne: false
            referencedRelation: "ownership_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ownership_evidence_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_methods: {
        Row: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at: string
          iban: string | null
          id: string
          instructions: string | null
          is_active: boolean
          phone_or_wallet: string | null
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          bank_name: string
          created_at?: string
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          phone_or_wallet?: string | null
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          bank_name?: string
          created_at?: string
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          phone_or_wallet?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          business_name: string | null
          contact_name: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_dealer: boolean
          logo_path: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_dealer?: boolean
          logo_path?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_name?: string | null
          contact_name?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_dealer?: boolean
          logo_path?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      report_evidence: {
        Row: {
          created_at: string
          id: string
          report_id: string
          storage_path: string
          uploader_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          report_id: string
          storage_path: string
          uploader_id: string
        }
        Update: {
          created_at?: string
          id?: string
          report_id?: string
          storage_path?: string
          uploader_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_evidence_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "device_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "report_evidence_uploader_id_fkey"
            columns: ["uploader_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_events: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          app_id: string | null
          created_at: string
          event_type: string
          id: string
          metadata: Json
          scan_id: string | null
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          app_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          scan_id?: string | null
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          app_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          scan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_events_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          billing_interval: string
          created_at: string
          description: string | null
          features: Json
          id: string
          is_active: boolean
          is_popular: boolean
          max_devices: number
          monthly_price_sdg: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_devices: number
          monthly_price_sdg: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          description?: string | null
          features?: Json
          id?: string
          is_active?: boolean
          is_popular?: boolean
          max_devices?: number
          monthly_price_sdg?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
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
      check_and_increment_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: {
          allowed: boolean
          current_count: number
        }[]
      }
      current_user_is_dealer: { Args: never; Returns: boolean }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      imei_luhn_valid: { Args: { p_imei: string }; Returns: boolean }
      is_claimant_of_device: { Args: { p_device_id: string }; Returns: boolean }
      is_valid_device_status_transition: {
        Args: {
          p_new: Database["public"]["Enums"]["device_status"]
          p_old: Database["public"]["Enums"]["device_status"]
        }
        Returns: boolean
      }
      public_check_device_status: {
        Args: { p_imei_hash: string }
        Returns: {
          owner_display_name: string
          status: Database["public"]["Enums"]["device_status"]
        }[]
      }
      register_device: {
        Args: {
          p_brand: string
          p_color: string
          p_imei1_normalized: string
          p_imei2_normalized?: string
          p_model: string
          p_serial_number: string
        }
        Returns: string
      }
      review_device_report: {
        Args: {
          p_admin_note?: string
          p_new_status: Database["public"]["Enums"]["device_report_status"]
          p_report_id: string
        }
        Returns: undefined
      }
      review_ownership_claim: {
        Args: {
          p_claim_id: string
          p_new_status: Database["public"]["Enums"]["ownership_claim_status"]
          p_note?: string
        }
        Returns: undefined
      }
      review_subscription_request: {
        Args: {
          p_decision: Database["public"]["Enums"]["dealer_subscription_request_status"]
          p_rejection_reason?: string
          p_request_id: string
        }
        Returns: undefined
      }
      submit_ownership_claim: {
        Args: { p_imei_hash: string; p_note?: string }
        Returns: string
      }
      transition_device_status: {
        Args: {
          p_device_id: string
          p_new_status: Database["public"]["Enums"]["device_status"]
          p_reason: string
          p_source: string
        }
        Returns: undefined
      }
      verify_certificate: {
        Args: { p_certificate_id: string }
        Returns: {
          brand: string
          issued_at: string
          model: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      app_security_status:
        | "pending_scan"
        | "scanning"
        | "passed"
        | "review_required"
        | "failed"
      app_status: "pending" | "approved" | "rejected"
      dealer_subscription_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
      dealer_subscription_status: "active" | "expired"
      device_report_status:
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "REJECTED"
      device_report_type: "LOST" | "STOLEN"
      device_status:
        | "ACTIVE"
        | "UNDER_REVIEW"
        | "LOST"
        | "STOLEN"
        | "RECOVERED"
        | "BLOCKED"
      imei_kind: "imei1" | "imei2"
      ownership_claim_status:
        | "SUBMITTED"
        | "UNDER_REVIEW"
        | "MORE_INFORMATION_REQUIRED"
        | "APPROVED"
        | "REJECTED"
      payment_status: "pending" | "approved" | "rejected" | "cancelled"
      security_risk_level: "low" | "medium" | "high" | "critical"
      security_scan_status:
        | "uploaded"
        | "scanning"
        | "passed"
        | "failed"
        | "review_required"
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
  public: {
    Enums: {
      app_security_status: [
        "pending_scan",
        "scanning",
        "passed",
        "review_required",
        "failed",
      ],
      app_status: ["pending", "approved", "rejected"],
      dealer_subscription_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
      ],
      dealer_subscription_status: ["active", "expired"],
      device_report_status: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "APPROVED",
        "REJECTED",
      ],
      device_report_type: ["LOST", "STOLEN"],
      device_status: [
        "ACTIVE",
        "UNDER_REVIEW",
        "LOST",
        "STOLEN",
        "RECOVERED",
        "BLOCKED",
      ],
      imei_kind: ["imei1", "imei2"],
      ownership_claim_status: [
        "SUBMITTED",
        "UNDER_REVIEW",
        "MORE_INFORMATION_REQUIRED",
        "APPROVED",
        "REJECTED",
      ],
      payment_status: ["pending", "approved", "rejected", "cancelled"],
      security_risk_level: ["low", "medium", "high", "critical"],
      security_scan_status: [
        "uploaded",
        "scanning",
        "passed",
        "failed",
        "review_required",
      ],
      subscription_plan: ["trial", "basic", "pro"],
      subscription_status: ["trial", "active", "expired", "suspended"],
      user_role: ["user", "developer", "admin"],
    },
  },
} as const
