-- Fix RLS policies for new tables that lack them

-- Add RLS policies for ai_human_decision_divergence
ALTER TABLE ai_human_decision_divergence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage divergence for accessible funds"
ON ai_human_decision_divergence
FOR ALL
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- Add RLS policies for ai_service_interactions  
ALTER TABLE ai_service_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service interactions for accessible funds"
ON ai_service_interactions
FOR SELECT
USING (user_can_access_fund(fund_id));

CREATE POLICY "Services can log interactions"
ON ai_service_interactions
FOR INSERT
WITH CHECK (true);

-- Add RLS policies for ai_service_performance
ALTER TABLE ai_service_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view service performance for accessible funds"
ON ai_service_performance
FOR SELECT  
USING (user_can_access_fund(fund_id));

CREATE POLICY "Services can log performance"
ON ai_service_performance
FOR INSERT
WITH CHECK (true);

-- Add RLS policies for analysis_execution_log
ALTER TABLE analysis_execution_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view execution logs for accessible funds"
ON analysis_execution_log
FOR SELECT
USING (user_can_access_fund(fund_id));

CREATE POLICY "Services can log execution"
ON analysis_execution_log  
FOR INSERT
WITH CHECK (true);

-- Add RLS policies for analysis_queue
ALTER TABLE analysis_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage analysis queue for accessible funds"
ON analysis_queue
FOR ALL
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- Add RLS policies for decision_contexts
ALTER TABLE decision_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage decision contexts for accessible funds"
ON decision_contexts
FOR ALL
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- Add RLS policies for decision_learning_patterns
ALTER TABLE decision_learning_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view learning patterns for accessible funds"
ON decision_learning_patterns
FOR SELECT
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can manage learning patterns for accessible funds"
ON decision_learning_patterns
FOR ALL
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));

-- Add RLS policies for decision_supporting_evidence
ALTER TABLE decision_supporting_evidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage evidence for accessible decision contexts"
ON decision_supporting_evidence
FOR ALL
USING (decision_context_id IN (
  SELECT id FROM decision_contexts dc WHERE user_can_access_fund(dc.fund_id)
))
WITH CHECK (decision_context_id IN (
  SELECT id FROM decision_contexts dc WHERE user_can_access_fund(dc.fund_id)
));

-- Add RLS policies for fund_decision_patterns
ALTER TABLE fund_decision_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view fund decision patterns for accessible funds"
ON fund_decision_patterns
FOR SELECT
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can manage fund decision patterns for manageable funds"
ON fund_decision_patterns
FOR ALL
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));

-- Add RLS policies for fund_memory_entries
ALTER TABLE fund_memory_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view memory entries for accessible funds"
ON fund_memory_entries
FOR SELECT
USING (user_can_access_fund(fund_id));

CREATE POLICY "Users can manage memory entries for accessible funds"
ON fund_memory_entries
FOR ALL
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- Add RLS policies for ic_decision_contexts  
ALTER TABLE ic_decision_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage IC decision contexts for accessible funds"
ON ic_decision_contexts
FOR ALL
USING (user_can_access_fund(fund_id))
WITH CHECK (user_can_access_fund(fund_id));

-- Add RLS policies for ic_meetings
ALTER TABLE ic_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view IC meetings for accessible funds"
ON ic_meetings
FOR SELECT
USING (user_can_access_fund(fund_id));

CREATE POLICY "Fund managers can manage IC meetings"
ON ic_meetings
FOR ALL
USING (user_can_manage_fund(fund_id))
WITH CHECK (user_can_manage_fund(fund_id));