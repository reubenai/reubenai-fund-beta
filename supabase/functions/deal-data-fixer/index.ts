import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 Deal Data Fixer: Starting comprehensive deal data repair...');

    // Fix 1: Update deals with missing company names
    console.log('🔧 Fixing deals with missing company names...');
    
    const { data: dealsWithoutNames, error: fetchError } = await supabase
      .from('deals')
      .select('id, company_name, website')
      .or('company_name.is.null,company_name.eq.""');

    if (fetchError) {
      console.error('❌ Error fetching deals without names:', fetchError);
    } else if (dealsWithoutNames && dealsWithoutNames.length > 0) {
      console.log(`Found ${dealsWithoutNames.length} deals with missing company names`);
      
      for (const deal of dealsWithoutNames) {
        let fixedName = 'Unnamed Company';
        
        // Try to extract company name from website
        if (deal.website) {
          try {
            const url = new URL(deal.website.startsWith('http') ? deal.website : `https://${deal.website}`);
            const domain = url.hostname.replace('www.', '');
            const parts = domain.split('.');
            if (parts.length > 0) {
              fixedName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
            }
          } catch (e) {
            console.warn('Could not parse website URL for deal:', deal.id);
          }
        }
        
        const { error: updateError } = await supabase
          .from('deals')
          .update({ company_name: fixedName })
          .eq('id', deal.id);
          
        if (updateError) {
          console.error(`❌ Failed to fix company name for deal ${deal.id}:`, updateError);
        } else {
          console.log(`✅ Fixed company name for deal ${deal.id}: ${fixedName}`);
        }
      }
    }

    // Fix 2: Populate missing enhanced_analysis with placeholder structure
    console.log('🔧 Fixing deals with missing enhanced_analysis...');
    
    const { data: dealsWithoutAnalysis, error: analysisError } = await supabase
      .from('deals')
      .select('id, company_name, fund_id')
      .is('enhanced_analysis', null);

    if (analysisError) {
      console.error('❌ Error fetching deals without analysis:', analysisError);
    } else if (dealsWithoutAnalysis && dealsWithoutAnalysis.length > 0) {
      console.log(`Found ${dealsWithoutAnalysis.length} deals with missing enhanced_analysis`);
      
      for (const deal of dealsWithoutAnalysis) {
        const placeholderAnalysis = {
          rubric_breakdown: [
            {
              category: 'Market Opportunity',
              score: 0,
              confidence: 50,
              weight: 25,
              insights: ['Analysis pending - Market research will be conducted'],
              strengths: ['Market analysis will include TAM/SAM/SOM calculations'],
              concerns: ['Market validation pending']
            },
            {
              category: 'Team & Leadership',
              score: 0,
              confidence: 50,
              weight: 20,
              insights: ['Analysis pending - Team research will be conducted'],
              strengths: ['Founder and team assessment scheduled'],
              concerns: ['Team validation pending']
            },
            {
              category: 'Product & Technology',
              score: 0,
              confidence: 50,
              weight: 25,
              insights: ['Analysis pending - Product IP assessment will be conducted'],
              strengths: ['Technology moat evaluation scheduled'],
              concerns: ['IP defensibility analysis pending']
            },
            {
              category: 'Financial Health',
              score: 0,
              confidence: 50,
              weight: 15,
              insights: ['Analysis pending - Financial assessment will be conducted'],
              strengths: ['Revenue model analysis scheduled'],
              concerns: ['Unit economics validation pending']
            },
            {
              category: 'Business Traction',
              score: 0,
              confidence: 50,
              weight: 15,
              insights: ['Analysis pending - Traction assessment will be conducted'],
              strengths: ['Customer validation scheduled'],
              concerns: ['Scale analysis pending']
            }
          ],
          analysis_engines: {
            market_intelligence: {
              name: 'Market Intelligence Engine',
              score: 0,
              confidence: 50,
              status: 'pending',
              last_run: new Date().toISOString(),
              version: '2.3',
              data_sources: 'placeholder'
            },
            financial_engine: {
              name: 'Financial Analysis Engine',
              score: 0,
              confidence: 50,
              status: 'pending',
              last_run: new Date().toISOString(),
              version: '3.1',
              data_sources: 'placeholder'
            },
            team_research: {
              name: 'Team Research Engine',
              score: 0,
              confidence: 50,
              status: 'pending',
              last_run: new Date().toISOString(),
              version: '2.8',
              data_sources: 'placeholder'
            },
            product_ip: {
              name: 'Product IP Engine',
              score: 0,
              confidence: 50,
              status: 'pending',
              last_run: new Date().toISOString(),
              version: '2.5',
              data_sources: 'placeholder'
            },
            thesis_alignment: {
              name: 'Thesis Alignment Engine',
              score: 0,
              confidence: 50,
              status: 'pending',
              last_run: new Date().toISOString(),
              version: '4.0',
              data_sources: 'placeholder'
            }
          },
          analysis_completeness: 0,
          last_comprehensive_analysis: new Date().toISOString(),
          notes_intelligence: {
            sentiment: 'pending',
            key_insights: ['Notes intelligence will be processed when available'],
            risk_flags: [],
            trend_indicators: [],
            confidence_level: 50,
            last_analyzed: new Date().toISOString()
          },
          engines_completion_status: {
            market_intelligence_complete: false,
            financial_analysis_complete: false,
            team_research_complete: false,
            product_ip_complete: false,
            thesis_alignment_complete: false,
            total_engines_complete: 0,
            pending_analysis_note: 'Ready for comprehensive analysis - engines will populate when triggered'
          }
        };
        
        const { error: updateError } = await supabase
          .from('deals')
          .update({ enhanced_analysis: placeholderAnalysis })
          .eq('id', deal.id);
          
        if (updateError) {
          console.error(`❌ Failed to add enhanced_analysis for deal ${deal.id}:`, updateError);
        } else {
          console.log(`✅ Added enhanced_analysis structure for deal ${deal.id}: ${deal.company_name}`);
        }
      }
    }

    // Fix 3: Ensure all deals have proper analysis queue compatibility
    console.log('🔧 Ensuring analysis queue compatibility...');
    
    const { error: queueError } = await supabase
      .from('deals')
      .update({ 
        auto_analysis_enabled: true,
        analysis_queue_status: 'pending'
      })
      .is('auto_analysis_enabled', null);

    if (queueError) {
      console.error('❌ Error updating analysis queue settings:', queueError);
    } else {
      console.log('✅ Updated analysis queue compatibility for all deals');
    }

    const result = {
      success: true,
      message: 'Deal data repair completed successfully',
      fixes_applied: [
        'Fixed deals with missing company names',
        'Added enhanced_analysis structure to deals without it',
        'Ensured analysis queue compatibility',
        'Prepared deals for comprehensive analysis'
      ],
      timestamp: new Date().toISOString()
    };

    console.log('🎉 Deal Data Fixer completed:', result);

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Deal Data Fixer error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});