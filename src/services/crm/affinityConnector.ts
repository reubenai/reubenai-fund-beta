import { CRMDeal } from '../crmIntegrationService';

export class AffinityConnector {
  private baseUrl = 'https://api.affinity.co';

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/lists`, {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.api_key}`)}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Affinity connection test failed:', error);
      return false;
    }
  }

  async fetchDeals(credentials: Record<string, any>, syncSettings: Record<string, any> = {}): Promise<CRMDeal[]> {
    try {
      const deals: CRMDeal[] = [];
      
      // First, get all lists to find deal/opportunity lists
      const lists = await this.fetchLists(credentials);
      const dealLists = lists.filter(list => 
        list.type === 'opportunity' || 
        list.name.toLowerCase().includes('deal') ||
        list.name.toLowerCase().includes('investment')
      );

      for (const list of dealLists) {
        const listEntries = await this.fetchListEntries(list.id, credentials, syncSettings);
        
        for (const entry of listEntries) {
          const mappedDeal = await this.mapAffinityDeal(entry, credentials);
          if (mappedDeal) {
            deals.push(mappedDeal);
          }
        }
      }

      return deals;
    } catch (error) {
      console.error('Error fetching Affinity deals:', error);
      throw error;
    }
  }

  private async fetchLists(credentials: Record<string, any>): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/lists`, {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.api_key}`)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Affinity API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Affinity lists:', error);
      return [];
    }
  }

  private async fetchListEntries(listId: number, credentials: Record<string, any>, syncSettings: Record<string, any> = {}): Promise<any[]> {
    try {
      const url = new URL(`${this.baseUrl}/lists/${listId}/list-entries`);
      
      if (syncSettings.last_sync_date) {
        url.searchParams.set('min_last_modified', syncSettings.last_sync_date);
      }

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.api_key}`)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Affinity API error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching Affinity list entries:', error);
      return [];
    }
  }

  private async mapAffinityDeal(entry: any, credentials: Record<string, any>): Promise<CRMDeal | null> {
    try {
      // Get the organization/company data
      let organizationData = null;
      if (entry.entity_id && entry.entity_type === 1) { // Type 1 is organization
        organizationData = await this.fetchOrganization(entry.entity_id, credentials);
      }

      const fieldValues = entry.field_values || [];
      const dealSize = this.extractFieldValue(fieldValues, ['deal size', 'amount', 'investment amount']);
      const valuation = this.extractFieldValue(fieldValues, ['valuation', 'pre-money', 'post-money']);
      const stage = this.extractFieldValue(fieldValues, ['stage', 'status', 'investment stage']);

      return {
        external_id: `${entry.list_id}_${entry.entity_id}`,
        company_name: organizationData?.name || entry.entity?.name || 'Unknown Company',
        deal_size: dealSize ? parseFloat(dealSize.toString()) : undefined,
        valuation: valuation ? parseFloat(valuation.toString()) : undefined,
        stage: stage?.toString() || '',
        status: this.mapAffinityStatus(stage?.toString()),
        industry: organizationData?.industry || '',
        location: organizationData?.location || '',
        website: organizationData?.domain || '',
        description: entry.notes || '',
        last_updated: entry.last_modified,
        raw_data: entry
      };
    } catch (error) {
      console.error('Error mapping Affinity deal:', error);
      return null;
    }
  }

  private async fetchOrganization(organizationId: number, credentials: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}`, {
        headers: {
          'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.api_key}`)}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      return await response.json();
    } catch (error) {
      console.error('Error fetching Affinity organization:', error);
      return null;
    }
  }

  private extractFieldValue(fieldValues: any[], fieldNames: string[]): any {
    for (const fieldName of fieldNames) {
      const field = fieldValues.find(fv => 
        fv.field?.name?.toLowerCase().includes(fieldName.toLowerCase())
      );
      if (field && field.value) {
        return field.value;
      }
    }
    return null;
  }

  private mapAffinityStatus(stage: string): string {
    if (!stage) return 'active';
    
    const lowerStage = stage.toLowerCase();
    
    if (lowerStage.includes('closed') || lowerStage.includes('invested')) return 'invested';
    if (lowerStage.includes('passed') || lowerStage.includes('rejected')) return 'rejected';
    return 'active';
  }
}