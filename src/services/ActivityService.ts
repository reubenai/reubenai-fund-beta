import { supabase } from '@/integrations/supabase/client';

export type ActivityType = 
  | 'deal_created'
  | 'deal_updated' 
  | 'deal_stage_changed'
  | 'deal_deleted'
  | 'deal_note_added'
  | 'deal_analysis_started'
  | 'deal_analysis_completed'
  | 'document_uploaded'
  | 'pitch_deck_uploaded'
  | 'fund_created'
  | 'fund_updated'
  | 'criteria_updated'
  | 'team_member_invited'
  | 'team_member_joined'
  | 'meeting_scheduled'
  | 'investment_decision'
  | 'system_event';

export type ActivityPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ActivityEvent {
  id: string;
  fund_id: string;
  user_id: string;
  activity_type: ActivityType;
  priority: ActivityPriority;
  title: string;
  description?: string;
  deal_id?: string;
  resource_type?: string;
  resource_id?: string;
  context_data?: any;
  change_data?: any;
  tags?: string[];
  searchable_content?: string;
  session_id?: string;
  source_ip?: string;
  user_agent?: string;
  created_at: string;
  updated_at: string;
  occurred_at: string;
  is_system_event: boolean;
  is_visible: boolean;
  retention_date?: string;
}

export interface CreateActivityInput {
  fund_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  deal_id?: string;
  resource_type?: string;
  resource_id?: string;
  context_data?: Record<string, any>;
  change_data?: Record<string, any>;
  tags?: string[];
  priority?: ActivityPriority;
  occurred_at?: string;
  is_system_event?: boolean;
}

export interface ActivityFilters {
  fund_id?: string;
  deal_id?: string;
  activity_types?: ActivityType[];
  priorities?: ActivityPriority[];
  date_from?: string;
  date_to?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

class ActivityService {
  private getSessionInfo() {
    return {
      session_id: crypto.randomUUID(),
      user_agent: navigator.userAgent
    };
  }

  async createActivity(input: CreateActivityInput): Promise<ActivityEvent | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const sessionInfo = this.getSessionInfo();
      
      const { data, error } = await supabase
        .from('activity_events')
        .insert({
          ...input,
          user_id: user.id,
          priority: input.priority || 'medium',
          occurred_at: input.occurred_at || new Date().toISOString(),
          is_system_event: input.is_system_event || false,
          ...sessionInfo
        })
        .select()
        .single();

      if (error) throw error;
      return data as ActivityEvent;
    } catch (error) {
      console.error('Error creating activity:', error);
      return null;
    }
  }

  async getActivities(filters: ActivityFilters = {}): Promise<ActivityEvent[]> {
    try {
      let query = supabase
        .from('activity_events')
        .select('*')
        .eq('is_visible', true)
        .order('occurred_at', { ascending: false });

      if (filters.fund_id) {
        query = query.eq('fund_id', filters.fund_id);
      }

      if (filters.deal_id) {
        query = query.eq('deal_id', filters.deal_id);
      }

      if (filters.activity_types?.length) {
        query = query.in('activity_type', filters.activity_types);
      }

      if (filters.priorities?.length) {
        query = query.in('priority', filters.priorities);
      }

      if (filters.date_from) {
        query = query.gte('occurred_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('occurred_at', filters.date_to);
      }

      if (filters.search) {
        query = query.textSearch('searchable_content', filters.search);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as ActivityEvent[];
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  async getRecentActivities(fundId: string, limit: number = 20): Promise<ActivityEvent[]> {
    return this.getActivities({
      fund_id: fundId,
      limit
    });
  }

  async getDealActivities(dealId: string, limit: number = 50): Promise<ActivityEvent[]> {
    return this.getActivities({
      deal_id: dealId,
      limit
    });
  }

  async searchActivities(fundId: string, searchQuery: string, limit: number = 50): Promise<ActivityEvent[]> {
    return this.getActivities({
      fund_id: fundId,
      search: searchQuery,
      limit
    });
  }

  // Helper methods for common activities
  async logDealCreated(fundId: string, dealId: string, companyName: string, context?: Record<string, any>) {
    return this.createActivity({
      fund_id: fundId,
      activity_type: 'deal_created',
      title: `New deal created: ${companyName}`,
      description: `Created a new deal for ${companyName}`,
      deal_id: dealId,
      resource_type: 'deal',
      resource_id: dealId,
      context_data: { company_name: companyName, ...context },
      priority: 'medium',
      tags: ['deal', 'created']
    });
  }

  async logDealStageChanged(fundId: string, dealId: string, companyName: string, fromStage: string, toStage: string) {
    return this.createActivity({
      fund_id: fundId,
      activity_type: 'deal_stage_changed',
      title: `Deal moved: ${companyName}`,
      description: `Moved ${companyName} from ${fromStage} to ${toStage}`,
      deal_id: dealId,
      resource_type: 'deal',
      resource_id: dealId,
      context_data: { 
        company_name: companyName,
        stage_from: fromStage,
        stage_to: toStage
      },
      change_data: {
        from: fromStage,
        to: toStage
      },
      priority: 'medium',
      tags: ['deal', 'stage_change', fromStage, toStage]
    });
  }

  async logDealUpdated(fundId: string, dealId: string, companyName: string, changes: Record<string, any>) {
    return this.createActivity({
      fund_id: fundId,
      activity_type: 'deal_updated',
      title: `Deal updated: ${companyName}`,
      description: `Updated details for ${companyName}`,
      deal_id: dealId,
      resource_type: 'deal',
      resource_id: dealId,
      context_data: { company_name: companyName },
      change_data: changes,
      priority: 'low',
      tags: ['deal', 'updated']
    });
  }

  async logDealDeleted(fundId: string, companyName: string, context?: Record<string, any>) {
    return this.createActivity({
      fund_id: fundId,
      activity_type: 'deal_deleted',
      title: `Deal deleted: ${companyName}`,
      description: `Deleted deal for ${companyName}`,
      resource_type: 'deal',
      context_data: { company_name: companyName, ...context },
      priority: 'medium',
      tags: ['deal', 'deleted']
    });
  }

  async logDealNoteAdded(fundId: string, dealId: string, companyName: string) {
    return this.createActivity({
      fund_id: fundId,
      activity_type: 'deal_note_added',
      title: `Note added to ${companyName}`,
      description: `Added a new note to ${companyName}`,
      deal_id: dealId,
      resource_type: 'deal_note',
      resource_id: dealId,
      context_data: { company_name: companyName },
      priority: 'low',
      tags: ['deal', 'note']
    });
  }
}

export const activityService = new ActivityService();