-- Update Kat's profile to Super Admin and assign to ReubenAI organization
UPDATE public.profiles 
SET role = 'super_admin', 
    organization_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE email = 'kat@goreuben.com';