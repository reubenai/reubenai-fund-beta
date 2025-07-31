-- Update organization name to match what we want and create the fund
UPDATE public.organizations 
SET name = 'Reuben Venture'
WHERE id = '550e8400-e29b-41d4-a716-446655440000';

-- Create Reuben Fund 1 using the same table and fields as regular users
INSERT INTO public.funds (
  name, 
  organization_id, 
  fund_type, 
  description,
  target_size,
  currency,
  created_by,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  'Reuben Fund 1',
  '550e8400-e29b-41d4-a716-446655440000',
  'venture_capital'::fund_type,
  'Early-stage venture capital fund focusing on technology startups',
  250000000, -- $250M target size (stored as actual amount, not millions)
  'USD',
  p.user_id,
  true,
  now(),
  now()
FROM public.profiles p 
WHERE p.email = 'kat@goreuben.com';