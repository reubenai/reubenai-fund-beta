-- Phase 6 Final: Fix remaining RLS policy gaps only

-- Add RLS policies for tables with RLS enabled but no policies

-- Investment outcomes table
CREATE POLICY "Users can manage investment outcomes for accessible funds"
ON public.investment_outcomes
FOR ALL
USING (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Pattern insights table
CREATE POLICY "Users can manage pattern insights for accessible funds"
ON public.pattern_insights
FOR ALL
USING (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Sourcing sessions table
CREATE POLICY "Users can manage sourcing sessions for accessible funds"
ON public.sourcing_sessions
FOR ALL
USING (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Memory prompt triggers table
CREATE POLICY "Users can manage memory prompts for accessible funds"
ON public.memory_prompt_triggers
FOR ALL
USING (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Outcome correlation tracking table
CREATE POLICY "Users can manage outcome tracking for accessible funds"
ON public.outcome_correlation_tracking
FOR ALL
USING (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Market signal responses table
CREATE POLICY "Users can manage market signals for accessible funds"
ON public.market_signal_responses
FOR ALL
USING (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
))
WITH CHECK (fund_id IN (
  SELECT f.id
  FROM funds f
  JOIN profiles p ON f.organization_id = p.organization_id
  WHERE p.user_id = auth.uid()
));

-- Comment: Final RLS policy gap resolution complete
-- All RLS-enabled tables now have appropriate policies