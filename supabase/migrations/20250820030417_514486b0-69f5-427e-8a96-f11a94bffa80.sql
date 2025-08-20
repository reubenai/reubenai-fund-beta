-- Fix investment_strategies table constraints and RLS policies

-- 1. Add unique constraint on fund_id (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'investment_strategies' 
        AND constraint_name = 'investment_strategies_fund_id_unique'
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.investment_strategies 
        ADD CONSTRAINT investment_strategies_fund_id_unique UNIQUE (fund_id);
    END IF;
END $$;

-- 2. Drop conflicting RLS policies to avoid conflicts
DROP POLICY IF EXISTS "Users can manage investment strategies for accessible funds" ON public.investment_strategies;
DROP POLICY IF EXISTS "Users can view investment strategies for accessible funds" ON public.investment_strategies;
DROP POLICY IF EXISTS "Users can manage investment strategies for manageable funds" ON public.investment_strategies;
DROP POLICY IF EXISTS "strategies_sel" ON public.investment_strategies;
DROP POLICY IF EXISTS "strategies_ins" ON public.investment_strategies;
DROP POLICY IF EXISTS "strategies_upd" ON public.investment_strategies;
DROP POLICY IF EXISTS "strategies_del" ON public.investment_strategies;

-- 3. Create clean, non-conflicting RLS policies
CREATE POLICY "investment_strategies_select" 
ON public.investment_strategies 
FOR SELECT 
USING (
  is_super_admin_by_email() OR 
  user_can_access_fund(fund_id)
);

CREATE POLICY "investment_strategies_insert" 
ON public.investment_strategies 
FOR INSERT 
WITH CHECK (
  is_super_admin_by_email() OR 
  user_can_access_fund(fund_id)
);

CREATE POLICY "investment_strategies_update" 
ON public.investment_strategies 
FOR UPDATE 
USING (
  is_super_admin_by_email() OR 
  user_can_access_fund(fund_id)
)
WITH CHECK (
  is_super_admin_by_email() OR 
  user_can_access_fund(fund_id)
);

CREATE POLICY "investment_strategies_delete" 
ON public.investment_strategies 
FOR DELETE 
USING (
  is_super_admin_by_email()
);