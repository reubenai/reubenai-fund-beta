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
      ai_service_interactions: {
        Row: {
          created_at: string | null
          deal_id: string | null
          execution_metadata: Json | null
          fund_id: string
          id: string
          input_data: Json | null
          interaction_type: string
          memory_context_used: Json | null
          output_data: Json | null
          service_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id?: string | null
          execution_metadata?: Json | null
          fund_id: string
          id?: string
          input_data?: Json | null
          interaction_type: string
          memory_context_used?: Json | null
          output_data?: Json | null
          service_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string | null
          execution_metadata?: Json | null
          fund_id?: string
          id?: string
          input_data?: Json | null
          interaction_type?: string
          memory_context_used?: Json | null
          output_data?: Json | null
          service_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_service_interactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_service_interactions_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_service_performance: {
        Row: {
          accuracy_feedback: number | null
          confidence_score: number | null
          created_at: string | null
          deal_id: string | null
          execution_date: string | null
          fund_id: string
          id: string
          input_context: Json | null
          memory_entry_id: string | null
          outcome_correlation: number | null
          output_result: Json | null
          processing_time_ms: number | null
          service_name: string
          service_version: string | null
          user_rating: number | null
        }
        Insert: {
          accuracy_feedback?: number | null
          confidence_score?: number | null
          created_at?: string | null
          deal_id?: string | null
          execution_date?: string | null
          fund_id: string
          id?: string
          input_context?: Json | null
          memory_entry_id?: string | null
          outcome_correlation?: number | null
          output_result?: Json | null
          processing_time_ms?: number | null
          service_name: string
          service_version?: string | null
          user_rating?: number | null
        }
        Update: {
          accuracy_feedback?: number | null
          confidence_score?: number | null
          created_at?: string | null
          deal_id?: string | null
          execution_date?: string | null
          fund_id?: string
          id?: string
          input_context?: Json | null
          memory_entry_id?: string | null
          outcome_correlation?: number | null
          output_result?: Json | null
          processing_time_ms?: number | null
          service_name?: string
          service_version?: string | null
          user_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_service_performance_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_service_performance_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_service_performance_memory_entry_id_fkey"
            columns: ["memory_entry_id"]
            isOneToOne: false
            referencedRelation: "fund_memory_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_execution_log: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string
          error_message: string | null
          execution_type: string
          fund_id: string
          id: string
          metadata: Json | null
          stage_name: string
          started_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id: string
          error_message?: string | null
          execution_type?: string
          fund_id: string
          id?: string
          metadata?: Json | null
          stage_name: string
          started_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          error_message?: string | null
          execution_type?: string
          fund_id?: string
          id?: string
          metadata?: Json | null
          stage_name?: string
          started_at?: string | null
          status?: string
        }
        Relationships: []
      }
      analysis_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          deal_id: string
          error_message: string | null
          fund_id: string
          id: string
          max_attempts: number
          metadata: Json | null
          priority: string
          scheduled_for: string
          started_at: string | null
          status: string
          trigger_reason: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          deal_id: string
          error_message?: string | null
          fund_id: string
          id?: string
          max_attempts?: number
          metadata?: Json | null
          priority?: string
          scheduled_for?: string
          started_at?: string | null
          status?: string
          trigger_reason: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          error_message?: string | null
          fund_id?: string
          id?: string
          max_attempts?: number
          metadata?: Json | null
          priority?: string
          scheduled_for?: string
          started_at?: string | null
          status?: string
          trigger_reason?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_queue_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
      deal_decisions: {
        Row: {
          ai_recommendation_at_decision: string | null
          ai_score_at_decision: number | null
          confidence_level: number | null
          contradicts_ai: boolean | null
          created_at: string
          deal_id: string
          decision_maker: string
          decision_metadata: Json | null
          decision_rationale: string | null
          decision_type: string
          fund_id: string
          id: string
          impact_on_strategy: Json | null
          learning_context: Json | null
          rejection_category: string | null
          rejection_reason: string | null
          sourcing_feedback: Json | null
          updated_at: string
        }
        Insert: {
          ai_recommendation_at_decision?: string | null
          ai_score_at_decision?: number | null
          confidence_level?: number | null
          contradicts_ai?: boolean | null
          created_at?: string
          deal_id: string
          decision_maker: string
          decision_metadata?: Json | null
          decision_rationale?: string | null
          decision_type: string
          fund_id: string
          id?: string
          impact_on_strategy?: Json | null
          learning_context?: Json | null
          rejection_category?: string | null
          rejection_reason?: string | null
          sourcing_feedback?: Json | null
          updated_at?: string
        }
        Update: {
          ai_recommendation_at_decision?: string | null
          ai_score_at_decision?: number | null
          confidence_level?: number | null
          contradicts_ai?: boolean | null
          created_at?: string
          deal_id?: string
          decision_maker?: string
          decision_metadata?: Json | null
          decision_rationale?: string | null
          decision_type?: string
          fund_id?: string
          id?: string
          impact_on_strategy?: Json | null
          learning_context?: Json | null
          rejection_category?: string | null
          rejection_reason?: string | null
          sourcing_feedback?: Json | null
          updated_at?: string
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
          extracted_text: string | null
          file_path: string
          file_size: number | null
          fund_id: string | null
          id: string
          is_public: boolean | null
          last_analysis_impact: string | null
          metadata: Json | null
          name: string
          organization_id: string | null
          parsed_data: Json | null
          parsing_status: string | null
          storage_path: string | null
          tags: string[] | null
          triggers_reanalysis: boolean | null
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
          extracted_text?: string | null
          file_path: string
          file_size?: number | null
          fund_id?: string | null
          id?: string
          is_public?: boolean | null
          last_analysis_impact?: string | null
          metadata?: Json | null
          name: string
          organization_id?: string | null
          parsed_data?: Json | null
          parsing_status?: string | null
          storage_path?: string | null
          tags?: string[] | null
          triggers_reanalysis?: boolean | null
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
          extracted_text?: string | null
          file_path?: string
          file_size?: number | null
          fund_id?: string | null
          id?: string
          is_public?: boolean | null
          last_analysis_impact?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string | null
          parsed_data?: Json | null
          parsing_status?: string | null
          storage_path?: string | null
          tags?: string[] | null
          triggers_reanalysis?: boolean | null
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
          analysis_queue_status: string | null
          auto_analysis_enabled: boolean | null
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
          last_analysis_trigger: string | null
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
          source_method: string | null
          status: Database["public"]["Enums"]["deal_status"] | null
          updated_at: string
          valuation: number | null
          web_presence_confidence: number | null
          website: string | null
        }
        Insert: {
          analysis_queue_status?: string | null
          auto_analysis_enabled?: boolean | null
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
          last_analysis_trigger?: string | null
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
          source_method?: string | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          updated_at?: string
          valuation?: number | null
          web_presence_confidence?: number | null
          website?: string | null
        }
        Update: {
          analysis_queue_status?: string | null
          auto_analysis_enabled?: boolean | null
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
          last_analysis_trigger?: string | null
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
          source_method?: string | null
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
      decision_contexts: {
        Row: {
          ai_recommendations: Json | null
          created_at: string | null
          deal_id: string | null
          decision_maker: string | null
          decision_outcome: string | null
          decision_rationale: string | null
          decision_type: string
          dissenting_opinions: Json | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          fund_id: string
          id: string
          supporting_evidence: Json | null
          updated_at: string | null
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string | null
          deal_id?: string | null
          decision_maker?: string | null
          decision_outcome?: string | null
          decision_rationale?: string | null
          decision_type: string
          dissenting_opinions?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          fund_id: string
          id?: string
          supporting_evidence?: Json | null
          updated_at?: string | null
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string | null
          deal_id?: string | null
          decision_maker?: string | null
          decision_outcome?: string | null
          decision_rationale?: string | null
          decision_type?: string
          dissenting_opinions?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          fund_id?: string
          id?: string
          supporting_evidence?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_contexts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_contexts_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_learning_patterns: {
        Row: {
          actionable_insights: string | null
          confidence_score: number | null
          created_at: string
          decisions_analyzed: number | null
          fund_id: string
          id: string
          is_active: boolean | null
          last_updated: string
          pattern_data: Json
          pattern_strength: number | null
          pattern_type: string
          recommended_adjustments: Json | null
        }
        Insert: {
          actionable_insights?: string | null
          confidence_score?: number | null
          created_at?: string
          decisions_analyzed?: number | null
          fund_id: string
          id?: string
          is_active?: boolean | null
          last_updated?: string
          pattern_data?: Json
          pattern_strength?: number | null
          pattern_type: string
          recommended_adjustments?: Json | null
        }
        Update: {
          actionable_insights?: string | null
          confidence_score?: number | null
          created_at?: string
          decisions_analyzed?: number | null
          fund_id?: string
          id?: string
          is_active?: boolean | null
          last_updated?: string
          pattern_data?: Json
          pattern_strength?: number | null
          pattern_type?: string
          recommended_adjustments?: Json | null
        }
        Relationships: []
      }
      fund_memory_entries: {
        Row: {
          ai_service_name: string | null
          confidence_score: number | null
          content: string | null
          contextual_tags: string[] | null
          correlation_score: number | null
          created_at: string | null
          created_by: string
          deal_id: string | null
          description: string | null
          expires_at: string | null
          fund_id: string
          ic_meeting_id: string | null
          id: string
          importance_level: string | null
          is_active: boolean | null
          memory_content: Json
          memory_type: string
          retention_period: unknown | null
          title: string
          validation_status: string | null
        }
        Insert: {
          ai_service_name?: string | null
          confidence_score?: number | null
          content?: string | null
          contextual_tags?: string[] | null
          correlation_score?: number | null
          created_at?: string | null
          created_by: string
          deal_id?: string | null
          description?: string | null
          expires_at?: string | null
          fund_id: string
          ic_meeting_id?: string | null
          id?: string
          importance_level?: string | null
          is_active?: boolean | null
          memory_content?: Json
          memory_type: string
          retention_period?: unknown | null
          title: string
          validation_status?: string | null
        }
        Update: {
          ai_service_name?: string | null
          confidence_score?: number | null
          content?: string | null
          contextual_tags?: string[] | null
          correlation_score?: number | null
          created_at?: string | null
          created_by?: string
          deal_id?: string | null
          description?: string | null
          expires_at?: string | null
          fund_id?: string
          ic_meeting_id?: string | null
          id?: string
          importance_level?: string | null
          is_active?: boolean | null
          memory_content?: Json
          memory_type?: string
          retention_period?: unknown | null
          title?: string
          validation_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fund_memory_entries_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_memory_entries_fund_id_fkey"
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
      ic_calendar_invites: {
        Row: {
          attendees: Json | null
          calendar_provider: string | null
          conference_method: string | null
          conference_url: string | null
          created_at: string
          end_time: string
          external_event_id: string | null
          ics_content: string | null
          id: string
          invite_status: string | null
          location: string | null
          meeting_description: string | null
          meeting_title: string
          organizer_email: string
          reminder_sent: boolean | null
          session_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          attendees?: Json | null
          calendar_provider?: string | null
          conference_method?: string | null
          conference_url?: string | null
          created_at?: string
          end_time: string
          external_event_id?: string | null
          ics_content?: string | null
          id?: string
          invite_status?: string | null
          location?: string | null
          meeting_description?: string | null
          meeting_title: string
          organizer_email: string
          reminder_sent?: boolean | null
          session_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          attendees?: Json | null
          calendar_provider?: string | null
          conference_method?: string | null
          conference_url?: string | null
          created_at?: string
          end_time?: string
          external_event_id?: string | null
          ics_content?: string | null
          id?: string
          invite_status?: string | null
          location?: string | null
          meeting_description?: string | null
          meeting_title?: string
          organizer_email?: string
          reminder_sent?: boolean | null
          session_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
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
      ic_memo_versions: {
        Row: {
          content: Json
          created_at: string
          created_by: string
          deal_id: string
          description: string | null
          fund_id: string
          id: string
          updated_at: string
          version: number
        }
        Insert: {
          content?: Json
          created_at?: string
          created_by: string
          deal_id: string
          description?: string | null
          fund_id: string
          id?: string
          updated_at?: string
          version?: number
        }
        Update: {
          content?: Json
          created_at?: string
          created_by?: string
          deal_id?: string
          description?: string | null
          fund_id?: string
          id?: string
          updated_at?: string
          version?: number
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
          content_quality_score: number | null
          content_word_count: number | null
          created_at: string
          created_by: string
          data_richness_score: number | null
          deal_id: string
          executive_summary: string | null
          fund_id: string
          generation_metadata: Json | null
          id: string
          investment_recommendation: string | null
          is_published: boolean | null
          memo_content: Json
          overall_score: number | null
          published_at: string | null
          publishing_notes: string | null
          rag_status: string | null
          review_notes: string | null
          review_priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_for_review_at: string | null
          template_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content_quality_score?: number | null
          content_word_count?: number | null
          created_at?: string
          created_by: string
          data_richness_score?: number | null
          deal_id: string
          executive_summary?: string | null
          fund_id: string
          generation_metadata?: Json | null
          id?: string
          investment_recommendation?: string | null
          is_published?: boolean | null
          memo_content?: Json
          overall_score?: number | null
          published_at?: string | null
          publishing_notes?: string | null
          rag_status?: string | null
          review_notes?: string | null
          review_priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_for_review_at?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content_quality_score?: number | null
          content_word_count?: number | null
          created_at?: string
          created_by?: string
          data_richness_score?: number | null
          deal_id?: string
          executive_summary?: string | null
          fund_id?: string
          generation_metadata?: Json | null
          id?: string
          investment_recommendation?: string | null
          is_published?: boolean | null
          memo_content?: Json
          overall_score?: number | null
          published_at?: string | null
          publishing_notes?: string | null
          rag_status?: string | null
          review_notes?: string | null
          review_priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_for_review_at?: string | null
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
      investment_outcomes: {
        Row: {
          actual_outcome: string | null
          ai_accuracy_assessment: Json | null
          ai_services_used: string[] | null
          correlation_factors: Json | null
          created_by: string
          deal_id: string
          fund_id: string
          id: string
          initial_analysis_score: number | null
          initial_confidence_levels: Json | null
          initial_recommendation: string | null
          lessons_learned: string | null
          outcome_date: string | null
          outcome_metrics: Json | null
          pattern_insights: Json | null
          recorded_at: string | null
        }
        Insert: {
          actual_outcome?: string | null
          ai_accuracy_assessment?: Json | null
          ai_services_used?: string[] | null
          correlation_factors?: Json | null
          created_by: string
          deal_id: string
          fund_id: string
          id?: string
          initial_analysis_score?: number | null
          initial_confidence_levels?: Json | null
          initial_recommendation?: string | null
          lessons_learned?: string | null
          outcome_date?: string | null
          outcome_metrics?: Json | null
          pattern_insights?: Json | null
          recorded_at?: string | null
        }
        Update: {
          actual_outcome?: string | null
          ai_accuracy_assessment?: Json | null
          ai_services_used?: string[] | null
          correlation_factors?: Json | null
          created_by?: string
          deal_id?: string
          fund_id?: string
          id?: string
          initial_analysis_score?: number | null
          initial_confidence_levels?: Json | null
          initial_recommendation?: string | null
          lessons_learned?: string | null
          outcome_date?: string | null
          outcome_metrics?: Json | null
          pattern_insights?: Json | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "investment_outcomes_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investment_outcomes_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_strategies: {
        Row: {
          created_at: string
          enhanced_criteria: Json | null
          exciting_threshold: number | null
          fund_id: string
          fund_type: string
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
          enhanced_criteria?: Json | null
          exciting_threshold?: number | null
          fund_id: string
          fund_type?: string
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
          enhanced_criteria?: Json | null
          exciting_threshold?: number | null
          fund_id?: string
          fund_type?: string
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
            isOneToOne: true
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
      pattern_insights: {
        Row: {
          actionable_insights: string | null
          confidence_level: number | null
          discovered_at: string | null
          fund_id: string
          id: string
          is_active: boolean | null
          pattern_data: Json | null
          pattern_description: string
          pattern_type: string
          recommended_actions: Json | null
          statistical_significance: number | null
          supporting_deals: string[] | null
          validated_at: string | null
        }
        Insert: {
          actionable_insights?: string | null
          confidence_level?: number | null
          discovered_at?: string | null
          fund_id: string
          id?: string
          is_active?: boolean | null
          pattern_data?: Json | null
          pattern_description: string
          pattern_type: string
          recommended_actions?: Json | null
          statistical_significance?: number | null
          supporting_deals?: string[] | null
          validated_at?: string | null
        }
        Update: {
          actionable_insights?: string | null
          confidence_level?: number | null
          discovered_at?: string | null
          fund_id?: string
          id?: string
          is_active?: boolean | null
          pattern_data?: Json | null
          pattern_description?: string
          pattern_type?: string
          recommended_actions?: Json | null
          statistical_significance?: number | null
          supporting_deals?: string[] | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pattern_insights_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
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
      sourced_companies: {
        Row: {
          ai_analysis_score: number | null
          company_name: string
          confidence_score: number | null
          created_at: string
          created_deal_id: string | null
          deal_size: number | null
          description: string | null
          funding_stage: string | null
          id: string
          industry: string | null
          location: string | null
          priority_level: string | null
          raw_data: Json | null
          recommendation: string | null
          removed_by_user: boolean | null
          session_id: string
          source_method: string | null
          strategy_alignment_score: number | null
          updated_at: string
          validation_reasons: Json | null
          validation_score: number | null
          valuation: number | null
          website: string | null
        }
        Insert: {
          ai_analysis_score?: number | null
          company_name: string
          confidence_score?: number | null
          created_at?: string
          created_deal_id?: string | null
          deal_size?: number | null
          description?: string | null
          funding_stage?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          priority_level?: string | null
          raw_data?: Json | null
          recommendation?: string | null
          removed_by_user?: boolean | null
          session_id: string
          source_method?: string | null
          strategy_alignment_score?: number | null
          updated_at?: string
          validation_reasons?: Json | null
          validation_score?: number | null
          valuation?: number | null
          website?: string | null
        }
        Update: {
          ai_analysis_score?: number | null
          company_name?: string
          confidence_score?: number | null
          created_at?: string
          created_deal_id?: string | null
          deal_size?: number | null
          description?: string | null
          funding_stage?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          priority_level?: string | null
          raw_data?: Json | null
          recommendation?: string | null
          removed_by_user?: boolean | null
          session_id?: string
          source_method?: string | null
          strategy_alignment_score?: number | null
          updated_at?: string
          validation_reasons?: Json | null
          validation_score?: number | null
          valuation?: number | null
          website?: string | null
        }
        Relationships: []
      }
      sourcing_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          fund_id: string
          id: string
          search_parameters: Json
          status: string
          thesis_snapshot: Json
          total_processed: number | null
          total_reviewed: number | null
          total_sourced: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          fund_id: string
          id?: string
          search_parameters?: Json
          status?: string
          thesis_snapshot?: Json
          total_processed?: number | null
          total_reviewed?: number | null
          total_sourced?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          fund_id?: string
          id?: string
          search_parameters?: Json
          status?: string
          thesis_snapshot?: Json
          total_processed?: number | null
          total_reviewed?: number | null
          total_sourced?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          admin_response: string | null
          created_at: string
          feedback_type: string
          fund_id: string | null
          id: string
          message: string
          metadata: Json | null
          page_url: string | null
          priority: string
          rating: number | null
          resolved_at: string | null
          status: string
          updated_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          feedback_type: string
          fund_id?: string | null
          id?: string
          message: string
          metadata?: Json | null
          page_url?: string | null
          priority?: string
          rating?: number | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          feedback_type?: string
          fund_id?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          page_url?: string | null
          priority?: string
          rating?: number | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          custom_message: string | null
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          is_active: boolean
          organization_id: string
          role: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          custom_message?: string | null
          email: string
          expires_at?: string
          id?: string
          invitation_token: string
          invited_by: string
          is_active?: boolean
          organization_id: string
          role: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          custom_message?: string | null
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          is_active?: boolean
          organization_id?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_invitations_organization_id_fkey"
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
      analyze_decision_patterns: {
        Args: { fund_id_param: string }
        Returns: Json
      }
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
      complete_analysis_queue_item: {
        Args: {
          queue_id_param: string
          success?: boolean
          error_message_param?: string
        }
        Returns: boolean
      }
      create_default_investment_strategy: {
        Args: {
          fund_id_param: string
          fund_type_param: Database["public"]["Enums"]["fund_type"]
        }
        Returns: string
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
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
      process_analysis_queue: {
        Args: { batch_size?: number; max_concurrent?: number }
        Returns: Json
      }
      queue_deal_analysis: {
        Args: {
          deal_id_param: string
          trigger_reason_param?: string
          priority_param?: string
          delay_minutes?: number
        }
        Returns: string
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
