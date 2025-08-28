import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface DecisionUpdateRequest {
  decisionId: string;
  finalDecision: 'approved' | 'rejected' | 'deferred';
  voteSummary?: any;
  decisionRationale?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { decisionId, finalDecision, voteSummary, decisionRationale }: DecisionUpdateRequest = await req.json();

    console.log('🔄 Update Deal: Processing IC decision for:', decisionId);

    // Fetch decision and related memo/deal data
    const { data: decision, error: decisionError } = await supabase
      .from('ic_voting_decisions')
      .select(`
        *,
        ic_memos (
          deal_id,
          deals (
            id,
            company_name,
            status,
            fund_id,
            funds (name)
          )
        )
      `)
      .eq('id', decisionId)
      .single();

    if (decisionError || !decision) {
      throw new Error(`Decision not found: ${decisionError?.message}`);
    }

    const deal = decision.ic_memos.deals;
    
    // Update the voting decision
    const { error: updateDecisionError } = await supabase
      .from('ic_voting_decisions')
      .update({
        final_decision: finalDecision,
        vote_summary: voteSummary,
        decision_rationale: decisionRationale,
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', decisionId);

    if (updateDecisionError) {
      throw new Error(`Failed to update decision: ${updateDecisionError.message}`);
    }

    // Determine new deal status based on decision
    let newDealStatus = 'due_diligence'; // Default fallback
    
    switch (finalDecision) {
      case 'approved':
        newDealStatus = 'term_sheet';
        break;
      case 'rejected':
        newDealStatus = 'rejected';
        break;
      case 'deferred':
        newDealStatus = 'due_diligence'; // Back to DD for more information
        break;
    }

    // Update deal status and IC decision fields
    const { error: updateDealError } = await supabase
      .from('deals')
      .update({
        status: newDealStatus,
        ic_decision_id: decisionId,
        ic_decision_date: new Date().toISOString(),
        ic_decision_outcome: finalDecision
      })
      .eq('id', deal.id);

    if (updateDealError) {
      throw new Error(`Failed to update deal status: ${updateDealError.message}`);
    }

    // Log activity
    const { error: activityError } = await supabase
      .from('activity_events')
      .insert({
        fund_id: deal.fund_id,
        deal_id: deal.id,
        activity_type: 'ic_decision_made',
        title: 'IC Decision Made',
        description: `Investment Committee ${finalDecision} ${deal.company_name}`,
        user_id: '00000000-0000-0000-0000-000000000000', // System user
        context_data: {
          decision_id: decisionId,
          company_name: deal.company_name,
          final_decision: finalDecision,
          previous_status: deal.status,
          new_status: newDealStatus,
          decision_rationale: decisionRationale
        }
      });

    if (activityError) {
      console.warn('Could not log activity:', activityError.message);
    }

    // Create deal note with decision details
    const decisionNote = `IC Decision: ${finalDecision.toUpperCase()}

Decision made on: ${new Date().toLocaleString()}
Vote Summary: ${JSON.stringify(voteSummary, null, 2)}

${decisionRationale ? `Rationale:\n${decisionRationale}` : ''}

Deal status updated from "${deal.status}" to "${newDealStatus}"`;

    const { error: noteError } = await supabase
      .from('deal_notes')
      .insert({
        deal_id: deal.id,
        content: decisionNote,
        created_by: '00000000-0000-0000-0000-000000000000' // System user
      });

    if (noteError) {
      console.warn('Could not create decision note:', noteError.message);
    }

    // Capture IC decision context for Fund Memory
    try {
      const { error: memoryError } = await supabase.functions.invoke('enhanced-fund-memory-engine', {
        body: {
          fund_id: deal.fund_id,
          action_type: 'capture_decision_context',
          context: {
            deal_id: deal.id,
            ic_session_id: decision.session_id,
            decision_type: 'ic_voting_decision',
            decision_outcome: finalDecision,
            confidence_level: 95, // IC decisions have high confidence
            ai_recommendations: null, // Could be enhanced with AI comparison
            supporting_evidence: {
              vote_summary: voteSummary,
              decision_rationale: decisionRationale,
              committee_votes: voteSummary
            },
            context_data: {
              decision_id: decisionId,
              company_name: deal.company_name,
              previous_status: deal.status,
              new_status: newDealStatus,
              fund_name: deal.funds.name,
              decision_date: new Date().toISOString()
            }
          }
        }
      });

      if (memoryError) {
        console.warn('Could not capture IC decision in Fund Memory:', memoryError);
      } else {
        console.log('✅ IC decision captured in Fund Memory');
      }
    } catch (memoryError) {
      console.warn('Fund Memory capture failed silently:', memoryError);
    }

    console.log(`✅ Update Deal: ${deal.company_name} decision processed - ${finalDecision}`);

    return new Response(JSON.stringify({
      success: true,
      message: `Deal ${deal.company_name} ${finalDecision} successfully`,
      decision: {
        id: decisionId,
        final_decision: finalDecision,
        completed_at: new Date().toISOString()
      },
      deal: {
        id: deal.id,
        company_name: deal.company_name,
        previous_status: deal.status,
        new_status: newDealStatus
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('❌ Update Deal Error:', error);
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});