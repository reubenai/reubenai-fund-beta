import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ParseResult {
  id: string;
  data: any;
  status: 'success' | 'error' | 'warning';
  message: string;
  originalRow: any;
}

interface FieldMapping {
  [key: string]: string[];
}

export class CsvParsingService {
  private static fieldMapping: FieldMapping = {
    'company': ['company', 'company name', 'company_name', 'name'],
    'founder': ['founder', 'founder name', 'founder_name', 'ceo', 'founder/ceo'],
    'founder_email': ['founder email', 'founder_email', 'email', 'contact email'],
    'sector': ['sector', 'industry', 'vertical', 'space'],
    'stage': ['stage', 'round', 'funding stage', 'funding round'],
    'amount': ['amount', 'funding amount', 'investment amount', 'deal size'],
    'valuation': ['valuation', 'pre-money', 'pre_money', 'company valuation'],
    'location': ['location', 'city', 'country', 'headquarters', 'hq'],
    'description': ['description', 'summary', 'overview', 'about'],
    'website': ['website', 'url', 'web', 'site', 'company website'],
    'linkedin_url': ['linkedin', 'linkedin_url', 'linkedin url', 'linkedin profile'],
    'crunchbase_url': ['crunchbase', 'crunchbase_url', 'crunchbase url', 'crunchbase profile'],
    'employee_count': ['team size', 'employees', 'headcount', 'employee count', 'team']
  };

  static async parseFile(file: File): Promise<ParseResult[]> {
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let results: ParseResult[];
          
          if (isExcel) {
            const workbook = XLSX.read(data, { type: 'binary' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const csvData = XLSX.utils.sheet_to_csv(worksheet);
            results = this.parseCsvContent(csvData);
          } else {
            results = this.parseCsvContent(data as string);
          }
          
          resolve(results);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (isExcel) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  private static parseCsvContent(csvContent: string): ParseResult[] {
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header and one data row');
    }

    const headers = this.parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
    const results: ParseResult[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length === 0 || values.every(v => !v.trim())) continue;

      const result = this.parseRow(headers, values, i);
      results.push(result);
    }

    return results;
  }

  private static parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static parseRow(headers: string[], values: string[], rowIndex: number): ParseResult {
    const id = `row-${rowIndex}`;
    const originalRow = Object.fromEntries(headers.map((h, i) => [h, values[i] || '']));
    
    try {
      const mappedData = this.mapFields(headers, values);
      const validation = this.validateRow(mappedData);
      
      return {
        id,
        data: mappedData,
        status: validation.errors.length > 0 ? 'error' : validation.warnings.length > 0 ? 'warning' : 'success',
        message: validation.errors.length > 0 ? validation.errors[0] : validation.warnings[0] || 'Successfully parsed',
        originalRow
      };
    } catch (error) {
      return {
        id,
        data: {},
        status: 'error',
        message: `Parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        originalRow
      };
    }
  }

  private static mapFields(headers: string[], values: string[]): any {
    const mapped: any = {};
    
    // Map each field using the field mapping
    for (const [targetField, possibleHeaders] of Object.entries(this.fieldMapping)) {
      const headerIndex = headers.findIndex(h => 
        possibleHeaders.some(ph => h.includes(ph.toLowerCase()))
      );
      
      if (headerIndex !== -1 && values[headerIndex]) {
        const value = values[headerIndex].trim();
        mapped[targetField] = this.parseFieldValue(targetField, value);
      }
    }
    
    return mapped;
  }

  private static parseFieldValue(field: string, value: string): any {
    if (!value) return null;
    
    switch (field) {
      case 'amount':
      case 'valuation':
        return this.parseMoneyValue(value);
      case 'employee_count':
        return parseInt(value) || null;
      case 'website':
      case 'linkedin_url':
      case 'crunchbase_url':
        return this.normalizeUrl(value);
      case 'founder_email':
        return this.validateEmail(value) ? value : null;
      default:
        return value;
    }
  }

  private static parseMoneyValue(value: string): number | null {
    // Remove currency symbols and convert K/M suffixes
    const cleaned = value.replace(/[$,\s]/g, '').toLowerCase();
    const match = cleaned.match(/^(\d+(?:\.\d+)?)([km]?)$/);
    
    if (!match) return null;
    
    const [, number, suffix] = match;
    const base = parseFloat(number);
    
    switch (suffix) {
      case 'k': return base * 1000;
      case 'm': return base * 1000000;
      default: return base;
    }
  }

  private static normalizeUrl(url: string): string {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return `https://${url}`;
    }
    return url;
  }

  private static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private static validateRow(data: any): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Required fields
    if (!data.company) {
      errors.push('Company name is required');
    }
    
    // Warnings for missing recommended fields
    if (!data.founder) warnings.push('Founder name is missing');
    if (!data.sector) warnings.push('Sector is missing');
    if (!data.stage) warnings.push('Stage is missing');
    
    // Email validation
    if (data.founder_email && !this.validateEmail(data.founder_email)) {
      warnings.push('Invalid email format');
    }
    
    return { errors, warnings };
  }

  static async saveToDatabaseBatch(results: ParseResult[], fundId: string): Promise<string[]> {
    const validResults = results.filter(r => r.status === 'success');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) throw new Error('User not authenticated');
    
    const dealInserts = validResults.map(result => ({
      company_name: result.data.company,
      founder: result.data.founder,
      industry: result.data.sector,
      location: result.data.location,
      description: result.data.description,
      website: result.data.website,
      linkedin_url: result.data.linkedin_url,
      crunchbase_url: result.data.crunchbase_url,
      employee_count: result.data.employee_count,
      deal_size: result.data.amount,
      valuation: result.data.valuation,
      fund_id: fundId,
      created_by: user.id,
      status: 'sourced' as const,
      primary_source: 'batch_upload',
      currency: 'USD'
    }));

    const { data, error } = await supabase
      .from('deals')
      .insert(dealInserts)
      .select('id');

    if (error) throw error;
    
    return data.map(d => d.id);
  }

  static async triggerBatchAIAnalysis(dealIds: string[]): Promise<void> {
    for (const dealId of dealIds) {
      try {
        // Update status to processing
        await supabase.from('deals')
          .update({ 
            // ai_analysis_status: 'processing' - This field doesn't exist yet
            updated_at: new Date().toISOString()
          })
          .eq('id', dealId);

        // Call AI orchestrator for comprehensive analysis
        const { data, error } = await supabase.functions
          .invoke('ai-orchestrator', {
            body: { 
              action: 'comprehensive_analysis',
              dealId 
            }
          });

        if (!error && data?.success) {
          // Update with results if available
          await supabase.from('deals')
            .update({ 
              overall_score: data.overallScore || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', dealId);
        }
      } catch (error) {
        console.error(`Failed to analyze deal ${dealId}:`, error);
        // Continue with other deals even if one fails
      }
    }
  }
}