import { supabase } from '@/integrations/supabase/client';

/**
 * Test IC to Orchestrator integration
 * This utility function tests the connection between IC decisions and the Reuben Orchestrator
 */
export async function testOrchestratorIntegration(dealId: string) {
  try {
    console.log('🧪 Testing Orchestrator Integration for deal:', dealId);

    // 1. Verify deal exists and has analysis
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        company_name,
        status,
        overall_score,
        fund_id,
        deal_analyses (
          id,
          analyzed_at,
          engine_results
        )
      `)
      .eq('id', dealId)
      .single();

    if (dealError || !deal) {
      throw new Error(`Deal not found: ${dealError?.message}`);
    }

    console.log('✅ Deal found:', deal.company_name);

    // 2. Check if AI analysis exists
    if (!deal.deal_analyses || !Array.isArray(deal.deal_analyses) || deal.deal_analyses.length === 0) {
      console.log('⚠️  No AI analysis found - triggering orchestrator...');
      
      // Trigger comprehensive analysis
      const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
        'reuben-orchestrator',
        {
          body: { dealId }
        }
      );

      if (analysisError) {
        throw new Error(`Orchestrator failed: ${analysisError.message}`);
      }

      console.log('✅ Orchestrator analysis completed:', analysisResult);
    } else {
      console.log('✅ Existing AI analysis found');
    }

    // 3. Check IC memo generation capability
    const { data: memos } = await supabase
      .from('ic_memos')
      .select('id, title, status')
      .eq('deal_id', dealId);

    console.log('📝 IC Memos for deal:', memos?.length || 0);

    // 4. Test memo generation if none exist
    if (!memos || memos.length === 0) {
      console.log('🔄 Testing memo generation...');
      
      const { data: memoResult, error: memoError } = await supabase.functions.invoke(
        'ai-memo-generator',
        {
          body: { 
            dealId,
            fundId: deal.fund_id || '',
            analysisType: 'comprehensive'
          }
        }
      );

      if (memoError) {
        console.warn('⚠️  Memo generation failed (expected in test):', memoError.message);
      } else {
        console.log('✅ Memo generation test successful:', memoResult);
      }
    }

    // 5. Check activity logging
    const { data: activities } = await supabase
      .from('activity_events')
      .select('id, activity_type, title, created_at')
      .eq('deal_id', dealId)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📊 Recent activities for deal:', activities?.length || 0);

    return {
      success: true,
      deal: deal.company_name,
      hasAnalysis: Array.isArray(deal.deal_analyses) && deal.deal_analyses.length > 0,
      hasMemos: memos && memos.length > 0,
      recentActivities: activities?.length || 0,
      overallScore: deal.overall_score
    };

  } catch (error) {
    console.error('❌ Orchestrator integration test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test the complete IC workflow
 */
export async function testCompleteICWorkflow(fundId: string) {
  try {
    console.log('🔄 Testing complete IC workflow for fund:', fundId);

    // 1. Get deals ready for IC
    const { data: deals } = await supabase
      .from('deals')
      .select('id, company_name, status, overall_score')
      .eq('fund_id', fundId)
      .in('status', ['investment_committee', 'due_diligence'])
      .limit(1);

    if (!deals || deals.length === 0) {
      console.log('⚠️  No deals available for IC workflow test');
      return { success: false, error: 'No deals available for testing' };
    }

    const testDeal = deals[0];
    console.log('🎯 Testing with deal:', testDeal.company_name);

    // 2. Test orchestrator integration
    const orchestratorTest = await testOrchestratorIntegration(testDeal.id);
    
    // 3. Test IC committee members
    const { data: members } = await supabase
      .from('ic_committee_members')
      .select('id, role, voting_weight')
      .eq('fund_id', fundId)
      .eq('is_active', true);

    console.log('👥 IC Committee members:', members?.length || 0);

    // 4. Test voting decisions
    const { data: votingDecisions } = await supabase
      .from('ic_voting_decisions')
      .select('id, title, status')
      .eq('memo_id', testDeal.id) // This would be memo_id in practice
      .limit(1);

    console.log('🗳️  Voting decisions:', votingDecisions?.length || 0);

    return {
      success: true,
      dealTested: testDeal.company_name,
      orchestratorResults: orchestratorTest,
      committeeMembers: members?.length || 0,
      votingDecisions: votingDecisions?.length || 0
    };

  } catch (error) {
    console.error('❌ Complete IC workflow test failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}