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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_insights: {
        Row: {
          content: string
          created_by: string | null
          escalation_level: number
          expires_at: string | null
          generated_at: string
          id: string
          insight_type: string
          is_read: boolean
          last_escalated_at: string | null
          metadata: Json | null
          organization_id: string
          reason: Json
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          snoozed_until: string | null
          status: string
          title: string
        }
        Insert: {
          content: string
          created_by?: string | null
          escalation_level?: number
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean
          last_escalated_at?: string | null
          metadata?: Json | null
          organization_id: string
          reason?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          snoozed_until?: string | null
          status?: string
          title: string
        }
        Update: {
          content?: string
          created_by?: string | null
          escalation_level?: number
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean
          last_escalated_at?: string | null
          metadata?: Json | null
          organization_id?: string
          reason?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          snoozed_until?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      announcement_reads: {
        Row: {
          acknowledged: boolean
          acknowledged_at: string | null
          announcement_id: string
          id: string
          read_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          announcement_id: string
          id?: string
          read_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          acknowledged_at?: string | null
          announcement_id?: string
          id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcement_reads_announcement_id_fkey"
            columns: ["announcement_id"]
            isOneToOne: false
            referencedRelation: "announcements"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          department_id: string | null
          id: string
          is_mandatory: boolean
          organization_id: string
          priority: string
          published_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          department_id?: string | null
          id?: string
          is_mandatory?: boolean
          organization_id: string
          priority?: string
          published_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          department_id?: string | null
          id?: string
          is_mandatory?: boolean
          organization_id?: string
          priority?: string
          published_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_records: {
        Row: {
          clock_in: string
          clock_out: string | null
          created_at: string
          id: string
          ip_address: string | null
          notes: string | null
          organization_id: string
          status: string
          user_id: string
        }
        Insert: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          organization_id: string
          status?: string
          user_id: string
        }
        Update: {
          clock_in?: string
          clock_out?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          notes?: string | null
          organization_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      candidates: {
        Row: {
          cover_letter: string | null
          created_at: string
          created_by: string
          email: string
          full_name: string
          id: string
          job_posting_id: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          rating: number | null
          resume_url: string | null
          stage: string | null
          updated_at: string
        }
        Insert: {
          cover_letter?: string | null
          created_at?: string
          created_by: string
          email: string
          full_name: string
          id?: string
          job_posting_id?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          rating?: number | null
          resume_url?: string | null
          stage?: string | null
          updated_at?: string
        }
        Update: {
          cover_letter?: string | null
          created_at?: string
          created_by?: string
          email?: string
          full_name?: string
          id?: string
          job_posting_id?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          rating?: number | null
          resume_url?: string | null
          stage?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_job_posting_id_fkey"
            columns: ["job_posting_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      channel_members: {
        Row: {
          channel_id: string
          id: string
          joined_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          id?: string
          joined_at?: string
          user_id: string
        }
        Update: {
          channel_id?: string
          id?: string
          joined_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channel_members_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
        ]
      }
      channels: {
        Row: {
          channel_type: Database["public"]["Enums"]["channel_type"]
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["channel_type"]
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "channels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_settings: {
        Row: {
          allowed_ips: string[] | null
          audit_log_enabled: boolean | null
          data_retention_days: number | null
          gdpr_enabled: boolean | null
          id: string
          ip_restriction_enabled: boolean | null
          mfa_required: boolean | null
          ndpr_enabled: boolean | null
          organization_id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          allowed_ips?: string[] | null
          audit_log_enabled?: boolean | null
          data_retention_days?: number | null
          gdpr_enabled?: boolean | null
          id?: string
          ip_restriction_enabled?: boolean | null
          mfa_required?: boolean | null
          ndpr_enabled?: boolean | null
          organization_id: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          allowed_ips?: string[] | null
          audit_log_enabled?: boolean | null
          data_retention_days?: number | null
          gdpr_enabled?: boolean | null
          id?: string
          ip_restriction_enabled?: boolean | null
          mfa_required?: boolean | null
          ndpr_enabled?: boolean | null
          organization_id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_shares: {
        Row: {
          created_at: string
          document_id: string
          expires_at: string | null
          granted_by: string
          id: string
          owner_org_id: string
          partner_org_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_id: string
          expires_at?: string | null
          granted_by: string
          id?: string
          owner_org_id: string
          partner_org_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_id?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          owner_org_id?: string
          partner_org_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_shares_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          created_at: string
          department_id: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          organization_id: string
          project_id: string | null
          status: string | null
          tags: string[] | null
          task_id: string | null
          title: string
          updated_at: string
          uploaded_by: string
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          organization_id: string
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          task_id?: string | null
          title: string
          updated_at?: string
          uploaded_by: string
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          department_id?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          organization_id?: string
          project_id?: string | null
          status?: string | null
          tags?: string[] | null
          task_id?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_reports: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          created_at: string
          currency: string | null
          description: string | null
          id: string
          organization_id: string
          receipt_url: string | null
          status: string | null
          submitted_by: string
          title: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          organization_id: string
          receipt_url?: string | null
          status?: string | null
          submitted_by: string
          title: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          currency?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          receipt_url?: string | null
          status?: string | null
          submitted_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_edges: {
        Row: {
          created_at: string
          edge_type: string
          from_entity_id: string
          id: string
          metadata: Json
          organization_id: string
          to_entity_id: string
          weight: number
        }
        Insert: {
          created_at?: string
          edge_type: string
          from_entity_id: string
          id?: string
          metadata?: Json
          organization_id: string
          to_entity_id: string
          weight?: number
        }
        Update: {
          created_at?: string
          edge_type?: string
          from_entity_id?: string
          id?: string
          metadata?: Json
          organization_id?: string
          to_entity_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "graph_edges_from_entity_id_fkey"
            columns: ["from_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_edges_to_entity_id_fkey"
            columns: ["to_entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_entities: {
        Row: {
          created_at: string
          entity_type: string
          id: string
          label: string | null
          metadata: Json
          organization_id: string
          source_id: string
          source_table: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entity_type: string
          id?: string
          label?: string | null
          metadata?: Json
          organization_id: string
          source_id: string
          source_table: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entity_type?: string
          id?: string
          label?: string | null
          metadata?: Json
          organization_id?: string
          source_id?: string
          source_table?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "graph_entities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      graph_events: {
        Row: {
          actor_id: string | null
          entity_id: string | null
          event_type: string
          id: string
          occurred_at: string
          organization_id: string
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          entity_id?: string | null
          event_type: string
          id?: string
          occurred_at?: string
          organization_id: string
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          entity_id?: string | null
          event_type?: string
          id?: string
          occurred_at?: string
          organization_id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "graph_events_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "graph_entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "graph_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inter_org_audit_log: {
        Row: {
          actor_id: string | null
          event_type: string
          id: string
          metadata: Json
          occurred_at: string
          owner_org_id: string
          partner_org_id: string | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          actor_id?: string | null
          event_type: string
          id?: string
          metadata?: Json
          occurred_at?: string
          owner_org_id: string
          partner_org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          actor_id?: string | null
          event_type?: string
          id?: string
          metadata?: Json
          occurred_at?: string
          owner_org_id?: string
          partner_org_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inter_org_audit_log_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inter_org_audit_log_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      internal_memos: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          organization_id: string
          published_at: string | null
          recipients: string[] | null
          signature_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          published_at?: string | null
          recipients?: string[] | null
          signature_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          published_at?: string | null
          recipients?: string[] | null
          signature_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "internal_memos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "internal_memos_signature_id_fkey"
            columns: ["signature_id"]
            isOneToOne: false
            referencedRelation: "user_signatures"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          department_id: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          job_title: string | null
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          department_id?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          job_title?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          department_id?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          job_title?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          status?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitations_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_plan_targets: {
        Row: {
          created_at: string | null
          current_value: number | null
          due_date: string | null
          id: string
          job_plan_id: string
          notes: string | null
          organization_id: string
          period_type: string
          reminder_at: string | null
          status: string | null
          target_value: number | null
          title: string
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          due_date?: string | null
          id?: string
          job_plan_id: string
          notes?: string | null
          organization_id: string
          period_type: string
          reminder_at?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          due_date?: string | null
          id?: string
          job_plan_id?: string
          notes?: string | null
          organization_id?: string
          period_type?: string
          reminder_at?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "job_plan_targets_job_plan_id_fkey"
            columns: ["job_plan_id"]
            isOneToOne: false
            referencedRelation: "job_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_plan_targets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_plans: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          id: string
          organization_id: string
          start_date: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id: string
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          id?: string
          organization_id?: string
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          created_at: string
          created_by: string
          department_id: string | null
          description: string | null
          employment_type: string | null
          id: string
          location: string | null
          organization_id: string
          requirements: string | null
          salary_range: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          department_id?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          location?: string | null
          organization_id: string
          requirements?: string | null
          salary_range?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          department_id?: string | null
          description?: string | null
          employment_type?: string | null
          id?: string
          location?: string | null
          organization_id?: string
          requirements?: string | null
          salary_range?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_postings_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_postings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kpis: {
        Row: {
          category: string | null
          created_at: string
          current_value: number | null
          department_id: string | null
          description: string | null
          id: string
          organization_id: string
          owner_id: string | null
          period_end: string | null
          period_start: string | null
          status: string | null
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          current_value?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          current_value?: number | null
          department_id?: string | null
          description?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string | null
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "kpis_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kpis_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          end_date: string
          id: string
          leave_type: Database["public"]["Enums"]["leave_type"]
          organization_id: string
          reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["leave_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          organization_id: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["leave_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          leave_type?: Database["public"]["Enums"]["leave_type"]
          organization_id?: string
          reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["leave_status"]
          user_id?: string
        }
        Relationships: []
      }
      meeting_participants: {
        Row: {
          id: string
          joined_at: string
          left_at: string | null
          organization_id: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          left_at?: string | null
          organization_id: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          left_at?: string | null
          organization_id?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          created_at: string
          duration_seconds: number | null
          file_size: number | null
          id: string
          mime_type: string | null
          organization_id: string
          room_id: string | null
          status: string
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          organization_id: string
          room_id?: string | null
          status?: string
          storage_path: string
          uploaded_by: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          organization_id?: string
          room_id?: string | null
          status?: string
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_recordings_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "meeting_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_rooms: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          host_id: string
          id: string
          organization_id: string
          peak_participants: number
          room_name: string
          started_at: string
          status: string
          title: string | null
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          host_id: string
          id?: string
          organization_id: string
          peak_participants?: number
          room_name: string
          started_at?: string
          status?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          host_id?: string
          id?: string
          organization_id?: string
          peak_participants?: number
          room_name?: string
          started_at?: string
          status?: string
          title?: string | null
        }
        Relationships: []
      }
      meeting_summaries: {
        Row: {
          action_items: Json
          created_at: string
          id: string
          key_decisions: Json
          organization_id: string
          recording_id: string
          sentiment: string | null
          summary: string
          translated_summary: Json | null
        }
        Insert: {
          action_items?: Json
          created_at?: string
          id?: string
          key_decisions?: Json
          organization_id: string
          recording_id: string
          sentiment?: string | null
          summary: string
          translated_summary?: Json | null
        }
        Update: {
          action_items?: Json
          created_at?: string
          id?: string
          key_decisions?: Json
          organization_id?: string
          recording_id?: string
          sentiment?: string | null
          summary?: string
          translated_summary?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_transcripts: {
        Row: {
          created_at: string
          full_text: string
          id: string
          language: string | null
          organization_id: string
          recording_id: string
          segments: Json
        }
        Insert: {
          created_at?: string
          full_text: string
          id?: string
          language?: string | null
          organization_id: string
          recording_id: string
          segments?: Json
        }
        Update: {
          created_at?: string
          full_text?: string
          id?: string
          language?: string | null
          organization_id?: string
          recording_id?: string
          segments?: Json
        }
        Relationships: [
          {
            foreignKeyName: "meeting_transcripts_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          channel_id: string
          content: string
          created_at: string
          id: string
          parent_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          channel_id: string
          content: string
          created_at?: string
          id?: string
          parent_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          channel_id?: string
          content?: string
          created_at?: string
          id?: string
          parent_message_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email: boolean
          escalate_to_manager: boolean
          escalation_after_hours: number
          id: string
          in_app: boolean
          slack: boolean
          slack_webhook_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: boolean
          escalate_to_manager?: boolean
          escalation_after_hours?: number
          id?: string
          in_app?: boolean
          slack?: boolean
          slack_webhook_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: boolean
          escalate_to_manager?: boolean
          escalation_after_hours?: number
          id?: string
          in_app?: boolean
          slack?: boolean
          slack_webhook_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          message: string
          organization_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message: string
          organization_id: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          message?: string
          organization_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_conversations: {
        Row: {
          created_at: string
          created_by: string
          id: string
          org_a_id: string
          org_b_id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          org_a_id: string
          org_b_id: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          org_a_id?: string
          org_b_id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_conversations_org_a_id_fkey"
            columns: ["org_a_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_conversations_org_b_id_fkey"
            columns: ["org_b_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_messages: {
        Row: {
          attachment_name: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
          sender_org_id: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
          sender_org_id: string
        }
        Update: {
          attachment_name?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
          sender_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "org_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_messages_sender_org_id_fkey"
            columns: ["sender_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_share_consents: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_by: string
          id: string
          owner_org_id: string
          partner_org_id: string
          resource_id: string
          share_type: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_by: string
          id?: string
          owner_org_id: string
          partner_org_id: string
          resource_id: string
          share_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_by?: string
          id?: string
          owner_org_id?: string
          partner_org_id?: string
          resource_id?: string
          share_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_share_consents_owner_org_id_fkey"
            columns: ["owner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_share_consents_partner_org_id_fkey"
            columns: ["partner_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          brand_tagline: string | null
          core_values: string[] | null
          created_at: string
          favicon_url: string | null
          id: string
          logo_url: string | null
          mission: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_tagline?: string | null
          core_values?: string[] | null
          created_at?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_tagline?: string | null
          core_values?: string[] | null
          created_at?: string
          favicon_url?: string | null
          id?: string
          logo_url?: string | null
          mission?: string | null
          name?: string
          primary_color?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      payroll_records: {
        Row: {
          approved_by: string | null
          base_salary: number | null
          bonuses: number | null
          created_at: string
          currency: string | null
          deductions: number | null
          id: string
          net_pay: number | null
          notes: string | null
          organization_id: string
          period_end: string
          period_start: string
          status: string | null
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          base_salary?: number | null
          bonuses?: number | null
          created_at?: string
          currency?: string | null
          deductions?: number | null
          id?: string
          net_pay?: number | null
          notes?: string | null
          organization_id: string
          period_end: string
          period_start: string
          status?: string | null
          user_id: string
        }
        Update: {
          approved_by?: string | null
          base_salary?: number | null
          bonuses?: number | null
          created_at?: string
          currency?: string | null
          deductions?: number | null
          id?: string
          net_pay?: number | null
          notes?: string | null
          organization_id?: string
          period_end?: string
          period_start?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_reviews: {
        Row: {
          attendance_rate: number | null
          comments: string | null
          communication_score: number | null
          created_at: string
          id: string
          improvements: string | null
          organization_id: string
          overall_rating: number | null
          quality_score: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          status: string | null
          strengths: string | null
          task_completion_rate: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attendance_rate?: number | null
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          id?: string
          improvements?: string | null
          organization_id: string
          overall_rating?: number | null
          quality_score?: number | null
          review_period_end: string
          review_period_start: string
          reviewer_id: string
          status?: string | null
          strengths?: string | null
          task_completion_rate?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attendance_rate?: number | null
          comments?: string | null
          communication_score?: number | null
          created_at?: string
          id?: string
          improvements?: string | null
          organization_id?: string
          overall_rating?: number | null
          quality_score?: number | null
          review_period_end?: string
          review_period_start?: string
          reviewer_id?: string
          status?: string | null
          strengths?: string | null
          task_completion_rate?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          email: string | null
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department_id: string | null
          full_name: string
          id: string
          job_title: string | null
          organization_id: string | null
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          full_name: string
          id: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department_id?: string | null
          full_name?: string
          id?: string
          job_title?: string | null
          organization_id?: string | null
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          department_id: string | null
          description: string | null
          due_date: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          department_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_ledger: {
        Row: {
          chain_hash: string
          content_hash: string
          id: string
          memo_id: string
          organization_id: string
          prev_hash: string | null
          signature_hash: string
          signed_at: string
          signer_id: string
        }
        Insert: {
          chain_hash: string
          content_hash: string
          id?: string
          memo_id: string
          organization_id: string
          prev_hash?: string | null
          signature_hash: string
          signed_at?: string
          signer_id: string
        }
        Update: {
          chain_hash?: string
          content_hash?: string
          id?: string
          memo_id?: string
          organization_id?: string
          prev_hash?: string | null
          signature_hash?: string
          signed_at?: string
          signer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signature_ledger_memo_id_fkey"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "internal_memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signature_ledger_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          description: string
          id: string
          organization_id: string
          priority: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          description: string
          id?: string
          organization_id: string
          priority?: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          organization_id?: string
          priority?: string
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          task_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          task_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          id: string
          organization_id: string
          parent_task_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          id?: string
          organization_id?: string
          parent_task_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_parent_task_id_fkey"
            columns: ["parent_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      terminations: {
        Row: {
          created_at: string
          exit_interview_notes: string | null
          id: string
          last_working_day: string | null
          organization_id: string
          reason: string | null
          status: string | null
          terminated_by: string
          termination_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exit_interview_notes?: string | null
          id?: string
          last_working_day?: string | null
          organization_id: string
          reason?: string | null
          status?: string | null
          terminated_by: string
          termination_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          exit_interview_notes?: string | null
          id?: string
          last_working_day?: string | null
          organization_id?: string
          reason?: string | null
          status?: string | null
          terminated_by?: string
          termination_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "terminations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_admin_reply: boolean
          ticket_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          ticket_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_admin_reply?: boolean
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_replies_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_signatures: {
        Row: {
          created_at: string
          id: string
          signature_data: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature_data: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signature_data?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          current_step: number
          id: string
          organization_id: string
          started_at: string
          started_by: string
          status: string
          trigger_data: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          current_step?: number
          id?: string
          organization_id: string
          started_at?: string
          started_by: string
          status?: string
          trigger_data?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          current_step?: number
          id?: string
          organization_id?: string
          started_at?: string
          started_by?: string
          status?: string
          trigger_data?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_instances_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_logs: {
        Row: {
          action: string
          id: string
          instance_id: string
          notes: string | null
          performed_at: string
          performed_by: string
          step_order: number
        }
        Insert: {
          action: string
          id?: string
          instance_id: string
          notes?: string | null
          performed_at?: string
          performed_by: string
          step_order: number
        }
        Update: {
          action?: string
          id?: string
          instance_id?: string
          notes?: string | null
          performed_at?: string
          performed_by?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_logs_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "workflow_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          action_config: Json | null
          action_type: string
          assignee_id: string | null
          created_at: string
          escalation_id: string | null
          id: string
          step_order: number
          timeout_hours: number | null
          workflow_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type?: string
          assignee_id?: string | null
          created_at?: string
          escalation_id?: string | null
          id?: string
          step_order?: number
          timeout_hours?: number | null
          workflow_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          assignee_id?: string | null
          created_at?: string
          escalation_id?: string | null
          id?: string
          step_order?: number
          timeout_hours?: number | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: { Args: { _token: string }; Returns: Json }
      complete_onboarding: {
        Args: {
          _brand_tagline?: string
          _core_values?: string[]
          _logo_url?: string
          _mission?: string
          _name: string
          _slug: string
        }
        Returns: Json
      }
      end_stale_meeting_rooms: { Args: never; Returns: number }
      escalate_alerts: { Args: never; Returns: Json }
      get_platform_stats: { Args: never; Returns: Json }
      get_platform_tenants: {
        Args: never
        Returns: {
          created_at: string
          id: string
          last_activity: string
          member_count: number
          name: string
          slug: string
          task_count: number
          ticket_count: number
        }[]
      }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      graph_upsert_edge: {
        Args: {
          _from: string
          _metadata?: Json
          _org: string
          _to: string
          _type: string
          _weight?: number
        }
        Returns: undefined
      }
      graph_upsert_entity: {
        Args: {
          _label: string
          _metadata?: Json
          _org: string
          _source_id: string
          _source_table: string
          _type: string
        }
        Returns: string
      }
      graph_workload_by_person: {
        Args: { _org: string }
        Returns: {
          blocked_count: number
          completed_count: number
          full_name: string
          open_count: number
          overdue_count: number
          user_id: string
        }[]
      }
      has_document_share: {
        Args: { _document_id: string; _owner_org: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_share_consent: {
        Args: { _owner_org: string; _resource_id: string; _share_type: string }
        Returns: boolean
      }
      intelligence_isolation_probe: { Args: never; Returns: Json }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      retention_purge: { Args: never; Returns: Json }
      sign_memo: { Args: { _memo_id: string }; Returns: Json }
      verify_memo_signature: { Args: { _memo_id: string }; Returns: Json }
      workflow_instantiate: {
        Args: { _actor: string; _org: string; _payload: Json; _trigger: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role:
        | "owner"
        | "executive"
        | "manager"
        | "staff"
        | "contractor"
        | "auditor"
      channel_type: "public" | "private" | "direct"
      leave_status: "pending" | "approved" | "rejected" | "cancelled"
      leave_type:
        | "annual"
        | "sick"
        | "personal"
        | "maternity"
        | "paternity"
        | "unpaid"
        | "other"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "todo"
        | "in_progress"
        | "review"
        | "approved"
        | "completed"
        | "blocked"
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
      app_role: [
        "owner",
        "executive",
        "manager",
        "staff",
        "contractor",
        "auditor",
      ],
      channel_type: ["public", "private", "direct"],
      leave_status: ["pending", "approved", "rejected", "cancelled"],
      leave_type: [
        "annual",
        "sick",
        "personal",
        "maternity",
        "paternity",
        "unpaid",
        "other",
      ],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "todo",
        "in_progress",
        "review",
        "approved",
        "completed",
        "blocked",
      ],
    },
  },
} as const
