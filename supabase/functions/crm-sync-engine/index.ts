import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CRMSyncRequest {
  integration_id: string;
  sync_type?: 'full_sync' | 'incremental_sync' | 'webhook_sync';
  trigger_reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { integration_id, sync_type = 'full_sync', trigger_reason = 'manual_trigger' }: CRMSyncRequest = await req.json();

    console.log(`Starting CRM sync for integration ${integration_id}, type: ${sync_type}`);

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from('crm_integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('is_active', true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Integration not found or inactive',
          details: integrationError?.message 
        }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Create sync log entry
    const { data: syncLog, error: syncLogError } = await supabase
      .from('crm_sync_log')
      .insert({
        integration_id,
        sync_type,
        status: 'running',
        metadata: { trigger_reason }
      })
      .select()
      .single();

    if (syncLogError) {
      console.error('Error creating sync log:', syncLogError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Failed to create sync log',
          details: syncLogError.message 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Perform the actual sync
    const syncResult = await performCRMSync(integration, supabase);

    // Update sync log
    await supabase
      .from('crm_sync_log')
      .update({
        status: syncResult.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
        records_processed: syncResult.recordsProcessed,
        records_created: syncResult.recordsCreated,
        records_updated: syncResult.recordsUpdated,
        records_failed: syncResult.recordsFailed,
        error_message: syncResult.errors.length > 0 ? syncResult.errors.join('; ') : null,
        metadata: {
          trigger_reason,
          sync_duration_ms: Date.now() - new Date(syncLog.started_at).getTime(),
          errors: syncResult.errors
        }
      })
      .eq('id', syncLog.id);

    // Update integration last sync time
    if (syncResult.success) {
      await supabase
        .from('crm_integrations')
        .update({ last_sync_at: new Date().toISOString() })
        .eq('id', integration_id);
    }

    console.log(`CRM sync completed for integration ${integration_id}:`, syncResult);

    return new Response(
      JSON.stringify({
        success: syncResult.success,
        sync_log_id: syncLog.id,
        records_processed: syncResult.recordsProcessed,
        records_created: syncResult.recordsCreated,
        records_updated: syncResult.recordsUpdated,
        records_failed: syncResult.recordsFailed,
        errors: syncResult.errors
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('CRM sync engine error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function performCRMSync(integration: any, supabase: any) {
  let recordsCreated = 0;
  let recordsUpdated = 0;
  let recordsFailed = 0;
  const errors: string[] = [];
  let crmDeals: any[] = [];

  try {
    // Fetch deals based on CRM type
    crmDeals = await fetchCRMDeals(integration);
    
    for (const crmDeal of crmDeals) {
      try {
        // Map CRM fields to ReubenAI deal fields
        const mappedDeal = mapCRMDeal(crmDeal, integration);

        // Check if deal already exists
        const { data: existingDeal } = await supabase
          .from('deals')
          .select('id')
          .eq('crm_external_id', crmDeal.external_id)
          .eq('crm_integration_id', integration.id)
          .maybeSingle();

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
          // Create new deal
          const { error } = await supabase
            .from('deals')
            .insert({
              organization_id: integration.organization_id,
              fund_id: integration.fund_id,
              company_name: mappedDeal.company_name,
              deal_size: mappedDeal.deal_size,
              valuation: mappedDeal.valuation,
              status: mappedDeal.status || 'sourced',
              industry: mappedDeal.industry,
              location: mappedDeal.location,
              website: mappedDeal.website,
              description: mappedDeal.description,
              founder: mappedDeal.founder,
              founder_email: mappedDeal.founder_email,
              linkedin_url: mappedDeal.linkedin_url,
              crunchbase_url: mappedDeal.crunchbase_url,
              crm_source: integration.crm_type,
              crm_external_id: crmDeal.external_id,
              crm_integration_id: integration.id,
              last_crm_sync: new Date().toISOString(),
              created_by: integration.created_by
            });

          if (error) throw error;
          recordsCreated++;
          
          // Queue the new deal for enrichment and analysis using existing pipeline
          await queueDealForProcessing(supabase, crmDeal.external_id, integration.fund_id);
        }
      } catch (error) {
        console.error(`Error processing deal ${crmDeal.external_id}:`, error);
        errors.push(`Deal ${crmDeal.external_id}: ${error.message}`);
        recordsFailed++;
      }
    }
  } catch (error) {
    console.error('Error fetching CRM deals:', error);
    errors.push(`Failed to fetch deals from ${integration.crm_type}: ${error.message}`);
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

async function fetchCRMDeals(integration: any): Promise<any[]> {
  // This is a simplified version - in production, you'd have full CRM connector logic
  // For now, return empty array to prevent errors
  console.log(`Fetching deals from ${integration.crm_type} (placeholder implementation)`);
  return [];
}

function mapCRMDeal(crmDeal: any, integration: any) {
  // Basic mapping - would be enhanced with full field mapping logic
  return {
    company_name: crmDeal.company_name || crmDeal.name || 'Unknown Company',
    deal_size: crmDeal.deal_size || crmDeal.amount,
    valuation: crmDeal.valuation,
    industry: crmDeal.industry,
    location: crmDeal.location,
    website: crmDeal.website,
    description: crmDeal.description,
    founder: crmDeal.founder,
    founder_email: crmDeal.founder_email,
    linkedin_url: crmDeal.linkedin_url,
    crunchbase_url: crmDeal.crunchbase_url,
    status: 'sourced' // Default status for new CRM deals
  };
}

async function queueDealForProcessing(supabase: any, dealId: string, fundId: string) {
  try {
    // Use the existing universal deal processor to handle enrichment and analysis
    await supabase.functions.invoke('universal-deal-processor', {
      body: {
        dealData: { id: dealId },
        source: 'crm_sync',
        fundId,
        options: {
          skipEnrichment: false,
          skipAnalysis: false,
          priority: 'normal'
        }
      }
    });
  } catch (error) {
    console.error('Error queuing deal for processing:', error);
    // Don't throw - sync should continue even if queuing fails
  }
}