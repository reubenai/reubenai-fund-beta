-- Create demo fund and complete personalization system setup

-- 1. First create the demo organization if it doesn't exist
INSERT INTO public.organizations (id, name, domain)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'ReubenAI Demo Organization',
  'demo.goreuben.com'
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create demo fund if it doesn't exist  
INSERT INTO public.funds (
  id,
  organization_id, 
  name,
  fund_type,
  description,
  target_size,
  currency,
  is_active,
  created_by
)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '550e8400-e29b-41d4-a716-446655440000'::uuid,
  'ReubenAI Demo Fund',
  'venture_capital',
  'Demo fund for testing ReubenAI platform features',
  50000000, -- $50M target
  'USD',
  true,
  (SELECT id FROM auth.users WHERE email = 'demo@goreuben.com' LIMIT 1)
)
ON CONFLICT (id) DO NOTHING;

-- 3. Now grant demo user GP access to demo fund
INSERT INTO public.fund_permissions (user_id, fund_id, role, invitation_status)
SELECT 
  u.id as user_id,
  '00000000-0000-0000-0000-000000000002'::uuid as fund_id,
  'gp' as role,
  'active' as invitation_status
FROM auth.users u
WHERE u.email = 'demo@goreuben.com'
ON CONFLICT (user_id, fund_id) DO NOTHING;

-- 4. Insert default preferences for demo user
INSERT INTO public.user_preferences (user_id, theme, default_view, last_active_fund)
SELECT 
  id, 
  'light', 
  'dashboard',
  '00000000-0000-0000-0000-000000000002'::uuid
FROM auth.users 
WHERE email = 'demo@goreuben.com'
ON CONFLICT (user_id) DO NOTHING;

-- 5. Create investment strategy for demo fund
INSERT INTO public.investment_strategies (
  fund_id,
  industries,
  geography, 
  min_investment_amount,
  max_investment_amount,
  needs_development_threshold,
  promising_threshold,
  exciting_threshold,
  strategy_notes
)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  ARRAY['SaaS', 'FinTech', 'HealthTech', 'AI/ML'],
  ARRAY['North America', 'Europe'],
  500000,   -- $500K min
  5000000,  -- $5M max
  50,       -- Needs development < 50
  70,       -- Promising 50-70
  85,       -- Exciting 70+
  'Demo investment strategy focusing on early-stage B2B SaaS and emerging technology companies with strong product-market fit and experienced founding teams.'
)
ON CONFLICT (fund_id) DO NOTHING;