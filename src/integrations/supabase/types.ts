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
          expires_at: string | null
          generated_at: string
          id: string
          insight_type: string
          is_read: boolean
          metadata: Json | null
          organization_id: string
          severity: string
          title: string
        }
        Insert: {
          content: string
          created_by?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean
          metadata?: Json | null
          organization_id: string
          severity?: string
          title: string
        }
        Update: {
          content?: string
          created_by?: string | null
          expires_at?: string | null
          generated_at?: string
          id?: string
          insight_type?: string
          is_read?: boolean
          metadata?: Json | null
          organization_id?: string
          severity?: string
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
      messages: {
        Row: {
          channel_id: string
          content: string
          created_at: string
          id: string
          parent_message_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          channel_id: string
          content: string
          created_at?: string
          id?: string
          parent_message_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
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
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          primary_color: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          primary_color?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
