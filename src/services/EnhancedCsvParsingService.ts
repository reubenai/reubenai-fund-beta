import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ParseResult {
  id: string;
  data: any;
  status: 'success' | 'error' | 'warning';
  message: string;
  originalRow: any;
  pitchDeckFile?: File;
  removed?: boolean;
}

interface FieldMapping {
  [key: string]: string[];
}

export class EnhancedCsvParsingService {
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
    
    // Only require company name as absolute requirement
    if (!data.company) {
      errors.push('Company name is required');
    }
    
    // Only warn for truly problematic data, not missing optional fields
    if (data.founder_email && !this.validateEmail(data.founder_email)) {
      warnings.push('Invalid email format');
    }
    
    // Missing founder, sector, stage are common and acceptable - don't warn about them
    // These fields are nice-to-have but not critical for initial deal creation
    
    return { errors, warnings };
  }

  static async saveToDatabaseBatch(results: ParseResult[], fundId: string): Promise<string[]> {
    // Allow deals with warnings to be processed - they just have minor data quality issues
    const validResults = results.filter(r => (r.status === 'success' || r.status === 'warning') && !r.removed);
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

    // Process each deal through universal processor
    const dealIds: string[] = [];
    
    for (const dealData of dealInserts) {
      try {
        const { data: response, error } = await supabase.functions.invoke('universal-deal-processor', {
          body: {
            dealData,
            source: 'batch_csv',
            fundId,
            options: {
              priority: 'normal',
              metadata: { batchUpload: true }
            }
          }
        });

        if (error) throw error;
        if (response?.result?.dealId) {
          dealIds.push(response.result.dealId);
        }
      } catch (error) {
        console.error(`Failed to process deal ${dealData.company_name}:`, error);
        // Fallback: direct insert without processing
        const { data: fallbackDeal, error: insertError } = await supabase
          .from('deals')
          .insert(dealData)
          .select('id')
          .single();
        
        if (!insertError && fallbackDeal) {
          dealIds.push(fallbackDeal.id);
        }
      }
    }
    
    return dealIds;
  }

  static async uploadPitchDeck(dealId: string, file: File, companyName: string): Promise<void> {
    try {
      // Clean company name for file naming
      const cleanCompanyName = companyName.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
      const fileExt = file.name.split('.').pop();
      const fileName = `${cleanCompanyName}_Pitch_Deck.${fileExt}`;
      const filePath = `${dealId}/${fileName}`;
      
      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('deal-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Store document metadata
      const { data: documentRecord, error: dbError } = await supabase
        .from('deal_documents')
        .insert({
          deal_id: dealId,
          name: fileName,
          file_path: uploadData.path,
          file_size: file.size,
          content_type: file.type,
          document_type: 'Pitch Deck',
          document_category: 'pitch_deck',
          uploaded_by: user.id,
          storage_path: uploadData.path,
          bucket_name: 'deal-documents',
          metadata: {
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            batchUpload: true
          }
        })
        .select('id')
        .single();

      if (dbError) throw dbError;

      // Trigger document processing
      await supabase.functions.invoke('document-processor', {
        body: {
          documentId: documentRecord.id,
          analysisType: 'quick'
        }
      });

      console.log(`Successfully uploaded pitch deck for ${companyName}: ${fileName}`);
    } catch (error) {
      console.error(`Failed to upload pitch deck for ${companyName}:`, error);
      throw error;
    }
  }

  static async triggerBatchAnalysis(dealIds: string[]): Promise<void> {
    // Universal processor already handles analysis queueing
    // This method is now primarily for backward compatibility
    console.log('Batch analysis already triggered via universal processor for deals:', dealIds);
  }
}