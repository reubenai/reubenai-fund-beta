import { CRMDeal } from '../crmIntegrationService';

export interface MappedDeal {
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
}

export class CRMFieldMapper {
  mapToReubenAI(crmDeal: CRMDeal, customMappings: Record<string, any> = {}): MappedDeal {
    const mapped: MappedDeal = {
      company_name: crmDeal.company_name || '',
    };

    // Apply standard mappings
    if (crmDeal.deal_size) mapped.deal_size = this.parseNumber(crmDeal.deal_size);
    if (crmDeal.valuation) mapped.valuation = this.parseNumber(crmDeal.valuation);
    if (crmDeal.stage) mapped.stage = this.mapStage(crmDeal.stage);
    if (crmDeal.status) mapped.status = this.mapStatus(crmDeal.status);
    if (crmDeal.industry) mapped.industry = crmDeal.industry;
    if (crmDeal.location) mapped.location = crmDeal.location;
    if (crmDeal.website) mapped.website = this.cleanUrl(crmDeal.website);
    if (crmDeal.description) mapped.description = crmDeal.description;
    if (crmDeal.founder) mapped.founder = crmDeal.founder;
    if (crmDeal.founder_email) mapped.founder_email = crmDeal.founder_email;
    if (crmDeal.linkedin_url) mapped.linkedin_url = this.cleanUrl(crmDeal.linkedin_url);
    if (crmDeal.crunchbase_url) mapped.crunchbase_url = this.cleanUrl(crmDeal.crunchbase_url);

    // Apply custom field mappings if provided
    if (customMappings) {
      Object.entries(customMappings).forEach(([crmField, reubenField]) => {
        if (crmDeal.raw_data[crmField] && reubenField && reubenField in mapped) {
          (mapped as any)[reubenField] = crmDeal.raw_data[crmField];
        }
      });
    }

    return mapped;
  }

  private parseNumber(value: any): number | undefined {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^0-9.-]/g, ''));
      return isNaN(parsed) ? undefined : parsed;
    }
    return undefined;
  }

  private mapStage(stage: string): string {
    const stageMap: Record<string, string> = {
      // HubSpot stages
      'lead': 'Sourced',
      'qualified': 'Screening',
      'proposal': 'Investment Committee',
      'negotiation': 'Due Diligence',
      'closed-won': 'Invested',
      'closed-lost': 'Rejected',

      // Salesforce stages
      'prospecting': 'Sourced',
      'qualification': 'Screening',
      'needs-analysis': 'Investment Committee',
      'value-proposition': 'Due Diligence',
      'decision-makers': 'Due Diligence',
      'proposal-price-quote': 'Due Diligence',
      'negotiation-review': 'Due Diligence',
      'sf-closed-won': 'Invested',
      'sf-closed-lost': 'Rejected',

      // Affinity stages
      'sourced': 'Sourced',
      'initial-review': 'Screening',
      'partner-meeting': 'Investment Committee',
      'due-diligence': 'Due Diligence',
      'investment-committee': 'Investment Committee',
      'term-sheet': 'Approved',
      'affinity-closed': 'Invested',
      'passed': 'Rejected',

      // PipeDrive stages (common)
      'contact-made': 'Sourced',
      'qualified-to-buy': 'Screening',
      'presentation-scheduled': 'Investment Committee',
      'decision-maker-bought-in': 'Due Diligence',
      'contract-sent': 'Approved',
      'pipedrive-closed-deal': 'Invested',
      'pipedrive-lost': 'Rejected'
    };

    const normalizedStage = stage.toLowerCase().replace(/\s+/g, '-');
    return stageMap[normalizedStage] || 'Sourced';
  }

  private mapStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'active': 'active',
      'inactive': 'inactive',
      'won': 'invested',
      'lost': 'rejected',
      'closed': 'invested',
      'open': 'active'
    };

    const normalizedStatus = status.toLowerCase();
    return statusMap[normalizedStatus] || 'active';
  }

  private cleanUrl(url: string): string {
    if (!url) return '';
    
    // Add https:// if no protocol is specified
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    
    return url;
  }
}