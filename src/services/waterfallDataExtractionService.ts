interface WaterfallResult<T> {
  value: T | string;
  source: string;
  confidence: 'high' | 'medium' | 'low';
  lastUpdated?: string;
  isFallback: boolean;
}

interface EnrichmentData {
  documents?: { data_points_vc?: any };
  vc_datapoints?: {
    deal_enrichment_crunchbase_export?: any;
    deal_enrichment_linkedin_export?: any;
    deal_enrichment_linkedin_profile_export?: any;
    deal_enrichment_perplexity_company_export_vc?: any;
    deal_enrichment_perplexity_founder_export_vc?: any;
    deal_enrichment_perplexity_market_export_vc?: any;
  };
  crunchbase?: { num_employees?: string | number; founded_date?: string; created_at?: string };
  linkedin?: { employees_in_linkedin?: number; founded?: number; created_at?: string };
  perplexity_company?: { tam?: string; sam?: string; som?: string; cagr?: string; created_at?: string };
  perplexity_founder?: { founder_name?: string; leadership_experience?: any; created_at?: string };
  perplexity_market?: { primary_industry?: string; market_cycle?: string; created_at?: string };
}

export class WaterfallDataExtractionService {
  private static isMissing(value: any): boolean {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') {
      const trimmed = value.trim().toLowerCase();
      return trimmed === '' || trimmed === 'not found' || trimmed === 'not listed';
    }
    return false;
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key];
    }, obj);
  }

  static extractEmployeeCount(data: EnrichmentData): WaterfallResult<number> {
    // Priority 1: LinkedIn Export table - employees_in_linkedin
    const linkedinEmployees = data.linkedin?.employees_in_linkedin;
    if (!this.isMissing(linkedinEmployees)) {
      return {
        value: typeof linkedinEmployees === 'number' ? linkedinEmployees : parseInt(linkedinEmployees),
        source: 'LinkedIn Export',
        confidence: 'high',
        lastUpdated: data.linkedin?.created_at,
        isFallback: false
      };
    }

    // Priority 2: Crunchbase Export table - num_employees
    const crunchbaseEmployees = data.crunchbase?.num_employees;
    if (!this.isMissing(crunchbaseEmployees)) {
      // Handle string format like "11-50" or "51-200"
      let employeeValue: number;
      if (typeof crunchbaseEmployees === 'string') {
        // Extract number from ranges like "11-50"
        const match = crunchbaseEmployees.match(/(\d+)/);
        employeeValue = match ? parseInt(match[1]) : 0;
      } else {
        employeeValue = Number(crunchbaseEmployees);
      }
      
      return {
        value: employeeValue,
        source: 'Crunchbase',
        confidence: 'medium',
        lastUpdated: data.crunchbase?.created_at,
        isFallback: false
      };
    }

    // Priority 3: VC Datapoints JSON columns - check enrichment JSON data
    const vcLinkedinData = this.getNestedValue(data.vc_datapoints, 'deal_enrichment_linkedin_export.employees_in_linkedin');
    if (!this.isMissing(vcLinkedinData)) {
      return {
        value: typeof vcLinkedinData === 'number' ? vcLinkedinData : parseInt(vcLinkedinData),
        source: 'LinkedIn Export (Stored)',
        confidence: 'medium',
        isFallback: false
      };
    }

    const vcCrunchbaseData = this.getNestedValue(data.vc_datapoints, 'deal_enrichment_crunchbase_export.num_employees');
    if (!this.isMissing(vcCrunchbaseData)) {
      return {
        value: typeof vcCrunchbaseData === 'number' ? vcCrunchbaseData : parseInt(vcCrunchbaseData),
        source: 'Crunchbase (Stored)',
        confidence: 'medium',
        isFallback: false
      };
    }

    // Fallback
    return {
      value: 'Require more information. Add LinkedIn or Crunchbase',
      source: 'fallback',
      confidence: 'low',
      isFallback: true
    };
  }

  static extractFoundingYear(data: EnrichmentData): WaterfallResult<number> {
    // Priority 1: LinkedIn Export table - founded
    const linkedinYear = data.linkedin?.founded;
    if (!this.isMissing(linkedinYear)) {
      return {
        value: typeof linkedinYear === 'number' ? linkedinYear : parseInt(linkedinYear),
        source: 'LinkedIn Export',
        confidence: 'high',
        lastUpdated: data.linkedin?.created_at,
        isFallback: false
      };
    }

    // Priority 2: Crunchbase Export table - founded_date (extract year)
    const crunchbaseYear = data.crunchbase?.founded_date;
    if (!this.isMissing(crunchbaseYear)) {
      // Extract year from date string
      const year = crunchbaseYear ? new Date(crunchbaseYear).getFullYear() : null;
      if (year && !isNaN(year)) {
        return {
          value: year,
          source: 'Crunchbase',
          confidence: 'high',
          lastUpdated: data.crunchbase?.created_at,
          isFallback: false
        };
      }
    }

    return {
      value: 'Require more information. Add LinkedIn or Crunchbase',
      source: 'fallback',
      confidence: 'low',
      isFallback: true
    };
  }

  static extractBusinessModel(data: EnrichmentData): WaterfallResult<string> {
    // Check documents first
    const docBusinessModel = this.getNestedValue(data.documents, 'data_points_vc.business_model');
    if (!this.isMissing(docBusinessModel)) {
      return {
        value: docBusinessModel,
        source: 'Documents',
        confidence: 'high',
        isFallback: false
      };
    }

    // Check any Perplexity source
    const perplexityModel = this.getNestedValue(data.perplexity_company, 'business_model') ||
                           this.getNestedValue(data.perplexity_market, 'business_model');
    if (!this.isMissing(perplexityModel)) {
      return {
        value: perplexityModel,
        source: 'Perplexity Research',
        confidence: 'medium',
        isFallback: false
      };
    }

    return {
      value: 'Require more information. Add business documents or market research',
      source: 'fallback',
      confidence: 'low',
      isFallback: true
    };
  }
}