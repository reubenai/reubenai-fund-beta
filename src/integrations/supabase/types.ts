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
      analysis_allowlist: {
        Row: {
          created_at: string | null
          deal_id: string
          notes: string | null
          test_phase: string | null
        }
        Insert: {
          created_at?: string | null
          deal_id: string
          notes?: string | null
          test_phase?: string | null
        }
        Update: {
          created_at?: string | null
          deal_id?: string
          notes?: string | null
          test_phase?: string | null
        }
        Relationships: []
      }
      analysis_completion_tracker: {
        Row: {
          analysis_type: string
          artifacts_created: number | null
          completed_at: string | null
          completion_reason: string | null
          created_at: string
          deal_id: string
          execution_token: string | null
          id: string
          metadata: Json | null
          sources_created: number | null
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          analysis_type?: string
          artifacts_created?: number | null
          completed_at?: string | null
          completion_reason?: string | null
          created_at?: string
          deal_id: string
          execution_token?: string | null
          id?: string
          metadata?: Json | null
          sources_created?: number | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          analysis_type?: string
          artifacts_created?: number | null
          completed_at?: string | null
          completion_reason?: string | null
          created_at?: string
          deal_id?: string
          execution_token?: string | null
          id?: string
          metadata?: Json | null
          sources_created?: number | null
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_completion_tracker_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      analysis_environment_config: {
        Row: {
          config_key: string
          config_value: string
          created_at: string | null
          enabled: boolean | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
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
      analysis_governance: {
        Row: {
          analysis_enabled: boolean | null
          created_at: string | null
          daily_analysis_count: number | null
          daily_analysis_limit: number | null
          daily_cost_limit: number | null
          daily_cost_spent: number | null
          fund_id: string
          id: string
          last_reset_date: string | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          analysis_enabled?: boolean | null
          created_at?: string | null
          daily_analysis_count?: number | null
          daily_analysis_limit?: number | null
          daily_cost_limit?: number | null
          daily_cost_spent?: number | null
          fund_id: string
          id?: string
          last_reset_date?: string | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          analysis_enabled?: boolean | null
          created_at?: string | null
          daily_analysis_count?: number | null
          daily_analysis_limit?: number | null
          daily_cost_limit?: number | null
          daily_cost_spent?: number | null
          fund_id?: string
          id?: string
          last_reset_date?: string | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_governance_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      analysis_idempotency: {
        Row: {
          completed_at: string | null
          created_at: string
          deal_id: string
          engine_name: string
          expires_at: string
          id: string
          idempotency_key: string
          operation_type: string
          result_data: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          deal_id: string
          engine_name: string
          expires_at?: string
          id?: string
          idempotency_key: string
          operation_type: string
          result_data?: Json | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          deal_id?: string
          engine_name?: string
          expires_at?: string
          id?: string
          idempotency_key?: string
          operation_type?: string
          result_data?: Json | null
          status?: string
        }
        Relationships: []
      }
      analysis_quality_monitor: {
        Row: {
          analysis_type: string
          confidence_score: number | null
          created_at: string | null
          data_completeness_score: number | null
          data_sources_count: number | null
          deal_id: string
          fund_id: string
          has_competitive_data: boolean | null
          has_financial_data: boolean | null
          has_market_data: boolean | null
          id: string
          org_id: string
          quality_flags: Json | null
        }
        Insert: {
          analysis_type: string
          confidence_score?: number | null
          created_at?: string | null
          data_completeness_score?: number | null
          data_sources_count?: number | null
          deal_id: string
          fund_id: string
          has_competitive_data?: boolean | null
          has_financial_data?: boolean | null
          has_market_data?: boolean | null
          id?: string
          org_id: string
          quality_flags?: Json | null
        }
        Update: {
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string | null
          data_completeness_score?: number | null
          data_sources_count?: number | null
          deal_id?: string
          fund_id?: string
          has_competitive_data?: boolean | null
          has_financial_data?: boolean | null
          has_market_data?: boolean | null
          id?: string
          org_id?: string
          quality_flags?: Json | null
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
      analysis_queue_metrics: {
        Row: {
          deal_id: string | null
          fund_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
          time_bucket: string | null
        }
        Insert: {
          deal_id?: string | null
          fund_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string
          time_bucket?: string | null
        }
        Update: {
          deal_id?: string | null
          fund_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          time_bucket?: string | null
        }
        Relationships: []
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
      artifacts: {
        Row: {
          artifact_data: Json
          artifact_kind: string
          artifact_type: string
          citations: Json | null
          created_at: string
          deal_id: string | null
          fund_id: string
          id: string
          org_id: string
          provenance: Json | null
          updated_at: string
          validation_status: string | null
        }
        Insert: {
          artifact_data: Json
          artifact_kind: string
          artifact_type: string
          citations?: Json | null
          created_at?: string
          deal_id?: string | null
          fund_id: string
          id?: string
          org_id: string
          provenance?: Json | null
          updated_at?: string
          validation_status?: string | null
        }
        Update: {
          artifact_data?: Json
          artifact_kind?: string
          artifact_type?: string
          citations?: Json | null
          created_at?: string
          deal_id?: string | null
          fund_id?: string
          id?: string
          org_id?: string
          provenance?: Json | null
          updated_at?: string
          validation_status?: string | null
        }
        Relationships: []
      }
      circuit_breaker_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_message: string | null
          function_name: string
          id: string
          metadata: Json | null
          status: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name: string
          id?: string
          metadata?: Json | null
          status: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          function_name?: string
          id?: string
          metadata?: Json | null
          status?: string
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
      dead_letter_queue: {
        Row: {
          can_retry: boolean
          created_at: string
          engine: string
          failure_context: Json | null
          failure_reason: string
          id: string
          last_retry_at: string | null
          original_job_id: string
          original_payload: Json
          queue_name: string
          retry_attempts: number
          tenant_id: string
        }
        Insert: {
          can_retry?: boolean
          created_at?: string
          engine: string
          failure_context?: Json | null
          failure_reason: string
          id?: string
          last_retry_at?: string | null
          original_job_id: string
          original_payload: Json
          queue_name: string
          retry_attempts?: number
          tenant_id: string
        }
        Update: {
          can_retry?: boolean
          created_at?: string
          engine?: string
          failure_context?: Json | null
          failure_reason?: string
          id?: string
          last_retry_at?: string | null
          original_job_id?: string
          original_payload?: Json
          queue_name?: string
          retry_attempts?: number
          tenant_id?: string
        }
        Relationships: []
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
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_analysis_catalysts: {
        Row: {
          analysis_queued: boolean | null
          catalyst_type: string
          deal_id: string
          id: string
          metadata: Json | null
          queue_id: string | null
          triggered_at: string
          triggered_by: string
        }
        Insert: {
          analysis_queued?: boolean | null
          catalyst_type: string
          deal_id: string
          id?: string
          metadata?: Json | null
          queue_id?: string | null
          triggered_at?: string
          triggered_by: string
        }
        Update: {
          analysis_queued?: boolean | null
          catalyst_type?: string
          deal_id?: string
          id?: string
          metadata?: Json | null
          queue_id?: string | null
          triggered_at?: string
          triggered_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_analysis_catalysts_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_analysis_catalysts_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "analysis_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_analysis_sources: {
        Row: {
          confidence_score: number | null
          created_at: string
          data_retrieved: Json | null
          data_snippet: string | null
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
          data_snippet?: string | null
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
          data_snippet?: string | null
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
          document_summary: Json | null
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
          document_summary?: Json | null
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
          document_summary?: Json | null
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
      deal_enrichment_crunchbase_export: {
        Row: {
          aberdeen_it_spend: Json | null
          about: string | null
          acquired_by: Json | null
          acquisitions: Json | null
          active_tech_count: number | null
          address: string | null
          alumni: Json | null
          apptopia: Json | null
          apptopia_total_downloads: number | null
          apptopia_total_downloads_mom_pct: number | null
          bombora: Json | null
          bombora_last_updated: string | null
          built_with_num_technologies_used: number | null
          built_with_tech: Json | null
          builtwith_num_technologies_used: number | null
          builtwith_tech: Json | null
          cb_id: string | null
          cb_rank: number | null
          company_activity_level: string | null
          company_id: string | null
          company_industry: string | null
          company_overview: string | null
          company_trending: string | null
          company_type: string | null
          contact_email: string | null
          contact_phone: string | null
          contacts: Json | null
          country_code: string | null
          created_at: string
          current_advisors: Json | null
          current_employees: Json | null
          deal_id: string
          diversity_investments: Json | null
          email_address: string | null
          error_details: string | null
          event_appearances: Json | null
          exits: Json | null
          featured_list: string | null
          financials_highlights: Json | null
          founded_date: string | null
          founders: Json | null
          full_description: string | null
          funding_rounds: number | null
          funding_rounds_list: Json | null
          funds_list: Json | null
          funds_raised: Json | null
          funds_total: number | null
          growth_score: number | null
          growth_trend: string | null
          headquarters_regions: Json | null
          heat_score: number | null
          heat_trend: string | null
          hq_continent: string | null
          id: string
          industries: string | null
          investment_stage: string | null
          investments: Json | null
          investor_type: string | null
          investors: Json | null
          ipo_fields: Json | null
          ipo_status: string | null
          ipqwery: Json | null
          layoff: Json | null
          leadership_hire: Json | null
          legal_name: string | null
          location: string | null
          monthly_visits: number | null
          monthly_visits_growth: number | null
          name: string | null
          news: Json | null
          num_acquisitions: number | null
          num_advisor_positions: number | null
          num_alumni: number | null
          num_contacts: number | null
          num_contacts_linkedin: number | null
          num_diversity_spotlight_investments: number | null
          num_employee_profiles: number | null
          num_employees: number | null
          num_event_appearances: number | null
          num_exits: number | null
          num_founder_alumni: number | null
          num_funds: number | null
          num_investments: number | null
          num_investments_lead: number | null
          num_investors: number | null
          num_news: number | null
          num_sub_organizations: number | null
          number_of_acquisitions: number | null
          number_of_advisor_positions: number | null
          number_of_alumni: number | null
          number_of_contacts: number | null
          number_of_diversity_spotlight_investments: number | null
          number_of_employee_profiles: number | null
          number_of_event_appearances: number | null
          number_of_exits: number | null
          number_of_founder_alumni: number | null
          number_of_funds: number | null
          number_of_investments: number | null
          number_of_investments_lead: number | null
          number_of_investors: number | null
          number_of_linkedin_contacts: number | null
          number_of_news: number | null
          number_of_sub_organizations: number | null
          operating_status: string | null
          overview_highlights: Json | null
          people_highlights: Json | null
          phone_number: string | null
          processed_at: string | null
          processing_status: string
          products_and_services: Json | null
          raw_brightdata_response: Json
          region: string | null
          semrush_last_updated: string | null
          semrush_location_list: Json | null
          semrush_visits_latest_month: number | null
          semrush_visits_mom_pct: number | null
          siftery_products: Json | null
          similar_companies: Json | null
          snapshot_id: string
          social_media_links: Json | null
          socila_media_urls: Json | null
          stock_symbol: string | null
          sub_organization_of: Json | null
          sub_organizations: Json | null
          technology_highlights: Json | null
          timestamp: string | null
          total_active_products: number | null
          type: string | null
          updated_at: string
          url: string | null
          uuid: string | null
          web_traffic_by_semrush: Json | null
          website: string | null
        }
        Insert: {
          aberdeen_it_spend?: Json | null
          about?: string | null
          acquired_by?: Json | null
          acquisitions?: Json | null
          active_tech_count?: number | null
          address?: string | null
          alumni?: Json | null
          apptopia?: Json | null
          apptopia_total_downloads?: number | null
          apptopia_total_downloads_mom_pct?: number | null
          bombora?: Json | null
          bombora_last_updated?: string | null
          built_with_num_technologies_used?: number | null
          built_with_tech?: Json | null
          builtwith_num_technologies_used?: number | null
          builtwith_tech?: Json | null
          cb_id?: string | null
          cb_rank?: number | null
          company_activity_level?: string | null
          company_id?: string | null
          company_industry?: string | null
          company_overview?: string | null
          company_trending?: string | null
          company_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contacts?: Json | null
          country_code?: string | null
          created_at?: string
          current_advisors?: Json | null
          current_employees?: Json | null
          deal_id: string
          diversity_investments?: Json | null
          email_address?: string | null
          error_details?: string | null
          event_appearances?: Json | null
          exits?: Json | null
          featured_list?: string | null
          financials_highlights?: Json | null
          founded_date?: string | null
          founders?: Json | null
          full_description?: string | null
          funding_rounds?: number | null
          funding_rounds_list?: Json | null
          funds_list?: Json | null
          funds_raised?: Json | null
          funds_total?: number | null
          growth_score?: number | null
          growth_trend?: string | null
          headquarters_regions?: Json | null
          heat_score?: number | null
          heat_trend?: string | null
          hq_continent?: string | null
          id?: string
          industries?: string | null
          investment_stage?: string | null
          investments?: Json | null
          investor_type?: string | null
          investors?: Json | null
          ipo_fields?: Json | null
          ipo_status?: string | null
          ipqwery?: Json | null
          layoff?: Json | null
          leadership_hire?: Json | null
          legal_name?: string | null
          location?: string | null
          monthly_visits?: number | null
          monthly_visits_growth?: number | null
          name?: string | null
          news?: Json | null
          num_acquisitions?: number | null
          num_advisor_positions?: number | null
          num_alumni?: number | null
          num_contacts?: number | null
          num_contacts_linkedin?: number | null
          num_diversity_spotlight_investments?: number | null
          num_employee_profiles?: number | null
          num_employees?: number | null
          num_event_appearances?: number | null
          num_exits?: number | null
          num_founder_alumni?: number | null
          num_funds?: number | null
          num_investments?: number | null
          num_investments_lead?: number | null
          num_investors?: number | null
          num_news?: number | null
          num_sub_organizations?: number | null
          number_of_acquisitions?: number | null
          number_of_advisor_positions?: number | null
          number_of_alumni?: number | null
          number_of_contacts?: number | null
          number_of_diversity_spotlight_investments?: number | null
          number_of_employee_profiles?: number | null
          number_of_event_appearances?: number | null
          number_of_exits?: number | null
          number_of_founder_alumni?: number | null
          number_of_funds?: number | null
          number_of_investments?: number | null
          number_of_investments_lead?: number | null
          number_of_investors?: number | null
          number_of_linkedin_contacts?: number | null
          number_of_news?: number | null
          number_of_sub_organizations?: number | null
          operating_status?: string | null
          overview_highlights?: Json | null
          people_highlights?: Json | null
          phone_number?: string | null
          processed_at?: string | null
          processing_status?: string
          products_and_services?: Json | null
          raw_brightdata_response?: Json
          region?: string | null
          semrush_last_updated?: string | null
          semrush_location_list?: Json | null
          semrush_visits_latest_month?: number | null
          semrush_visits_mom_pct?: number | null
          siftery_products?: Json | null
          similar_companies?: Json | null
          snapshot_id: string
          social_media_links?: Json | null
          socila_media_urls?: Json | null
          stock_symbol?: string | null
          sub_organization_of?: Json | null
          sub_organizations?: Json | null
          technology_highlights?: Json | null
          timestamp?: string | null
          total_active_products?: number | null
          type?: string | null
          updated_at?: string
          url?: string | null
          uuid?: string | null
          web_traffic_by_semrush?: Json | null
          website?: string | null
        }
        Update: {
          aberdeen_it_spend?: Json | null
          about?: string | null
          acquired_by?: Json | null
          acquisitions?: Json | null
          active_tech_count?: number | null
          address?: string | null
          alumni?: Json | null
          apptopia?: Json | null
          apptopia_total_downloads?: number | null
          apptopia_total_downloads_mom_pct?: number | null
          bombora?: Json | null
          bombora_last_updated?: string | null
          built_with_num_technologies_used?: number | null
          built_with_tech?: Json | null
          builtwith_num_technologies_used?: number | null
          builtwith_tech?: Json | null
          cb_id?: string | null
          cb_rank?: number | null
          company_activity_level?: string | null
          company_id?: string | null
          company_industry?: string | null
          company_overview?: string | null
          company_trending?: string | null
          company_type?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          contacts?: Json | null
          country_code?: string | null
          created_at?: string
          current_advisors?: Json | null
          current_employees?: Json | null
          deal_id?: string
          diversity_investments?: Json | null
          email_address?: string | null
          error_details?: string | null
          event_appearances?: Json | null
          exits?: Json | null
          featured_list?: string | null
          financials_highlights?: Json | null
          founded_date?: string | null
          founders?: Json | null
          full_description?: string | null
          funding_rounds?: number | null
          funding_rounds_list?: Json | null
          funds_list?: Json | null
          funds_raised?: Json | null
          funds_total?: number | null
          growth_score?: number | null
          growth_trend?: string | null
          headquarters_regions?: Json | null
          heat_score?: number | null
          heat_trend?: string | null
          hq_continent?: string | null
          id?: string
          industries?: string | null
          investment_stage?: string | null
          investments?: Json | null
          investor_type?: string | null
          investors?: Json | null
          ipo_fields?: Json | null
          ipo_status?: string | null
          ipqwery?: Json | null
          layoff?: Json | null
          leadership_hire?: Json | null
          legal_name?: string | null
          location?: string | null
          monthly_visits?: number | null
          monthly_visits_growth?: number | null
          name?: string | null
          news?: Json | null
          num_acquisitions?: number | null
          num_advisor_positions?: number | null
          num_alumni?: number | null
          num_contacts?: number | null
          num_contacts_linkedin?: number | null
          num_diversity_spotlight_investments?: number | null
          num_employee_profiles?: number | null
          num_employees?: number | null
          num_event_appearances?: number | null
          num_exits?: number | null
          num_founder_alumni?: number | null
          num_funds?: number | null
          num_investments?: number | null
          num_investments_lead?: number | null
          num_investors?: number | null
          num_news?: number | null
          num_sub_organizations?: number | null
          number_of_acquisitions?: number | null
          number_of_advisor_positions?: number | null
          number_of_alumni?: number | null
          number_of_contacts?: number | null
          number_of_diversity_spotlight_investments?: number | null
          number_of_employee_profiles?: number | null
          number_of_event_appearances?: number | null
          number_of_exits?: number | null
          number_of_founder_alumni?: number | null
          number_of_funds?: number | null
          number_of_investments?: number | null
          number_of_investments_lead?: number | null
          number_of_investors?: number | null
          number_of_linkedin_contacts?: number | null
          number_of_news?: number | null
          number_of_sub_organizations?: number | null
          operating_status?: string | null
          overview_highlights?: Json | null
          people_highlights?: Json | null
          phone_number?: string | null
          processed_at?: string | null
          processing_status?: string
          products_and_services?: Json | null
          raw_brightdata_response?: Json
          region?: string | null
          semrush_last_updated?: string | null
          semrush_location_list?: Json | null
          semrush_visits_latest_month?: number | null
          semrush_visits_mom_pct?: number | null
          siftery_products?: Json | null
          similar_companies?: Json | null
          snapshot_id?: string
          social_media_links?: Json | null
          socila_media_urls?: Json | null
          stock_symbol?: string | null
          sub_organization_of?: Json | null
          sub_organizations?: Json | null
          technology_highlights?: Json | null
          timestamp?: string | null
          total_active_products?: number | null
          type?: string | null
          updated_at?: string
          url?: string | null
          uuid?: string | null
          web_traffic_by_semrush?: Json | null
          website?: string | null
        }
        Relationships: []
      }
      deal_enrichment_linkedin_export: {
        Row: {
          about: string | null
          affiliated: Json | null
          alumni: Json | null
          alumni_information: Json | null
          company_id: string | null
          company_name: string | null
          company_size: string | null
          country_code: string | null
          country_codes_array: string[] | null
          created_at: string
          crunchbase_url: string | null
          deal_id: string
          description: string | null
          employees: Json | null
          employees_in_linkedin: number | null
          error_details: string | null
          followers: number | null
          formatted_locations: string[] | null
          founded: number | null
          funding: Json | null
          get_directions_url: string | null
          headquarters: string | null
          id: string
          image: string | null
          industries: string | null
          investors: Json | null
          linkedin_url: string | null
          locations: string[] | null
          logo: string | null
          organization_type: string | null
          processed_at: string | null
          processing_status: string | null
          raw_brightdata_response: Json
          similar_companies: Json | null
          slogan: string | null
          snapshot_id: string
          specialties: string[] | null
          stock_info: Json | null
          timestamp: string | null
          unformatted_about: string | null
          updated_at: string
          updates: Json | null
          website: string | null
          website_simplified: string | null
        }
        Insert: {
          about?: string | null
          affiliated?: Json | null
          alumni?: Json | null
          alumni_information?: Json | null
          company_id?: string | null
          company_name?: string | null
          company_size?: string | null
          country_code?: string | null
          country_codes_array?: string[] | null
          created_at?: string
          crunchbase_url?: string | null
          deal_id: string
          description?: string | null
          employees?: Json | null
          employees_in_linkedin?: number | null
          error_details?: string | null
          followers?: number | null
          formatted_locations?: string[] | null
          founded?: number | null
          funding?: Json | null
          get_directions_url?: string | null
          headquarters?: string | null
          id?: string
          image?: string | null
          industries?: string | null
          investors?: Json | null
          linkedin_url?: string | null
          locations?: string[] | null
          logo?: string | null
          organization_type?: string | null
          processed_at?: string | null
          processing_status?: string | null
          raw_brightdata_response: Json
          similar_companies?: Json | null
          slogan?: string | null
          snapshot_id: string
          specialties?: string[] | null
          stock_info?: Json | null
          timestamp?: string | null
          unformatted_about?: string | null
          updated_at?: string
          updates?: Json | null
          website?: string | null
          website_simplified?: string | null
        }
        Update: {
          about?: string | null
          affiliated?: Json | null
          alumni?: Json | null
          alumni_information?: Json | null
          company_id?: string | null
          company_name?: string | null
          company_size?: string | null
          country_code?: string | null
          country_codes_array?: string[] | null
          created_at?: string
          crunchbase_url?: string | null
          deal_id?: string
          description?: string | null
          employees?: Json | null
          employees_in_linkedin?: number | null
          error_details?: string | null
          followers?: number | null
          formatted_locations?: string[] | null
          founded?: number | null
          funding?: Json | null
          get_directions_url?: string | null
          headquarters?: string | null
          id?: string
          image?: string | null
          industries?: string | null
          investors?: Json | null
          linkedin_url?: string | null
          locations?: string[] | null
          logo?: string | null
          organization_type?: string | null
          processed_at?: string | null
          processing_status?: string | null
          raw_brightdata_response?: Json
          similar_companies?: Json | null
          slogan?: string | null
          snapshot_id?: string
          specialties?: string[] | null
          stock_info?: Json | null
          timestamp?: string | null
          unformatted_about?: string | null
          updated_at?: string
          updates?: Json | null
          website?: string | null
          website_simplified?: string | null
        }
        Relationships: []
      }
      deal_enrichment_linkedin_profile_export: {
        Row: {
          about: string | null
          activity: Json | null
          certifications: Json | null
          connections: number | null
          courses: Json | null
          created_at: string
          current_company: string | null
          current_company_company_id: string | null
          current_company_name: string | null
          deal_id: string
          education: Json | null
          educations_details: Json | null
          error_details: string | null
          experience: Json | null
          first_name: string | null
          followers: number | null
          honors_and_awards: Json | null
          id: string
          languages: Json | null
          last_name: string | null
          name: string | null
          organizations: Json | null
          patents: Json | null
          position: string | null
          posts: Json | null
          processed_at: string | null
          processing_status: string | null
          projects: Json | null
          publications: Json | null
          raw_brightdata_response: Json
          recommendations: Json | null
          recommendations_count: number | null
          snapshot_id: string
          timestamp: string | null
          updated_at: string
          url: string | null
          volunteer_experience: Json | null
        }
        Insert: {
          about?: string | null
          activity?: Json | null
          certifications?: Json | null
          connections?: number | null
          courses?: Json | null
          created_at?: string
          current_company?: string | null
          current_company_company_id?: string | null
          current_company_name?: string | null
          deal_id: string
          education?: Json | null
          educations_details?: Json | null
          error_details?: string | null
          experience?: Json | null
          first_name?: string | null
          followers?: number | null
          honors_and_awards?: Json | null
          id?: string
          languages?: Json | null
          last_name?: string | null
          name?: string | null
          organizations?: Json | null
          patents?: Json | null
          position?: string | null
          posts?: Json | null
          processed_at?: string | null
          processing_status?: string | null
          projects?: Json | null
          publications?: Json | null
          raw_brightdata_response: Json
          recommendations?: Json | null
          recommendations_count?: number | null
          snapshot_id: string
          timestamp?: string | null
          updated_at?: string
          url?: string | null
          volunteer_experience?: Json | null
        }
        Update: {
          about?: string | null
          activity?: Json | null
          certifications?: Json | null
          connections?: number | null
          courses?: Json | null
          created_at?: string
          current_company?: string | null
          current_company_company_id?: string | null
          current_company_name?: string | null
          deal_id?: string
          education?: Json | null
          educations_details?: Json | null
          error_details?: string | null
          experience?: Json | null
          first_name?: string | null
          followers?: number | null
          honors_and_awards?: Json | null
          id?: string
          languages?: Json | null
          last_name?: string | null
          name?: string | null
          organizations?: Json | null
          patents?: Json | null
          position?: string | null
          posts?: Json | null
          processed_at?: string | null
          processing_status?: string | null
          projects?: Json | null
          publications?: Json | null
          raw_brightdata_response?: Json
          recommendations?: Json | null
          recommendations_count?: number | null
          snapshot_id?: string
          timestamp?: string | null
          updated_at?: string
          url?: string | null
          volunteer_experience?: Json | null
        }
        Relationships: []
      }
      deal_enrichment_perplexity_company_export_vc: {
        Row: {
          addressable_customers: string | null
          cac_trend: string | null
          cagr: string | null
          channel_effectiveness: Json | null
          company_name: string
          confidence_level: string | null
          created_at: string
          data_quality_score: number | null
          data_sources: Json | null
          deal_id: string
          growth_drivers: string[] | null
          id: string
          investor_network: string[] | null
          key_market_players: string[] | null
          last_updated: string | null
          ltv_cac_ratio: string | null
          market_share_distribution: Json | null
          partnership_ecosystem: Json | null
          processed_at: string | null
          processing_status: string
          raw_perplexity_response: Json
          retention_rate: string | null
          sam: string | null
          snapshot_id: string
          som: string | null
          strategic_advisors: string[] | null
          subcategory_confidence: Json | null
          subcategory_sources: Json | null
          tam: string | null
          updated_at: string
          whitespace_opportunities: string[] | null
        }
        Insert: {
          addressable_customers?: string | null
          cac_trend?: string | null
          cagr?: string | null
          channel_effectiveness?: Json | null
          company_name: string
          confidence_level?: string | null
          created_at?: string
          data_quality_score?: number | null
          data_sources?: Json | null
          deal_id: string
          growth_drivers?: string[] | null
          id?: string
          investor_network?: string[] | null
          key_market_players?: string[] | null
          last_updated?: string | null
          ltv_cac_ratio?: string | null
          market_share_distribution?: Json | null
          partnership_ecosystem?: Json | null
          processed_at?: string | null
          processing_status?: string
          raw_perplexity_response?: Json
          retention_rate?: string | null
          sam?: string | null
          snapshot_id: string
          som?: string | null
          strategic_advisors?: string[] | null
          subcategory_confidence?: Json | null
          subcategory_sources?: Json | null
          tam?: string | null
          updated_at?: string
          whitespace_opportunities?: string[] | null
        }
        Update: {
          addressable_customers?: string | null
          cac_trend?: string | null
          cagr?: string | null
          channel_effectiveness?: Json | null
          company_name?: string
          confidence_level?: string | null
          created_at?: string
          data_quality_score?: number | null
          data_sources?: Json | null
          deal_id?: string
          growth_drivers?: string[] | null
          id?: string
          investor_network?: string[] | null
          key_market_players?: string[] | null
          last_updated?: string | null
          ltv_cac_ratio?: string | null
          market_share_distribution?: Json | null
          partnership_ecosystem?: Json | null
          processed_at?: string | null
          processing_status?: string
          raw_perplexity_response?: Json
          retention_rate?: string | null
          sam?: string | null
          snapshot_id?: string
          som?: string | null
          strategic_advisors?: string[] | null
          subcategory_confidence?: Json | null
          subcategory_sources?: Json | null
          tam?: string | null
          updated_at?: string
          whitespace_opportunities?: string[] | null
        }
        Relationships: []
      }
      deal_enrichment_perplexity_founder_export_vc: {
        Row: {
          academic_background: Json | null
          certifications: Json | null
          company_name: string
          confidence_score: number | null
          created_at: string
          data_quality_score: number | null
          deal_id: string
          exit_history: Json | null
          founder_name: string
          id: string
          innovation_record: Json | null
          leadership_experience: Json | null
          market_knowledge: Json | null
          previous_roles: Json | null
          processed_at: string | null
          processing_status: string
          raw_perplexity_response: Json
          snapshot_id: string | null
          subcategory_confidence: Json | null
          subcategory_sources: Json | null
          team_building: Json | null
          technical_skills: Json | null
          thought_leadership: Json | null
          updated_at: string
          value_creation: Json | null
        }
        Insert: {
          academic_background?: Json | null
          certifications?: Json | null
          company_name: string
          confidence_score?: number | null
          created_at?: string
          data_quality_score?: number | null
          deal_id: string
          exit_history?: Json | null
          founder_name: string
          id?: string
          innovation_record?: Json | null
          leadership_experience?: Json | null
          market_knowledge?: Json | null
          previous_roles?: Json | null
          processed_at?: string | null
          processing_status?: string
          raw_perplexity_response?: Json
          snapshot_id?: string | null
          subcategory_confidence?: Json | null
          subcategory_sources?: Json | null
          team_building?: Json | null
          technical_skills?: Json | null
          thought_leadership?: Json | null
          updated_at?: string
          value_creation?: Json | null
        }
        Update: {
          academic_background?: Json | null
          certifications?: Json | null
          company_name?: string
          confidence_score?: number | null
          created_at?: string
          data_quality_score?: number | null
          deal_id?: string
          exit_history?: Json | null
          founder_name?: string
          id?: string
          innovation_record?: Json | null
          leadership_experience?: Json | null
          market_knowledge?: Json | null
          previous_roles?: Json | null
          processed_at?: string | null
          processing_status?: string
          raw_perplexity_response?: Json
          snapshot_id?: string | null
          subcategory_confidence?: Json | null
          subcategory_sources?: Json | null
          team_building?: Json | null
          technical_skills?: Json | null
          thought_leadership?: Json | null
          updated_at?: string
          value_creation?: Json | null
        }
        Relationships: []
      }
      deal_execution_locks: {
        Row: {
          created_at: string
          deal_id: string
          expires_at: string
          id: string
          lock_type: string
          locked_at: string
          locked_by: string
          metadata: Json | null
        }
        Insert: {
          created_at?: string
          deal_id: string
          expires_at?: string
          id?: string
          lock_type?: string
          locked_at?: string
          locked_by: string
          metadata?: Json | null
        }
        Update: {
          created_at?: string
          deal_id?: string
          expires_at?: string
          id?: string
          lock_type?: string
          locked_at?: string
          locked_by?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "deal_execution_locks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_features: {
        Row: {
          confidence_score: number | null
          created_at: string
          deal_id: string
          extraction_method: string | null
          feature_name: string
          feature_type: string
          feature_value: Json
          fund_id: string
          id: string
          org_id: string
          source_references: Json | null
          updated_at: string
          validation_status: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          deal_id: string
          extraction_method?: string | null
          feature_name: string
          feature_type: string
          feature_value: Json
          fund_id: string
          id?: string
          org_id: string
          source_references?: Json | null
          updated_at?: string
          validation_status?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          deal_id?: string
          extraction_method?: string | null
          feature_name?: string
          feature_type?: string
          feature_value?: Json
          fund_id?: string
          id?: string
          org_id?: string
          source_references?: Json | null
          updated_at?: string
          validation_status?: string | null
        }
        Relationships: []
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
      deal_permissions: {
        Row: {
          access_granted_by: string
          access_type: string
          created_at: string | null
          deal_id: string
          id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_granted_by: string
          access_type: string
          created_at?: string | null
          deal_id: string
          id?: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_granted_by?: string
          access_type?: string
          created_at?: string | null
          deal_id?: string
          id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_permissions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_rate_limits: {
        Row: {
          analysis_count_today: number | null
          circuit_opened_at: string | null
          consecutive_failures: number | null
          created_at: string
          deal_id: string
          id: string
          is_circuit_open: boolean | null
          last_analysis_at: string
          metadata: Json | null
          reset_date: string | null
          updated_at: string
        }
        Insert: {
          analysis_count_today?: number | null
          circuit_opened_at?: string | null
          consecutive_failures?: number | null
          created_at?: string
          deal_id: string
          id?: string
          is_circuit_open?: boolean | null
          last_analysis_at?: string
          metadata?: Json | null
          reset_date?: string | null
          updated_at?: string
        }
        Update: {
          analysis_count_today?: number | null
          circuit_opened_at?: string | null
          consecutive_failures?: number | null
          created_at?: string
          deal_id?: string
          id?: string
          is_circuit_open?: boolean | null
          last_analysis_at?: string
          metadata?: Json | null
          reset_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_rate_limits_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: true
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_scores: {
        Row: {
          category: string
          confidence_level: number | null
          created_at: string
          deal_id: string
          driver_contributions: Json | null
          evidence_refs: Json | null
          fund_id: string
          id: string
          org_id: string
          raw_score: number | null
          rubric_version: string
          scoring_method: string | null
          updated_at: string
          weighted_score: number | null
        }
        Insert: {
          category: string
          confidence_level?: number | null
          created_at?: string
          deal_id: string
          driver_contributions?: Json | null
          evidence_refs?: Json | null
          fund_id: string
          id?: string
          org_id: string
          raw_score?: number | null
          rubric_version: string
          scoring_method?: string | null
          updated_at?: string
          weighted_score?: number | null
        }
        Update: {
          category?: string
          confidence_level?: number | null
          created_at?: string
          deal_id?: string
          driver_contributions?: Json | null
          evidence_refs?: Json | null
          fund_id?: string
          id?: string
          org_id?: string
          raw_score?: number | null
          rubric_version?: string
          scoring_method?: string | null
          updated_at?: string
          weighted_score?: number | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          analysis_blocked_until: string | null
          analysis_failure_count: number | null
          analysis_queue_status: string | null
          auto_analysis_enabled: boolean | null
          business_model: string | null
          capital_raised_to_date: number | null
          co_founders: string[] | null
          company_name: string
          company_stage: string | null
          company_validation_status: string | null
          competitors: string[] | null
          countries_of_operation: string[] | null
          created_at: string
          created_by: string
          crunchbase_url: string | null
          currency: string | null
          current_round_size: number | null
          deal_size: number | null
          description: string | null
          employee_count: number | null
          enhanced_analysis: Json | null
          first_analysis_completed: boolean | null
          founder: string | null
          founder_email: string | null
          founding_year: number | null
          fund_id: string
          funding_stage: string | null
          headquarters: string | null
          id: string
          industry: string | null
          key_customers: string[] | null
          last_analysis_trigger: string | null
          last_analysis_trigger_reason: string | null
          linkedin_url: string | null
          location: string | null
          next_action: string | null
          organization_id: string | null
          overall_score: number | null
          previous_funding_amount: number | null
          primary_industry: string | null
          primary_source: string | null
          priority: string | null
          rag_confidence: number | null
          rag_reasoning: Json | null
          rag_status: string | null
          revenue_model: string | null
          score_level: Database["public"]["Enums"]["deal_score_level"] | null
          source_confidence_score: number | null
          source_method: string | null
          specialized_sectors: string[] | null
          status: Database["public"]["Enums"]["deal_status"] | null
          target_market: string | null
          technology_stack: string[] | null
          updated_at: string
          valuation: number | null
          version: number | null
          web_presence_confidence: number | null
          website: string | null
        }
        Insert: {
          analysis_blocked_until?: string | null
          analysis_failure_count?: number | null
          analysis_queue_status?: string | null
          auto_analysis_enabled?: boolean | null
          business_model?: string | null
          capital_raised_to_date?: number | null
          co_founders?: string[] | null
          company_name: string
          company_stage?: string | null
          company_validation_status?: string | null
          competitors?: string[] | null
          countries_of_operation?: string[] | null
          created_at?: string
          created_by: string
          crunchbase_url?: string | null
          currency?: string | null
          current_round_size?: number | null
          deal_size?: number | null
          description?: string | null
          employee_count?: number | null
          enhanced_analysis?: Json | null
          first_analysis_completed?: boolean | null
          founder?: string | null
          founder_email?: string | null
          founding_year?: number | null
          fund_id: string
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_customers?: string[] | null
          last_analysis_trigger?: string | null
          last_analysis_trigger_reason?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_action?: string | null
          organization_id?: string | null
          overall_score?: number | null
          previous_funding_amount?: number | null
          primary_industry?: string | null
          primary_source?: string | null
          priority?: string | null
          rag_confidence?: number | null
          rag_reasoning?: Json | null
          rag_status?: string | null
          revenue_model?: string | null
          score_level?: Database["public"]["Enums"]["deal_score_level"] | null
          source_confidence_score?: number | null
          source_method?: string | null
          specialized_sectors?: string[] | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          target_market?: string | null
          technology_stack?: string[] | null
          updated_at?: string
          valuation?: number | null
          version?: number | null
          web_presence_confidence?: number | null
          website?: string | null
        }
        Update: {
          analysis_blocked_until?: string | null
          analysis_failure_count?: number | null
          analysis_queue_status?: string | null
          auto_analysis_enabled?: boolean | null
          business_model?: string | null
          capital_raised_to_date?: number | null
          co_founders?: string[] | null
          company_name?: string
          company_stage?: string | null
          company_validation_status?: string | null
          competitors?: string[] | null
          countries_of_operation?: string[] | null
          created_at?: string
          created_by?: string
          crunchbase_url?: string | null
          currency?: string | null
          current_round_size?: number | null
          deal_size?: number | null
          description?: string | null
          employee_count?: number | null
          enhanced_analysis?: Json | null
          first_analysis_completed?: boolean | null
          founder?: string | null
          founder_email?: string | null
          founding_year?: number | null
          fund_id?: string
          funding_stage?: string | null
          headquarters?: string | null
          id?: string
          industry?: string | null
          key_customers?: string[] | null
          last_analysis_trigger?: string | null
          last_analysis_trigger_reason?: string | null
          linkedin_url?: string | null
          location?: string | null
          next_action?: string | null
          organization_id?: string | null
          overall_score?: number | null
          previous_funding_amount?: number | null
          primary_industry?: string | null
          primary_source?: string | null
          priority?: string | null
          rag_confidence?: number | null
          rag_reasoning?: Json | null
          rag_status?: string | null
          revenue_model?: string | null
          score_level?: Database["public"]["Enums"]["deal_score_level"] | null
          source_confidence_score?: number | null
          source_method?: string | null
          specialized_sectors?: string[] | null
          status?: Database["public"]["Enums"]["deal_status"] | null
          target_market?: string | null
          technology_stack?: string[] | null
          updated_at?: string
          valuation?: number | null
          version?: number | null
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
      emergency_deal_blacklist: {
        Row: {
          blocked_at: string | null
          blocked_by: string | null
          deal_id: string
          reason: string
        }
        Insert: {
          blocked_at?: string | null
          blocked_by?: string | null
          deal_id: string
          reason: string
        }
        Update: {
          blocked_at?: string | null
          blocked_by?: string | null
          deal_id?: string
          reason?: string
        }
        Relationships: []
      }
      emergency_ops_control: {
        Row: {
          control_key: string
          control_value: string
          created_at: string | null
          enabled: boolean
          id: string
        }
        Insert: {
          control_key: string
          control_value: string
          created_at?: string | null
          enabled?: boolean
          id?: string
        }
        Update: {
          control_key?: string
          control_value?: string
          created_at?: string | null
          enabled?: boolean
          id?: string
        }
        Relationships: []
      }
      engine_registry: {
        Row: {
          created_at: string
          enabled: boolean
          engine_id: string
          feature_flag: string | null
          id: string
          job_ttl_minutes: number
          max_concurrency: number
          queue_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          engine_id: string
          feature_flag?: string | null
          id?: string
          job_ttl_minutes?: number
          max_concurrency?: number
          queue_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          engine_id?: string
          feature_flag?: string | null
          id?: string
          job_ttl_minutes?: number
          max_concurrency?: number
          queue_name?: string
          updated_at?: string
        }
        Relationships: []
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
      feature_flags: {
        Row: {
          created_at: string
          flag_config: Json | null
          flag_name: string
          flag_value: boolean | null
          id: string
          org_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          flag_config?: Json | null
          flag_name: string
          flag_value?: boolean | null
          id?: string
          org_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          flag_config?: Json | null
          flag_name?: string
          flag_value?: boolean | null
          id?: string
          org_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      field_catalog: {
        Row: {
          created_at: string
          default_value: Json | null
          field_key: string
          field_type: string
          id: string
          is_nullable: boolean
          is_required: boolean
          updated_at: string
          used_in_entities: string[]
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          default_value?: Json | null
          field_key: string
          field_type: string
          id?: string
          is_nullable?: boolean
          is_required?: boolean
          updated_at?: string
          used_in_entities?: string[]
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          default_value?: Json | null
          field_key?: string
          field_type?: string
          id?: string
          is_nullable?: boolean
          is_required?: boolean
          updated_at?: string
          used_in_entities?: string[]
          validation_rules?: Json | null
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
      fund_memory: {
        Row: {
          confidence_score: number | null
          created_at: string
          expires_at: string | null
          fund_id: string
          id: string
          memory_key: string
          memory_type: string
          memory_value: Json
          namespace: string
          org_id: string
          retention_period: unknown | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          fund_id: string
          id?: string
          memory_key: string
          memory_type?: string
          memory_value?: Json
          namespace: string
          org_id: string
          retention_period?: unknown | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          expires_at?: string | null
          fund_id?: string
          id?: string
          memory_key?: string
          memory_type?: string
          memory_value?: Json
          namespace?: string
          org_id?: string
          retention_period?: unknown | null
          updated_at?: string
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
      ic_decisions: {
        Row: {
          confidence_level: number | null
          created_at: string
          deal_id: string
          decision_context: Json | null
          decision_maker: string
          decision_outcome: string
          decision_rationale: string | null
          decision_type: string
          fund_id: string
          id: string
          org_id: string
          supporting_evidence: Json | null
          updated_at: string
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string
          deal_id: string
          decision_context?: Json | null
          decision_maker: string
          decision_outcome: string
          decision_rationale?: string | null
          decision_type: string
          fund_id: string
          id?: string
          org_id: string
          supporting_evidence?: Json | null
          updated_at?: string
        }
        Update: {
          confidence_level?: number | null
          created_at?: string
          deal_id?: string
          decision_context?: Json | null
          decision_maker?: string
          decision_outcome?: string
          decision_rationale?: string | null
          decision_type?: string
          fund_id?: string
          id?: string
          org_id?: string
          supporting_evidence?: Json | null
          updated_at?: string
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
      ic_memo_workflow_audit: {
        Row: {
          action_at: string
          action_by: string
          from_state: string | null
          id: string
          is_override: boolean | null
          memo_id: string
          metadata: Json | null
          reason: string | null
          to_state: string
        }
        Insert: {
          action_at?: string
          action_by: string
          from_state?: string | null
          id?: string
          is_override?: boolean | null
          memo_id: string
          metadata?: Json | null
          reason?: string | null
          to_state: string
        }
        Update: {
          action_at?: string
          action_by?: string
          from_state?: string | null
          id?: string
          is_override?: boolean | null
          memo_id?: string
          metadata?: Json | null
          reason?: string | null
          to_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "ic_memo_workflow_audit_memo_id_fkey"
            columns: ["memo_id"]
            isOneToOne: false
            referencedRelation: "ic_memos"
            referencedColumns: ["id"]
          },
        ]
      }
      ic_memos: {
        Row: {
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          content_quality_score: number | null
          content_word_count: number | null
          created_at: string
          created_by: string
          custom_sections: Json | null
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
          override_reason: string | null
          published_at: string | null
          publishing_notes: string | null
          rag_status: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          review_notes: string | null
          review_priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          scheduled_by: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          submitted_for_review_at: string | null
          super_admin_override: boolean | null
          template_id: string | null
          title: string
          updated_at: string
          workflow_state: string | null
        }
        Insert: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          content_quality_score?: number | null
          content_word_count?: number | null
          created_at?: string
          created_by: string
          custom_sections?: Json | null
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
          override_reason?: string | null
          published_at?: string | null
          publishing_notes?: string | null
          rag_status?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          review_priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          scheduled_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_for_review_at?: string | null
          super_admin_override?: boolean | null
          template_id?: string | null
          title: string
          updated_at?: string
          workflow_state?: string | null
        }
        Update: {
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          content_quality_score?: number | null
          content_word_count?: number | null
          created_at?: string
          created_by?: string
          custom_sections?: Json | null
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
          override_reason?: string | null
          published_at?: string | null
          publishing_notes?: string | null
          rag_status?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          review_priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          scheduled_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          submitted_for_review_at?: string | null
          super_admin_override?: boolean | null
          template_id?: string | null
          title?: string
          updated_at?: string
          workflow_state?: string | null
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
      idempotency_keys: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          key: string
          metadata: Json | null
          result: Json | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          key: string
          metadata?: Json | null
          result?: Json | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          key?: string
          metadata?: Json | null
          result?: Json | null
          status?: string
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
          deal_sourcing_strategy: Json | null
          decision_making_process: Json | null
          enhanced_criteria: Json | null
          exciting_threshold: number | null
          fund_id: string
          fund_name: string | null
          fund_type: string
          geography: string[] | null
          id: string
          industries: string[] | null
          investment_philosophy: string | null
          investment_stages: string[] | null
          key_signals: string[] | null
          max_investment_amount: number | null
          min_investment_amount: number | null
          needs_development_threshold: number | null
          philosophy_config: Json | null
          promising_threshold: number | null
          recency_thresholds: Json | null
          research_approach: Json | null
          specialized_sectors: string[] | null
          strategy_notes: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deal_sourcing_strategy?: Json | null
          decision_making_process?: Json | null
          enhanced_criteria?: Json | null
          exciting_threshold?: number | null
          fund_id: string
          fund_name?: string | null
          fund_type?: string
          geography?: string[] | null
          id?: string
          industries?: string[] | null
          investment_philosophy?: string | null
          investment_stages?: string[] | null
          key_signals?: string[] | null
          max_investment_amount?: number | null
          min_investment_amount?: number | null
          needs_development_threshold?: number | null
          philosophy_config?: Json | null
          promising_threshold?: number | null
          recency_thresholds?: Json | null
          research_approach?: Json | null
          specialized_sectors?: string[] | null
          strategy_notes?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deal_sourcing_strategy?: Json | null
          decision_making_process?: Json | null
          enhanced_criteria?: Json | null
          exciting_threshold?: number | null
          fund_id?: string
          fund_name?: string | null
          fund_type?: string
          geography?: string[] | null
          id?: string
          industries?: string[] | null
          investment_philosophy?: string | null
          investment_stages?: string[] | null
          key_signals?: string[] | null
          max_investment_amount?: number | null
          min_investment_amount?: number | null
          needs_development_threshold?: number | null
          philosophy_config?: Json | null
          promising_threshold?: number | null
          recency_thresholds?: Json | null
          research_approach?: Json | null
          specialized_sectors?: string[] | null
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
      investment_strategies_v2: {
        Row: {
          business_traction_config: Json | null
          check_size_max: number | null
          check_size_min: number | null
          created_at: string
          deal_sourcing_strategy: Json | null
          decision_making_process: Json | null
          enhanced_criteria: Json | null
          exciting_threshold: number | null
          financial_health_config: Json | null
          fund_id: string
          fund_name: string
          fund_type: string
          geographies: string[] | null
          id: string
          investment_philosophy: string | null
          key_signals: string[] | null
          market_opportunity_config: Json | null
          needs_development_threshold: number | null
          organization_id: string
          philosophy_config: Json | null
          product_technology_config: Json | null
          promising_threshold: number | null
          research_approach: Json | null
          sectors: string[] | null
          stages: string[] | null
          strategic_fit_config: Json | null
          strategy_description: string | null
          team_leadership_config: Json | null
          updated_at: string
        }
        Insert: {
          business_traction_config?: Json | null
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          deal_sourcing_strategy?: Json | null
          decision_making_process?: Json | null
          enhanced_criteria?: Json | null
          exciting_threshold?: number | null
          financial_health_config?: Json | null
          fund_id: string
          fund_name: string
          fund_type: string
          geographies?: string[] | null
          id?: string
          investment_philosophy?: string | null
          key_signals?: string[] | null
          market_opportunity_config?: Json | null
          needs_development_threshold?: number | null
          organization_id: string
          philosophy_config?: Json | null
          product_technology_config?: Json | null
          promising_threshold?: number | null
          research_approach?: Json | null
          sectors?: string[] | null
          stages?: string[] | null
          strategic_fit_config?: Json | null
          strategy_description?: string | null
          team_leadership_config?: Json | null
          updated_at?: string
        }
        Update: {
          business_traction_config?: Json | null
          check_size_max?: number | null
          check_size_min?: number | null
          created_at?: string
          deal_sourcing_strategy?: Json | null
          decision_making_process?: Json | null
          enhanced_criteria?: Json | null
          exciting_threshold?: number | null
          financial_health_config?: Json | null
          fund_id?: string
          fund_name?: string
          fund_type?: string
          geographies?: string[] | null
          id?: string
          investment_philosophy?: string | null
          key_signals?: string[] | null
          market_opportunity_config?: Json | null
          needs_development_threshold?: number | null
          organization_id?: string
          philosophy_config?: Json | null
          product_technology_config?: Json | null
          promising_threshold?: number | null
          research_approach?: Json | null
          sectors?: string[] | null
          stages?: string[] | null
          strategic_fit_config?: Json | null
          strategy_description?: string | null
          team_leadership_config?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "investment_strategies_v2_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: true
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
        ]
      }
      investment_strategy_versions: {
        Row: {
          change_reason: string | null
          changed_by: string
          created_at: string | null
          id: string
          strategy_id: string
          strategy_snapshot: Json
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          changed_by: string
          created_at?: string | null
          id?: string
          strategy_id: string
          strategy_snapshot: Json
          version_number: number
        }
        Update: {
          change_reason?: string | null
          changed_by?: string
          created_at?: string | null
          id?: string
          strategy_id?: string
          strategy_snapshot?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "investment_strategy_versions_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "investment_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queues: {
        Row: {
          completed_at: string | null
          created_at: string
          engine: string
          error_message: string | null
          expires_at: string
          id: string
          idempotency_key: string
          job_id: string
          job_payload: Json
          max_retries: number
          metadata: Json | null
          queue_name: string
          related_ids: Json
          retry_count: number
          scheduled_for: string
          source: string
          started_at: string | null
          status: string
          tenant_id: string
          trigger_reason: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          engine: string
          error_message?: string | null
          expires_at: string
          id?: string
          idempotency_key: string
          job_id: string
          job_payload: Json
          max_retries?: number
          metadata?: Json | null
          queue_name: string
          related_ids?: Json
          retry_count?: number
          scheduled_for?: string
          source: string
          started_at?: string | null
          status?: string
          tenant_id: string
          trigger_reason: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          engine?: string
          error_message?: string | null
          expires_at?: string
          id?: string
          idempotency_key?: string
          job_id?: string
          job_payload?: Json
          max_retries?: number
          metadata?: Json | null
          queue_name?: string
          related_ids?: Json
          retry_count?: number
          scheduled_for?: string
          source?: string
          started_at?: string | null
          status?: string
          tenant_id?: string
          trigger_reason?: string
          updated_at?: string
        }
        Relationships: []
      }
      kill_switches: {
        Row: {
          activated_at: string | null
          activated_by: string | null
          created_at: string
          deactivated_at: string | null
          deactivated_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          switch_name: string
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          switch_name: string
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          activated_by?: string | null
          created_at?: string
          deactivated_at?: string | null
          deactivated_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          switch_name?: string
          updated_at?: string
        }
        Relationships: []
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
      orchestrator_executions: {
        Row: {
          created_at: string
          current_step: string
          deal_id: string | null
          error_details: Json | null
          execution_token: string
          fund_id: string
          id: string
          org_id: string
          step_input: Json | null
          step_output: Json | null
          step_status: string | null
          telemetry_data: Json | null
          updated_at: string
          workflow_type: string
        }
        Insert: {
          created_at?: string
          current_step: string
          deal_id?: string | null
          error_details?: Json | null
          execution_token: string
          fund_id: string
          id?: string
          org_id: string
          step_input?: Json | null
          step_output?: Json | null
          step_status?: string | null
          telemetry_data?: Json | null
          updated_at?: string
          workflow_type: string
        }
        Update: {
          created_at?: string
          current_step?: string
          deal_id?: string | null
          error_details?: Json | null
          execution_token?: string
          fund_id?: string
          id?: string
          org_id?: string
          step_input?: Json | null
          step_output?: Json | null
          step_status?: string | null
          telemetry_data?: Json | null
          updated_at?: string
          workflow_type?: string
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
      platform_cost_monitor: {
        Row: {
          cost_amount: number
          cost_category: string
          created_at: string | null
          date: string
          fund_id: string | null
          id: string
          organization_id: string
          usage_metrics: Json | null
        }
        Insert: {
          cost_amount?: number
          cost_category: string
          created_at?: string | null
          date?: string
          fund_id?: string | null
          id?: string
          organization_id: string
          usage_metrics?: Json | null
        }
        Update: {
          cost_amount?: number
          cost_category?: string
          created_at?: string | null
          date?: string
          fund_id?: string | null
          id?: string
          organization_id?: string
          usage_metrics?: Json | null
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
      queue_processing_locks: {
        Row: {
          acquired_at: string
          expires_at: string
          id: string
          metadata: Json | null
          queue_name: string
          worker_id: string
        }
        Insert: {
          acquired_at?: string
          expires_at: string
          id?: string
          metadata?: Json | null
          queue_name: string
          worker_id: string
        }
        Update: {
          acquired_at?: string
          expires_at?: string
          id?: string
          metadata?: Json | null
          queue_name?: string
          worker_id?: string
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
      rls_policy_logs: {
        Row: {
          context_data: Json | null
          created_at: string | null
          error_message: string | null
          id: string
          operation: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          context_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          context_data?: Json | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          operation?: string
          table_name?: string
          user_id?: string | null
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
      system_maintenance_config: {
        Row: {
          affected_services: string[] | null
          analysis_engines_disabled: boolean
          background_tasks_disabled: boolean
          created_at: string
          disabled_at: string | null
          disabled_by: string | null
          estimated_completion: string | null
          id: string
          maintenance_mode: boolean
          maintenance_reason: string | null
          updated_at: string
        }
        Insert: {
          affected_services?: string[] | null
          analysis_engines_disabled?: boolean
          background_tasks_disabled?: boolean
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          estimated_completion?: string | null
          id?: string
          maintenance_mode?: boolean
          maintenance_reason?: string | null
          updated_at?: string
        }
        Update: {
          affected_services?: string[] | null
          analysis_engines_disabled?: boolean
          background_tasks_disabled?: boolean
          created_at?: string
          disabled_at?: string | null
          disabled_by?: string | null
          estimated_completion?: string | null
          id?: string
          maintenance_mode?: boolean
          maintenance_reason?: string | null
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
      vector_embeddings: {
        Row: {
          confidence_score: number | null
          content_id: string
          content_text: string
          content_type: string
          created_at: string
          embedding: string | null
          fund_id: string
          id: string
          metadata: Json | null
          updated_at: string
        }
        Insert: {
          confidence_score?: number | null
          content_id: string
          content_text: string
          content_type: string
          created_at?: string
          embedding?: string | null
          fund_id: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Update: {
          confidence_score?: number | null
          content_id?: string
          content_text?: string
          content_type?: string
          created_at?: string
          embedding?: string | null
          fund_id?: string
          id?: string
          metadata?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      vector_search_cache: {
        Row: {
          confidence_threshold: number | null
          created_at: string
          expires_at: string
          fund_id: string
          id: string
          query_hash: string
          query_text: string
          result_count: number
          results: Json
          search_type: string
        }
        Insert: {
          confidence_threshold?: number | null
          created_at?: string
          expires_at?: string
          fund_id: string
          id?: string
          query_hash: string
          query_text: string
          result_count: number
          results: Json
          search_type: string
        }
        Update: {
          confidence_threshold?: number | null
          created_at?: string
          expires_at?: string
          fund_id?: string
          id?: string
          query_hash?: string
          query_text?: string
          result_count?: number
          results?: Json
          search_type?: string
        }
        Relationships: []
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
          created_at: string
          currency: string
          fund_type: Database["public"]["Enums"]["fund_type"]
          id: string
          is_active: boolean
          name: string
          organization_id: string
          target_size: number
          updated_at: string
        }[]
      }
      admin_get_all_funds_with_orgs: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          currency: string
          description: string
          fund_type: Database["public"]["Enums"]["fund_type"]
          id: string
          is_active: boolean
          name: string
          organization_id: string
          organization_name: string
          target_size: number
          updated_at: string
        }[]
      }
      admin_get_all_organizations: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          domain: string
          id: string
          name: string
          updated_at: string
        }[]
      }
      admin_get_all_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          is_deleted: boolean
          last_name: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
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
          p_org_id?: string
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_email: string
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
          p_role: Database["public"]["Enums"]["user_role"]
          p_user_id: string
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
          invalid_org_id_count: number
          issues_found: boolean
          null_org_id_count: number
          organization_list: string[]
          severity: string
          table_name: string
          total_rows: number
          valid_org_id_count: number
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
      auto_complete_stuck_linkedin_exports: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      backfill_linkedin_exports: {
        Args: Record<PropertyKey, never>
        Returns: {
          deal_id: string
          snapshot_id: string
          status: string
        }[]
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      bytea_to_text: {
        Args: { data: string }
        Returns: string
      }
      calculate_overall_score: {
        Args: {
          financial_score?: number
          leadership_score?: number
          market_score?: number
          product_score?: number
          thesis_score?: number
          traction_score?: number
        }
        Returns: number
      }
      can_user_access_fund: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      can_user_access_profile: {
        Args: { target_org_id: string; target_user_id: string }
        Returns: boolean
      }
      can_user_access_strategy_v2: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      can_user_manage_fund: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      can_user_update_strategy: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      can_user_update_strategy_v2: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      check_analysis_limits: {
        Args: { p_fund_id: string }
        Returns: boolean
      }
      check_cost_limits: {
        Args: {
          agent_name_param: string
          current_cost_per_deal: number
          current_cost_per_minute: number
        }
        Returns: Json
      }
      cleanup_expired_execution_locks: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_llm_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_stalled_analysis_queue: {
        Args: Record<PropertyKey, never>
        Returns: {
          cleaned_count: number
          processing_count: number
        }[]
      }
      cleanup_stuck_linkedin_processes: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      cleanup_vector_search_cache: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      complete_analysis_queue_item: {
        Args: {
          error_message_param?: string
          queue_id_param: string
          success?: boolean
        }
        Returns: boolean
      }
      create_activity_with_context: {
        Args: {
          p_activity_type: string
          p_context_data?: Json
          p_deal_id?: string
          p_description?: string
          p_fund_id: string
          p_title: string
        }
        Returns: string
      }
      create_default_investment_strategy: {
        Args: {
          fund_id_param: string
          fund_type_param: Database["public"]["Enums"]["fund_type"]
        }
        Returns: string
      }
      create_default_memo_sections_for_all_deals: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_default_pipeline_stages: {
        Args: { fund_id_param: string }
        Returns: undefined
      }
      create_organization_with_admin: {
        Args: {
          admin_email: string
          admin_role?: Database["public"]["Enums"]["user_role"]
          org_domain: string
          org_name: string
        }
        Returns: {
          message: string
          organization_id: string
          success: boolean
          user_id: string
        }[]
      }
      current_user_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      detect_duplicate_sources: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      emergency_cleanup_duplicate_artifacts: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      emergency_cleanup_duplicate_sources: {
        Args: Record<PropertyKey, never>
        Returns: Json
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
          active_deals: number
          completed_analyses: number
          failed_analyses: number
          fund_count: number
          health_status: string
          last_activity: string
          organization_id: string
          organization_name: string
          queue_success_rate: number
          total_deals: number
        }[]
      }
      get_deals_analysis_readiness: {
        Args: { fund_id_param: string }
        Returns: {
          company_name: string
          completeness_score: number
          deal_id: string
          is_ready: boolean
          issue_count: number
          validation_score: number
          warning_count: number
        }[]
      }
      get_jwt_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_linkedin_processing_status: {
        Args: { target_deal_id: string }
        Returns: Json
      }
      get_queue_health_status: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_user_deal_role: {
        Args: { target_deal_id: string }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_delete: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_get: {
        Args: { data: Json; uri: string } | { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
      }
      http_list_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_post: {
        Args:
          | { content: string; content_type: string; uri: string }
          | { data: Json; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
      }
      http_reset_curlopt: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      is_admin_by_email: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_deal_analysis_complete: {
        Args: { p_deal_id: string }
        Returns: boolean
      }
      is_deal_safe_to_edit: {
        Args: { deal_id_param: string }
        Returns: boolean
      }
      is_reuben_admin: {
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
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      jwt_is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      jwt_org_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      list_platform_activities: {
        Args: { p_limit?: number; p_offset?: number }
        Returns: {
          activity_type: string
          created_at: string
          fund_id: string
          id: string
          priority: string
          title: string
          user_id: string
        }[]
      }
      monitor_analysis_quality: {
        Args: { p_analysis_type: string; p_deal_id: string }
        Returns: Json
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
      process_analysis_queue_safe: {
        Args: { batch_size?: number; max_concurrent?: number }
        Returns: Json
      }
      queue_deal_analysis: {
        Args: {
          deal_id_param: string
          delay_minutes?: number
          priority_param?: string
          trigger_reason_param?: string
        }
        Returns: string
      }
      reclaim_zombie_analysis_jobs: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      restore_archived_activities: {
        Args: {
          activity_ids?: string[]
          end_date?: string
          start_date?: string
        }
        Returns: number
      }
      set_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["user_role"]
          org_id?: string
          user_email: string
        }
        Returns: boolean
      }
      should_queue_analysis: {
        Args: { p_catalyst_type: string; p_deal_id: string; p_user_id: string }
        Returns: Json
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      text_to_bytea: {
        Args: { data: string }
        Returns: string
      }
      urlencode: {
        Args: { data: Json } | { string: string } | { string: string }
        Returns: string
      }
      user_can_access_activity: {
        Args: { activity_deal_id: string; activity_fund_id: string }
        Returns: boolean
      }
      user_can_access_deal: {
        Args: { required_role?: string; target_deal_id: string }
        Returns: boolean
      }
      user_can_access_fund: {
        Args: { target_fund_id: string }
        Returns: boolean
      }
      user_can_manage_activity: {
        Args: { activity_deal_id: string; activity_fund_id: string }
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
          claims_valid: boolean
          email: string
          is_super_admin: boolean
          missing_claims: string[]
          org_id: string
          role: string
          user_id: string
        }[]
      }
      validate_memo_workflow_transition: {
        Args: {
          current_state: string
          is_super_admin?: boolean
          new_state: string
        }
        Returns: boolean
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_similarity_search: {
        Args:
          | {
              content_type_filter?: string
              fund_id_filter?: string
              max_results?: number
              query_embedding: string
              similarity_threshold?: number
            }
          | {
              content_type_filter?: string
              fund_id_filter?: string
              max_results?: number
              query_embedding: string
              similarity_threshold?: number
            }
        Returns: {
          content_id: string
          content_text: string
          content_type: string
          fund_id: string
          metadata: Json
          similarity_score: number
        }[]
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_rls_policies_for_org: {
        Args: { test_org_id: string }
        Returns: {
          actual_result: string
          expected_behavior: string
          policy_test: string
          security_risk: string
          table_name: string
          test_passed: boolean
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
        | "linkedin_enrichment_triggered"
        | "linkedin_enrichment_api_error"
        | "linkedin_enrichment_trigger_error"
        | "linkedin_url_validation_failed"
        | "analysis_triggered"
        | "conflict_detected"
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
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown | null
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
        "linkedin_enrichment_triggered",
        "linkedin_enrichment_api_error",
        "linkedin_enrichment_trigger_error",
        "linkedin_url_validation_failed",
        "analysis_triggered",
        "conflict_detected",
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
