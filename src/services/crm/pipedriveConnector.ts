import { CRMDeal } from '../crmIntegrationService';

export class PipeDriveConnector {
  private baseUrl = 'https://api.pipedrive.com/v1';

  async testConnection(credentials: Record<string, any>): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/deals?limit=1&api_token=${credentials.api_token}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('PipeDrive connection test failed:', error);
      return false;
    }
  }

  async fetchDeals(credentials: Record<string, any>, syncSettings: Record<string, any> = {}): Promise<CRMDeal[]> {
    try {
      const deals: CRMDeal[] = [];
      let start = 0;
      const limit = 100;
      let hasMore = true;

      while (hasMore) {
        const url = new URL(`${this.baseUrl}/deals`);
        url.searchParams.set('api_token', credentials.api_token);
        url.searchParams.set('start', start.toString());
        url.searchParams.set('limit', limit.toString());
        url.searchParams.set('status', 'all_not_deleted');

        // Add date filter if specified
        if (syncSettings.last_sync_date) {
          url.searchParams.set('filter_id', 'custom'); // Would need custom filter setup
        }

        const response = await fetch(url.toString(), {
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error(`PipeDrive API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.success || !data.data) break;

        for (const deal of data.data) {
          const mappedDeal = await this.mapPipeDriveDeal(deal, credentials);
          if (mappedDeal) {
            deals.push(mappedDeal);
          }
        }

        hasMore = data.additional_data?.pagination?.more_items_in_collection;
        start += limit;
      }

      return deals;
    } catch (error) {
      console.error('Error fetching PipeDrive deals:', error);
      throw error;
    }
  }

  private async mapPipeDriveDeal(pipedriveDeal: any, credentials: Record<string, any>): Promise<CRMDeal | null> {
    try {
      // Get organization data if available
      let organizationData = null;
      if (pipedriveDeal.org_id?.value) {
        organizationData = await this.fetchOrganization(pipedriveDeal.org_id.value, credentials);
      }

      const companyName = organizationData?.name || pipedriveDeal.org_name || pipedriveDeal.title || 'Unknown Company';

      return {
        external_id: pipedriveDeal.id.toString(),
        company_name: companyName,
        deal_size: pipedriveDeal.value ? parseFloat(pipedriveDeal.value) : undefined,
        stage: pipedriveDeal.stage_name || '',
        status: this.mapPipeDriveStatus(pipedriveDeal.status),
        industry: organizationData?.category || '',
        location: organizationData?.address || '',
        website: organizationData?.website || '',
        description: pipedriveDeal.notes || '',
        founder: pipedriveDeal.person_name || '',
        last_updated: pipedriveDeal.update_time || pipedriveDeal.add_time,
        raw_data: pipedriveDeal
      };
    } catch (error) {
      console.error('Error mapping PipeDrive deal:', error);
      return null;
    }
  }

  private async fetchOrganization(organizationId: number, credentials: Record<string, any>): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/organizations/${organizationId}?api_token=${credentials.api_token}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.success ? data.data : null;
    } catch (error) {
      console.error('Error fetching PipeDrive organization:', error);
      return null;
    }
  }

  private mapPipeDriveStatus(status: string): string {
    if (status === 'won') return 'invested';
    if (status === 'lost') return 'rejected';
    return 'active';
  }
}