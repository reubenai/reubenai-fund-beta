import { CRMDeal } from '../crmIntegrationService';

export class SalesforceConnector {
  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${credentials.instance_url}/services/data/v58.0/sobjects/Opportunity/describe/`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Salesforce connection test failed:', error);
      return false;
    }
  }

  async fetchDeals(credentials: Record<string, any>, syncSettings: Record<string, any> = {}): Promise<CRMDeal[]> {
    try {
      const deals: CRMDeal[] = [];
      
      // Build SOQL query
      let soql = `
        SELECT Id, Name, Amount, StageName, CloseDate, CreatedDate, LastModifiedDate, 
               Description, Type, Account.Name, Account.Website, Account.Industry,
               Account.BillingCity, Account.BillingState, Account.BillingCountry
        FROM Opportunity
      `;

      // Add date filter if specified
      if (syncSettings.last_sync_date) {
        soql += ` WHERE LastModifiedDate >= ${syncSettings.last_sync_date}`;
      }

      soql += ' ORDER BY LastModifiedDate DESC LIMIT 2000';

      const response = await fetch(`${credentials.instance_url}/services/data/v58.0/query/?q=${encodeURIComponent(soql)}`, {
        headers: {
          'Authorization': `Bearer ${credentials.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Salesforce API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      for (const opportunity of data.records) {
        const mappedDeal = this.mapSalesforceDeal(opportunity);
        if (mappedDeal) {
          deals.push(mappedDeal);
        }
      }

      return deals;
    } catch (error) {
      console.error('Error fetching Salesforce deals:', error);
      throw error;
    }
  }

  private mapSalesforceDeal(opportunity: any): CRMDeal | null {
    try {
      const account = opportunity.Account;
      
      let location = '';
      if (account?.BillingCity || account?.BillingState || account?.BillingCountry) {
        const locationParts = [
          account.BillingCity,
          account.BillingState,
          account.BillingCountry
        ].filter(Boolean);
        location = locationParts.join(', ');
      }

      return {
        external_id: opportunity.Id,
        company_name: account?.Name || opportunity.Name || 'Unknown Company',
        deal_size: opportunity.Amount ? parseFloat(opportunity.Amount) : undefined,
        stage: opportunity.StageName || '',
        status: this.mapSalesforceStatus(opportunity.StageName),
        industry: account?.Industry || '',
        location,
        website: account?.Website || '',
        description: opportunity.Description || '',
        last_updated: opportunity.LastModifiedDate || opportunity.CreatedDate,
        raw_data: opportunity
      };
    } catch (error) {
      console.error('Error mapping Salesforce deal:', error);
      return null;
    }
  }

  private mapSalesforceStatus(stage: string): string {
    const closedWonStages = ['closed won', 'closedwon'];
    const closedLostStages = ['closed lost', 'closedlost'];
    
    if (closedWonStages.includes(stage?.toLowerCase())) return 'invested';
    if (closedLostStages.includes(stage?.toLowerCase())) return 'rejected';
    return 'active';
  }
}