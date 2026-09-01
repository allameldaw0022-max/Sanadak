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
      apk_security_scans: {
        Row: {
          activities: Json
          app_id: string
          certificate_fingerprint: string | null
          certificate_issuer: string | null
          certificate_subject: string | null
          certificate_valid_from: string | null
          certificate_valid_to: string | null
          completed_at: string | null
          created_at: string
          deep_links: Json
          detected_urls: Json
          developer_id: string
          exported_components: Json
          file_path: string
          file_size: number
          findings: Json
          id: string
          invalid_reason: string | null
          is_signed: boolean
          is_valid_apk: boolean
          malware_details: Json | null
          malware_provider: string | null
          malware_report_id: string | null
          malware_status: string
          md5: string | null
          min_sdk: number | null
          native_libraries: Json
          package_name: string | null
          permissions: Json
          previous_certificate_fingerprint: string | null
          providers: Json
          receivers: Json
          risk_level: Database["public"]["Enums"]["security_risk_level"]
          risk_score: number
          scan_status: Database["public"]["Enums"]["security_scan_status"]
          services: Json
          sha1: string | null
          sha256: string
          signature_changed: boolean
          signature_scheme: string | null
          target_sdk: number | null
          version_code: string | null
          version_name: string | null
        }
        Insert: {
          activities?: Json
          app_id: string
          certificate_fingerprint?: string | null
          certificate_issuer?: string | null
          certificate_subject?: string | null
          certificate_valid_from?: string | null
          certificate_valid_to?: string | null
          completed_at?: string | null
          created_at?: string
          deep_links?: Json
          detected_urls?: Json
          developer_id: string
          exported_components?: Json
          file_path: string
          file_size: number
          findings?: Json
          id?: string
          invalid_reason?: string | null
          is_signed?: boolean
          is_valid_apk?: boolean
          malware_details?: Json | null
          malware_provider?: string | null
          malware_report_id?: string | null
          malware_status?: string
          md5?: string | null
          min_sdk?: number | null
          native_libraries?: Json
          package_name?: string | null
          permissions?: Json
          previous_certificate_fingerprint?: string | null
          providers?: Json
          receivers?: Json
          risk_level?: Database["public"]["Enums"]["security_risk_level"]
          risk_score?: number
          scan_status?: Database["public"]["Enums"]["security_scan_status"]
          services?: Json
          sha1?: string | null
          sha256: string
          signature_changed?: boolean
          signature_scheme?: string | null
          target_sdk?: number | null
          version_code?: string | null
          version_name?: string | null
        }
        Update: {
          activities?: Json
          app_id?: string
          certificate_fingerprint?: string | null
          certificate_issuer?: string | null
          certificate_subject?: string | null
          certificate_valid_from?: string | null
          certificate_valid_to?: string | null
          completed_at?: string | null
          created_at?: string
          deep_links?: Json
          detected_urls?: Json
          developer_id?: string
          exported_components?: Json
          file_path?: string
          file_size?: number
          findings?: Json
          id?: string
          invalid_reason?: string | null
          is_signed?: boolean
          is_valid_apk?: boolean
          malware_details?: Json | null
          malware_provider?: string | null
          malware_report_id?: string | null
          malware_status?: string
          md5?: string | null
          min_sdk?: number | null
          native_libraries?: Json
          package_name?: string | null
          permissions?: Json
          previous_certificate_fingerprint?: string | null
          providers?: Json
          receivers?: Json
          risk_level?: Database["public"]["Enums"]["security_risk_level"]
          risk_score?: number
          scan_status?: Database["public"]["Enums"]["security_scan_status"]
          services?: Json
          sha1?: string | null
          sha256?: string
          signature_changed?: boolean
          signature_scheme?: string | null
          target_sdk?: number | null
          version_code?: string | null
          version_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "apk_security_scans_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apk_security_scans_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      app_screenshots: {
        Row: {
          app_id: string
          created_at: string
          developer_id: string
          id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          app_id: string
          created_at?: string
          developer_id: string
          id?: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          app_id?: string
          created_at?: string
          developer_id?: string
          id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_screenshots_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_screenshots_developer_id_fkey"
            columns: ["developer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      apps: {
        Row: {
          apk_md5: string | null
          apk_path: string | null
          apk_sha1: string | null
          apk_sha256: string | null
          category_slug: string
          created_at: string
          description: string
          developer_id: string
          downloads_count: number
          emergency_disabled: boolean
          emergency_disabled_at: string | null
          emergency_disabled_by: string | null
          emergency_disabled_reason: string | null
          featured: boolean
          icon_color: string
          icon_path: string | null
          id: string
          name: string
          rating: number
          rating_count: number
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          screenshots_count: number
          security_scan_id: string | null
          security_status: Database["public"]["Enums"]["app_security_status"]
          short_description: string
          size: string
          slug: string
          status: Database["public"]["Enums"]["app_status"]
          updated_at: string
          version: string
        }
        Insert: {
          apk_md5?: string | null
          apk_path?: string | null
          apk_sha1?: string | null
          apk_sha256?: string | null
          category_slug: string
          created_at?: string
          description: string
          developer_id: string
          downloads_count?: number
          emergency_disabled?: boolean
          emergency_disabled_at?: string | null
          emergency_disabled_by?: string | null
          emergency_disabled_reason?: string | null
          featured?: boolean
          icon_color?: string
          icon_path?: string | null
          id?: string
          name: string
          rating?: number
          rating_count?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots_count?: number
          security_scan_id?: string | null
          security_status?: Database["public"]["Enums"]["app_security_status"]
          short_description: string
          size?: string
          slug: string
          status?: Database["public"]["Enums"]["app_status"]
          updated_at?: string
          version?: string
        }
        Update: {
          apk_md5?: string | null
          apk_path?: string | null
          apk_sha1?: string | null
          apk_sha256?: string | null
          category_slug?: string
          created_at?: string
          description?: string
          developer_id?: string
          downloads_count?: number
          emergency_disabled?: boolean
          emergency_disabled_at?: string | null
          emergency_disabled_by?: string | null
          emergency_disabled_reason?: string | null
          featured?: boolean
          icon_color?: string
          icon_path?: string | null
          id?: string
          name?: string
          rating?: number
          rating_count?: number
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          screenshots_count?: number
          security_scan_id?: string | null
          security_status?: Database["public"]["Enums"]["app_security_status"]
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
            foreignKeyName: "apps_emergency_disabled_by_fkey"
            columns: ["emergency_disabled_by"]
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
          {
            foreignKeyName: "apps_security_scan_id_fkey"
            columns: ["security_scan_id"]
            isOneToOne: false
            referencedRelation: "apk_security_scans"
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
          is_dealer: boolean
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_dealer?: boolean
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_dealer?: boolean
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
          {
            foreignKeyName: "security_events_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_events_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "apk_security_scans"
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
      security_rules_config: {
        Row: {
          config: Json
          id: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          config: Json
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          config?: Json
          id?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_rules_config_updated_by_fkey"
            columns: ["updated_by"]
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
          status: Database["public"]["Enums"]["device_status"]
        }[]
      }
      register_device: {
        Args: {
          p_brand: string
          p_color?: string
          p_imei1_hash?: string
          p_imei1_normalized?: string
          p_imei2_hash?: string
          p_imei2_normalized?: string
          p_model: string
          p_serial_number?: string
        }
        Returns: string
      }
      reject_payment_request: {
        Args: { p_admin_note: string; p_request_id: string }
        Returns: undefined
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
      submit_ownership_claim: {
        Args: { p_imei_hash: string; p_note?: string }
        Returns: string
      }
      sync_subscription_status: {
        Args: { p_developer_id: string }
        Returns: undefined
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
      app_security_status: [
        "pending_scan",
        "scanning",
        "passed",
        "review_required",
        "failed",
      ],
      app_status: ["pending", "approved", "rejected"],
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
