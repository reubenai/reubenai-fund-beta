import { CRMDeal } from '../crmIntegrationService';

export class HubSpotConnector {
  private baseUrl = 'https://api.hubapi.com';

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/deals?limit=1`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('HubSpot connection test failed:', error);
      return false;
    }
  }

  async fetchDeals(credentials: Record<string, any>, syncSettings: Record<string, any> = {}): Promise<CRMDeal[]> {
    try {
      const deals: CRMDeal[] = [];
      let hasMore = true;
      let after = '';

      const properties = [
        'dealname',
        'amount',
        'dealstage',
        'closedate',
        'createdate',
        'hs_lastmodifieddate',
        'pipeline',
        'dealtype',
        'description'
      ];

      while (hasMore) {
        const url = new URL(`${this.baseUrl}/crm/v3/objects/deals`);
        url.searchParams.set('limit', '100');
        url.searchParams.set('properties', properties.join(','));
        url.searchParams.set('associations', 'company,contact');
        
        if (after) {
          url.searchParams.set('after', after);
        }

        // Add date filter if specified in sync settings
        if (syncSettings.last_sync_date) {
          url.searchParams.set('filterGroups', JSON.stringify([{
            filters: [{
              propertyName: 'hs_lastmodifieddate',
              operator: 'GTE',
              value: syncSettings.last_sync_date
            }]
          }]));
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Authorization': `Bearer ${credentials.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        for (const deal of data.results) {
          const mappedDeal = await this.mapHubSpotDeal(deal, credentials);
          if (mappedDeal) {
            deals.push(mappedDeal);
          }
        }

        hasMore = !!data.paging?.next;
        after = data.paging?.next?.after || '';
      }

      return deals;
    } catch (error) {
      console.error('Error fetching HubSpot deals:', error);
      throw error;
    }
  }

  private async mapHubSpotDeal(hubspotDeal: any, credentials: Record<string, any>): Promise<CRMDeal | null> {
    try {
      const properties = hubspotDeal.properties;
      
      // Get associated company data
      let companyName = properties.dealname || 'Unknown Company';
      let website = '';
      let industry = '';
      let location = '';

      if (hubspotDeal.associations?.companies?.results?.length > 0) {
        const companyId = hubspotDeal.associations.companies.results[0].id;
        const companyData = await this.fetchCompanyData(companyId, credentials);
        if (companyData) {
          companyName = companyData.name || companyName;
          website = companyData.domain || companyData.website || '';
          industry = companyData.industry || '';
          location = companyData.city && companyData.state 
            ? `${companyData.city}, ${companyData.state}` 
            : companyData.city || companyData.state || '';
        }
      }

      return {
        external_id: hubspotDeal.id,
        company_name: companyName,
        deal_size: properties.amount ? parseFloat(properties.amount) : undefined,
        stage: properties.dealstage || '',
        status: this.mapHubSpotStatus(properties.dealstage),
        industry,
        location,
        website,
        description: properties.description || '',
        last_updated: properties.hs_lastmodifieddate || properties.createdate,
        raw_data: hubspotDeal
      };
    } catch (error) {
      console.error('Error mapping HubSpot deal:', error);
      return null;
    }
  }

  private async fetchCompanyData(companyId: string, credentials: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/crm/v3/objects/companies/${companyId}?properties=name,domain,website,industry,city,state`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.properties;
    } catch (error) {
      console.error('Error fetching HubSpot company data:', error);
      return null;
    }
  }

  private mapHubSpotStatus(stage: string): string {
    const closedWonStages = ['closedwon', 'closed-won'];
    const closedLostStages = ['closedlost', 'closed-lost'];
    
    if (closedWonStages.includes(stage?.toLowerCase())) return 'invested';
    if (closedLostStages.includes(stage?.toLowerCase())) return 'rejected';
    return 'active';
  }
}