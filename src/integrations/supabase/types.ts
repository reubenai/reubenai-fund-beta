export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      activity_events: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          change_data: Json | null
          context_data: Json | null
          created_at: string
          deal_id: string | null
          description: string | null
          fund_id: string
          id: string
          is_system_event: boolean
          is_visible: boolean
          occurred_at: string
          priority: Database["public"]["Enums"]["activity_priority"]
          resource_id: string | null
          resource_type: string | null
          retention_date: string | null
          searchable_content: string | null
          session_id: string | null
          source_ip: unknown | null
          tags: string[] | null
          title: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          change_data?: Json | null
          context_data?: Json | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          fund_id: string
          id?: string
          is_system_event?: boolean
          is_visible?: boolean
          occurred_at?: string
          priority?: Database["public"]["Enums"]["activity_priority"]
          resource_id?: string | null
          resource_type?: string | null
          retention_date?: string | null
          searchable_content?: string | null
          session_id?: string | null
          source_ip?: unknown | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          change_data?: Json | null
          context_data?: Json | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          fund_id?: string
          id?: string
          is_system_event?: boolean
          is_visible?: boolean
          occurred_at?: string
          priority?: Database["public"]["Enums"]["activity_priority"]
          resource_id?: string | null
          resource_type?: string | null
          retention_date?: string | null
          searchable_content?: string | null
          session_id?: string | null
          source_ip?: unknown | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      deal_analyses: {
        Row: {
          analysis_version: number | null
          analyzed_at: string | null
          confidence_scores: Json | null
          created_at: string
          data_sources: Json | null
          deal_id: string
          engine_results: Json | null
          financial_notes: string | null
          financial_score: number | null
          id: string
          leadership_notes: string | null
          leadership_score: number | null
          market_notes: string | null
          market_score: number | null
          product_notes: string | null
          product_score: number | null
          thesis_alignment_notes: string | null
          thesis_alignment_score: number | null
          traction_notes: string | null
          traction_score: number | null
          updated_at: string
          validation_flags: Json | null
        }
        Insert: {
          analysis_version?: number | null
          analyzed_at?: string | null
          confidence_scores?: Json | null
          created_at?: string
          data_sources?: Json | null
          deal_id: string
          engine_results?: Json | null
          financial_notes?: string | null
          financial_score?: number | null
          id?: string
          leadership_notes?: string | null
          leadership_score?: number | null
          market_notes?: string | null
          market_score?: number | null
          product_notes?: string | null
          product_score?: number | null
          thesis_alignment_notes?: string | null
          thesis_alignment_score?: number | null
          traction_notes?: string | null
          traction_score?: number | null
          updated_at?: string
          validation_flags?: Json | null
        }
        Update: {
          analysis_version?: number | null
          analyzed_at?: string | null
          confidence_scores?: Json | null
          created_at?: string
          data_sources?: Json | null
          deal_id?: string
          engine_results?: Json | null
          financial_notes?: string | null
          financial_score?: number | null
          id?: string
          leadership_notes?: string | null
          leadership_score?: number | null
          market_notes?: string | null
          market_score?: number | null
          product_notes?: string | null
          product_score?: number | null
          thesis_alignment_notes?: string | null
          thesis_alignment_score?: number | null
          traction_notes?: string | null
          traction_score?: number | null
          updated_at?: string
          validation_flags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_analyses_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_analysis_sources: {
        Row: {
          confidence_score: number | null
          created_at: string
          data_retrieved: Json | null
          deal_id: string
          engine_name: string
          id: string
          retrieved_at: string
          source_type: string
          source_url: string | null
          validated: boolean | null
          validation_notes: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          data_retrieved?: Json | null
          deal_id: string
          engine_name: string
          id?: string
          retrieved_at?: string
          source_type: string
          source_url?: string | null
          validated?: boolean | null
          validation_notes?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          data_retrieved?: Json | null
          deal_id?: string
          engine_name?: string
          id?: string
          retrieved_at?: string
          source_type?: string
          source_url?: string | null
          validated?: boolean | null
          validation_notes?: string | null
        }
        Relationships: []
      }
      deal_documents: {
        Row: {
          bucket_name: string | null
          content_type: string | null
          created_at: string
          deal_id: string
          document_analysis_id: string | null
          document_analysis_status:
            | Database["public"]["Enums"]["document_analysis_status"]
            | null
          document_category:
            | Database["public"]["Enums"]["document_category"]
            | null
          document_type: string | null
          file_path: string
          file_size: number | null
          fund_id: string | null
          id: string
          is_public: boolean | null
          metadata: Json | null
          name: string
          organization_id: string | null
          storage_path: string | null
          tags: string[] | null
          uploaded_by: string
          version: number | null
        }
        Insert: {
          bucket_name?: string | null
          content_type?: string | null
          created_at?: string
          deal_id: string
          document_analysis_id?: string | null
          document_analysis_status?:
            | Database["public"]["Enums"]["document_analysis_status"]
            | null
          document_category?:
            | Database["public"]["Enums"]["document_category"]
            | null
          document_type?: string | null
          file_path: string
          file_size?: number | null
          fund_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          storage_path?: string | null
          tags?: string[] | null
          uploaded_by: string
          version?: number | null
        }
        Update: {
          bucket_name?: string | null
          content_type?: string | null
          created_at?: string
          deal_id?: string
          document_analysis_id?: string | null
          document_analysis_status?:
            | Database["public"]["Enums"]["document_analysis_status"]
            | null
          document_category?:
            | Database["public"]["Enums"]["document_category"]
            | null
          document_type?: string | null
          file_path?: string
          file_size?: number | null
          fund_id?: string | null
          id?: string
          is_public?: boolean | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          storage_path?: string | null
          tags?: string[] | null
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_documents_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string
          deal_id: string
          id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          deal_id: string
          id?: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          deal_id?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_notes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          business_model: string | null
          company_name: string
          company_validation_status: string | null
          created_at: string
          created_by: string
          crunchbase_url: string | null
          currency: string | null
          deal_size: number | null
          description: string | null
          employee_count: number | null
          founder: string | null
          fund_id: string
          id: string
          industry: string | null
          linkedin_url: string | null
          location: string | null
          next_action: string | null
          overall_score: number | null
          primary_source: string | null
          priority: string | null
          rag_confidence: number | null
          rag_reasoning: Json | null
          rag_status: string | null
          score_level: Database["public"]["Enums"]["deal_score_level"] | null
          source_confidence_score: number | null
          status: Database["public"]["Enums"]["deal_status"] | null
          updated_at: string
          valuation: number | null
          web_presence_confidence: number | null
          website: string | null
        }
        Insert: {
          business_model?: string | null
          company_name: string
          company_validation_status?: string | null
          created_at?: string
          created_by: string
          crunchbase_url?: string | null
          currency?: string | null
          deal_size?: number | null
          description?: string | null
          employee_count?: number | null
          founder?: string | null
          fund_id: string
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_action?: string | null
          overall_score?: number | null
          primary_source?: string | null
          priority?: string | null
          rag_confidence?: number | null
          rag_reasoning?: Json | null
          rag_status?: string | null
          score_level?: Database["public"]["Enums"]["deal_score_level"] | null
          source_confidence_score?: number | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string
          valuation?: number | null
          web_presence_confidence?: number | null
          website?: string | null
        }
        Update: {
          business_model?: string | null
          company_name?: string
          company_validation_status?: string | null
          created_at?: string
          created_by?: string
          crunchbase_url?: string | null
          currency?: string | null
          deal_size?: number | null
          description?: string | null
          employee_count?: number | null
          founder?: string | null
          fund_id?: string
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_action?: string | null
          overall_score?: number | null
          primary_source?: string | null
          priority?: string | null
          rag_confidence?: number | null
          rag_reasoning?: Json | null
          rag_status?: string | null
          score_level?: Database["public"]["Enums"]["deal_score_level"] | null
          source_confidence_score?: number | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string
          valuation?: number | null
          web_presence_confidence?: number | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      funds: {
        Row: {
          created_at: string
          created_by: string
          currency: string | null
          description: string | null
          fund_type: Database["public"]["Enums"]["fund_type"]
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          target_size: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          currency?: string | null
          description?: string | null
          fund_type: Database["public"]["Enums"]["fund_type"]
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          target_size?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          currency?: string | null
          description?: string | null
          fund_type?: Database["public"]["Enums"]["fund_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          target_size?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "funds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_committee_members: {
        Row: {
          appointed_date: string
          created_at: string
          fund_id: string
          id: string
          is_active: boolean
          role: string
          updated_at: string
          user_id: string
          voting_weight: number | null
        }
        Insert: {
          appointed_date?: string
          created_at?: string
          fund_id: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id: string
          voting_weight?: number | null
        }
        Update: {
          appointed_date?: string
          created_at?: string
          fund_id?: string
          id?: string
          is_active?: boolean
          role?: string
          updated_at?: string
          user_id?: string
          voting_weight?: number | null
        }
        Relationships: []
      }
      ic_meeting_deals: {
        Row: {
          created_at: string
          deal_id: string
          decision: string | null
          id: string
          meeting_id: string
          memo_content: string | null
          notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_id: string
          decision?: string | null
          id?: string
          meeting_id: string
          memo_content?: string | null
          notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_id?: string
          decision?: string | null
          id?: string
          meeting_id?: string
          memo_content?: string | null
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ic_meeting_deals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_meeting_deals_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "ic_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_meeting_minutes: {
        Row: {
          action_items: Json | null
          attendees: Json
          content: Json
          created_at: string
          id: string
          key_decisions: Json | null
          recorded_by: string
          session_id: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          attendees?: Json
          content?: Json
          created_at?: string
          id?: string
          key_decisions?: Json | null
          recorded_by: string
          session_id: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          attendees?: Json
          content?: Json
          created_at?: string
          id?: string
          key_decisions?: Json | null
          recorded_by?: string
          session_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      ic_meetings: {
        Row: {
          agenda: string | null
          created_at: string
          created_by: string
          fund_id: string
          id: string
          scheduled_date: string
          title: string
          updated_at: string
        }
        Insert: {
          agenda?: string | null
          created_at?: string
          created_by: string
          fund_id: string
          id?: string
          scheduled_date: string
          title: string
          updated_at?: string
        }
        Update: {
          agenda?: string | null
          created_at?: string
          created_by?: string
          fund_id?: string
          id?: string
          scheduled_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ic_meetings_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_memo_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          fund_id: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          sections: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          fund_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          sections?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          fund_id?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          sections?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ic_memo_votes: {
        Row: {
          confidence_level: number | null
          created_at: string
          decision_id: string
          id: string
          reasoning: string | null
          updated_at: string
          vote: string
          voter_id: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          decision_id: string
          id?: string
          reasoning?: string | null
          updated_at?: string
          vote: string
          voter_id: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          decision_id?: string
          id?: string
          reasoning?: string | null
          updated_at?: string
          vote?: string
          voter_id?: string
        }
        Relationships: []
      }
      ic_memos: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string
          deal_id: string
          executive_summary: string | null
          fund_id: string
          id: string
          investment_recommendation: string | null
          memo_content: Json
          overall_score: number | null
          rag_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by: string
          deal_id: string
          executive_summary?: string | null
          fund_id: string
          id?: string
          investment_recommendation?: string | null
          memo_content?: Json
          overall_score?: number | null
          rag_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string
          deal_id?: string
          executive_summary?: string | null
          fund_id?: string
          id?: string
          investment_recommendation?: string | null
          memo_content?: Json
          overall_score?: number | null
          rag_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          template_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ic_session_deals: {
        Row: {
          created_at: string
          deal_id: string
          id: string
          memo_id: string | null
          presentation_order: number | null
          session_id: string
          status: string | null
          time_allocated: number | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          id?: string
          memo_id?: string | null
          presentation_order?: number | null
          session_id: string
          status?: string | null
          time_allocated?: number | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          id?: string
          memo_id?: string | null
          presentation_order?: number | null
          session_id?: string
          status?: string | null
          time_allocated?: number | null
        }
        Relationships: []
      }
      ic_sessions: {
        Row: {
          agenda: Json | null
          created_at: string
          created_by: string
          fund_id: string
          id: string
          name: string
          notes: string | null
          participants: Json
          session_date: string
          status: string
          updated_at: string
        }
        Insert: {
          agenda?: Json | null
          created_at?: string
          created_by: string
          fund_id: string
          id?: string
          name: string
          notes?: string | null
          participants?: Json
          session_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          agenda?: Json | null
          created_at?: string
          created_by?: string
          fund_id?: string
          id?: string
          name?: string
          notes?: string | null
          participants?: Json
          session_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ic_voting_decisions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          decision_rationale: string | null
          description: string | null
          final_decision: string | null
          id: string
          memo_id: string
          session_id: string | null
          status: string
          title: string
          updated_at: string
          vote_summary: Json | null
          voting_deadline: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          decision_rationale?: string | null
          description?: string | null
          final_decision?: string | null
          id?: string
          memo_id: string
          session_id?: string | null
          status?: string
          title: string
          updated_at?: string
          vote_summary?: Json | null
          voting_deadline: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          decision_rationale?: string | null
          description?: string | null
          final_decision?: string | null
          id?: string
          memo_id?: string
          session_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          vote_summary?: Json | null
          voting_deadline?: string
        }
        Relationships: []
      }
      investment_strategies: {
        Row: {
          created_at: string
          exciting_threshold: number | null
          fund_id: string
          geography: string[] | null
          id: string
          industries: string[] | null
          key_signals: string[] | null
          max_investment_amount: number | null
          min_investment_amount: number | null
          needs_development_threshold: number | null
          promising_threshold: number | null
          strategy_notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          exciting_threshold?: number | null
          fund_id: string
          geography?: string[] | null
          id?: string
          industries?: string[] | null
          key_signals?: string[] | null
          max_investment_amount?: number | null
          min_investment_amount?: number | null
          needs_development_threshold?: number | null
          promising_threshold?: number | null
          strategy_notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          exciting_threshold?: number | null
          fund_id?: string
          geography?: string[] | null
          id?: string
          industries?: string[] | null
          key_signals?: string[] | null
          max_investment_amount?: number | null
          min_investment_amount?: number | null
          needs_development_threshold?: number | null
          promising_threshold?: number | null
          strategy_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_strategies_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          color: string
          created_at: string
          description: string | null
          fund_id: string
          id: string
          is_default: boolean
          name: string
          position: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          fund_id: string
          id?: string
          is_default?: boolean
          name: string
          position: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          fund_id?: string
          id?: string
          is_default?: boolean
          name?: string
          position?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          dashboard_layout: Json | null
          default_fund_id: string | null
          id: string
          notification_settings: Json | null
          theme_preference: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dashboard_layout?: Json | null
          default_fund_id?: string | null
          id?: string
          notification_settings?: Json | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dashboard_layout?: Json | null
          default_fund_id?: string | null
          id?: string
          notification_settings?: Json | null
          theme_preference?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_default_fund_id_fkey"
            columns: ["default_fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_create_funds: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_create_ic_meetings: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_edit_fund_data: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_funds: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      can_manage_users: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_role_simple: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_document_management_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_admin_by_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_reuben_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_user_role: {
        Args: {
          user_email: string
          new_role: Database["public"]["Enums"]["user_role"]
          org_id?: string
        }
        Returns: boolean
      }
    }
    Enums: {
      activity_priority: "low" | "medium" | "high" | "critical"
      activity_type:
        | "deal_created"
        | "deal_updated"
        | "deal_stage_changed"
        | "deal_deleted"
        | "deal_note_added"
        | "deal_analysis_started"
        | "deal_analysis_completed"
        | "document_uploaded"
        | "pitch_deck_uploaded"
        | "fund_created"
        | "fund_updated"
        | "criteria_updated"
        | "team_member_invited"
        | "team_member_joined"
        | "meeting_scheduled"
        | "investment_decision"
        | "system_event"
      deal_score_level:
        | "exciting"
        | "promising"
        | "needs_development"
        | "not_aligned"
      deal_status:
        | "sourced"
        | "screening"
        | "due_diligence"
        | "investment_committee"
        | "approved"
        | "rejected"
        | "invested"
      document_analysis_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "skipped"
      document_category:
        | "pitch_deck"
        | "financial_statement"
        | "legal_document"
        | "business_plan"
        | "technical_documentation"
        | "market_research"
        | "due_diligence"
        | "other"
      fund_type: "venture_capital" | "private_equity"
      user_role: "admin" | "fund_manager" | "analyst" | "viewer" | "super_admin"
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
      activity_priority: ["low", "medium", "high", "critical"],
      activity_type: [
        "deal_created",
        "deal_updated",
        "deal_stage_changed",
        "deal_deleted",
        "deal_note_added",
        "deal_analysis_started",
        "deal_analysis_completed",
        "document_uploaded",
        "pitch_deck_uploaded",
        "fund_created",
        "fund_updated",
        "criteria_updated",
        "team_member_invited",
        "team_member_joined",
        "meeting_scheduled",
        "investment_decision",
        "system_event",
      ],
      deal_score_level: [
        "exciting",
        "promising",
        "needs_development",
        "not_aligned",
      ],
      deal_status: [
        "sourced",
        "screening",
        "due_diligence",
        "investment_committee",
        "approved",
        "rejected",
        "invested",
      ],
      document_analysis_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "skipped",
      ],
      document_category: [
        "pitch_deck",
        "financial_statement",
        "legal_document",
        "business_plan",
        "technical_documentation",
        "market_research",
        "due_diligence",
        "other",
      ],
      fund_type: ["venture_capital", "private_equity"],
      user_role: ["admin", "fund_manager", "analyst", "viewer", "super_admin"],
    },
  },
} as const
