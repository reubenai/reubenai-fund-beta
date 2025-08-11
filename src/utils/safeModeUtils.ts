import { supabase } from '@/integrations/supabase/client';

export async function autoSelectVCDealAndRunSafeModeTest() {
  try {
    console.log('🤖 Auto-selecting VC deal for safe mode test...');

    // Find a VC deal
    const { data: vcDeals, error: dealError } = await supabase
      .from('deals')
      .select(`
        id,
        company_name,
        industry,
        fund_id,
        funds!fund_id(name, fund_type)
      `)
      .eq('funds.fund_type', 'venture_capital')
      .limit(1);

    if (dealError || !vcDeals?.length) {
      throw new Error('No VC deals found for testing');
    }

    const selectedDeal = vcDeals[0];
    console.log(`🎯 Selected VC deal: ${selectedDeal.company_name}`);

    // Clear existing allowlist
    await supabase
      .from('analysis_allowlist')
      .delete()
      .neq('deal_id', '00000000-0000-0000-0000-000000000000');

    // Add the selected deal to allowlist
    const { error: allowlistError } = await supabase
      .from('analysis_allowlist')
      .insert({
        deal_id: selectedDeal.id,
        test_phase: 'auto_safe_mode_test',
        notes: `Auto-selected VC deal: ${selectedDeal.company_name} (${selectedDeal.funds.fund_type})`
      });

    if (allowlistError) throw allowlistError;

    // Queue the deal for analysis
    await supabase.rpc('queue_deal_analysis', {
      deal_id_param: selectedDeal.id,
      trigger_reason_param: 'auto_safe_mode_test',
      priority_param: 'high',
      delay_minutes: 0
    });

    console.log('📋 Deal queued for analysis, running safe mode processor...');

    // Run safe mode processor
    const { data: processorResult, error: processorError } = await supabase.functions.invoke('safe-mode-processor');

    if (processorError) throw processorError;

    console.log('✅ Safe mode test completed:', processorResult);

    return {
      success: true,
      deal: selectedDeal,
      result: processorResult
    };

  } catch (error) {
    console.error('❌ Auto safe mode test failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export async function getAccurateAdminStats() {
  try {
    // Get accurate counts from database
    const [orgsResult, usersResult, fundsResult, dealsResult, costResult] = await Promise.all([
      supabase.from('organizations').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('funds').select('id').eq('is_active', true),
      supabase.from('deals').select('id, status'),
      supabase.from('analysis_cost_tracking').select('total_cost').gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ]);

    const totalOrgs = orgsResult.count || 0;
    const totalUsers = usersResult.count || 0;
    const totalFunds = fundsResult.data?.length || 0;
    const deals = dealsResult.data || [];
    const activeDeals = deals.filter(d => !['rejected', 'withdrawn'].includes(d.status)).length;
    
    // Calculate daily costs
    const dailyCosts = costResult.data || [];
    const dailyCost = dailyCosts.reduce((sum, item) => sum + (item.total_cost || 0), 0);

    // Get environment config for agents status
    const { data: envConfig } = await supabase
      .from('analysis_environment_config')
      .select('config_key, config_value')
      .eq('enabled', true);

    const activeAgents = envConfig?.filter(c => c.config_value === 'on').length || 0;
    const totalAgents = 7; // We have 7 main AI agent types

    // Calculate pending issues (failed analyses, stuck queue items, etc.)
    const { data: queueIssues } = await supabase
      .from('analysis_queue')
      .select('id')
      .eq('status', 'failed');

    const pendingIssues = queueIssues?.length || 0;

    // Get recent activity
    const { data: recentActivities } = await supabase
      .from('activity_events')
      .select('id')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    return {
      totalOrgs,
      totalUsers,
      totalFunds,
      activeDeals,
      recentActivity: recentActivities?.length || 0,
      dailyCost,
      activeAgents,
      totalAgents,
      pendingIssues,
      systemStatus: (pendingIssues > 5 ? 'degraded' : activeAgents === totalAgents ? 'healthy' : 'degraded') as 'healthy' | 'degraded' | 'critical'
    };

  } catch (error) {
    console.error('Error getting accurate admin stats:', error);
    return {
      totalOrgs: 0,
      totalUsers: 0,
      totalFunds: 0,
      activeDeals: 0,
      recentActivity: 0,
      dailyCost: 0,
      activeAgents: 0,
      totalAgents: 7,
      pendingIssues: 0,
      systemStatus: 'critical' as const
    };
  }
}