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
      activity_archival_config: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          priority: string
          retention_days: number
          updated_at: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority: string
          retention_days?: number
          updated_at?: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          retention_days?: number
          updated_at?: string
        }
        Relationships: []
      }
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
        Relationships: [
          {
            foreignKeyName: "fk_activity_events_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_activity_events_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      ai_human_decision_divergence: {
        Row: {
          ai_confidence_score: number | null
          ai_recommendation: string
          created_at: string
          deal_id: string
          decision_context_id: string | null
          divergence_type: string
          fund_id: string
          human_decision: string
          human_reasoning: string | null
          id: string
          learning_insights: Json | null
          outcome_validation: string | null
          validated_at: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_recommendation: string
          created_at?: string
          deal_id: string
          decision_context_id?: string | null
          divergence_type: string
          fund_id: string
          human_decision: string
          human_reasoning?: string | null
          id?: string
          learning_insights?: Json | null
          outcome_validation?: string | null
          validated_at?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          ai_recommendation?: string
          created_at?: string
          deal_id?: string
          decision_context_id?: string | null
          divergence_type?: string
          fund_id?: string
          human_decision?: string
          human_reasoning?: string | null
          id?: string
          learning_insights?: Json | null
          outcome_validation?: string | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_human_decision_divergence_decision_context_id_fkey"
            columns: ["decision_context_id"]
            isOneToOne: false
            referencedRelation: "ic_decision_contexts"
            referencedColumns: ["id"]
          },
        ]
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
      analysis_cost_tracking: {
        Row: {
          cost_per_deal: number | null
          cost_per_minute: number | null
          created_at: string | null
          deal_id: string
          degradation_reason: string | null
          degradation_triggered: boolean | null
          execution_id: string
          fund_id: string
          id: string
          model_costs: Json | null
          total_cost: number | null
          updated_at: string | null
        }
        Insert: {
          cost_per_deal?: number | null
          cost_per_minute?: number | null
          created_at?: string | null
          deal_id: string
          degradation_reason?: string | null
          degradation_triggered?: boolean | null
          execution_id: string
          fund_id: string
          id?: string
          model_costs?: Json | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          cost_per_deal?: number | null
          cost_per_minute?: number | null
          created_at?: string | null
          deal_id?: string
          degradation_reason?: string | null
          degradation_triggered?: boolean | null
          execution_id?: string
          fund_id?: string
          id?: string
          model_costs?: Json | null
          total_cost?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_cost_tracking_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_cost_tracking_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
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
          max_concurrent_override: number | null
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
          max_concurrent_override?: number | null
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
          max_concurrent_override?: number | null
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
      archived_activity_events: {
        Row: {
          activity_type: string
          archived_at: string
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
          original_id: string
          priority: string
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
          activity_type: string
          archived_at?: string
          change_data?: Json | null
          context_data?: Json | null
          created_at: string
          deal_id?: string | null
          description?: string | null
          fund_id: string
          id?: string
          is_system_event?: boolean
          is_visible?: boolean
          occurred_at: string
          original_id: string
          priority?: string
          resource_id?: string | null
          resource_type?: string | null
          retention_date?: string | null
          searchable_content?: string | null
          session_id?: string | null
          source_ip?: unknown | null
          tags?: string[] | null
          title: string
          updated_at: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          archived_at?: string
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
          original_id?: string
          priority?: string
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
      data_lineage_log: {
        Row: {
          approved: boolean
          contains_pii: boolean | null
          created_at: string | null
          data_classification: string
          data_size: number | null
          deal_id: string | null
          fund_id: string | null
          id: string
          metadata: Json | null
          source_service: string
          target_service: string
          transfer_reason: string
        }
        Insert: {
          approved?: boolean
          contains_pii?: boolean | null
          created_at?: string | null
          data_classification: string
          data_size?: number | null
          deal_id?: string | null
          fund_id?: string | null
          id?: string
          metadata?: Json | null
          source_service: string
          target_service: string
          transfer_reason: string
        }
        Update: {
          approved?: boolean
          contains_pii?: boolean | null
          created_at?: string | null
          data_classification?: string
          data_size?: number | null
          deal_id?: string | null
          fund_id?: string | null
          id?: string
          metadata?: Json | null
          source_service?: string
          target_service?: string
          transfer_reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_lineage_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_lineage_log_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_analyses: {
        Row: {
          analysis_version: number | null
          analyzed_at: string | null
          confidence_scores: Json | null
          cost_tracking: Json | null
          created_at: string
          data_sources: Json | null
          deal_id: string
          degradation_events: Json | null
          engine_results: Json | null
          financial_notes: string | null
          financial_score: number | null
          id: string
          leadership_notes: string | null
          leadership_score: number | null
          mandate_snapshot: Json | null
          market_notes: string | null
          market_score: number | null
          model_executions: Json | null
          organization_id: string | null
          overall_score: number | null
          product_notes: string | null
          product_score: number | null
          prompt_audit: Json | null
          recency_compliance: Json | null
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
          cost_tracking?: Json | null
          created_at?: string
          data_sources?: Json | null
          deal_id: string
          degradation_events?: Json | null
          engine_results?: Json | null
          financial_notes?: string | null
          financial_score?: number | null
          id?: string
          leadership_notes?: string | null
          leadership_score?: number | null
          mandate_snapshot?: Json | null
          market_notes?: string | null
          market_score?: number | null
          model_executions?: Json | null
          organization_id?: string | null
          overall_score?: number | null
          product_notes?: string | null
          product_score?: number | null
          prompt_audit?: Json | null
          recency_compliance?: Json | null
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
          cost_tracking?: Json | null
          created_at?: string
          data_sources?: Json | null
          deal_id?: string
          degradation_events?: Json | null
          engine_results?: Json | null
          financial_notes?: string | null
          financial_score?: number | null
          id?: string
          leadership_notes?: string | null
          leadership_score?: number | null
          mandate_snapshot?: Json | null
          market_notes?: string | null
          market_score?: number | null
          model_executions?: Json | null
          organization_id?: string | null
          overall_score?: number | null
          product_notes?: string | null
          product_score?: number | null
          prompt_audit?: Json | null
          recency_compliance?: Json | null
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
          category: string | null
          content: string
          created_at: string
          created_by: string
          deal_id: string
          id: string
          sentiment: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          created_by: string
          deal_id: string
          id?: string
          sentiment?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string
          deal_id?: string
          id?: string
          sentiment?: string | null
          tags?: string[] | null
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
          enhanced_analysis: Json | null
          founder: string | null
          fund_id: string
          id: string
          industry: string | null
          last_analysis_trigger: string | null
          linkedin_url: string | null
          location: string | null
          next_action: string | null
          organization_id: string | null
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
          enhanced_analysis?: Json | null
          founder?: string | null
          fund_id: string
          id?: string
          industry?: string | null
          last_analysis_trigger?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_action?: string | null
          organization_id?: string | null
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
          enhanced_analysis?: Json | null
          founder?: string | null
          fund_id?: string
          id?: string
          industry?: string | null
          last_analysis_trigger?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_action?: string | null
          organization_id?: string | null
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
          {
            foreignKeyName: "fk_deals_fund_id"
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
      decision_supporting_evidence: {
        Row: {
          confidence_score: number | null
          created_at: string
          decision_context_id: string
          evidence_content: Json | null
          evidence_type: string
          id: string
          relevance_weight: number | null
          source_reference: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          decision_context_id: string
          evidence_content?: Json | null
          evidence_type: string
          id?: string
          relevance_weight?: number | null
          source_reference?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          decision_context_id?: string
          evidence_content?: Json | null
          evidence_type?: string
          id?: string
          relevance_weight?: number | null
          source_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "decision_supporting_evidence_decision_context_id_fkey"
            columns: ["decision_context_id"]
            isOneToOne: false
            referencedRelation: "ic_decision_contexts"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_appendix: {
        Row: {
          appendix_data: Json
          created_at: string | null
          deal_id: string
          id: string
        }
        Insert: {
          appendix_data: Json
          created_at?: string | null
          deal_id: string
          id?: string
        }
        Update: {
          appendix_data?: Json
          created_at?: string | null
          deal_id?: string
          id?: string
        }
        Relationships: []
      }
      fund_decision_patterns: {
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
          pattern_description: string | null
          pattern_name: string
          pattern_strength: number | null
          pattern_type: string
          recommended_adjustments: Json | null
          validation_status: string | null
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
          pattern_description?: string | null
          pattern_name: string
          pattern_strength?: number | null
          pattern_type: string
          recommended_adjustments?: Json | null
          validation_status?: string | null
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
          pattern_description?: string | null
          pattern_name?: string
          pattern_strength?: number | null
          pattern_type?: string
          recommended_adjustments?: Json | null
          validation_status?: string | null
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
          last_triggered_at: string | null
          memory_content: Json
          memory_effectiveness_score: number | null
          memory_type: string
          retention_period: unknown | null
          similarity_scores: Json | null
          title: string
          trigger_contexts: Json | null
          trigger_count: number | null
          validation_status: string | null
        }
        Insert: {
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
          fund_id: string
          ic_meeting_id?: string | null
          id?: string
          importance_level?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          memory_content?: Json
          memory_effectiveness_score?: number | null
          memory_type: string
          retention_period?: unknown | null
          similarity_scores?: Json | null
          title: string
          trigger_contexts?: Json | null
          trigger_count?: number | null
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
          last_triggered_at?: string | null
          memory_content?: Json
          memory_effectiveness_score?: number | null
          memory_type?: string
          retention_period?: unknown | null
          similarity_scores?: Json | null
          title?: string
          trigger_contexts?: Json | null
          trigger_count?: number | null
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
      fund_memory_insights: {
        Row: {
          confidence_score: number | null
          created_at: string
          deal_id: string | null
          fund_id: string
          id: string
          insight_data: Json
          insight_type: string
          source_engines: string[] | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          deal_id?: string | null
          fund_id: string
          id?: string
          insight_data?: Json
          insight_type: string
          source_engines?: string[] | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          deal_id?: string | null
          fund_id?: string
          id?: string
          insight_data?: Json
          insight_type?: string
          source_engines?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fund_memory_insights_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fund_memory_insights_fund_id_fkey"
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_calendar_invites_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ic_sessions"
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_committee_members_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_decision_contexts: {
        Row: {
          ai_recommendations: Json | null
          created_at: string
          deal_id: string | null
          decision_maker: string
          decision_outcome: string | null
          decision_rationale: string | null
          decision_type: string
          dissenting_opinions: Json | null
          follow_up_date: string | null
          follow_up_required: boolean | null
          fund_id: string
          ic_session_id: string | null
          id: string
          market_context: Json | null
          memo_id: string | null
          supporting_evidence: Json | null
          updated_at: string
        }
        Insert: {
          ai_recommendations?: Json | null
          created_at?: string
          deal_id?: string | null
          decision_maker: string
          decision_outcome?: string | null
          decision_rationale?: string | null
          decision_type: string
          dissenting_opinions?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          fund_id: string
          ic_session_id?: string | null
          id?: string
          market_context?: Json | null
          memo_id?: string | null
          supporting_evidence?: Json | null
          updated_at?: string
        }
        Update: {
          ai_recommendations?: Json | null
          created_at?: string
          deal_id?: string | null
          decision_maker?: string
          decision_outcome?: string | null
          decision_rationale?: string | null
          decision_type?: string
          dissenting_opinions?: Json | null
          follow_up_date?: string | null
          follow_up_required?: boolean | null
          fund_id?: string
          ic_session_id?: string | null
          id?: string
          market_context?: Json | null
          memo_id?: string | null
          supporting_evidence?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ic_decision_contexts_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_decision_contexts_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_decision_contexts_memo_id"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "ic_memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_decision_contexts_session_id"
            columns: ["ic_session_id"]
            isOneToOne: false
            referencedRelation: "ic_sessions"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_ic_meeting_deals_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_meeting_deals_meeting_id"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "ic_meetings"
            referencedColumns: ["id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_meeting_minutes_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ic_sessions"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "fk_ic_meetings_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_memo_versions_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_memo_versions_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_memos_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_memos_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_packet_exports: {
        Row: {
          created_at: string | null
          deal_id: string
          expires_at: string | null
          export_metadata: Json | null
          exported_by: string
          file_path: string | null
          fund_id: string
          id: string
          packet_data: Json
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          expires_at?: string | null
          export_metadata?: Json | null
          exported_by: string
          file_path?: string | null
          fund_id: string
          id?: string
          packet_data: Json
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          expires_at?: string | null
          export_metadata?: Json | null
          exported_by?: string
          file_path?: string | null
          fund_id?: string
          id?: string
          packet_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ic_packet_exports_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_packet_exports_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_session_deals_deal_id"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ic_session_deals_session_id"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ic_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_session_deals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ic_sessions"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_sessions_fund_id"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "fk_ic_voting_decisions_memo_id"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "ic_memos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ic_voting_decisions_memo_id_fkey"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "ic_memos"
            referencedColumns: ["id"]
          },
        ]
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
          recency_thresholds: Json | null
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
          recency_thresholds?: Json | null
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
          recency_thresholds?: Json | null
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
      llm_cache: {
        Row: {
          cache_key: string
          created_at: string | null
          id: string
          response_data: Json
        }
        Insert: {
          cache_key: string
          created_at?: string | null
          id?: string
          response_data: Json
        }
        Update: {
          cache_key?: string
          created_at?: string | null
          id?: string
          response_data?: Json
        }
        Relationships: []
      }
      market_signal_responses: {
        Row: {
          created_at: string
          deals_affected: Json | null
          fund_id: string
          fund_response: Json | null
          id: string
          response_effectiveness: number | null
          signal_data: Json | null
          signal_date: string
          signal_description: string | null
          signal_type: string
          strategic_adjustments: Json | null
        }
        Insert: {
          created_at?: string
          deals_affected?: Json | null
          fund_id: string
          fund_response?: Json | null
          id?: string
          response_effectiveness?: number | null
          signal_data?: Json | null
          signal_date: string
          signal_description?: string | null
          signal_type: string
          strategic_adjustments?: Json | null
        }
        Update: {
          created_at?: string
          deals_affected?: Json | null
          fund_id?: string
          fund_response?: Json | null
          id?: string
          response_effectiveness?: number | null
          signal_data?: Json | null
          signal_date?: string
          signal_description?: string | null
          signal_type?: string
          strategic_adjustments?: Json | null
        }
        Relationships: []
      }
      memory_prompt_triggers: {
        Row: {
          created_at: string
          effectiveness_score: number | null
          fund_id: string
          id: string
          is_active: boolean | null
          last_triggered: string | null
          memory_entry_ids: string[] | null
          prompt_template: string | null
          trigger_conditions: Json
          trigger_priority: number | null
          trigger_type: string
        }
        Insert: {
          created_at?: string
          effectiveness_score?: number | null
          fund_id: string
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          memory_entry_ids?: string[] | null
          prompt_template?: string | null
          trigger_conditions?: Json
          trigger_priority?: number | null
          trigger_type: string
        }
        Update: {
          created_at?: string
          effectiveness_score?: number | null
          fund_id?: string
          id?: string
          is_active?: boolean | null
          last_triggered?: string | null
          memory_entry_ids?: string[] | null
          prompt_template?: string | null
          trigger_conditions?: Json
          trigger_priority?: number | null
          trigger_type?: string
        }
        Relationships: []
      }
      ops_control_switches: {
        Row: {
          agent_name: string
          circuit_breaker_open: boolean | null
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          failure_count: number | null
          id: string
          last_failure_at: string | null
          updated_at: string | null
        }
        Insert: {
          agent_name: string
          circuit_breaker_open?: boolean | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_name?: string
          circuit_breaker_open?: boolean | null
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          failure_count?: number | null
          id?: string
          last_failure_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ops_dashboard_events: {
        Row: {
          bucket: string | null
          event_type: string
          id: string
          metadata: Json | null
          model_id: string | null
          provider: string | null
          timestamp: string | null
        }
        Insert: {
          bucket?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          model_id?: string | null
          provider?: string | null
          timestamp?: string | null
        }
        Update: {
          bucket?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          model_id?: string | null
          provider?: string | null
          timestamp?: string | null
        }
        Relationships: []
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
      outcome_correlation_tracking: {
        Row: {
          actual_outcome: Json | null
          correlation_score: number | null
          created_at: string
          deal_id: string
          decision_context_id: string | null
          fund_id: string
          id: string
          learning_extracted: Json | null
          outcome_delta: Json | null
          predicted_outcome: Json | null
          updated_at: string
          validation_date: string | null
        }
        Insert: {
          actual_outcome?: Json | null
          correlation_score?: number | null
          created_at?: string
          deal_id: string
          decision_context_id?: string | null
          fund_id: string
          id?: string
          learning_extracted?: Json | null
          outcome_delta?: Json | null
          predicted_outcome?: Json | null
          updated_at?: string
          validation_date?: string | null
        }
        Update: {
          actual_outcome?: Json | null
          correlation_score?: number | null
          created_at?: string
          deal_id?: string
          decision_context_id?: string | null
          fund_id?: string
          id?: string
          learning_extracted?: Json | null
          outcome_delta?: Json | null
          predicted_outcome?: Json | null
          updated_at?: string
          validation_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outcome_correlation_tracking_decision_context_id_fkey"
            columns: ["decision_context_id"]
            isOneToOne: false
            referencedRelation: "ic_decision_contexts"
            referencedColumns: ["id"]
          },
        ]
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
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          is_deleted: boolean | null
          last_name: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
          last_name?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          is_deleted?: boolean | null
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
      queue_health_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      rate_limit_buckets: {
        Row: {
          bucket_id: string
          created_at: string | null
          id: string
          last_reset: string | null
          requests_count: number | null
        }
        Insert: {
          bucket_id: string
          created_at?: string | null
          id?: string
          last_reset?: string | null
          requests_count?: number | null
        }
        Update: {
          bucket_id?: string
          created_at?: string | null
          id?: string
          last_reset?: string | null
          requests_count?: number | null
        }
        Relationships: []
      }
      roles_catalog: {
        Row: {
          role: string
        }
        Insert: {
          role: string
        }
        Update: {
          role?: string
        }
        Relationships: []
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          created_at: string
          email: string
          feedback_type: string
          first_response_at: string | null
          fund_id: string | null
          fund_name: string | null
          id: string
          internal_notes: string | null
          message: string
          priority: string
          rating: number | null
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          email: string
          feedback_type: string
          first_response_at?: string | null
          fund_id?: string | null
          fund_name?: string | null
          id?: string
          internal_notes?: string | null
          message: string
          priority?: string
          rating?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string
          email?: string
          feedback_type?: string
          first_response_at?: string | null
          fund_id?: string | null
          fund_name?: string | null
          id?: string
          internal_notes?: string | null
          message?: string
          priority?: string
          rating?: number | null
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
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
      user_fund_access: {
        Row: {
          access_level: string
          created_at: string
          fund_id: string
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          fund_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          fund_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_fund_access_fund_id_fkey"
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
      dashboard_stats: {
        Row: {
          deals_pipeline: number | null
          funds_active: number | null
          orgs_active: number | null
          users_total: number | null
        }
        Relationships: []
      }
      rls_gaps: {
        Row: {
          schema_name: unknown | null
          table_name: unknown | null
        }
        Relationships: []
      }
      rls_smells: {
        Row: {
          policy_name: unknown | null
          schema_name: unknown | null
          table_name: unknown | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_get_all_funds: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          organization_id: string
          fund_type: Database["public"]["Enums"]["fund_type"]
          target_size: number
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
        }[]
      }
      admin_get_all_funds_with_orgs: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          organization_id: string
          fund_type: Database["public"]["Enums"]["fund_type"]
          description: string
          target_size: number
          currency: string
          is_active: boolean
          created_at: string
          updated_at: string
          organization_name: string
        }[]
      }
      admin_get_all_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          domain: string
          created_at: string
          updated_at: string
        }[]
      }
      admin_get_all_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          user_id: string
          email: string
          first_name: string
          last_name: string
          role: Database["public"]["Enums"]["user_role"]
          organization_id: string
          is_deleted: boolean
          created_at: string
          updated_at: string
        }[]
      }
      admin_list_all_orgs: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          domain: string | null
          id: string
          name: string
          updated_at: string
        }[]
      }
      admin_set_user_role: {
        Args: {
          p_user_email: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_org_id?: string
        }
        Returns: boolean
      }
      admin_update_profile_role: {
        Args: {
          p_profile_id: string
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: undefined
      }
      admin_update_user_role: {
        Args: {
          p_user_id: string
          p_role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      analyze_decision_patterns: {
        Args: { fund_id_param: string }
        Returns: Json
      }
      archive_old_activities: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      audit_tenant_isolation: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          total_rows: number
          null_org_id_count: number
          invalid_org_id_count: number
          valid_org_id_count: number
          organization_list: string[]
          issues_found: boolean
          severity: string
        }[]
      }
      auth_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      auth_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_uid: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      auth_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      calculate_overall_score: {
        Args: {
          thesis_score?: number
          leadership_score?: number
          market_score?: number
          product_score?: number
          financial_score?: number
          traction_score?: number
        }
        Returns: number
      }
      check_cost_limits: {
        Args: {
          agent_name_param: string
          current_cost_per_deal: number
          current_cost_per_minute: number
        }
        Returns: Json
      }
      cleanup_llm_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
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
      create_default_pipeline_stages: {
        Args: { fund_id_param: string }
        Returns: undefined
      }
      create_organization_with_admin: {
        Args: {
          org_name: string
          org_domain: string
          admin_email: string
          admin_role?: Database["public"]["Enums"]["user_role"]
        }
        Returns: {
          organization_id: string
          user_id: string
          success: boolean
          message: string
        }[]
      }
      emergency_disable_rls: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_ic_packet: {
        Args: { deal_id_param: string }
        Returns: Json
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_archival_statistics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_cross_org_analytics: {
        Args: Record<PropertyKey, never>
        Returns: {
          organization_id: string
          organization_name: string
          fund_count: number
          total_deals: number
          active_deals: number
          completed_analyses: number
          failed_analyses: number
          queue_success_rate: number
          last_activity: string
          health_status: string
        }[]
      }
      get_deals_analysis_readiness: {
        Args: { fund_id_param: string }
        Returns: {
          deal_id: string
          company_name: string
          validation_score: number
          is_ready: boolean
          issue_count: number
          warning_count: number
          completeness_score: number
        }[]
      }
      get_jwt_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin_by_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_reuben_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin_by_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      list_platform_activities: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          id: string
          title: string
          activity_type: string
          priority: string
          user_id: string
          fund_id: string
          created_at: string
        }[]
      }
      populate_enhanced_analysis: {
        Args: { target_deal_id: string }
        Returns: Json
      }
      populate_enhanced_analysis_with_real_engines: {
        Args: { target_deal_id: string }
        Returns: Json
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
      restore_archived_activities: {
        Args: {
          activity_ids?: string[]
          start_date?: string
          end_date?: string
        }
        Returns: number
      }
      set_user_role: {
        Args: {
          user_email: string
          new_role: Database["public"]["Enums"]["user_role"]
          org_id?: string
        }
        Returns: boolean
      }
      user_can_access_activity: {
        Args: { activity_fund_id: string; activity_deal_id: string }
        Returns: boolean
      }
      user_can_access_fund: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      user_can_manage_activity: {
        Args: { activity_fund_id: string; activity_deal_id: string }
        Returns: boolean
      }
      user_can_manage_fund: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      validate_deal_for_analysis: {
        Args: { deal_id_param: string }
        Returns: Json
      }
      validate_fund_strategy_for_analysis: {
        Args: { fund_id_param: string }
        Returns: Json
      }
      validate_jwt_claims: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          email: string
          role: string
          org_id: string
          is_super_admin: boolean
          claims_valid: boolean
          missing_claims: string[]
        }[]
      }
      verify_rls_policies_for_org: {
        Args: { test_org_id: string }
        Returns: {
          table_name: string
          policy_test: string
          expected_behavior: string
          actual_result: string
          test_passed: boolean
          security_risk: string
        }[]
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
        | "archived"
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
        "archived",
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
