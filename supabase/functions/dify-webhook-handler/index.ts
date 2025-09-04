import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DifyWebhookPayload {
  company_name: string;
  industry: string;
  fund_type: 'vc' | 'pe';
  fund_name: string;
  deal_size?: number;
  valuation?: number;
  location?: string;
  founder: string;
  created_at: string;
  deal_id: string;
  organization_id: string;
  fund_id: string;
  status: string;
  event_type: string;
}

interface WebhookConfig {
  id: string;
  webhook_url: string;
  config_data: Record<string, any>;
  is_active: boolean;
  service_name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      'https://bueuioozcgmedkuxawju.supabase.co',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('Received webhook trigger:', body);

    const { deal_id, event_type, deal_data } = body;

    if (!deal_id || !deal_data) {
      console.error('Missing deal_id or deal_data');
      return new Response(
        JSON.stringify({ error: 'Missing deal_id or deal_data' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get fund information
    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select('name, fund_type, organization_id')
      .eq('id', deal_data.fund_id)
      .single();

    if (fundError) {
      console.error('Error fetching fund:', fundError);
      return new Response(
        JSON.stringify({ error: 'Fund not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get active webhook configurations for this organization
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('organization_id', deal_data.organization_id)
      .eq('service_name', 'dify')
      .eq('is_active', true);

    if (configError) {
      console.error('Error fetching webhook configs:', configError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch webhook configs' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log('No active Dify webhook configurations found for organization:', deal_data.organization_id);
      return new Response(
        JSON.stringify({ message: 'No active webhook configurations found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Prepare Dify payload
    const difyPayload: DifyWebhookPayload = {
      company_name: deal_data.company_name || 'Unknown Company',
      industry: deal_data.industry || 'Unknown Industry',
      fund_type: fund.fund_type === 'venture_capital' ? 'vc' : 'pe',
      fund_name: fund.name || 'Unknown Fund',
      deal_size: deal_data.deal_size,
      valuation: deal_data.valuation,
      location: deal_data.location,
      founder: deal_data.founder || 'Unknown Founder',
      created_at: deal_data.created_at,
      deal_id: deal_data.id,
      organization_id: deal_data.organization_id,
      fund_id: deal_data.fund_id,
      status: deal_data.status || 'active',
      event_type: event_type || 'deal_created'
    };

    console.log('Prepared Dify payload:', difyPayload);

    // Send webhook to all configured Dify endpoints
    const webhookPromises = webhookConfigs.map(async (config: WebhookConfig) => {
      return sendWebhookToDify(supabase, config, difyPayload, deal_id);
    });

    const results = await Promise.allSettled(webhookPromises);
    
    // Log results
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const failureCount = results.filter(r => r.status === 'rejected').length;

    console.log(`Webhook processing complete: ${successCount} successful, ${failureCount} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Webhook processing complete',
        successful: successCount,
        failed: failureCount,
        total: webhookConfigs.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

async function sendWebhookToDify(
  supabase: any,
  config: WebhookConfig,
  payload: DifyWebhookPayload,
  dealId: string,
  attempt: number = 1
): Promise<void> {
  const maxAttempts = 3;
  const retryDelay = 1000 * attempt; // Exponential backoff

  try {
    console.log(`Sending webhook to Dify (attempt ${attempt}):`, config.webhook_url);

    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Supabase-Dify-Webhook/1.0',
      ...config.config_data.headers
    };

    // Add authentication if configured
    if (config.config_data.auth_token) {
      headers['Authorization'] = `Bearer ${config.config_data.auth_token}`;
    }

    if (config.config_data.api_key) {
      headers['X-API-Key'] = config.config_data.api_key;
    }

    const response = await fetch(config.webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    const responseText = await response.text();
    
    // Log webhook attempt
    await supabase.from('webhook_logs').insert({
      config_id: config.id,
      deal_id: dealId,
      request_payload: payload,
      response_status: response.status,
      response_body: responseText.substring(0, 1000), // Limit response body length
      attempt_number: attempt
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${responseText}`);
    }

    console.log(`Webhook sent successfully to ${config.webhook_url}`);

  } catch (error) {
    console.error(`Webhook attempt ${attempt} failed:`, error.message);

    // Log failed attempt
    await supabase.from('webhook_logs').insert({
      config_id: config.id,
      deal_id: dealId,
      request_payload: payload,
      response_status: null,
      error_message: error.message,
      attempt_number: attempt
    });

    // Retry if not max attempts reached
    if (attempt < maxAttempts) {
      console.log(`Retrying in ${retryDelay}ms...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      return sendWebhookToDify(supabase, config, payload, dealId, attempt + 1);
    } else {
      throw error;
    }
  }
}