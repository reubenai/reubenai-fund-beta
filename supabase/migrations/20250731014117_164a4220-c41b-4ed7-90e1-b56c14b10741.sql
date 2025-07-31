-- Create Reuben Venture organization and Reuben Fund 1 for testing
-- This uses the exact same process and tables that real users would use

-- Insert Reuben Venture organization
INSERT INTO public.organizations (id, name, domain, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Reuben Venture',
  'goreuben.com',
  now(),
  now()
);

-- Update Kat's profile to be assigned to Reuben Venture organization  
UPDATE public.profiles 
SET organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE email = 'kat@goreuben.com';

-- Create Reuben Fund 1 using the same table and fields as regular users
INSERT INTO public.funds (
  id,
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
  gen_random_uuid(),
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