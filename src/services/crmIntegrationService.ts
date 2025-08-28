import { supabase } from '@/integrations/supabase/client';
import { HubSpotConnector } from './crm/hubspotConnector';
import { SalesforceConnector } from './crm/salesforceConnector';
import { AffinityConnector } from './crm/affinityConnector';
import { PipeDriveConnector } from './crm/pipedriveConnector';
import { CRMFieldMapper } from './crm/crmFieldMapper';

export type CRMType = 'hubspot' | 'salesforce' | 'affinity' | 'pipedrive';

export interface CRMIntegration {
  id: string;
  organization_id: string;
  fund_id?: string;
  crm_type: string;
  connection_name: string;
  credentials: any;
  field_mappings: any;
  sync_settings: any;
  is_active: boolean;
  last_sync_at?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CRMDeal {
  external_id: string;
  company_name: string;
  deal_size?: number;
  valuation?: number;
  stage?: string;
  status?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  founder?: string;
  founder_email?: string;
  linkedin_url?: string;
  crunchbase_url?: string;
  last_updated?: string;
  raw_data: Record<string, any>;
}

export interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsFailed: number;
  errors: string[];
}

export class CRMIntegrationService {
  private connectors: Map<CRMType, any> = new Map();
  private fieldMapper = new CRMFieldMapper();

  constructor() {
    this.connectors.set('hubspot', new HubSpotConnector());
    this.connectors.set('salesforce', new SalesforceConnector());
    this.connectors.set('affinity', new AffinityConnector());
    this.connectors.set('pipedrive', new PipeDriveConnector());
  }

  async createIntegration(
    organizationId: string,
    fundId: string,
    crmType: CRMType,
    connectionName: string,
    credentials: Record<string, any>,
    fieldMappings: Record<string, any> = {},
    syncSettings: Record<string, any> = {}
  ): Promise<CRMIntegration | null> {
    try {
      const { data, error } = await supabase
        .from('crm_integrations')
        .insert({
          organization_id: organizationId,
          fund_id: fundId,
          crm_type: crmType,
          connection_name: connectionName,
          credentials,
          field_mappings: fieldMappings,
          sync_settings: {
            auto_sync: true,
            sync_frequency: '1h',
            ...syncSettings
          }
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating CRM integration:', error);
      return null;
    }
  }

  async getIntegrations(organizationId: string, fundId?: string): Promise<CRMIntegration[]> {
    try {
      let query = supabase
        .from('crm_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true);

      if (fundId) {
        query = query.eq('fund_id', fundId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching CRM integrations:', error);
      return [];
    }
  }

  async testConnection(integration: CRMIntegration): Promise<boolean> {
    try {
      const connector = this.connectors.get(integration.crm_type as CRMType);
      if (!connector) return false;

      return await connector.testConnection(integration.credentials);
    } catch (error) {
      console.error('Error testing CRM connection:', error);
      return false;
    }
  }

  async syncDeals(integrationId: string): Promise<SyncResult> {
    try {
      // Get integration details
      const { data: integration, error } = await supabase
        .from('crm_integrations')
        .select('*')
        .eq('id', integrationId)
        .single();

      if (error || !integration) {
        throw new Error('Integration not found');
      }

      // Create sync log entry
      const { data: syncLog, error: syncLogError } = await supabase
        .from('crm_sync_log')
        .insert({
          integration_id: integrationId,
          sync_type: 'full_sync',
          status: 'running'
        })
        .select()
        .single();

      if (syncLogError) throw syncLogError;

      const connector = this.connectors.get(integration.crm_type as CRMType);
      if (!connector) {
        throw new Error(`Connector not found for ${integration.crm_type}`);
      }

      // Fetch deals from CRM
      const crmDeals = await connector.fetchDeals(integration.credentials, integration.sync_settings);
      
      // Map and process deals
      const result = await this.processDeals(crmDeals, integration, syncLog.id);

      // Update sync log
      await supabase
        .from('crm_sync_log')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          records_processed: result.recordsProcessed,
          records_created: result.recordsCreated,
          records_updated: result.recordsUpdated,
          records_failed: result.recordsFailed
        })
        .eq('id', syncLog.id);

      // Update integration last sync time
      await supabase
        .from('crm_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integrationId);

      return result;
    } catch (error) {
      console.error('Error syncing deals:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errors: [error.message]
      };
    }
  }

  private async processDeals(
    crmDeals: CRMDeal[],
    integration: CRMIntegration,
    syncLogId: string
  ): Promise<SyncResult> {
    let recordsCreated = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    for (const crmDeal of crmDeals) {
      try {
        // Map CRM fields to ReubenAI deal fields
        const mappedDeal = this.fieldMapper.mapToReubenAI(crmDeal, integration.field_mappings);

        // Check if deal already exists
        const { data: existingDeal } = await supabase
          .from('deals')
          .select('id')
          .eq('crm_external_id', crmDeal.external_id)
          .eq('crm_integration_id', integration.id)
          .single();

        if (existingDeal) {
          // Update existing deal
          const { error } = await supabase
            .from('deals')
            .update({
              company_name: mappedDeal.company_name,
              deal_size: mappedDeal.deal_size,
              valuation: mappedDeal.valuation,
              industry: mappedDeal.industry,
              location: mappedDeal.location,
              website: mappedDeal.website,
              description: mappedDeal.description,
              founder: mappedDeal.founder,
              founder_email: mappedDeal.founder_email,
              linkedin_url: mappedDeal.linkedin_url,
              crunchbase_url: mappedDeal.crunchbase_url,
              last_crm_sync: new Date().toISOString()
            })
            .eq('id', existingDeal.id);

          if (error) throw error;
          recordsUpdated++;
        } else {
          // Create new deal - map status to valid enum value
          const dealStatus = this.mapStatusToEnum(mappedDeal.status);
          
          const { error } = await supabase
            .from('deals')
            .insert({
              organization_id: integration.organization_id,
              fund_id: integration.fund_id,
              company_name: mappedDeal.company_name,
              deal_size: mappedDeal.deal_size,
              valuation: mappedDeal.valuation,
              status: dealStatus,
              industry: mappedDeal.industry,
              location: mappedDeal.location,
              website: mappedDeal.website,
              description: mappedDeal.description,
              founder: mappedDeal.founder,
              founder_email: mappedDeal.founder_email,
              linkedin_url: mappedDeal.linkedin_url,
              crunchbase_url: mappedDeal.crunchbase_url,
              crm_source: integration.crm_type as CRMType,
              crm_external_id: crmDeal.external_id,
              crm_integration_id: integration.id,
              last_crm_sync: new Date().toISOString(),
              created_by: integration.created_by
            });

          if (error) throw error;
          recordsCreated++;
        }
      } catch (error) {
        console.error(`Error processing deal ${crmDeal.external_id}:`, error);
        errors.push(`Deal ${crmDeal.external_id}: ${error.message}`);
        recordsFailed++;
      }
    }

    return {
      success: errors.length === 0,
      recordsProcessed: crmDeals.length,
      recordsCreated,
      recordsUpdated,
      recordsFailed,
      errors
    };
  }

  private mapStatusToEnum(status?: string): 'sourced' | 'screening' | 'due_diligence' | 'investment_committee' | 'approved' | 'rejected' | 'invested' | 'archived' {
    if (!status) return 'sourced';
    
    const statusMap: Record<string, any> = {
      'active': 'sourced',
      'invested': 'invested',
      'rejected': 'rejected'
    };
    
    return statusMap[status] || 'sourced';
  }

  async deleteIntegration(integrationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('crm_integrations')
        .update({ is_active: false })
        .eq('id', integrationId);

      return !error;
    } catch (error) {
      console.error('Error deleting CRM integration:', error);
      return false;
    }
  }
}

export const crmIntegrationService = new CRMIntegrationService();